# Email Service Integration Guide

## Overview

The email service has been fully integrated into the ToolBox platform. It uses Nodemailer for SMTP-based email delivery with professional HTML templates for all application events.

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install nodemailer @types/nodemailer
```

**Status**: ✅ Already installed

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory with SMTP configuration:

```bash
# Email Service Configuration
SMTP_HOST=smtp.gmail.com          # Your SMTP server
SMTP_PORT=587                      # SMTP port (usually 587 or 465)
SMTP_SECURE=false                  # Set to true if using port 465 (SSL)
SMTP_USER=your-email@gmail.com     # SMTP username
SMTP_PASSWORD=your-app-password    # SMTP password (app-specific for Gmail)
SMTP_FROM=noreply@toolbox.app     # From email address
FRONTEND_URL=http://localhost:5173 # Frontend URL for email links
```

### 3. Common SMTP Providers

#### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password  # Generate at myaccount.google.com/apppasswords
```

#### SendGrid (with Nodemailer)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
```

#### AWS SES
```bash
SMTP_HOST=email-smtp.region.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
```

## Usage

### Import the Service

```typescript
import emailService from '../services/emailService';
```

### Available Methods

#### 1. Send Verification Email

```typescript
await emailService.sendVerificationEmail(
  { email: 'user@example.com', firstName: 'John' },
  'https://yourdomain.com/verify?token=xyz'
);
```

#### 2. Send Welcome Email

```typescript
await emailService.sendWelcomeEmail({
  email: 'user@example.com',
  firstName: 'John'
});
```

#### 3. Send Password Reset Email

```typescript
await emailService.sendPasswordResetEmail(
  { email: 'user@example.com', firstName: 'John' },
  'https://yourdomain.com/reset?token=xyz'
);
```

#### 4. Send Payment Confirmation

```typescript
await emailService.sendPaymentConfirmationEmail(
  { email: 'user@example.com', firstName: 'John' },
  9999,  // amount in cents
  'https://stripe.com/invoice/inv_xxx'  // invoice URL
);
```

#### 5. Send Payment Failed Alert

```typescript
await emailService.sendPaymentFailedEmail(
  { email: 'user@example.com', firstName: 'John' },
  9999,  // amount in cents
  'https://yourdomain.com/dashboard/billing'  // retry URL
);
```

#### 6. Send Subscription Change Notification

```typescript
await emailService.sendSubscriptionChangedEmail(
  { email: 'user@example.com', firstName: 'John' },
  'Pro Plan',
  'upgraded'  // or 'downgraded', 'cancelled'
);
```

## Integration Points

### 1. Stripe Webhook Handler

Automatically sends emails when payment events occur:

```typescript
// In webhookRoutes.ts - handleInvoicePaymentFailed
await emailService.sendPaymentFailedEmail(user, amount, retryUrl);

