const PDFDocument = require('pdfkit');

const PRETINA_COLOR = '#1A1A2E'; // Pretina Dark
const DARK = '#1E293B';
const GREY = '#64748B';
const WHITE = '#FFFFFF';
const BORDER = '#E2E8F0';

const COMPANY = {
  name: 'Pretina',
  address: 'A Block 722, Hubtown Gitamandir Bus Station',
  address2: 'Gita Mandir, Ahmedabad 380001',
  phone: '+91 8169902291',
  email: 'support@pretina.com',
};

const fmt = (n) => `Rs.${Math.round(Number(n || 0))}`;
const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
};

const normalizeInvoice = (raw) => {
  if (!raw) return {};

  // Support both direct Order object and { order: ... } wrapper
  const order = raw.orderNumber ? raw : (raw.order || {});
  const user = raw.user || order.user || {};
  const addr = raw.shippingAddress || order.shippingAddress || {};

  const invoiceNumber = (order.orderNumber || raw.orderNumber || 'DRAFT').replace(/^PRE-/, 'INV-');
  const orderNumber = order.orderNumber || raw.orderNumber || '-';

  const customerName = addr.name || (typeof user === 'object' ? user.name : '') || '-';
  const customerPhone = addr.phone || (typeof user === 'object' ? user.phone : '') || '-';

  const addressStr = typeof addr === 'string'
    ? addr
    : [addr.companyName, addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');

  const grandTotal = Number(order.total || raw.total || 0);
  const shipping = Number(order.deliveryFee || raw.deliveryFee || 0);
  const discount = Number(order.discount || raw.discount || 0);
  const tokenReceived = Number(order.tokenReceived || raw.tokenReceived || 0);
  const balance = Math.max(0, grandTotal - tokenReceived);

  const paymentMethod = order.paymentMethod || raw.paymentMethod || '';
  const paymentStatus = order.paymentStatus || raw.paymentStatus || 'pending';

  // Human-readable payment method label
  let paymentLabel = 'Cash on Delivery';
  if (paymentMethod === 'razorpay') paymentLabel = 'Prepaid (Razorpay)';
  else if (paymentMethod === 'partial_razorpay') paymentLabel = 'Partial Payment (Razorpay Advance + COD Balance)';
  else if (paymentMethod === 'qr_upi') paymentLabel = 'UPI/QR Payment';
  else if (paymentMethod === 'cod') paymentLabel = 'Cash on Delivery';

  const sourceItems = order.items || raw.items || [];
  const items = sourceItems.map((item) => ({
    name: item.name || item.product?.name || 'Product',
    variantName: item.variantName || '',
    quantity: Number(item.quantity || 0),
    mrp: Number(item.mrp || item.price || 0),
    price: Number(item.price || 0),
    total: Number(item.total || (Number(item.price || 0) * Number(item.quantity || 0))),
  }));

  return {
    invoiceNumber,
    orderNumber,
    invoiceDate: order.createdAt || raw.createdAt || new Date(),
    customerName,
    customerPhone,
    addressStr,
    grandTotal,
    shipping,
    discount,
    tokenReceived,
    balance,
    items,
    paymentMethod,
    paymentStatus,
    paymentLabel,
  };
};


const generateInvoicePDF = (rawInvoice) => {
  return new Promise((resolve, reject) => {
    try {
      const inv = normalizeInvoice(rawInvoice);
      const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const W = 595;
      doc.rect(0, 0, W, 10).fill(PRETINA_COLOR);

      // Company block
      doc.fillColor(PRETINA_COLOR).fontSize(16).font('Helvetica-Bold').text(COMPANY.name, 40, 25);
      doc.fillColor(GREY).fontSize(8).font('Helvetica')
        .text(COMPANY.address, 40, 45)
        .text(COMPANY.address2, 40, 55)
        .text(`Phone: ${COMPANY.phone}`, 40, 65)
        .text(`Email: ${COMPANY.email}`, 40, 75);

      // Invoice Title
      doc.fillColor(PRETINA_COLOR).fontSize(26).font('Helvetica-Bold').text('INVOICE', 360, 22, { width: 195, align: 'right' });

      const metaY = 55;
      const metaRows = [['Invoice No:', inv.invoiceNumber], ['Order No:', inv.orderNumber], ['Date:', fmtDate(inv.invoiceDate)]];
      metaRows.forEach(([label, val], i) => {
        doc.fillColor(GREY).fontSize(8).font('Helvetica').text(label, 360, metaY + i * 14, { width: 90, align: 'right' });
        doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold').text(val || '-', 455, metaY + i * 14, { width: 100, align: 'right' });
      });

      doc.rect(40, 100, W - 80, 1).fill(PRETINA_COLOR);

      // BILL TO
      doc.fillColor(PRETINA_COLOR).fontSize(8).font('Helvetica-Bold').text('BILL TO', 40, 115);
      doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text(inv.customerName, 40, 128);
      doc.fillColor(GREY).fontSize(8.5).font('Helvetica').text(inv.customerPhone, 40, 142);
      doc.fillColor(GREY).fontSize(8).font('Helvetica').text(inv.addressStr, 40, 154, { width: 260 });

      // Payment Method label
      doc.fillColor(PRETINA_COLOR).fontSize(8).font('Helvetica-Bold').text('PAYMENT', 310, 115);
      doc.fillColor(GREY).fontSize(8).font('Helvetica').text(inv.paymentLabel, 310, 128, { width: 245 });

      // Table
      const tableTop = 195;
      const cols = [
        { label: '#', width: 28, align: 'center' },
        { label: 'Product', width: 200, align: 'left' },
        { label: 'Qty', width: 40, align: 'center' },
        { label: 'MRP', width: 70, align: 'right' },
        { label: 'Price', width: 70, align: 'right' },
        { label: 'Amount', width: 107, align: 'right' },
      ];
      const tableW = 515;

      doc.rect(40, tableTop, tableW, 22).fill(PRETINA_COLOR);
      let cx = 40;
      cols.forEach((col) => {
        doc.fillColor(WHITE).fontSize(8.5).font('Helvetica-Bold').text(col.label, cx + 4, tableTop + 7, { width: col.width - 8, align: col.align });
        cx += col.width;
      });

      let rowY = tableTop + 22;
      inv.items.forEach((item, idx) => {
        const rowH = 26;
        if (idx % 2 === 1) doc.rect(40, rowY, tableW, rowH).fill('#F8F9FA');

        const rowData = [String(idx + 1), item.name + (item.variantName ? ` (${item.variantName})` : ''), String(item.quantity), fmt(item.mrp), fmt(item.price), fmt(item.total)];

        cx = 40;
        doc.fillColor(DARK).fontSize(8).font('Helvetica');
        rowData.forEach((val, ci) => {
          doc.text(val, cx + 4, rowY + 9, { width: cols[ci].width - 8, align: cols[ci].align });
          cx += cols[ci].width;
        });

        doc.rect(40, rowY + rowH - 0.5, tableW, 0.5).fill(BORDER);
        rowY += rowH;

        if (rowY > 700) {
          doc.addPage({ size: 'A4', margin: 0 });
          doc.rect(0, 0, W, 10).fill(PRETINA_COLOR);
          rowY = 20;
        }
      });

      // Summary
      const sumX = 355, sumW = 200;
      let sumY = Math.max(rowY + 15, 520);

      const subtotal = inv.items.reduce((sum, i) => sum + i.total, 0);
      const sumRows = [{ label: 'Sub Total', val: fmt(subtotal) }];
      if (inv.shipping > 0) sumRows.push({ label: 'Delivery Charge', val: `+ ${fmt(inv.shipping)}` });
      if (inv.discount > 0) sumRows.push({ label: 'Discount', val: `- ${fmt(inv.discount)}` });
      if (inv.tokenReceived > 0) sumRows.push({ label: 'Advance Paid', val: `- ${fmt(inv.tokenReceived)}`, green: true });

      sumRows.forEach((row) => {
        doc.rect(sumX, sumY, sumW, 20).stroke(BORDER);
        doc.fillColor(row.green ? '#059669' : GREY).fontSize(8).font('Helvetica').text(row.label, sumX + 5, sumY + 6, { width: 100 });
        doc.fillColor(row.green ? '#059669' : DARK).font('Helvetica-Bold').text(row.val, sumX + 100, sumY + 6, { width: sumW - 110, align: 'right' });
        sumY += 20;
      });

      // Balance Due / PAID display
      const isPaid = inv.paymentStatus === 'paid';
      const isAdvancePaid = inv.paymentStatus === 'advance_paid';

      if (isPaid) {
        // Show green PAID banner
        doc.rect(sumX, sumY, sumW, 26).fill('#059669');
        doc.fillColor(WHITE).fontSize(12).font('Helvetica-Bold').text('\u2713 PAID IN FULL', sumX + 5, sumY + 7, { width: sumW - 10, align: 'center' });
      } else if (isAdvancePaid && inv.tokenReceived > 0) {
        // Show advance paid + balance due
        doc.rect(sumX, sumY, sumW, 26).fill('#D97706');
        doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold').text(`Balance Due on Delivery`, sumX + 5, sumY + 4, { width: sumW - 10, align: 'center' });
        doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold').text(fmt(inv.balance), sumX + 5, sumY + 14, { width: sumW - 10, align: 'center' });
      } else {
        // Regular balance due
        doc.rect(sumX, sumY, sumW, 26).fill(PRETINA_COLOR);
        doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold').text('Balance Due', sumX + 5, sumY + 8, { width: 90 });
        doc.text(fmt(inv.balance), sumX + 100, sumY + 8, { width: sumW - 110, align: 'right' });
      }

      // PAID watermark stamp for fully paid orders
      if (isPaid) {
        doc.save();
        doc.rotate(-35, { origin: [W / 2, 400] });
        doc.fillColor('#059669').opacity(0.08).fontSize(90).font('Helvetica-Bold').text('PAID', 100, 320, { width: 400, align: 'center' });
        doc.restore();
        doc.opacity(1);
      }

      // Footer
      const footerY = 800;
      doc.rect(0, footerY, W, 1).fill(BORDER);
      doc.fillColor(GREY).fontSize(7.5).font('Helvetica')
        .text('Thank you for shopping with Pretina!', 40, footerY + 6, { width: W - 80, align: 'center' })
        .text(`${COMPANY.name} | ${COMPANY.email}`, 40, footerY + 16, { width: W - 80, align: 'center' });

      doc.end();
    } catch (err) { reject(err); }
  });
};


const generatePackingSlipPDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      doc.fontSize(20).font('Helvetica-Bold').fillColor(PRETINA_COLOR).text(COMPANY.name, 40, 40);
      doc.fontSize(14).font('Helvetica').fillColor(GREY).text('Packing Slip', 40, 65);
      doc.moveTo(40, 90).lineTo(555, 90).stroke('#ccc');

      const infoY = 105;
      doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('Order Number:', 40, infoY);
      doc.font('Helvetica').text(order.orderNumber || '-', 160, infoY);

      doc.font('Helvetica-Bold').text('Order Date:', 40, infoY + 18);
      doc.font('Helvetica').text(fmtDate(order.createdAt), 160, infoY + 18);

      doc.font('Helvetica-Bold').text('Total Items:', 350, infoY);
      const totalQty = (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
      doc.font('Helvetica').text(totalQty.toString(), 440, infoY);

      doc.moveTo(40, infoY + 50).lineTo(555, infoY + 50).stroke('#ccc');

      const tableTop = infoY + 65;
      const colWidths = [40, 275, 120, 80];
      const headers = ['#', 'Product Name', 'Variant', 'Qty'];

      doc.rect(40, tableTop, 515, 22).fill('#F8F9FA');
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold');
      let x = 40;
      headers.forEach((h, i) => {
        doc.text(h, x + 5, tableTop + 6, { width: colWidths[i] - 10, align: i === 3 ? 'center' : 'left' });
        x += colWidths[i];
      });

      let y = tableTop + 27;
      doc.font('Helvetica').fontSize(9);

      (order.items || []).forEach((item, index) => {
        if (index % 2 === 1) doc.rect(40, y - 3, 515, 20).fill('#FAFAFA');
        doc.fillColor(DARK);

        x = 40;
        const row = [(index + 1).toString(), item.name || '-', item.variantName || '-', item.quantity.toString()];
        row.forEach((r, i) => {
          doc.text(r, x + 5, y, { width: colWidths[i] - 10, align: i === 3 ? 'center' : 'left' });
          x += colWidths[i];
        });
        y += 20;

        if (y > 750) { doc.addPage(); y = 40; }
      });

      doc.rect(40, tableTop, 515, y - tableTop + 5).stroke('#ddd');

      const footerY = Math.max(y + 40, 650);
      doc.moveTo(40, footerY).lineTo(555, footerY).stroke('#ccc');
      doc.fillColor(GREY).fontSize(8).font('Helvetica')
        .text('This is an auto-generated packing slip. No customer details are included for privacy.', 40, footerY + 8, { align: 'center', width: 515 });

      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text('Packed by: _______________', 40, footerY + 40);
      doc.text('Date: _______________', 300, footerY + 40);

      doc.end();
    } catch (error) { reject(error); }
  });
};

module.exports = { generateInvoicePDF, generatePackingSlipPDF };
