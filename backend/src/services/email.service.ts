import { transporter } from "../config/email";
import { env } from "../config/env";

export class EmailService {
  private readonly from = `"ShopClone" <${env.SMTP_FROM}>`;

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await transporter.sendMail({
      from: this.from,
      to: email,
      subject: "Welcome to ShopClone! 🎉",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Welcome, ${name}!</h1>
          <p>Thank you for joining ShopClone. Your account has been created successfully.</p>
          <p>Start exploring our amazing products today!</p>
          <a href="${env.CLIENT_URL}" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
            Shop Now
          </a>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${env.CLIENT_URL}/auth/reset-password?token=${token}`;
    await transporter.sendMail({
      from: this.from,
      to: email,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Password Reset</h1>
          <p>Hi ${name}, you requested to reset your password.</p>
          <p>Click the button below to reset it. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
            Reset Password
          </a>
          <p style="color: #999; font-size: 14px; margin-top: 16px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
  }

  async sendOrderConfirmationEmail(
    email: string,
    name: string,
    orderNumber: string,
    total: number,
    items: Array<{ name: string; quantity: number; price: number }>,
  ): Promise<void> {
    const itemsHtml = items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
          </tr>`,
      )
      .join("");

    await transporter.sendMail({
      from: this.from,
      to: email,
      subject: `Order Confirmed — #${orderNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Order Confirmed! ✓</h1>
          <p>Hi ${name}, your order <strong>#${orderNumber}</strong> has been confirmed.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="text-align: right; font-size: 18px; font-weight: bold; margin-top: 16px;">
            Total: $${total.toFixed(2)}
          </p>
          <a href="${env.CLIENT_URL}/account/orders" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
            View Order
          </a>
        </div>
      `,
    });
  }

  async sendShippingEmail(
    email: string,
    name: string,
    orderNumber: string,
    trackingNumber?: string,
  ): Promise<void> {
    await transporter.sendMail({
      from: this.from,
      to: email,
      subject: `Your order #${orderNumber} has shipped! 📦`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Your Order Has Shipped!</h1>
          <p>Hi ${name}, great news! Your order <strong>#${orderNumber}</strong> is on its way.</p>
          ${trackingNumber ? `<p>Tracking number: <strong>${trackingNumber}</strong></p>` : ""}
          <a href="${env.CLIENT_URL}/account/orders" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
            Track Order
          </a>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