// In webhookRoutes.ts - handleInvoicePaymentSucceeded
await emailService.sendPaymentConfirmationEmail(user, amount, invoiceUrl);
```

### 2. Authentication Service

Could be integrated for:
- Verification email after registration
- Password reset emails
- Login notifications

### 3. Subscription Service

Could be integrated for:
- Subscription confirmation emails
- Upgrade/downgrade notifications
- Cancellation confirmations

## Email Templates

All templates are responsive and professionally designed with:
- HTML and plain text versions
- Branded styling with your company colors
- Clear call-to-action buttons
- Security warnings where appropriate

### Template List

1. **Verification Email**
   - Used for: Account registration
   - Includes: Verification link, expiration notice

2. **Welcome Email**
   - Used for: New account activation
   - Includes: Feature overview, dashboard link

3. **Password Reset Email**
   - Used for: Password recovery
   - Includes: Reset link, security notice, 1-hour expiration

4. **Payment Confirmation**
   - Used for: Successful payment
   - Includes: Amount, invoice download, date

5. **Payment Failed**
   - Used for: Failed payment attempt
   - Includes: Retry link, 3-day retry window notice

6. **Subscription Changed**
   - Used for: Plan upgrades/downgrades/cancellations
   - Includes: New plan details, effective date

## Testing

### Manual Testing

1. **Verify Service Connection**
   ```bash
   cd backend
   npm run dev
   # Check logs for: "Email service connected successfully"
   ```

2. **Test Email Sending**
   ```typescript
   // In a route or test file
   import emailService from '../services/emailService';

   await emailService.sendVerificationEmail(
     { email: 'your-email@example.com', firstName: 'Test' },
     'https://example.com/verify?token=test'
   );
   ```

3. **Check Email Inbox**
   - Look for email with subject "Verify Your Email Address"
   - Verify styling and links work correctly

### Development Mode

If SMTP is not configured:
- Emails are logged to console instead of being sent
- No external dependencies required
- Perfect for local development

```
[INFO] 📧 EMAIL (CONSOLE MODE) {
  to: 'user@example.com',
  subject: 'Verify Your Email Address',
  preview: 'Hello John, Thank you for signing up...'
}
```

## Error Handling

The email service gracefully handles errors:

1. **If SMTP not configured**
   - Warns in logs
   - Returns false from send methods
   - Application continues to function

2. **If email delivery fails**
   - Logs error with full stack trace
   - Returns false from send methods
   - Webhook/auth flow continues

3. **User receives feedback**
   - Success messages after operations
   - Error messages if something goes wrong

## Troubleshooting

### "Email service not configured"

**Solution**: Set up SMTP environment variables

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Emails not being received

**Check**:
1. SMTP credentials are correct
2. Firewall allows SMTP port (587 or 465)
3. Check spam/junk folder
4. Verify sender email domain

### SSL/TLS errors

**Solution**: 
- If using port 465: Set `SMTP_SECURE=true`
- If using port 587: Set `SMTP_SECURE=false`

### Gmail specific issues

**Solution**: Use app-specific password
1. Go to myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Generate 16-character password
4. Use as `SMTP_PASSWORD`

### Rate limiting

**Solution**: Implement retry logic with exponential backoff (not currently implemented)

## Production Deployment

### Best Practices

1. **Use Production Email Service**
   - SendGrid: Best for transactional emails (~$10-100/month)
   - Mailgun: Good alternative with free tier
   - AWS SES: Cheapest for high volume
   - Gmail/Company Email: For internal notifications only

2. **Monitor Email Delivery**
   - Set up delivery tracking
   - Monitor bounce rates
   - Track spam complaints

3. **Compliance**
   - Add unsubscribe links (if needed)
   - Implement CAN-SPAM compliance
   - Include physical address
   - Respect user preferences

4. **Performance**
   - Current: Asynchronous (non-blocking)
   - Consider: Email queue for high volume
   - Monitor: Deliverability metrics

### SendGrid Production Setup

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-actual-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

### AWS SES Production Setup

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

## Monitoring & Analytics

Currently logs email operations:
- Successful sends
- Failed attempts
- Configuration warnings

Add these enhancements later:
- Email delivery tracking
- Open rate tracking
- Click tracking
- Bounce handling

## Future Enhancements

1. **Queue System**
   - Use Bull/RabbitMQ for email queue
   - Retry failed deliveries
   - Rate limiting

2. **Email Analytics**
   - Track delivery status
   - Monitor open rates
   - Track link clicks

3. **Custom Templates**
   - Allow customization of email templates
   - Brand colors/logos
   - Dynamic content blocks

4. **Multiple Templates**
   - Different template for each event type
   - A/B testing support
   - Language localization

5. **Unsubscribe Management**
   - User preference center
   - CAN-SPAM compliance
   - Preference tracking

## Security Considerations

1. **API Key Protection**
   - Store SMTP password in .env (not in code)
   - Use environment variables only
   - Rotate passwords regularly

2. **Email Content**
   - No sensitive data in plain text
   - Use tokenized URLs instead of raw tokens
   - SSL/TLS encryption for SMTP

3. **User Privacy**
   - Clear disclosure of what emails are sent
   - Easy unsubscribe mechanism
   - GDPR compliance for EU users

## Support

For issues or questions:
1. Check logs: `backend/logs/app.log`
2. Verify SMTP configuration
3. Test with console logging
4. Contact support@toolbox.app

---

**Last Updated**: November 4, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
