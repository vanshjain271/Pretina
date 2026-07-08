/**
 * Notification Service — Pretina
 *
 * Handles:
 *   1. FCM push notifications (DISABLED until Firebase is configured)
 *   2. In-app notification record storage (always active)
 *   3. Order status push messages
 *   4. Admin broadcast
 *
 * To enable Firebase:
 *   1. Create a Firebase project and download the service account JSON.
 *   2. Set FIREBASE_SERVICE_ACCOUNT_JSON env var (stringified JSON).
 *      OR set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
 *   3. Set FIREBASE_ENABLED=true in .env
 */

const Notification = require('../models/Notification');
const User = require('../models/User');

/* ── Firebase Admin Initialisation ─────────────────────────────
   Disabled by default. Only boots if FIREBASE_ENABLED=true and
   the required credentials are present.
   ──────────────────────────────────────────────────────────── */
let firebaseAdmin = null;
const FIREBASE_ENABLED = process.env.FIREBASE_ENABLED === 'true';

if (FIREBASE_ENABLED) {
  try {
    const admin = require('firebase-admin');

    if (!admin.apps.length) {
      let credential;

      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        // Full service account JSON as a single env var (recommended for production)
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        credential = admin.credential.cert(serviceAccount);
      } else if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
      ) {
        // Split credentials across three env vars
        credential = admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
      } else {
        console.warn('⚠️  [NotificationService] FIREBASE_ENABLED=true but no credentials found. FCM disabled.');
      }

      if (credential) {
        admin.initializeApp({ credential });
        firebaseAdmin = admin;
        console.log('✅ [NotificationService] Firebase Admin initialized.');
      }
    } else {
      firebaseAdmin = admin;
    }
  } catch (err) {
    console.error('❌ [NotificationService] Firebase Admin init failed:', err.message);
    firebaseAdmin = null;
  }
} else {
  console.log('ℹ️  [NotificationService] Firebase disabled (FIREBASE_ENABLED != true). Push notifications will be skipped.');
}

/* ── Status → Message Map ────────────────────────────────────── */
const ORDER_STATUS_MESSAGES = {
  confirmed: {
    title: '✅ Order Confirmed!',
    body: (num) => `Great news! Your order ${num} has been confirmed and is being prepared.`,
  },
  packed: {
    title: '📦 Order Packed',
    body: (num) => `Your order ${num} is packed and ready for dispatch.`,
  },
  shipped: {
    title: '🚚 Order Shipped!',
    body: (num) => `Your order ${num} is on its way. Tracking details coming soon!`,
  },
  delivered: {
    title: '🎉 Order Delivered!',
    body: (num) => `Your order ${num} has been delivered. Hope you love it!`,
  },
  cancelled: {
    title: '❌ Order Cancelled',
    body: (num) => `Your order ${num} has been cancelled. Contact support for queries.`,
  },
};

