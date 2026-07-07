/**
 * Analytics Controller — Pretina V2
 */

const AnalyticsService = require('../services/analytics.service');

const getDashboardOverview = async (req, res) => {
  try {
    const result = await AnalyticsService.getDashboardOverview();
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, overview: result.overview });
  } catch (err) {
    console.error('Analytics getDashboardOverview:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSalesAnalytics = async (req, res) => {
  try {
    const { period = 'last30days', startDate, endDate } = req.query;
    const result = await AnalyticsService.getSalesAnalytics(period, startDate, endDate);
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, analytics: result.analytics });
  } catch (err) {
    console.error('Analytics getSalesAnalytics:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    const { period = 'last30days', startDate, endDate } = req.query;
    const result = await AnalyticsService.getUserAnalytics(period, startDate, endDate);
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, analytics: result.analytics });
  } catch (err) {
    console.error('Analytics getUserAnalytics:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAbandonedCartAnalytics = async (req, res) => {
  try {
    const { thresholdHours = 24 } = req.query;
    const result = await AnalyticsService.getAbandonedCartAnalytics(parseInt(thresholdHours));
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, analytics: result.analytics });
  } catch (err) {
    console.error('Analytics getAbandonedCartAnalytics:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getLowStockAlerts = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    const result = await AnalyticsService.getLowStockAlerts(parseInt(threshold));
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, alerts: result.alerts, count: result.count });
  } catch (err) {
    console.error('Analytics getLowStockAlerts:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getProductPerformance = async (req, res) => {
  try {
    const { period = 'last30days', startDate, endDate, limit = 10 } = req.query;
    const result = await AnalyticsService.getProductPerformance(period, startDate, endDate, parseInt(limit));
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, performance: result.performance });
  } catch (err) {
    console.error('Analytics getProductPerformance:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getOrderTrends = async (req, res) => {
  try {
    const { period = 'last30days', startDate, endDate } = req.query;
    const result = await AnalyticsService.getOrderTrends(period, startDate, endDate);
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, trends: result.trends });
  } catch (err) {
    console.error('Analytics getOrderTrends:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getGeographyAnalytics = async (req, res) => {
  try {
    const { period = 'last30days' } = req.query;
    const result = await AnalyticsService.getGeographyAnalytics(period);
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, geography: result.geography });
  } catch (err) {
    console.error('Analytics getGeographyAnalytics:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPeakHoursAnalytics = async (req, res) => {
  try {
    const { period = 'last30days' } = req.query;
    const result = await AnalyticsService.getPeakHoursAnalytics(period);
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, peakHours: result.peakHours });
  } catch (err) {
    console.error('Analytics getPeakHoursAnalytics:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getDeadStockAnalytics = async (req, res) => {
  try {
    const { days = 60 } = req.query;
    const result = await AnalyticsService.getDeadStockAnalytics(parseInt(days));
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, deadStock: result.deadStock });
  } catch (err) {
    console.error('Analytics getDeadStockAnalytics:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getDashboardOverview,
  getSalesAnalytics,
  getUserAnalytics,
  getAbandonedCartAnalytics,
  getLowStockAlerts,
  getProductPerformance,
  getOrderTrends,
  getGeographyAnalytics,
  getPeakHoursAnalytics,
  getDeadStockAnalytics,
};
