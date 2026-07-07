/**
 * Analytics Service — Pretina V2
 * Ported from YouthQit, adapted for Pretina order status values
 * (pending | confirmed | packed | shipped | delivered | cancelled | returned)
 */

const Order = require('../models/Order');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Pretina statuses that count as "successful" revenue
const REVENUE_STATUSES = ['confirmed', 'packed', 'shipped', 'delivered'];

class AnalyticsService {
  // ─────────────────────────────────────────────────────────────────
  // PUBLIC METHODS
  // ─────────────────────────────────────────────────────────────────

  async getDashboardOverview() {
    try {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const [
        totalSalesThisMonth,
        totalOrdersThisMonth,
        totalOrders30Days,
        activeUsers30Days,
        abandonedCartsCount,
        lowStockProducts,
        totalCustomers,
        recentOrders,
        ordersByStatus,
        salesTrend,
      ] = await Promise.all([
        this._calculateSales(thisMonthStart, now),
        this._countOrders(thisMonthStart, now),
        this._countOrders(last30Days, now),
        this._countActiveUsers(last30Days, now),
        this._countAbandonedCarts(),
        this._getLowStockProducts(10),
        User.countDocuments({ role: 'customer', isActive: true }),
        Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('user', 'name phone')
          .select('orderNumber status total paymentMethod createdAt')
          .lean(),
        this._getOrdersByStatus(thisMonthStart, now),
        this._getSalesByDay(last30Days, now, 'last30days'),
      ]);

      return {
        success: true,
        overview: {
          thisMonth: { sales: totalSalesThisMonth, orders: totalOrdersThisMonth },
          last30Days: { orders: totalOrders30Days, activeUsers: activeUsers30Days },
          totalCustomers,
          abandonedCarts: abandonedCartsCount,
          lowStockProducts: lowStockProducts.length,
          recentOrders,
          ordersByStatus,
          salesTrend,
        },
      };
    } catch (err) {
      console.error('Analytics getDashboardOverview:', err);
      return { success: false, message: 'Failed to fetch dashboard overview' };
    }
  }

  async getSalesAnalytics(period = 'last30days', startDate = null, endDate = null) {
    try {
      const dateRange = this._getDateRange(period, startDate, endDate);
      if (!dateRange.success) return dateRange;
      const { start, end } = dateRange;

      const [totalSales, totalOrders, ordersByStatus, salesByDay, topProducts] = await Promise.all([
        this._calculateSales(start, end),
        this._countOrders(start, end),
        this._getOrdersByStatus(start, end),
        this._getSalesByDay(start, end, period),
        this._getTopProducts(start, end, 5),
      ]);

      return {
        success: true,
        analytics: {
          period,
          dateRange: { start, end },
          summary: {
            totalSales: Math.round(totalSales * 100) / 100,
            totalOrders,
            averageOrderValue: totalOrders > 0 ? Math.round((totalSales / totalOrders) * 100) / 100 : 0,
          },
          ordersByStatus,
          salesByDay,
          topProducts,
        },
      };
    } catch (err) {
      console.error('Analytics getSalesAnalytics:', err);
      return { success: false, message: 'Failed to fetch sales analytics' };
    }
  }

  async getUserAnalytics(period = 'last30days', startDate = null, endDate = null) {
    try {
      const dateRange = this._getDateRange(period, startDate, endDate);
      if (!dateRange.success) return dateRange;
      const { start, end } = dateRange;

      const [totalUsers, newUsers, activeUsers, usersByRole] = await Promise.all([
        User.countDocuments({ isActive: true }),
        User.countDocuments({ createdAt: { $gte: start, $lte: end }, isActive: true }),
        this._countActiveUsers(start, end),
        User.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$role', count: { $sum: 1 } } },
        ]),
      ]);