class NotificationService {
  /* ──────────────────────────────────────────────────────────
     INTERNAL: Send FCM to a list of tokens
     ────────────────────────────────────────────────────────── */
  async _sendFCM(tokens, title, body, data = {}, imageUrl = null) {
    if (!firebaseAdmin || !tokens || tokens.length === 0) return { success: false, reason: 'FCM not available' };

    try {
      const message = {
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
        android: {
          notification: { ...(imageUrl && { imageUrl }) },
          priority: 'high',
        },
        apns: {
          payload: { aps: { 'mutable-content': 1, sound: 'default' } },
          ...(imageUrl && { fcm_options: { image: imageUrl } }),
        },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        tokens,
      };

      const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (err) {
      console.error('[NotificationService] FCM send error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /* ──────────────────────────────────────────────────────────
     INTERNAL: Cleanup invalid FCM tokens for a user
     ────────────────────────────────────────────────────────── */
  async _cleanupTokens(userId, userFcmTokens, responses) {
    if (!responses || responses.length === 0) return;
    const invalidTokens = [];
    responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code || '';
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(userFcmTokens[idx]?.token);
        }
      }
    });
    if (invalidTokens.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { token: { $in: invalidTokens } } },
      });
    }
  }

  /* ──────────────────────────────────────────────────────────
     PUBLIC: Send to a specific user
     ────────────────────────────────────────────────────────── */
  async sendToUser(userId, { title, body, data = {}, imageUrl = null } = {}) {
    try {
      const user = await User.findById(userId).select('fcmTokens name phone').lean();
      if (!user) return { success: false, reason: 'User not found' };

      const tokens = (user.fcmTokens || []).map(t => t.token).filter(Boolean);

      if (tokens.length > 0 && firebaseAdmin) {
        const result = await this._sendFCM(tokens, title, body, data, imageUrl);
        if (result.success) {
          await this._cleanupTokens(userId, user.fcmTokens, result.responses);
        }
      }

      return { success: true };
    } catch (err) {
      console.error('[NotificationService] sendToUser error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /* ──────────────────────────────────────────────────────────
     PUBLIC: Broadcast to all users via FCM topic
     ────────────────────────────────────────────────────────── */
  async broadcast({ title, body, data = {}, topic = 'all_users', imageUrl = null } = {}) {
    try {
      if (!firebaseAdmin) {
        console.log('[NotificationService] broadcast skipped — Firebase not configured.');
        return { success: false, reason: 'Firebase not configured' };
      }

      const message = {
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
        android: {
          notification: { ...(imageUrl && { imageUrl }) },
          priority: 'high',
        },
        apns: {
          payload: { aps: { 'mutable-content': 1, sound: 'default' } },
          ...(imageUrl && { fcm_options: { image: imageUrl } }),
        },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        topic,
      };

      const messageId = await firebaseAdmin.messaging().send(message);
      return { success: true, messageId };
    } catch (err) {
      console.error('[NotificationService] broadcast error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /* ──────────────────────────────────────────────────────────
     PUBLIC: Order status changed — notify customer + save record
     ────────────────────────────────────────────────────────── */
  async sendOrderStatusNotification(userId, order, newStatus) {
    try {
      const statusKey = String(newStatus).toLowerCase();
      const template = ORDER_STATUS_MESSAGES[statusKey];

      const title = template?.title || `Order ${statusKey.toUpperCase()}`;
      const body = template?.body
        ? template.body(order.orderNumber)
        : `Your order ${order.orderNumber} status has been updated to ${newStatus}.`;

      const data = {
        type: 'ORDER_UPDATE',
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        status: newStatus,
      };

      // 1. Send FCM (no-op if Firebase not configured)
      this.sendToUser(String(userId), { title, body, data }).catch(e =>
        console.error('[NotificationService] orderStatus FCM fail:', e.message)
      );

      return { success: true };
    } catch (err) {
      console.error('[NotificationService] sendOrderStatusNotification error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /* ──────────────────────────────────────────────────────────
     PUBLIC: Notify all admins (e.g. new order placed)
     ────────────────────────────────────────────────────────── */
  async notifyAdmins(title, body, data = {}) {
    try {
      const admins = await User.find({
        role: { $in: ['admin', 'employee'] },
        isActive: true,
      }).select('fcmTokens').lean();

      if (!admins.length) return { success: false, reason: 'No admins found' };

      const allTokens = admins.flatMap(a => (a.fcmTokens || []).map(t => t.token)).filter(Boolean);

      if (allTokens.length > 0 && firebaseAdmin) {
        await this._sendFCM(allTokens, title, body, data);
      }

      return { success: true };
    } catch (err) {
      console.error('[NotificationService] notifyAdmins error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /* ──────────────────────────────────────────────────────────
     PUBLIC: Register / update FCM token for a user
     ────────────────────────────────────────────────────────── */
  async registerFCMToken(userId, token, deviceType = 'android') {
    try {
      if (!token) return { success: false, reason: 'No token provided' };

      // Remove any existing entry for this token (prevent duplicates), then add fresh
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { token } },
      });
      await User.findByIdAndUpdate(userId, {
        $push: { fcmTokens: { token, device: deviceType, addedAt: new Date() } },
      });

      return { success: true };
    } catch (err) {
      console.error('[NotificationService] registerFCMToken error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /* ──────────────────────────────────────────────────────────
     PUBLIC: Save notification record to DB (for history tab)
     ────────────────────────────────────────────────────────── */
  async saveRecord({ sentBy, title, body, data = {}, targetType = 'all', targetUser = null, imageUrl = '', sentCount = 0, status = 'sent' }) {
    try {
      const record = await Notification.create({
        sentBy,
        title,
        body,
        data,
        targetType,
        targetUser,
        imageUrl,
        sentCount,
        status,
      });
      return { success: true, record };
    } catch (err) {
      console.error('[NotificationService] saveRecord error:', err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new NotificationService();
