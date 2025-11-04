/**
 * Email Service
 * Handles sending emails for various application events
 * Uses Nodemailer for SMTP integration
 */

import nodemailer from 'nodemailer';
import logger from '../utils/logger';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface User {
  email: string;
  firstName?: string;
  lastName?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD || '',
          }
        : undefined,
    });

    this.isConfigured = !!process.env.SMTP_HOST;
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('Email service not configured. Set SMTP_HOST to enable email');
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully');
      return true;
    } catch (error) {
      logger.error('Failed to verify email connection:', error);
      return false;
    }
  }

  /**
   * Generate email verification template
   */
  private getVerificationEmailTemplate(
    userName: string,
    verificationUrl: string
  ): EmailTemplate {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>Thank you for signing up for ToolBox! Please verify your email address by clicking the button below:</p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
              <p>Or copy and paste this link in your browser:</p>
              <p><code>${verificationUrl}</code></p>
              <p>This link expires in 24 hours.</p>
              <p>If you didn't create this account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 ToolBox. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Hello ${userName},

Thank you for signing up for ToolBox! Please verify your email address by visiting:

${verificationUrl}

This link expires in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
ToolBox Team
    `;

    return {
      subject: 'Verify Your Email Address',
      html,
      text,
    };
  }

  /**
   * Generate welcome email template
   */
  private getWelcomeEmailTemplate(userName: string): EmailTemplate {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .feature { margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #667eea; }
            .feature strong { color: #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ToolBox!</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>Welcome to ToolBox! We're excited to have you on board. Here's what you can do with your account:</p>
              
              <div class="feature">
                <strong>📊 Create API Keys:</strong> Generate and manage API keys for your applications
              </div>
              <div class="feature">
                <strong>📈 Track Usage:</strong> Monitor your API usage and costs in real-time
              </div>
              <div class="feature">
                <strong>💳 Choose Plans:</strong> Select the perfect plan for your needs
              </div>
              <div class="feature">
                <strong>🔐 Security:</strong> Your data is encrypted and protected with industry-standard security
              </div>

              <p>Get started by visiting your dashboard:</p>
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>

              <p>Have questions? Check out our documentation or contact support.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 ToolBox. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Hello ${userName},

Welcome to ToolBox! We're excited to have you on board.

Get started by visiting your dashboard:
${process.env.FRONTEND_URL}/dashboard

Features:
- Create and manage API keys
- Track your API usage
- Choose from our flexible plans
- Enterprise-grade security

Have questions? Check out our documentation or contact support.

Best regards,
ToolBox Team
    `;

    return {
      subject: 'Welcome to ToolBox',
      html,
      text,
    };
  }

  /**
   * Generate password reset email template
   */
  private getPasswordResetEmailTemplate(
    userName: string,
    resetUrl: string
  ): EmailTemplate {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link in your browser:</p>
              <p><code>${resetUrl}</code></p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link expires in 1 hour. If you didn't request a password reset, please ignore this email or contact support immediately.
              </div>
              <p>The link will only work once. After you reset your password, your old password will no longer work.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 ToolBox. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Hello ${userName},

We received a request to reset your password. Visit the link below to create a new password:

${resetUrl}

This link expires in 1 hour.

If you didn't request a password reset, please ignore this email or contact support immediately.

Best regards,
ToolBox Team
    `;

    return {
      subject: 'Reset Your Password',
      html,
      text,
    };
  }

  /**
   * Generate payment confirmation email template
   */
  private getPaymentConfirmationEmailTemplate(
    userName: string,
    amount: number,
    invoiceUrl: string
  ): EmailTemplate {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .amount { font-size: 28px; font-weight: bold; color: #11998e; margin: 20px 0; }
            .details { background: white; padding: 15px; border-left: 4px solid #11998e; margin: 20px 0; }
            .button { display: inline-block; background: #11998e; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Received</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>Thank you! Your payment has been received successfully.</p>
              <div class="amount">$${(amount / 100).toFixed(2)}</div>
              <div class="details">
                <p><strong>Payment Status:</strong> Completed</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <p>You can download your invoice using the link below:</p>
              <a href="${invoiceUrl}" class="button">Download Invoice</a>
              <p>Your subscription has been updated. Thank you for your business!</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 ToolBox. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Hello ${userName},

Thank you! Your payment has been received successfully.

Amount: $${(amount / 100).toFixed(2)}
Date: ${new Date().toLocaleDateString()}

You can download your invoice here:
${invoiceUrl}

Your subscription has been updated. Thank you for your business!

Best regards,
ToolBox Team
    `;

    return {
      subject: 'Payment Confirmation',
      html,
      text,
    };
  }

  /**
   * Generate payment failed email template
   */
  private getPaymentFailedEmailTemplate(
    userName: string,
    amount: number,
    retryUrl: string
  ): EmailTemplate {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert { background: #f8d7da; border-left: 4px solid #f5576c; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .amount { font-size: 28px; font-weight: bold; color: #eb3349; margin: 20px 0; }
            .button { display: inline-block; background: #eb3349; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Failed</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <div class="alert">
                <p><strong>⚠️ Your payment could not be processed.</strong></p>
                <p>We attempted to charge your account $${(amount / 100).toFixed(2)}, but the payment failed.</p>
              </div>
              <p>This could be due to:</p>
              <ul>
                <li>Insufficient funds</li>
                <li>Card expired or blocked</li>
                <li>Incorrect billing information</li>
                <li>Bank declined the transaction</li>
              </ul>
              <p>Please update your payment method and try again:</p>
              <a href="${retryUrl}" class="button">Update Payment Method</a>
              <p><strong>Note:</strong> Your service will continue for now, but you'll need to resolve this within 3 days to avoid service interruption.</p>
              <p>If you need help, contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 ToolBox. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Hello ${userName},

Your payment could not be processed.

Amount: $${(amount / 100).toFixed(2)}

This could be due to:
- Insufficient funds
- Card expired or blocked
- Incorrect billing information
- Bank declined the transaction

Please update your payment method:
${retryUrl}

Your service will continue for now, but you'll need to resolve this within 3 days to avoid service interruption.

If you need help, contact our support team.

Best regards,
ToolBox Team
    `;

    return {
      subject: 'Payment Failed - Action Required',
      html,
      text,
    };
  }

  /**
   * Generate subscription changed email template
   */
  private getSubscriptionChangedEmailTemplate(
    userName: string,
    planName: string,
    changeType: 'upgraded' | 'downgraded' | 'cancelled'
  ): EmailTemplate {
    const messages = {
      upgraded: 'You have successfully upgraded your plan',
      downgraded: 'You have successfully downgraded your plan',
      cancelled: 'Your subscription has been cancelled',
    };

    const colors = {
      upgraded: '11998e',
      downgraded: 'f59e0b',
      cancelled: 'ef4444',
    };

    const color = colors[changeType];
    const message = messages[changeType];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #${color} 0%, #${color} 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .details { background: white; padding: 15px; border-left: 4px solid #${color}; margin: 20px 0; }
            .button { display: inline-block; background: #${color}; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${message.charAt(0).toUpperCase() + message.slice(1)}</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>${message}</p>
              <div class="details">
                <p><strong>Plan:</strong> ${planName}</p>
                <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <a href="${process.env.FRONTEND_URL}/dashboard/subscription" class="button">View Subscription</a>
              <p>If you have any questions about your subscription, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 ToolBox. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Hello ${userName},

${message}

Plan: ${planName}
Effective Date: ${new Date().toLocaleDateString()}

View your subscription:
${process.env.FRONTEND_URL}/dashboard/subscription

If you have any questions about your subscription, please contact our support team.

Best regards,
ToolBox Team
    `;

    const subjectMap = {
      upgraded: 'Plan Upgrade Confirmed',
      downgraded: 'Plan Downgrade Confirmed',
      cancelled: 'Subscription Cancelled',
    };

    return {
      subject: subjectMap[changeType],
      html,
      text,
    };
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    user: User,
    verificationUrl: string
  ): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('Email service not configured, skipping verification email');
      return false;
    }

    try {
      const template = this.getVerificationEmailTemplate(
        user.firstName || 'User',
        verificationUrl
      );

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@toolbox.app',
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info(`Verification email sent to ${user.email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send verification email to ${user.email}:`, error);
      return false;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user: User): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('Email service not configured, skipping welcome email');
      return false;
    }

    try {
      const template = this.getWelcomeEmailTemplate(user.firstName || 'User');

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@toolbox.app',
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info(`Welcome email sent to ${user.email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send welcome email to ${user.email}:`, error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    user: User,
    resetUrl: string
  ): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('Email service not configured, skipping password reset email');
      return false;
    }

    try {
      const template = this.getPasswordResetEmailTemplate(
        user.firstName || 'User',
        resetUrl
      );

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@toolbox.app',
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info(`Password reset email sent to ${user.email}`);
      return true;
    } catch (error) {
      logger.error(
        `Failed to send password reset email to ${user.email}:`,
        error
      );
      return false;
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(
    user: User,
    amount: number,
    invoiceUrl: string
  ): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('Email service not configured, skipping payment confirmation email');
      return false;
    }

    try {
      const template = this.getPaymentConfirmationEmailTemplate(
        user.firstName || 'User',
        amount,
        invoiceUrl
      );

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@toolbox.app',
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info(`Payment confirmation email sent to ${user.email}`);
      return true;
    } catch (error) {
      logger.error(
        `Failed to send payment confirmation email to ${user.email}:`,
        error
      );
      return false;
    }
  }

  /**
   * Send payment failed email
   */
  async sendPaymentFailedEmail(
    user: User,
    amount: number,
    retryUrl: string
  ): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('Email service not configured, skipping payment failed email');
      return false;
    }

    try {
      const template = this.getPaymentFailedEmailTemplate(
        user.firstName || 'User',
        amount,
        retryUrl
      );

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@toolbox.app',
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info(`Payment failed email sent to ${user.email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send payment failed email to ${user.email}:`, error);
      return false;
    }
  }

  /**
   * Send subscription changed email
   */
  async sendSubscriptionChangedEmail(
    user: User,
    planName: string,
    changeType: 'upgraded' | 'downgraded' | 'cancelled'
  ): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('Email service not configured, skipping subscription change email');
      return false;
    }

    try {
      const template = this.getSubscriptionChangedEmailTemplate(
        user.firstName || 'User',
        planName,
        changeType
      );

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@toolbox.app',
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info(
        `Subscription changed email (${changeType}) sent to ${user.email}`
      );
      return true;
    } catch (error) {
      logger.error(
        `Failed to send subscription change email to ${user.email}:`,
        error
      );
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

export default emailService;
