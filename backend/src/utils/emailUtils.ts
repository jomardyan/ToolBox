// backend/src/utils/emailUtils.ts

import logger from './logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email service - uses environment-based provider (SendGrid, Nodemailer, etc)
 * For MVP, can use console logging or mock sending
 */
export class EmailUtils {
  /**
   * Send email verification email
   */
  static async sendEmailVerification(email: string, token: string, firstName: string) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
      <h2>Welcome, ${firstName}!</h2>
      <p>Please verify your email address to complete your registration.</p>
      <p>
        <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
      </p>
      <p>Or copy this link: <a href="${verificationLink}">${verificationLink}</a></p>
      <p>This link expires in 24 hours.</p>
      <hr />
      <p>If you didn't create this account, please ignore this email.</p>
    `;

    return this.send({
      to: email,
      subject: 'Verify Your Email - SaaS Platform',
      html,
      text: `Please verify your email: ${verificationLink}`
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(email: string, token: string, firstName: string) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
      <h2>Password Reset Request</h2>
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your password. Click the link below to create a new password.</p>
      <p>
        <a href="${resetLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </p>
      <p>Or copy this link: <a href="${resetLink}">${resetLink}</a></p>
      <p>This link expires in 1 hour.</p>
      <hr />
      <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
    `;

    return this.send({
      to: email,
      subject: 'Password Reset - SaaS Platform',
      html,
      text: `Reset your password: ${resetLink}`
    });
  }

  /**
   * Send subscription confirmation email
   */
  static async sendSubscriptionConfirmation(
    email: string,
    firstName: string,
    planName: string,
    amount: number,
    billingPeriod: string
  ) {
    const html = `
      <h2>Subscription Confirmed!</h2>
      <p>Hi ${firstName},</p>
      <p>Thank you for subscribing to our <strong>${planName}</strong> plan.</p>
      <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Plan:</strong> ${planName}</p>
        <p><strong>Amount:</strong> $${amount.toFixed(2)} / ${billingPeriod}</p>
        <p><strong>Start Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      <p>You can manage your subscription in your <a href="${process.env.FRONTEND_URL}/subscription">account dashboard</a>.</p>
      <hr />
      <p>Need help? Contact us at support@platform.com</p>
    `;

    return this.send({
      to: email,
      subject: `Welcome to ${planName} - SaaS Platform`,
      html,
      text: `You have successfully subscribed to ${planName} for $${amount.toFixed(2)}/${billingPeriod}`
    });
  }

  /**
   * Send invoice email
   */
  static async sendInvoice(
    email: string,
    firstName: string,
    invoiceId: string,
    amount: number,
    periodStart: string,
    periodEnd: string
  ) {
    const downloadLink = `${process.env.FRONTEND_URL}/billing/invoices/${invoiceId}/download`;

    const html = `
      <h2>Invoice #${invoiceId}</h2>
      <p>Hi ${firstName},</p>
      <p>Your invoice for the billing period ${periodStart} to ${periodEnd} is ready.</p>
      <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Invoice ID:</strong> ${invoiceId}</p>
        <p><strong>Amount Due:</strong> $${amount.toFixed(2)}</p>
        <p><strong>Period:</strong> ${periodStart} to ${periodEnd}</p>
      </div>
      <p>
        <a href="${downloadLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Download Invoice
        </a>
      </p>
      <p>View your invoice in your <a href="${process.env.FRONTEND_URL}/billing">billing dashboard</a>.</p>
      <hr />
      <p>Questions? Contact support@platform.com</p>
    `;

    return this.send({
      to: email,
      subject: `Invoice ${invoiceId} - SaaS Platform`,
      html,
      text: `Invoice ${invoiceId} for $${amount.toFixed(2)}`
    });
  }

  /**
   * Send payment failed email
   */
  static async sendPaymentFailed(email: string, firstName: string, amount: number, invoiceId: string) {
    const updatePaymentLink = `${process.env.FRONTEND_URL}/billing/payment-methods`;

    const html = `
      <h2>Payment Failed</h2>
      <p>Hi ${firstName},</p>
      <p>We attempted to charge your payment method for invoice #${invoiceId}, but the transaction failed.</p>
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
        <p><strong>Invoice ID:</strong> ${invoiceId}</p>
      </div>
      <p>Please update your payment method to avoid service interruption.</p>
      <p>
        <a href="${updatePaymentLink}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Update Payment Method
        </a>
      </p>
      <p>If you believe this is an error, please contact support@platform.com</p>
      <hr />
      <p>We'll retry payment in 3 days.</p>
    `;

    return this.send({
      to: email,
      subject: 'Payment Failed - Action Required - SaaS Platform',
      html,
      text: `Payment failed for invoice ${invoiceId}. Please update your payment method.`
    });
  }

  /**
   * Send subscription cancellation email
   */
  static async sendSubscriptionCancelled(email: string, firstName: string, planName: string) {
    const html = `
      <h2>Subscription Cancelled</h2>
      <p>Hi ${firstName},</p>
      <p>Your subscription to the <strong>${planName}</strong> plan has been cancelled.</p>
      <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p>You will lose access to your API keys and usage data at the end of your current billing period.</p>
      </div>
      <p>We'd love to have you back! If you'd like to reactivate or downgrade instead, visit your <a href="${process.env.FRONTEND_URL}/subscription">subscription settings</a>.</p>
      <hr />
      <p>Feedback? We'd love to hear from you: support@platform.com</p>
    `;

    return this.send({
      to: email,
      subject: 'Subscription Cancelled - SaaS Platform',
      html,
      text: `Your subscription to ${planName} has been cancelled.`
    });
  }

  /**
   * Send password change notification email
   */
  static async sendPasswordChangeNotification(email: string, firstName: string) {
    const securityLink = `${process.env.FRONTEND_URL}/account/settings`;

    const html = `
      <h2>Password Changed</h2>
      <p>Hi ${firstName},</p>
      <p>Your password was successfully changed on ${new Date().toLocaleString()}.</p>
      <p>If you didn't make this change, please <a href="${securityLink}">secure your account</a> immediately.</p>
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <p><strong>⚠️ Security Alert</strong></p>
        <p>If this wasn't you, click the button below to reset your password again.</p>
        <p>
          <a href="${process.env.FRONTEND_URL}/request-password-reset" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password Again
          </a>
        </p>
      </div>
      <hr />
      <p>Account Security: <a href="${securityLink}">Manage your account</a></p>
    `;

    return this.send({
      to: email,
      subject: 'Password Changed - SaaS Platform',
      html,
      text: `Your password was changed on ${new Date().toLocaleString()}`
    });
  }

  /**
   * Send account deletion confirmation email
   */
  static async sendAccountDeletionConfirmation(email: string, firstName: string) {
    const html = `
      <h2>Account Deleted</h2>
      <p>Hi ${firstName},</p>
      <p>Your account and all associated data have been permanently deleted as of ${new Date().toLocaleString()}.</p>
      <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p>The following data has been removed:</p>
        <ul>
          <li>Your profile and account information</li>
          <li>All API keys</li>
          <li>Usage history and logs</li>
          <li>Subscriptions and billing records</li>
          <li>Payment methods</li>
        </ul>
      </div>
      <p>If you'd like to create a new account in the future, you can sign up again anytime.</p>
      <p>We're sorry to see you go. If you have any feedback, please let us know at support@platform.com</p>
      <hr />
      <p>This action cannot be undone.</p>
    `;

    return this.send({
      to: email,
      subject: 'Account Deleted - SaaS Platform',
      html,
      text: 'Your account has been permanently deleted.'
    });
  }

  /**
   * Send usage alert email
   */
  static async sendUsageAlert(
    email: string,
    firstName: string,
    currentUsage: number,
    limit: number,
    severity: 'WARNING' | 'CRITICAL',
    percentage: number
  ) {
    const bgColor = severity === 'CRITICAL' ? '#dc3545' : '#ffc107';
    const textColor = severity === 'CRITICAL' ? 'white' : 'black';
    const severityText = severity === 'CRITICAL' ? 'Critical' : 'Warning';

    const html = `
      <h2>API Usage ${severityText}</h2>
      <p>Hi ${firstName},</p>
      <p>Your API usage has reached <strong>${(percentage * 100).toFixed(1)}%</strong> of your monthly limit.</p>
      <div style="background-color: ${bgColor}; color: ${textColor}; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Current Usage:</strong> ${currentUsage.toLocaleString()} requests</p>
        <p><strong>Monthly Limit:</strong> ${limit.toLocaleString()} requests</p>
        <p><strong>Percentage Used:</strong> ${(percentage * 100).toFixed(1)}%</p>
      </div>
      ${
        severity === 'CRITICAL'
          ? '<p><strong>⚠️ Action Required:</strong> Your service may be throttled once you exceed your limit. Please upgrade your plan or contact support.</p>'
          : '<p>Consider upgrading your plan to avoid service interruption.</p>'
      }
      <p>
        <a href="${process.env.FRONTEND_URL}/subscription" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Your Plan
        </a>
      </p>
      <hr />
      <p>Questions? Contact support@platform.com</p>
    `;

    return this.send({
      to: email,
      subject: `API Usage ${severityText} - Action May Be Required`,
      html,
      text: `Your API usage is at ${(percentage * 100).toFixed(1)}% of your monthly limit.`
    });
  }

  /**
   * Send admin notification
   */
  static async sendAdminNotification(
    email: string,
    subject: string,
    message: string,
    details?: Record<string, any>
  ) {
    let detailsHtml = '';
    if (details) {
      detailsHtml = '<div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">';
      for (const [key, value] of Object.entries(details)) {
        detailsHtml += `<p><strong>${key}:</strong> ${value}</p>`;
      }
      detailsHtml += '</div>';
    }

    const html = `
      <h2>${subject}</h2>
      <p>${message}</p>
      ${detailsHtml}
      <hr />
      <p>Admin Portal: <a href="${process.env.FRONTEND_URL}/admin">${process.env.FRONTEND_URL}/admin</a></p>
    `;

    return this.send({
      to: email,
      subject: `[ADMIN] ${subject}`,
      html,
      text: message
    });
  }

  /**
   * Core send email function
   * Supports multiple providers via environment config
   */
  private static async send(options: EmailOptions): Promise<boolean> {
    try {
      const provider = process.env.EMAIL_PROVIDER || 'console';

      if (provider === 'sendgrid') {
        return await this.sendViaSendGrid(options);
      } else if (provider === 'nodemailer') {
        return await this.sendViaNodemailer(options);
      } else {
        // Default: console logging (for development)
        return this.sendViaConsole(options);
      }
    } catch (error) {
      logger.error('Email send error:', error);
      return false;
    }
  }

  /**
   * Send via SendGrid
   */
  private static async sendViaSendGrid(options: EmailOptions): Promise<boolean> {
    try {
      // This would require @sendgrid/mail package
      // For now, log as not implemented
      logger.warn('SendGrid email provider not configured. Email not sent:', options);
      return false;
    } catch (error) {
      logger.error('SendGrid error:', error);
      return false;
    }
  }

  /**
   * Send via Nodemailer
   */
  private static async sendViaNodemailer(options: EmailOptions): Promise<boolean> {
    try {
      // This would require nodemailer package and SMTP configuration
      // For now, log as not implemented
      logger.warn('Nodemailer not configured. Email not sent:', options);
      return false;
    } catch (error) {
      logger.error('Nodemailer error:', error);
      return false;
    }
  }

  /**
   * Send via console (development)
   */
  private static sendViaConsole(options: EmailOptions): boolean {
    logger.info('📧 EMAIL (CONSOLE MODE)', {
      to: options.to,
      subject: options.subject,
      preview: options.html.substring(0, 100) + '...'
    });
    return true;
  }
}

export const emailUtils = EmailUtils;
