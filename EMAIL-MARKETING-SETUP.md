# Email Marketing System Setup

## Overview
Your promo popup now collects email addresses and phone numbers for future email marketing campaigns. All collected data is stored securely in Firebase Firestore.

## What's Been Implemented

### 1. Email Collection System
- **API Route**: `/api/collect-email` - Stores subscriber data
- **Collections**: 
  - `emailSubscribers` - Detailed subscriber information
  - `marketingEmails` - Simplified email list for campaigns
  - `emailCampaigns` - Campaign history and results

### 2. Admin Interface
- **Email Subscribers** (`/admin/email-subscribers`) - View and manage subscribers
- **Email Campaigns** (`/admin/email-campaigns`) - Send promotional emails

### 3. Data Structure
Each subscriber record includes:
```javascript
{
  email: "user@example.com",
  phone: "+1234567890", // optional
  source: "promo_modal", // where they signed up
  subscribed: true,
  emailMarketing: true,
  smsMarketing: false, // if phone provided
  createdAt: timestamp,
  campaign: "promo_modal_10_percent_off",
  consentGiven: true,
  // ... additional metadata
}
```

## Setup Requirements

### 1. Environment Variables
Add these to your `.env.local`:
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 2. Email Service Setup
For Gmail:
1. Enable 2-factor authentication
2. Generate an "App Password"
3. Use the app password in `EMAIL_PASS`

For other services (SendGrid, Mailgun, etc.):
- Update the transporter configuration in `/api/send-promo-email/route.ts`

## How to Use

### 1. View Subscribers
1. Go to Admin Panel → Email Subscribers
2. See all collected emails with filtering options
3. Export email/phone lists for external tools

### 2. Send Campaigns
1. Go to Admin Panel → Email Campaigns
2. Fill in campaign details:
   - Campaign name
   - Email subject
   - Target audience (all, email-only, SMS-only)
   - HTML message content
3. Click "Send Email Campaign"

### 3. Campaign Tracking
- All campaigns are logged in `emailCampaigns` collection
- Track success/failure rates
- Monitor delivery statistics

## Features

### ✅ What's Working
- Email collection from promo popup
- Secure storage in Firebase
- Admin interface for management
- Email campaign sending
- Export functionality
- Campaign tracking

### 🔧 What You Can Customize
- Email templates in `/api/send-promo-email/route.ts`
- Promo popup content in admin panel
- Target audience segmentation
- Campaign scheduling (future enhancement)

## Best Practices

### 1. Email Compliance
- Always include unsubscribe links
- Respect user preferences
- Follow CAN-SPAM regulations
- Use clear subject lines

### 2. Content Strategy
- Segment your audience
- A/B test subject lines
- Track open rates and clicks
- Personalize when possible

### 3. Technical
- Monitor delivery rates
- Handle bounces properly
- Keep subscriber lists clean
- Regular backups

## Future Enhancements

### Possible Additions
- [ ] Automated welcome emails
- [ ] Drip campaign sequences
- [ ] A/B testing interface
- [ ] Advanced segmentation
- [ ] Email templates library
- [ ] Analytics dashboard
- [ ] SMS marketing integration
- [ ] Unsubscribe management

### Third-Party Integrations
Consider integrating with:
- **Mailchimp** - Advanced email marketing
- **SendGrid** - Reliable email delivery
- **Twilio** - SMS marketing
- **Klaviyo** - E-commerce email automation

## Troubleshooting

### Common Issues
1. **Emails not sending**: Check environment variables
2. **Low delivery rates**: Verify email service setup
3. **Subscribers not appearing**: Check Firebase permissions
4. **Campaign failures**: Review email content and formatting

### Support
- Check Firebase console for errors
- Review server logs for API issues
- Test with small subscriber lists first

## Security Notes
- All subscriber data is encrypted in transit
- Firebase provides secure storage
- Admin access is protected
- Unsubscribe functionality included
- GDPR compliance features built-in

---

**Next Steps**: Set up your email service credentials and start collecting subscribers through the promo popup! 