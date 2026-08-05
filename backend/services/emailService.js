"use strict";
const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const FROM = process.env.RESEND_FROM_EMAIL || "ONE PIECE <orders@onepiece.in>";
const REPLY_TO = process.env.RESEND_REPLY_TO || "onepiece.fashion99@gmail.com";

const BLUE_DARK = "#0A2A80";
const BLUE_PRIMARY = "#0A5ACB";
const BLUE_ELECTRIC = "#3B82F6";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const appUrl = () => process.env.CLIENT_URL || "https://onepiecefashion.in";

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>ONE PIECE</title>
  <style>
    /* Global Reset */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F1F5F9; color: #0F172A; -webkit-font-smoothing: antialiased; line-height: 1.6; }
    table { border-collapse: collapse; width: 100%; }
    img { max-width: 100%; height: auto; display: block; }
    
    .outer-table { width: 100%; background-color: #F1F5F9; padding: 40px 10px; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 30px -10px rgba(10, 42, 128, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03); border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE_PRIMARY} 100%); padding: 44px 32px; text-align: center; }
    .logo { font-size: 32px; font-weight: 900; color: #FFFFFF; letter-spacing: 5px; line-height: 1; }
    .logo span { color: #7AB2E4; }
    .tagline { font-size: 10px; color: rgba(255, 255, 255, 0.75); letter-spacing: 3px; text-transform: uppercase; margin-top: 8px; font-weight: 600; }
    .body { background: #FFFFFF; padding: 40px 36px; }
    .footer { background: ${BLUE_DARK}; padding: 32px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08); }
    .footer p { color: rgba(255, 255, 255, 0.6); font-size: 12px; margin: 4px 0; font-weight: 400; }
    .footer a { color: #7AB2E4; text-decoration: none; font-weight: 500; }
    .btn { display: inline-block; background: linear-gradient(135deg, ${BLUE_PRIMARY}, ${BLUE_ELECTRIC}); color: #FFFFFF !important; text-decoration: none; padding: 15px 36px; border-radius: 10px; font-weight: 700; font-size: 13px; margin: 24px 0; letter-spacing: 1px; text-transform: uppercase; text-align: center; box-shadow: 0 6px 16px rgba(10, 90, 203, 0.28); }
    .divider { border: none; border-top: 1px solid #E2E8F0; margin: 28px 0; }
    .tag { display: inline-block; background: #EFF6FF; color: ${BLUE_PRIMARY}; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; border: 1px solid #DBEAFE; }
    .info-row { padding: 12px 0; font-size: 14px; border-bottom: 1px solid #F1F5F9; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748B; font-weight: 500; }
    .info-value { font-weight: 700; color: #0F172A; text-align: right; }
    .card-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }
    
    @media only screen and (max-width: 600px) {
      .outer-table { padding: 0; }
      .wrapper { border-radius: 0; border: none; }
      .body { padding: 32px 20px; }
      .header { padding: 36px 20px; }
      .card-box { padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="outer-table">
    <div class="wrapper">
      <div class="header">
        <div class="logo">ONE<span>PIECE</span></div>
        <div class="tagline">Your Statement. Your Style.</div>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} ONE PIECE Fashion. All rights reserved.</p>
        <p><a href="${appUrl()}">onepiece.in</a> &nbsp;·&nbsp; <a href="mailto:onepiece.fashion99@gmail.com">onepiece.fashion99@gmail.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

async function sendEmail({ to, subject, html }) {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: REPLY_TO,
      subject,
      html,
    });
  } catch (error) {
    console.error(error);
  }
}

const emailService = {
  async sendWelcome(user) {
    const html = baseTemplate(`
      <h2 style="font-size:24px;font-weight:800;color:${BLUE_DARK};margin-bottom:12px;letter-spacing:-0.5px">Welcome, ${user.name}! 👋</h2>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin-bottom:24px">
        You've just joined ONE PIECE — India's premium fashion destination. Discover thousands of curated styles, custom prints, and exclusive collections made just for you.
      </p>
      <center><a class="btn" href="${appUrl()}/collections">Start Shopping</a></center>
      <hr class="divider">
      <p style="font-size:13px;color:#94A3B8;text-align:center">Need assistance? Reply to this email anytime.</p>
    `);
    return sendEmail({
      to: user.email,
      subject: "Welcome to ONE PIECE 🎉",
      html,
    });
  },

  async sendAdminNewUser(user) {
    const adminEmail =
      process.env.ADMIN_EMAIL || "onepiece.fashion99@gmail.com";

    const html = baseTemplate(`
    <span class="tag">🎉 New User Registration</span>

    <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 20px;letter-spacing:-0.5px">
      A new customer has joined ONE PIECE
    </h2>

    <div class="card-box">
      <table>
        <tr class="info-row">
          <td class="info-label">Name</td>
          <td class="info-value">${user.name}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Email</td>
          <td class="info-value">${user.email}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Phone</td>
          <td class="info-value">${user.phone || "-"}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Registered</td>
          <td class="info-value">
            ${new Date(user.createdAt).toLocaleString("en-IN")}
          </td>
        </tr>
      </table>
    </div>

    <center>
      <a class="btn" href="${appUrl()}/admin/customers">
        View Customer
      </a>
    </center>
  `);

    return sendEmail({
      to: adminEmail,
      subject: `🎉 New User Registered - ${user.name}`,
      html,
    });
  },

  async sendOrderConfirmation(order) {
    const recipient = order.shippingAddress?.email || order.guestInfo?.email;
    if (!recipient) return;

    const itemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding:14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;margin-bottom:12px;">
          <table style="width:100%">
            <tr>
              <td style="width:68px;vertical-align:top">
                <img src="${item.image}" width="68" height="82" style="object-fit:cover;border-radius:8px;border:1px solid #E2E8F0;display:block" />
              </td>
              <td style="padding-left:16px;vertical-align:top">
                <p style="font-weight:700;font-size:14px;color:#0F172A;margin-bottom:4px;line-height:1.3">${item.name}</p>
                <p style="font-size:12px;color:#64748B;margin-bottom:6px">Qty: ${item.quantity}${item.size ? ` · Size: ${item.size}` : ""}${item.color ? ` · Color: ${item.color}` : ""}</p>
                <p style="font-size:14px;font-weight:800;color:${BLUE_PRIMARY}">${fmt(item.price * item.quantity)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height:10px"></td></tr>`,
      )
      .join("");

    const html = baseTemplate(`
      <span class="tag">Order Confirmed ✓</span>
      <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 4px;letter-spacing:-0.5px">Order #${order.orderNumber}</h2>
      <p style="font-size:14px;color:#64748B;margin-bottom:24px">Thank you, ${order.shippingAddress?.name}! We've received your order.</p>
      
      <table style="width:100%;margin-bottom:12px">${itemsHtml}</table>

      <div class="card-box" style="padding:16px 20px">
        <table>
          <tr class="info-row"><td class="info-label">Subtotal</td><td class="info-value">${fmt(order.pricing.subtotal)}</td></tr>
          ${order.pricing.couponDiscount > 0 ? `<tr class="info-row"><td class="info-label">Coupon Discount</td><td class="info-value" style="color:#16A34A">-${fmt(order.pricing.couponDiscount)}</td></tr>` : ""}
          <tr class="info-row"><td class="info-label">Shipping</td><td class="info-value">${order.pricing.shippingCost === 0 ? '<span style="color:#16A34A;font-weight:700">FREE</span>' : fmt(order.pricing.shippingCost)}</td></tr>
          <tr class="info-row"><td class="info-label">GST (${order.pricing.gstPercentage}%)</td><td class="info-value">${fmt(order.pricing.gst)}</td></tr>
          <tr class="info-row" style="border-top:2px solid #E2E8F0;border-bottom:none"><td style="font-size:15px;font-weight:700;color:#0F172A;padding-top:12px">Total</td><td style="font-size:18px;font-weight:800;color:${BLUE_PRIMARY};padding-top:12px;text-align:right">${fmt(order.pricing.total)}</td></tr>
        </table>
      </div>

      <div style="background:#F1F5F9;border-radius:12px;padding:18px 20px;margin-bottom:20px;border:1px solid #E2E8F0">
        <p style="font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:6px">Delivery Address</p>
        <p style="font-size:14px;color:#0F172A;line-height:1.5;font-weight:600">${order.shippingAddress.name}</p>
        <p style="font-size:13px;color:#64748B;line-height:1.4;margin-top:2px">${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
        <p style="font-size:13px;color:#16A34A;font-weight:700;margin-top:12px">📦 Expected delivery: ${order.tracking?.estimatedDelivery ? new Date(order.tracking.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Within 7 business days"}</p>
      </div>

      <center><a class="btn" href="${appUrl()}/orders/${order._id}">Track Your Order</a></center>
    `);

    return sendEmail({
      to: recipient,
      subject: `Order Confirmed #${order.orderNumber} | ONE PIECE`,
      html,
    });
  },

  async sendOrderStatusUpdate(order, status, message) {
    const recipient = order.shippingAddress?.email || order.guestInfo?.email;
    if (!recipient) return;

    const statusEmoji = {
      confirmed: "✅",
      packed: "📦",
      shipped: "🚚",
      out_for_delivery: "🛵",
      delivered: "🎉",
      cancelled: "❌",
    };
    const emoji = statusEmoji[status] || "📋";
    const label = status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const html = baseTemplate(`
      <span class="tag">${emoji} ${label}</span>
      <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 6px;letter-spacing:-0.5px">Your order has been ${label.toLowerCase()}</h2>
      <p style="font-size:14px;color:#64748B;margin-bottom:20px">Order #${order.orderNumber}</p>
      
      ${message ? `<div style="background:#EFF6FF;padding:18px 20px;border-radius:12px;font-size:14px;color:#1E40AF;border-left:4px solid ${BLUE_PRIMARY};margin-bottom:20px;line-height:1.6">${message}</div>` : ""}
      
      ${
        order.tracking?.trackingNumber
          ? `<div class="card-box" style="text-align:center">
              <p style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:1px;font-weight:700">Tracking Information</p>
              <p style="font-size:16px;font-weight:700;color:#0F172A;margin-top:4px">${order.tracking.trackingNumber} ${order.tracking.courier ? `<span style="font-weight:500;color:#64748B">via ${order.tracking.courier}</span>` : ""}</p>
            </div>`
          : ""
      }
      
      <center><a class="btn" href="${appUrl()}/orders/${order._id}">View Order Details</a></center>
    `);

    return sendEmail({
      to: recipient,
      subject: `${emoji} Order ${label} | ONE PIECE #${order.orderNumber}`,
      html,
    });
  },

  async sendPasswordReset(user, resetUrl) {
    const html = baseTemplate(`
      <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin-bottom:12px;letter-spacing:-0.5px">Reset Your Password 🔐</h2>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin-bottom:24px">Hi ${user.name},<br>We received a request to reset your ONE PIECE account password. Click the button below — this link expires in 30 minutes.</p>
      <center><a class="btn" href="${resetUrl}">Reset Password</a></center>
      <hr class="divider">
      <p style="font-size:12px;color:#94A3B8;text-align:center;line-height:1.5">If you didn't request this, ignore this email. Your password will remain unchanged.<br>For security, never share this link with anyone.</p>
    `);
    return sendEmail({
      to: user.email,
      subject: "Reset Your ONE PIECE Password",
      html,
    });
  },

  async sendShippingNotification(order) {
    const recipient = order.shippingAddress?.email || order.guestInfo?.email;
    if (!recipient) return;
    const html = baseTemplate(`
      <span class="tag">🚚 Order Shipped</span>
      <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 6px;letter-spacing:-0.5px">Your order is on its way!</h2>
      <p style="font-size:14px;color:#64748B;margin-bottom:24px">Order #${order.orderNumber} has been dispatched.</p>
      ${
        order.tracking?.trackingNumber
          ? `
        <div style="background:linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);padding:24px;border-radius:14px;text-align:center;border:1px solid #BFDBFE;margin-bottom:24px">
          <p style="font-size:11px;color:#1E40AF;letter-spacing:1.5px;text-transform:uppercase;font-weight:800">Tracking Details</p>
          <p style="font-size:26px;font-weight:900;color:${BLUE_PRIMARY};margin:8px 0;letter-spacing:1px">${order.tracking.trackingNumber}</p>
          ${order.tracking.courier ? `<p style="font-size:13px;color:#1E3A8A;font-weight:600">Shipped via <strong>${order.tracking.courier}</strong></p>` : ""}
        </div>`
          : ""
      }
      <center><a class="btn" href="${appUrl()}/orders/${order._id}">Track Live</a></center>
    `);
    return sendEmail({
      to: recipient,
      subject: `Shipped! Your ONE PIECE order #${order.orderNumber} is on its way`,
      html,
    });
  },

  async sendCouponToUser(user, coupon) {
    const html = baseTemplate(`
      <span class="tag">🎁 Exclusive Offer</span>
      <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 8px;letter-spacing:-0.5px">A Special Gift Just For You</h2>
      <p style="font-size:14px;color:#475569;margin-bottom:24px">Hi ${user.name}, use this exclusive coupon code on your next purchase:</p>
      
      <div style="background:linear-gradient(135deg,${BLUE_DARK},${BLUE_PRIMARY});border-radius:16px;padding:32px 24px;text-align:center;box-shadow:0 10px 20px rgba(10,42,128,0.18)">
        <p style="font-size:11px;color:rgba(255,255,255,0.75);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:8px;font-weight:700">Your Coupon Code</p>
        <p style="font-size:36px;font-weight:900;color:#FFFFFF;letter-spacing:6px;font-family:monospace;margin:6px 0">${coupon.code}</p>
        <p style="font-size:15px;color:#FFFFFF;margin-top:10px;font-weight:600">
          ${coupon.discountType === "percentage" ? `${coupon.discountValue}% OFF` : `Flat ₹${coupon.discountValue} OFF`}
          ${coupon.minOrderAmount ? `<span style="font-weight:400;opacity:0.85"> (Min. Order ₹${coupon.minOrderAmount})</span>` : ""}
        </p>
      </div>
      
      <p style="font-size:12px;color:#94A3B8;margin-top:18px;text-align:center">Valid until ${new Date(coupon.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      <center><a class="btn" href="${appUrl()}/collections">Shop Now</a></center>
    `);
    return sendEmail({
      to: user.email,
      subject: `${coupon.discountType === "percentage" ? coupon.discountValue + "% OFF" : "₹" + coupon.discountValue + " OFF"} — Exclusive Coupon | ONE PIECE`,
      html,
    });
  },

  async sendAdminNewOrder(order) {
    const adminEmail =
      process.env.ADMIN_EMAIL || "onepiece.fashion99@gmail.com";

    const customer =
      order.shippingAddress?.name || order.guestInfo?.name || "Guest Customer";

    const recipient =
      order.shippingAddress?.email || order.guestInfo?.email || "-";

    const phone = order.shippingAddress?.phone || order.guestInfo?.phone || "-";

    const html = baseTemplate(`
    <span class="tag">🛒 New Order Received</span>

    <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 20px;letter-spacing:-0.5px">
      Order #${order.orderNumber}
    </h2>

    <div class="card-box">
      <table>
        <tr class="info-row">
          <td class="info-label">Customer</td>
          <td class="info-value">${customer}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Email</td>
          <td class="info-value">${recipient}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Phone</td>
          <td class="info-value">${phone}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Payment</td>
          <td class="info-value" style="color:${order.paymentStatus === "paid" ? "#16A34A" : "#D97706"}">
            ${(order.paymentInfo?.status || order.paymentStatus || "Pending").toUpperCase()}
          </td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Items</td>
          <td class="info-value">${order.items.length}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Order Total</td>
          <td class="info-value" style="color:${BLUE_PRIMARY}">${fmt(order.pricing.total)}</td>
        </tr>
      </table>
    </div>

    <center>
      <a class="btn" href="${appUrl()}/admin/orders/${order._id}">
        View Order
      </a>
    </center>
  `);

    return sendEmail({
      to: adminEmail,
      subject: `🛒 New Order Received #${order.orderNumber}`,
      html,
    });
  },

  async sendAdminOrderPaid(order) {
    const adminEmail =
      process.env.ADMIN_EMAIL || "onepiece.fashion99@gmail.com";

    const customer =
      order.shippingAddress?.name || order.guestInfo?.name || "Guest Customer";

    const email = order.shippingAddress?.email || order.guestInfo?.email || "-";

    const html = baseTemplate(`
    <span class="tag">💰 Payment Received</span>

    <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 20px;letter-spacing:-0.5px">
      Order Payment Successful
    </h2>

    <div class="card-box">
      <table>
        <tr class="info-row">
          <td class="info-label">Order</td>
          <td class="info-value">#${order.orderNumber}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Customer</td>
          <td class="info-value">${customer}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Email</td>
          <td class="info-value">${email}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Amount Paid</td>
          <td class="info-value" style="color:#16A34A">${fmt(order.pricing.total)}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Payment Method</td>
          <td class="info-value">${order.paymentInfo?.method?.toUpperCase() || "ONLINE"}</td>
        </tr>
      </table>
    </div>

    <center>
      <a class="btn" href="${appUrl()}/admin/orders/${order._id}">
        View Order
      </a>
    </center>
  `);

    return sendEmail({
      to: adminEmail,
      subject: `💰 Payment Received - Order #${order.orderNumber}`,
      html,
    });
  },

  // ==========================================
  // CUSTOM PRINT EMAIL METHODS
  // ==========================================

  // --- Customer Emails ---

  async sendCustomPrintReceived(order) {
    const recipient = order.customerEmail;
    if (!recipient) return;

    const html = baseTemplate(`
      <span class="tag">Custom Print Received ✓</span>
      <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 6px;letter-spacing:-0.5px">We've received your Request!</h2>
      <p style="font-size:14px;color:#64748B;margin-bottom:24px">Hi ${order.customerName || "Customer"}, our design team is reviewing your customization details.</p>
      
      <div class="card-box">
        <table>
          <tr class="info-row"><td class="info-label">Print Area</td><td class="info-value">${order.selectedPrintArea || "Standard"}</td></tr>
          <tr class="info-row"><td class="info-label">Side</td><td class="info-value">${order.selectedSide || "Front"}</td></tr>
          <tr class="info-row"><td class="info-label">Quantity</td><td class="info-value">${order.quantity}</td></tr>
          ${order.printText ? `<tr class="info-row"><td class="info-label">Custom Text</td><td class="info-value">${order.printText}</td></tr>` : ""}
        </table>
      </div>

      <p style="font-size:14px;color:#475569;line-height:1.6">We will prepare a preview/proof for your review and send you a notification once it's ready.</p>
      <center><a class="btn" href="${appUrl()}/custom-print/${order._id}">View Order Details</a></center>
    `);

    return sendEmail({
      to: recipient,
      subject: `Custom Print Request Received | ONE PIECE`,
      html,
    });
  },

  async sendCustomPrintPreviewUploaded(order) {
    const recipient = order.customerEmail;
    if (!recipient) return;

    const previewImg = order.previewImage?.url || order.proofImage?.url;

    const html = baseTemplate(`
      <span class="tag">🖼️ Design Preview Ready</span>
      <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 6px;letter-spacing:-0.5px">Your Preview is Ready!</h2>
      <p style="font-size:14px;color:#475569;margin-bottom:20px">Hi ${order.customerName || "Customer"}, our design team has uploaded a proof for your review.</p>
      
      ${previewImg ? `<center style="margin:20px 0;"><img src="${previewImg}" style="max-width:100%;border-radius:12px;box-shadow:0 8px 16px rgba(0,0,0,0.06);border:1px solid #E2E8F0;" alt="Preview Proof"/></center>` : ""}
      
      ${order.quotedPrice ? `<div class="card-box" style="background:#EFF6FF;border-color:#BFDBFE;"><table style="width:100%"><tr><td class="info-label" style="color:#1E40AF">Quoted Price</td><td class="info-value" style="color:${BLUE_PRIMARY};font-size:18px;font-weight:800;text-align:right">${fmt(order.quotedPrice)}</td></tr></table></div>` : ""}
      
      <p style="font-size:14px;color:#475569;margin-top:16px;line-height:1.6">Please review and approve or request modifications so we can proceed with printing.</p>
      <center><a class="btn" href="${appUrl()}/custom-print/${order._id}">Review & Approve</a></center>
    `);

    return sendEmail({
      to: recipient,
      subject: `🖼️ Preview Ready for Approval | Custom Print Order`,
      html,
    });
  },

  async sendCustomPrintDecisionConfirmation(order) {
    const recipient = order.customerEmail;
    if (!recipient) return;

    let title = "";
    let message = "";
    let badge = "";

    switch (order.customerDecision) {
      case "Approved":
        badge = "✅ Design Approved";
        title = "Design Approved & Awaiting Payment";
        message = `Thank you for approving the design proof. Please complete payment of <strong>${fmt(order.quotedPrice)}</strong> so we can start production.`;
        break;
      case "Modification Requested":
        badge = "✏️ Modification Requested";
        title = "Modification Request Received";
        message = `We have received your feedback: <em style="color:#0F172A;">"${order.customerFeedback || "No additional comments"}"</em>. Our team will update the design and notify you shortly.`;
        break;
      case "Rejected":
        badge = "❌ Design Rejected";
        title = "Custom Order Closed";
        message = `You have rejected the proposed design preview. This order status is now updated to Rejected.`;
        break;
      default:
        return;
    }

    const html = baseTemplate(`
      <span class="tag">${badge}</span>
      <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 8px;letter-spacing:-0.5px">${title}</h2>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin-bottom:24px">${message}</p>
      
      ${order.customerDecision === "Approved" ? `<center><a class="btn" href="${appUrl()}/custom-print/${order._id}/pay">Complete Payment</a></center>` : `<center><a class="btn" href="${appUrl()}/custom-print/${order._id}">View Order Details</a></center>`}
    `);

    return sendEmail({
      to: recipient,
      subject: `${badge} | Custom Print Order Status`,
      html,
    });
  },

  async sendCustomPrintPaymentReminder(order) {
    const recipient = order.customerEmail;
    if (!recipient) return;

    const html = baseTemplate(`
      <span class="tag">💳 Payment Pending</span>
      <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 8px;letter-spacing:-0.5px">Complete Payment to Start Production</h2>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin-bottom:20px">Hi ${order.customerName || "Customer"}, your custom print proof was approved! Please finalize your payment of <strong>${fmt(order.quotedPrice)}</strong> so we can move your order into production.</p>
      <center><a class="btn" href="${appUrl()}/custom-print/${order._id}/pay">Pay ${fmt(order.quotedPrice)}</a></center>
    `);

    return sendEmail({
      to: recipient,
      subject: `💳 Payment Needed for Custom Print Order`,
      html,
    });
  },

  async sendCustomPrintStatusUpdate(order, status) {
    const recipient = order.customerEmail;
    if (!recipient) return;

    const statusMap = {
      Printing: {
        emoji: "🖨️",
        label: "Production Started",
        msg: "Great news! We've received your payment and your custom print is now in production.",
      },

      Packed: {
        emoji: "📦",
        label: "Order Packed",
        msg: "Your custom print order has been packed and is ready for dispatch.",
      },

      Shipped: {
        emoji: "🚚",
        label: "Order Shipped",
        msg: "Your custom print order is on its way to you!",
      },

      Delivered: {
        emoji: "🎉",
        label: "Order Delivered",
        msg: "Your custom print order has been delivered. Thank you for shopping with ONE PIECE!",
      },

      Approved: {
        emoji: "✅",
        label: "Design Approved",
        msg: "Your design has been approved successfully.",
      },

      "Waiting Approval": {
        emoji: "🖼️",
        label: "Preview Ready",
        msg: "Your design preview is ready for review.",
      },

      Reviewing: {
        emoji: "🎨",
        label: "Designer Reviewing",
        msg: "Our design team is reviewing your customization request.",
      },

      Rejected: {
        emoji: "❌",
        label: "Order Rejected",
        msg: "Your custom print request has been rejected.",
      },
    };

    const config = statusMap[status];
    if (!config) return;

    const html = baseTemplate(`
      <span class="tag">${config.emoji} ${config.label}</span>
      <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 8px;letter-spacing:-0.5px">${config.label}</h2>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin-bottom:24px">${config.msg}</p>
      <center><a class="btn" href="${appUrl()}/custom-print/${order._id}">Track Custom Order</a></center>
    `);

    return sendEmail({
      to: recipient,
      subject: `${config.emoji} Custom Order Update: ${config.label}`,
      html,
    });
  },

  // --- Admin Notifications ---

  async sendAdminNewCustomPrint(order) {
    const adminEmail =
      process.env.ADMIN_EMAIL || "onepiece.fashion99@gmail.com";

    const html = baseTemplate(`
      <span class="tag">🎨 New Custom Print Request</span>
      <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 20px;letter-spacing:-0.5px">New Custom Order Submitted</h2>
      
      <div class="card-box">
        <table>
          <tr class="info-row"><td class="info-label">Customer</td><td class="info-value">${order.customerName || "N/A"}</td></tr>
          <tr class="info-row"><td class="info-label">Email</td><td class="info-value">${order.customerEmail || "N/A"}</td></tr>
          <tr class="info-row"><td class="info-label">Phone</td><td class="info-value">${order.customerPhone || "N/A"}</td></tr>
          <tr class="info-row"><td class="info-label">Quantity</td><td class="info-value">${order.quantity}</td></tr>
          <tr class="info-row"><td class="info-label">Print Area</td><td class="info-value">${order.selectedPrintArea || "Standard"}</td></tr>
        </table>
      </div>

      <center><a class="btn" href="${appUrl()}/admin/custom-prints/${order._id}">View & Process Request</a></center>
    `);

    return sendEmail({
      to: adminEmail,
      subject: `🎨 New Custom Print Request - ${order.customerName || "Customer"}`,
      html,
    });
  },

  async sendAdminCustomerDecision(order) {
    const adminEmail =
      process.env.ADMIN_EMAIL || "onepiece.fashion99@gmail.com";

    const statusBadge =
      {
        Approved: "✅ Approved",
        "Modification Requested": "✏️ Modification Requested",
        Rejected: "❌ Rejected",
      }[order.customerDecision] || order.customerDecision;

    const html = baseTemplate(`
      <span class="tag">Decision: ${statusBadge}</span>
      <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 20px;letter-spacing:-0.5px">Customer Decision Received</h2>
      
      <div class="card-box">
        <table>
          <tr class="info-row"><td class="info-label">Customer</td><td class="info-value">${order.customerName || "N/A"}</td></tr>
          <tr class="info-row"><td class="info-label">Decision</td><td class="info-value">${order.customerDecision}</td></tr>
        </table>
        ${order.customerFeedback ? `<div style="margin-top:12px;padding-top:12px;border-top:1px dashed #E2E8F0;"><p style="font-size:12px;color:#64748B;margin-bottom:4px;font-weight:600">Feedback:</p><p style="font-size:14px;color:#0F172A;font-style:italic">"${order.customerFeedback}"</p></div>` : ""}
      </div>

      <center><a class="btn" href="${appUrl()}/admin/custom-prints/${order._id}">View Order in Admin Panel</a></center>
    `);

    return sendEmail({
      to: adminEmail,
      subject: `Custom Print Decision: ${statusBadge} (${order.customerName})`,
      html,
    });
  },

  async sendAdminCustomPrintPaid(order) {
    const adminEmail =
      process.env.ADMIN_EMAIL || "onepiece.fashion99@gmail.com";

    const html = baseTemplate(`
    <span class="tag">💰 Custom Print Payment</span>

    <h2 style="font-size:22px;font-weight:800;color:${BLUE_DARK};margin:18px 0 20px;letter-spacing:-0.5px">
      Payment Received Successfully
    </h2>

    <div class="card-box">
      <table>
        <tr class="info-row">
          <td class="info-label">Customer</td>
          <td class="info-value">${order.customerName}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Email</td>
          <td class="info-value">${order.customerEmail}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Amount Paid</td>
          <td class="info-value" style="color:#16A34A">${fmt(order.quotedPrice)}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Status</td>
          <td class="info-value">Printing</td>
        </tr>
      </table>
    </div>

    <center>
      <a class="btn" href="${appUrl()}/admin/custom-prints/${order._id}">
        Open Custom Print Order
      </a>
    </center>
  `);

    return sendEmail({
      to: adminEmail,
      subject: `💰 Custom Print Payment Received - ${order.customerName}`,
      html,
    });
  },
};

module.exports = emailService;
