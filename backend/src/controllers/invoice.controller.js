/**
 * Invoice Controller — Pretina V2
 * Creates invoices linked to orders, returns list and single invoice
 */

const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { logActivity } = require('../services/activity.service');

// GET /api/v1/invoices — list all invoices with pagination
const getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('order', 'orderNumber status')
        .populate('customer', 'name phone email')
        .lean(),
      Invoice.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: invoices,
      pagination: {
        total, page: parseInt(page), limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('getInvoices:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/v1/invoices/:id — get single invoice with full details
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('order', 'orderNumber status paymentMethod')
      .populate('customer', 'name phone email addresses')
      .lean();

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    return res.json({ success: true, data: invoice });
  } catch (err) {
    console.error('getInvoice:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/v1/invoices/generate/:orderId — generate invoice for an order
const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check if invoice already exists
    const existing = await Invoice.findOne({ order: orderId });
    if (existing) {
      return res.json({ success: true, data: existing, message: 'Invoice already exists' });
    }

    const order = await Order.findById(orderId).populate('user', 'name phone email').lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const settings = await Settings.getSettings();

    const addr = order.shippingAddress;
    const addressStr = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode]
      .filter(Boolean).join(', ');

    const invoice = await Invoice.create({
      order: order._id,
      customer: order.user._id,
      customerName: order.user.name || addr.name,
      customerPhone: order.user.phone || addr.phone,
      customerEmail: order.user.email || '',
      shippingAddress: addressStr,

      items: order.items.map(item => ({
        description: `${item.name}${item.variantName ? ` (${item.variantName})` : ''}`,
        quantity: item.quantity,
        unitPrice: item.price,
        mrp: item.mrp,
        total: item.total,
      })),

      subtotal: order.subtotal,
      discountAmount: order.discount || 0,
      shippingCharge: order.deliveryFee || 0,
      totalAmount: order.total,
      paymentMethod: order.paymentMethod,
      amountPaid: order.paymentStatus === 'paid' ? order.total : (order.codAdvanceAmount || 0),
      balanceDue: order.paymentStatus === 'paid' ? 0 : order.total - (order.codAdvanceAmount || 0),

      companyName: settings.businessName,
      companyAddress: settings.businessAddress,
      companyPhone: settings.businessPhone,
      companyEmail: settings.businessEmail,
      gstin: settings.gstin || '',

      status: 'issued',
      issuedAt: new Date(),
    });

    // Link invoice back to order
    await Order.findByIdAndUpdate(orderId, { invoice: invoice._id });

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'invoice.generated',
      description: `Generated invoice ${invoice.invoiceNumber} for order ${order.orderNumber}`,
      entityType: 'invoice',
      entityId: invoice._id,
    });

    return res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    console.error('generateInvoice:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Activity log controller
const getActivityLog = async (req, res) => {
  try {
    const { getActivityLog: getLog } = require('../services/activity.service');
    const result = await getLog(req.query);
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, data: result.logs, pagination: result.pagination });
  } catch (err) {
    console.error('getActivityLog:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getInvoices, getInvoice, generateInvoice, getActivityLog };
