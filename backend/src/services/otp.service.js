/**
 * OTP Service — Pretina
 *
 * Handles OTP generation, hashing, verification.
 * Designed to be SMS-provider-agnostic.
 *
 * To enable SMS delivery:
 *   Option A (MSG91): Set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID in .env
 *   Option B (Twilio): Set TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in .env
 *   Set SMS_ENABLED=true to activate actual sending.
 *
 * Without SMS: OTP is generated, stored (hashed), and returned in response
 * (useful for dev/testing).
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/* ── Config ─────────────────────────────────────────────────── */
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
const OTP_MAX_ATTEMPTS   = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;
const OTP_LENGTH         = parseInt(process.env.OTP_LENGTH) || 6;
const SALT_ROUNDS        = 10;

/* ── Special test numbers (like YouthQit pattern) ───────────── */
const TEST_PHONES = ['9999999999', '8888888888'];
const TEST_OTP    = '123456';

class OTPService {
  /**
   * Generate a numeric OTP of the configured length.
   * Returns plain text — store only the hash.
   */
  generate() {
    const min = Math.pow(10, OTP_LENGTH - 1);
    const max = Math.pow(10, OTP_LENGTH) - 1;
    return String(crypto.randomInt(min, max + 1));
  }

  /**
   * Hash an OTP for storage using bcrypt.
   * @param {string} otp - Plain text OTP
   * @returns {Promise<string>} hashed OTP
   */
  async hash(otp) {
    return bcrypt.hash(otp, SALT_ROUNDS);
  }

  /**
   * Build the OTP document to store inside the User document.
   * @param {string} otp - Plain text OTP
   * @returns {Promise<Object>} { hash, expiresAt, attempts: 0 }
   */
  async buildOTPDoc(otp) {
    const hash = await this.hash(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    return { hash, expiresAt, attempts: 0 };
  }

  /**
   * Verify an OTP against the stored document.
   *
   * @param {string}  phone   - User's phone (for test-number bypass)
   * @param {string}  otp     - Plain text OTP submitted by user
   * @param {Object}  otpDoc  - Stored OTP document { hash, expiresAt, attempts }
   * @returns {{ valid: boolean, message: string, shouldClear: boolean }}
   */
  async verify(phone, otp, otpDoc) {
    // ── Test number bypass (Play Console / dev) ───────────────
    if (TEST_PHONES.includes(phone) && otp === TEST_OTP) {
      return { valid: true, message: 'OTP verified.', shouldClear: true };
    }

    if (!otpDoc || !otpDoc.hash) {
      return { valid: false, message: 'No OTP found. Please request a new one.', shouldClear: false };
    }

    // ── Attempt limit ─────────────────────────────────────────
    if (otpDoc.attempts >= OTP_MAX_ATTEMPTS) {
      return {
        valid: false,
        message: 'Maximum attempts exceeded. Please request a new OTP.',
        shouldClear: false,
      };
    }

    // ── Expiry check ──────────────────────────────────────────
    if (new Date() > new Date(otpDoc.expiresAt)) {
      return { valid: false, message: 'OTP has expired. Please request a new one.', shouldClear: true };
    }

    // ── Hash comparison ───────────────────────────────────────
    const isMatch = await bcrypt.compare(otp, otpDoc.hash);

    if (!isMatch) {
      const remaining = OTP_MAX_ATTEMPTS - (otpDoc.attempts + 1);
      return {
        valid: false,
        message: `Incorrect OTP. ${remaining} attempt(s) remaining.`,
        shouldClear: false,
        incrementAttempts: true,
      };
    }

    return { valid: true, message: 'OTP verified successfully.', shouldClear: true };
  }

  /**
   * Returns expiry minutes config (useful for telling the user how long OTP is valid).
   */
  get expiryMinutes() {
    return OTP_EXPIRY_MINUTES;
  }
}

module.exports = new OTPService();