      return {
        success: true,
        analytics: {
          period,
          dateRange: { start, end },
          totalUsers,
          newUsers,
          activeUsers,
          usersByRole: usersByRole.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {}),
        },
      };
    } catch (err) {
      console.error('Analytics getUserAnalytics:', err);
      return { success: false, message: 'Failed to fetch user analytics' };
    }
  }

  async getAbandonedCartAnalytics(thresholdHours = 24) {
    try {
      const thresholdTime = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
      const [count, carts] = await Promise.all([
        Cart.countDocuments({ 'items.0': { $exists: true }, updatedAt: { $lt: thresholdTime } }),
        Cart.find({ 'items.0': { $exists: true }, updatedAt: { $lt: thresholdTime } })
          .populate('items.product', 'price')
          .populate('user', 'name phone')
          .lean(),
      ]);

      let totalValue = 0;
      for (const cart of carts) {
        for (const item of cart.items) {
          if (item.product) totalValue += (item.product.price || 0) * item.quantity;
        }
      }

      return {
        success: true,
        analytics: {
          totalAbandonedCarts: count,
          totalAbandonedValue: Math.round(totalValue * 100) / 100,
          averageCartValue: count > 0 ? Math.round((totalValue / count) * 100) / 100 : 0,
          carts: carts.slice(0, 20), // Return latest 20 for display
        },
      };
    } catch (err) {
      console.error('Analytics getAbandonedCartAnalytics:', err);
      return { success: false, message: 'Failed to fetch abandoned cart analytics' };
    }
  }

  async getLowStockAlerts(threshold = 10) {
    try {
      const alerts = await this._getLowStockProducts(threshold);
      return { success: true, alerts, count: alerts.length };
    } catch (err) {
      console.error('Analytics getLowStockAlerts:', err);
      return { success: false, message: 'Failed to fetch low stock alerts' };
    }
  }

  async getProductPerformance(period = 'last30days', startDate = null, endDate = null, limit = 10) {
    try {
      const dateRange = this._getDateRange(period, startDate, endDate);
      if (!dateRange.success) return dateRange;
      const { start, end } = dateRange;

      const [topProducts, bottomProducts] = await Promise.all([
        this._getTopProducts(start, end, limit),
        this._getBottomProducts(start, end, limit),
      ]);

      return { success: true, performance: { period, dateRange: { start, end }, topProducts, bottomProducts } };
    } catch (err) {
      console.error('Analytics getProductPerformance:', err);
      return { success: false, message: 'Failed to fetch product performance' };
    }
  }

  async getOrderTrends(period = 'last30days', startDate = null, endDate = null) {
    try {
      const dateRange = this._getDateRange(period, startDate, endDate);
      if (!dateRange.success) return dateRange;
      const { start, end } = dateRange;

      const trends = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
            totalOrders: { $sum: 1 },
            totalSales: { $sum: '$total' },
            avgOrderValue: { $avg: '$total' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return {
        success: true,
        trends: trends.map(d => ({
          date: d._id,
          orders: d.totalOrders,
          sales: Math.round(d.totalSales * 100) / 100,
          avgOrderValue: Math.round(d.avgOrderValue * 100) / 100,
        })),
      };
    } catch (err) {
      console.error('Analytics getOrderTrends:', err);
      return { success: false, message: 'Failed to fetch order trends' };
    }
  }

  async getGeographyAnalytics(period = 'last30days') {
    try {
      const dateRange = this._getDateRange(period);
      if (!dateRange.success) return dateRange;
      const { start, end } = dateRange;

      const geography = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: { $in: REVENUE_STATUSES },
          },
        },
        {
          $group: {
            _id: { state: '$shippingAddress.state', pincode: '$shippingAddress.pincode' },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
          },
        },
        {
          $group: {
            _id: '$_id.state',
            stateRevenue: { $sum: '$totalRevenue' },
            stateOrders: { $sum: '$totalOrders' },
            pincodes: { $push: { pincode: '$_id.pincode', orders: '$totalOrders', revenue: '$totalRevenue' } },
          },
        },
        {
          $project: { _id: 0, state: '$_id', revenue: '$stateRevenue', orders: '$stateOrders', pincodes: 1 },
        },
        { $sort: { revenue: -1 } },
      ]);

      return { success: true, geography };
    } catch (err) {
      console.error('Analytics getGeographyAnalytics:', err);
      return { success: false, message: 'Failed to fetch geography analytics' };
    }
  }

  async getPeakHoursAnalytics(period = 'last30days') {
    try {
      const dateRange = this._getDateRange(period);
      if (!dateRange.success) return dateRange;
      const { start, end } = dateRange;

      const raw = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: REVENUE_STATUSES } } },
        {
          $group: {
            _id: { dayOfWeek: { $dayOfWeek: '$createdAt' }, hour: { $hour: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
      ]);

      const cells = raw.map(r => ({
        day: r._id.dayOfWeek === 1 ? 6 : r._id.dayOfWeek - 2, // Mon=0 … Sun=6
        hour: r._id.hour,
        orders: r.orders,
        revenue: Math.round(r.revenue),
      }));

      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const byDay = Array(7).fill(0);
      const byHour = Array(24).fill(0);
      cells.forEach(c => { byDay[c.day] += c.orders; byHour[c.hour] += c.orders; });

      const bestDayIdx = byDay.indexOf(Math.max(...byDay));
      const bestHourIdx = byHour.indexOf(Math.max(...byHour));
      const nonZeroDay = byDay.filter(v => v > 0);
      const worstDayIdx = nonZeroDay.length ? byDay.indexOf(Math.min(...nonZeroDay)) : 0;

      return {
        success: true,
        peakHours: {
          cells,
          summary: {
            bestDay: dayNames[bestDayIdx] || 'N/A',
            worstDay: dayNames[worstDayIdx] || 'N/A',
            bestHour: bestHourIdx >= 0 ? `${bestHourIdx}:00` : 'N/A',
            byDay,
            byHour,
          },
        },
      };
    } catch (err) {
      console.error('Analytics getPeakHoursAnalytics:', err);
      return { success: false, message: 'Failed to fetch peak hours analytics' };
    }
  }

  async getDeadStockAnalytics(days = 60) {
    try {
      const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const soldResult = await Order.aggregate([
        { $match: { createdAt: { $gte: start }, status: { $nin: ['cancelled', 'returned'] } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product' } },
      ]);

      const soldIds = soldResult.map(r => r._id);

      const deadStock = await Product.find({
        _id: { $nin: soldIds },
        stock: { $gt: 0 },
        isActive: true,
      })
        .select('name images price mrp stock sku category brand')
        .populate('category', 'name')
        .populate('brand', 'name')
        .lean();

      return {
        success: true,
        deadStock: deadStock.map(p => ({
          _id: p._id,
          name: p.name,
          image: p.images?.[0] || '',
          category: p.category?.name || 'Uncategorized',
          brand: p.brand?.name || 'Unbranded',
          stock: p.stock,
          stockValue: p.stock * (p.price || 0),
          daysSinceLastSale: `> ${days} days`,
        })).sort((a, b) => b.stockValue - a.stockValue),
      };
    } catch (err) {
      console.error('Analytics getDeadStockAnalytics:', err);
      return { success: false, message: 'Failed to fetch dead stock analytics' };
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────

  _getDateRange(period, startDate = null, endDate = null) {
    const utcNow = new Date();
    const IST = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(utcNow.getTime() + IST);

    let startIST, endIST;

    switch (period) {
      case 'today':
        startIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()));
        endIST = new Date(nowIST);
        break;
      case 'yesterday':
        startIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate() - 1));
        endIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate() - 1, 23, 59, 59, 999));
        break;
      case 'week': {
        const d = nowIST.getUTCDay();
        const diff = nowIST.getUTCDate() - d + (d === 0 ? -6 : 1);
        startIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), diff));
        endIST = new Date(nowIST);
        break;
      }
      case 'thisMonth':
      case 'month':
        startIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 1));
        endIST = new Date(nowIST);
        break;
      case 'lastMonth':
        startIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth() - 1, 1));
        endIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 0, 23, 59, 59, 999));
        break;
      case 'last30days':
        startIST = new Date(nowIST.getTime() - 30 * 24 * 60 * 60 * 1000);
        endIST = new Date(nowIST);
        break;
      case 'last12months':
      case '12months':
        startIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth() - 12, nowIST.getUTCDate()));
        endIST = new Date(nowIST);
        break;
      case '6months':
        startIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth() - 6, nowIST.getUTCDate()));
        endIST = new Date(nowIST);
        break;
      case 'all':
        return { success: true, start: new Date(0), end: utcNow };
      case 'custom':
        if (!startDate || !endDate) return { success: false, message: 'Start date and end date required' };
        return { success: true, start: new Date(startDate), end: new Date(endDate) };
      default:
        startIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()));
        endIST = new Date(nowIST);
    }

    return {
      success: true,
      start: new Date(startIST.getTime() - IST),
      end: new Date(endIST.getTime() - IST),
    };
  }

  async _calculateSales(start, end) {
    const result = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: REVENUE_STATUSES } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    return result.length > 0 ? Math.round(result[0].total * 100) / 100 : 0;
  }

  async _countOrders(start, end = null) {
    const q = { createdAt: { $gte: start } };
    if (end) q.createdAt.$lte = end;
    return Order.countDocuments(q);
  }

  async _countActiveUsers(start, end = null) {
    const q = { createdAt: { $gte: start } };
    if (end) q.createdAt.$lte = end;
    const distinct = await Order.distinct('user', q);
    return distinct.length;
  }

  async _countAbandonedCarts() {
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return Cart.countDocuments({ 'items.0': { $exists: true }, updatedAt: { $lt: threshold } });
  }

  async _getLowStockProducts(threshold) {
    const products = await Product.find({ isActive: true, stock: { $lte: threshold } })
      .select('name images price stock sku')
      .lean();

    return products.map(p => ({
      _id: p._id,
      name: p.name,
      image: p.images?.[0] || '',
      sku: p.sku || '',
      stock: p.stock,
      threshold,
      status: p.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
    })).sort((a, b) => a.stock - b.stock);
  }

  async _getOrdersByStatus(start, end) {
    const result = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return result.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {});
  }

  async _getSalesByDay(start, end, period) {
    const format = (period === 'last12months' || period === '12months') ? '%Y-%m' : '%Y-%m-%d';
    const result = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: REVENUE_STATUSES } } },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt', timezone: 'Asia/Kolkata' } },
          sales: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return result.map(r => ({ date: r._id, sales: Math.round(r.sales * 100) / 100, orders: r.orders }));
  }

  async _getTopProducts(start, end, limit) {
    const result = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: REVENUE_STATUSES } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          orderCount: { $sum: 1 },
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
    ]);
    return result.map(r => ({ ...r, totalRevenue: Math.round(r.totalRevenue * 100) / 100 }));
  }

  async _getBottomProducts(start, end, limit) {
    const result = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: REVENUE_STATUSES } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          orderCount: { $sum: 1 },
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
        },
      },
      { $sort: { totalRevenue: 1 } },
      { $limit: limit },
    ]);
    return result.map(r => ({ ...r, totalRevenue: Math.round(r.totalRevenue * 100) / 100 }));
  }
}

module.exports = new AnalyticsService();
