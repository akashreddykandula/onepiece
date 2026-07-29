'use strict';
const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL || 'ONE PIECE <orders@onepiece.in>';
const REPLY_TO = process.env.RESEND_REPLY_TO || 'support@onepiece.in';

const BLUE_DARK = '#0A2A80';
const BLUE_PRIMARY = '#0A5ACB';
const BLUE_ELECTRIC = '#3B82F6';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const appUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

const baseTemplate = (content) => `
<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; background: #F7FAFC; color: #1A202C; }
  .wrapper { max-width: 600px; margin: 40px auto; }
  .header { background: linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE_PRIMARY} 100%); padding: 36px 40px; text-align: center; border-radius: 16px 16px 0 0; }
  .logo { font-size: 28px; font-weight: 900; color: #FFFFFF; letter-spacing: 3px; }
  .logo span { color: #7AB2E4; }
  .tagline { font-size: 11px; color: rgba(255,255,255,0.6); letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
  .body { background: #FFFFFF; padding: 40px; }
  .footer { background: ${BLUE_DARK}; padding: 28px 40px; text-align: center; border-radius: 0 0 16px 16px; }
  .footer p { color: rgba(255,255,255,0.5); font-size: 12px; margin: 4px 0; }
  .footer a { color: #7AB2E4; text-decoration: none; }
  .btn { display: inline-block; background: linear-gradient(135deg, ${BLUE_PRIMARY}, ${BLUE_ELECTRIC}); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 20px 0; letter-spacing: 0.5px; }
  .divider { border: none; border-top: 1px solid #E5E7EB; margin: 24px 0; }
  .tag { display: inline-block; background: #EFF6FF; color: ${BLUE_PRIMARY}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .info-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
  .info-label { color: #6B7280; }
  .info-value { font-weight: 600; color: #111827; }
</style></head>
<body><div class="wrapper">
  <div class="header">
    <div class="logo">ONE<span>PIECE</span></div>
    <div class="tagline">Your Statement. Your Style.</div>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} ONE PIECE Fashion. All rights reserved.</p>
    <p><a href="${appUrl()}">onepiece.in</a> &nbsp;·&nbsp; <a href="mailto:support@onepiece.in">support@onepiece.in</a></p>
  </div>
</div></body></html>`;

async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.log(`[EMAIL SKIPPED — no RESEND_API_KEY] To: ${to} | ${subject}`);
    return { skipped: true };
  }
  try {
    return await resend.emails.send({ from: FROM, to, replyTo: REPLY_TO, subject, html });
  } catch (error) {
    console.error('Email send failed:', error.message);
    return { error: error.message };
  }
}

