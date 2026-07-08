/**
 * SMS Service — Pretina
 *
 * Provider-agnostic SMS/WhatsApp sending layer.
 * Currently supports:
 *   - MSG91 (DLT-compliant, India — recommended)
 *   - Twilio (global fallback)
 *
 * To enable:
 *   Set SMS_ENABLED=true in .env
 *
 *   For MSG91:
 *     SMS_PROVIDER=msg91
 *     MSG91_AUTH_KEY=your_auth_key
 *     MSG91_SENDER_ID=PRTNNA      (6-char DLT approved sender)
 *     MSG91_OTP_TEMPLATE_ID=...   (DLT approved template for OTP)
 *     MSG91_ORDER_TEMPLATE_ID=... (DLT approved template for order updates)
 *
 *   For Twilio:
 *     SMS_PROVIDER=twilio
 *     TWILIO_SID=ACxxxxxxxx
 *     TWILIO_AUTH_TOKEN=xxxxxxxx
 *     TWILIO_FROM_NUMBER=+1xxxxxxxx
 *
 * Without config: messages are logged to console (dev mode).
 */

const axios = require('axios');

const SMS_ENABLED = process.env.SMS_ENABLED === 'true';
const PROVIDER    = (process.env.SMS_PROVIDER || 'msg91').toLowerCase();

class SMSService {
  /* ──────────────────────────────────────────────────────────
     INTERNAL: MSG91 send
     ────────────────────────────────────────────────────────── */
  async _sendMSG91(phone, templateId, variables = {}) {
    const authKey = process.env.MSG91_AUTH_KEY;
    const senderId = process.env.MSG91_SENDER_ID || 'PRTNNA';

    if (!authKey) {
      console.warn('[SMSService] MSG91_AUTH_KEY not set.');
      return { success: false, reason: 'MSG91 not configured' };
    }

    // MSG91 Flow API (v5)
    const url = 'https://control.msg91.com/api/v5/flow/';
    const payload = {
      template_id: templateId,
      sender: senderId,
      short_url: '0',
      mobiles: `91${phone}`,
      ...variables,
    };

    const response = await axios.post(url, payload, {
      headers: {
        authkey: authKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      timeout: 10000,
    });

    return { success: true, data: response.data };
  }

  /* ──────────────────────────────────────────────────────────
     INTERNAL: Twilio send
     ────────────────────────────────────────────────────────── */
  async _sendTwilio(phone, body) {
    const sid   = process.env.TWILIO_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from  = process.env.TWILIO_FROM_NUMBER;

    if (!sid || !token || !from) {
      console.warn('[SMSService] Twilio credentials not set.');
      return { success: false, reason: 'Twilio not configured' };
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const params = new URLSearchParams({ From: from, To: `+91${phone}`, Body: body });

    const response = await axios.post(url, params, {
      auth: { username: sid, password: token },
      timeout: 10000,
    });

    return { success: true, data: response.data };
  }

  /* ──────────────────────────────────────────────────────────
     INTERNAL: Dispatch based on provider
     ────────────────────────────────────────────────────────── */
  async _dispatch(phone, { templateId, variables, fallbackText }) {
    if (!SMS_ENABLED) {
      // Dev mode — just log
      console.log(`[SMSService] (dev) Would send SMS to ${phone}: ${fallbackText}`);
      return { success: true, dev: true };
    }

    try {
      if (PROVIDER === 'msg91') {
        return await this._sendMSG91(phone, templateId, variables);
      } else if (PROVIDER === 'twilio') {
        return await this._sendTwilio(phone, fallbackText);
      } else {
        console.warn(`[SMSService] Unknown provider: ${PROVIDER}`);
        return { success: false, reason: 'Unknown provider' };
      }
    } catch (err) {
      console.error('[SMSService] dispatch error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /* ──────────────────────────────────────────────────────────
     PUBLIC: Send OTP
     ────────────────────────────────────────────────────────── */
  async sendOTP(phone, otp) {
    return this._dispatch(phone, {
      templateId: process.env.MSG91_OTP_TEMPLATE_ID,
      variables: { otp },
      fallbackText: `Your Pretina OTP is ${otp}. Valid for 10 minutes. Do not share with anyone.`,
    });
  }

  /* ──────────────────────────────────────────────────────────
     PUBLIC: Send order status update
     ────────────────────────────────────────────────────────── */
  async sendOrderStatusUpdate(phone, orderNumber, status) {
    const statusMessages = {
      confirmed: `Order ${orderNumber} confirmed! We're preparing your items.`,
      packed:    `Order ${orderNumber} is packed and ready for dispatch!`,
      shipped:   `Your order ${orderNumber} has been shipped! Track via our app.`,
      delivered: `Your order ${orderNumber} has been delivered. Enjoy!`,
      cancelled: `Your order ${orderNumber} has been cancelled. Reach out for queries.`,
    };

    const text = statusMessages[String(status).toLowerCase()]
      || `Your order ${orderNumber} status: ${status}.`;

    return this._dispatch(phone, {
      templateId: process.env.MSG91_ORDER_TEMPLATE_ID,
      variables: { order_number: orderNumber, status },
      fallbackText: text,
    });
  }

  /* ──────────────────────────────────────────────────────────
     PUBLIC: General text SMS
     ────────────────────────────────────────────────────────── */
  async send(phone, text, templateId = null, variables = {}) {
    return this._dispatch(phone, {
      templateId,
      variables,
      fallbackText: text,
    });
  }
}

module.exports = new SMSService();