const emailService = {
  async sendWelcome(user) {
    const html = baseTemplate(`
      <h2 style="font-size:24px;font-weight:700;color:${BLUE_DARK};margin-bottom:8px">Welcome, ${user.name}! 👋</h2>
      <p style="color:#4B5563;font-size:15px;line-height:1.6;margin-bottom:20px">
        You've just joined ONE PIECE — India's premium fashion destination. Discover thousands of curated styles, custom prints, and exclusive collections made just for you.
      </p>
      <center><a class="btn" href="${appUrl()}/collections">Start Shopping</a></center>
      <hr class="divider">
      <p style="font-size:13px;color:#9CA3AF">Need help? Reply to this email anytime.</p>
    `);
    return sendEmail({ to: user.email, subject: 'Welcome to ONE PIECE 🎉', html });
  },

  async sendOrderConfirmation(order) {
    const recipient = order.shippingAddress?.email || order.guestInfo?.email;
    if (!recipient) return;

    const itemsHtml = order.items.map(item => `
      <div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid #F3F4F6">
        <img src="${item.image}" width="60" height="72" style="object-fit:cover;border-radius:8px;flex-shrink:0" />
        <div style="flex:1">
          <p style="font-weight:600;font-size:14px;color:#111827;margin-bottom:4px">${item.name}</p>
          <p style="font-size:12px;color:#6B7280">Qty: ${item.quantity}${item.size ? ` · ${item.size}` : ''}${item.color ? ` · ${item.color}` : ''}</p>
          <p style="font-size:14px;font-weight:700;color:${BLUE_PRIMARY};margin-top:4px">${fmt(item.price * item.quantity)}</p>
        </div>
      </div>`).join('');

    const html = baseTemplate(`
      <span class="tag">Order Confirmed ✓</span>
      <h2 style="font-size:22px;font-weight:700;color:${BLUE_DARK};margin:16px 0 4px">Order #${order.orderNumber}</h2>
      <p style="font-size:14px;color:#6B7280;margin-bottom:24px">Thank you, ${order.shippingAddress?.name}! We've received your order.</p>
      ${itemsHtml}
      <hr class="divider">
      <div class="info-row"><span class="info-label">Subtotal</span><span class="info-value">${fmt(order.pricing.subtotal)}</span></div>
      ${order.pricing.couponDiscount > 0 ? `<div class="info-row"><span class="info-label">Coupon Discount</span><span class="info-value" style="color:#22C55E">-${fmt(order.pricing.couponDiscount)}</span></div>` : ''}
      <div class="info-row"><span class="info-label">Shipping</span><span class="info-value">${order.pricing.shippingCost === 0 ? '<span style="color:#22C55E">FREE</span>' : fmt(order.pricing.shippingCost)}</span></div>
      <div class="info-row"><span class="info-label">GST (${order.pricing.gstPercentage}%)</span><span class="info-value">${fmt(order.pricing.gst)}</span></div>
      <div class="info-row" style="border-top:2px solid #E5E7EB;padding-top:12px;margin-top:4px"><span style="font-size:16px;font-weight:700">Total</span><span style="font-size:18px;font-weight:800;color:${BLUE_PRIMARY}">${fmt(order.pricing.total)}</span></div>
      <hr class="divider">
      <p style="font-size:13px;color:#6B7280;margin-bottom:4px"><strong>Delivery to:</strong> ${order.shippingAddress.name}</p>
      <p style="font-size:13px;color:#6B7280">${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
      <p style="font-size:13px;color:#22C55E;margin-top:8px">📦 Expected delivery: ${order.tracking?.estimatedDelivery ? new Date(order.tracking.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Within 7 business days'}</p>
      <center><a class="btn" href="${appUrl()}/orders/${order._id}">Track Your Order</a></center>
    `);

    return sendEmail({ to: recipient, subject: `Order Confirmed #${order.orderNumber} | ONE PIECE`, html });
  },

  async sendOrderStatusUpdate(order, status, message) {
    const recipient = order.shippingAddress?.email || order.guestInfo?.email;
    if (!recipient) return;

    const statusEmoji = { confirmed: '✅', packed: '📦', shipped: '🚚', out_for_delivery: '🛵', delivered: '🎉', cancelled: '❌' };
    const emoji = statusEmoji[status] || '📋';
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const html = baseTemplate(`
      <span class="tag">${emoji} ${label}</span>
      <h2 style="font-size:22px;font-weight:700;color:${BLUE_DARK};margin:16px 0 8px">Your order has been ${label.toLowerCase()}</h2>
      <p style="font-size:14px;color:#4B5563;margin-bottom:16px">Order #${order.orderNumber}</p>
      ${message ? `<p style="background:#EFF6FF;padding:16px;border-radius:8px;font-size:14px;color:#1E40AF;border-left:3px solid ${BLUE_PRIMARY}">${message}</p>` : ''}
      ${order.tracking?.trackingNumber ? `<p style="font-size:14px;color:#374151;margin-top:12px">📍 Tracking Number: <strong>${order.tracking.trackingNumber}</strong>${order.tracking.courier ? ` (${order.tracking.courier})` : ''}</p>` : ''}
      <center><a class="btn" href="${appUrl()}/orders/${order._id}">View Order</a></center>
    `);

    return sendEmail({ to: recipient, subject: `${emoji} Order ${label} | ONE PIECE #${order.orderNumber}`, html });
  },

  async sendPasswordReset(user, resetUrl) {
    const html = baseTemplate(`
      <h2 style="font-size:22px;font-weight:700;color:${BLUE_DARK};margin-bottom:8px">Reset Your Password 🔐</h2>
      <p style="font-size:14px;color:#4B5563;line-height:1.6;margin-bottom:20px">Hi ${user.name},<br>We received a request to reset your ONE PIECE account password. Click the button below — this link expires in 30 minutes.</p>
      <center><a class="btn" href="${resetUrl}">Reset Password</a></center>
      <hr class="divider">
      <p style="font-size:12px;color:#9CA3AF">If you didn't request this, ignore this email. Your password will remain unchanged.<br>For security, never share this link.</p>
    `);
    return sendEmail({ to: user.email, subject: 'Reset Your ONE PIECE Password', html });
  },

  async sendShippingNotification(order) {
    const recipient = order.shippingAddress?.email || order.guestInfo?.email;
    if (!recipient) return;
    const html = baseTemplate(`
      <h2 style="font-size:22px;font-weight:700;color:${BLUE_DARK};margin-bottom:8px">Your order is on its way! 🚚</h2>
      <p style="font-size:14px;color:#4B5563;margin-bottom:20px">Order #${order.orderNumber} has been shipped.</p>
      ${order.tracking?.trackingNumber ? `
        <div style="background:#EFF6FF;padding:20px;border-radius:12px;text-align:center">
          <p style="font-size:12px;color:#6B7280;letter-spacing:1px;text-transform:uppercase">Tracking Number</p>
          <p style="font-size:24px;font-weight:800;color:${BLUE_PRIMARY};margin:8px 0">${order.tracking.trackingNumber}</p>
          ${order.tracking.courier ? `<p style="font-size:13px;color:#4B5563">via ${order.tracking.courier}</p>` : ''}
        </div>` : ''}
      <center><a class="btn" href="${appUrl()}/orders/${order._id}">Track Live</a></center>
    `);
    return sendEmail({ to: recipient, subject: `Shipped! Your ONE PIECE order #${order.orderNumber} is on its way`, html });
  },

  async sendCouponToUser(user, coupon) {
    const html = baseTemplate(`
      <h2 style="font-size:22px;font-weight:700;color:${BLUE_DARK};margin-bottom:8px">Exclusive Offer Just For You 🎁</h2>
      <p style="font-size:14px;color:#4B5563;margin-bottom:20px">Hi ${user.name}, here's a special coupon code:</p>
      <div style="background:linear-gradient(135deg,${BLUE_DARK},${BLUE_PRIMARY});border-radius:12px;padding:24px;text-align:center">
        <p style="font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Your Coupon Code</p>
        <p style="font-size:32px;font-weight:900;color:#FFFFFF;letter-spacing:4px">${coupon.code}</p>
        <p style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:8px">
          ${coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `Flat ₹${coupon.discountValue} OFF`}
          ${coupon.minOrderAmount ? ` on orders above ₹${coupon.minOrderAmount}` : ''}
        </p>
      </div>
      <p style="font-size:12px;color:#9CA3AF;margin-top:12px">Valid until ${new Date(coupon.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <center><a class="btn" href="${appUrl()}/collections">Shop Now</a></center>
    `);
    return sendEmail({ to: user.email, subject: `${coupon.discountType === 'percentage' ? coupon.discountValue + '% OFF' : '₹' + coupon.discountValue + ' OFF'} — Exclusive Coupon | ONE PIECE`, html });
  },
};

module.exports = emailService;
