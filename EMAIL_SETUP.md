# EMAIL SETUP GUIDE

## Why Emails Aren't Working

Your application is currently running in **TEST MODE**, which means:
- Emails are not actually being sent
- QR codes are not reaching user inboxes
- Registration confirmations are lost

## How to Fix: Enable Gmail Integration

Follow these steps to send real emails:

### Step 1: Get a Gmail App Password

1. **Go to your Google Account**: https://myaccount.google.com
2. **Enable 2-Factor Authentication** (if not already enabled):
   - Security > 2-Step Verification
   - Follow the setup process
3. **Generate an App Password**:
   - Security > 2-Step Verification > App passwords
   - Select "Mail" and your device
   - Google will show you a **16-character password** (e.g., `abcd efgh ijkl mnop`)
   - **Copy this password** - you'll use it in Step 2

> ⚠️ **Important**: You CANNOT use your regular Gmail password. You must use an App Password.

### Step 2: Create .env File

1. Navigate to your backend folder:
   ```
   cd backend
   ```

2. Create a file named `.env` (copy from `.env.example`):
   ```
   cp .env.example .env
   ```

3. Edit the `.env` file and add:
   ```env
   NODE_ENV=production
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=Felicity Events <your-email@gmail.com>
   ```

   **Example**:
   ```env
   NODE_ENV=production
   EMAIL_SERVICE=gmail
   EMAIL_USER=john.doe@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   EMAIL_FROM=Felicity Events <john.doe@gmail.com>
   ```

### Step 3: Restart Your Backend Server

Stop your backend server (Ctrl+C) and restart it:
```bash
npm run dev
```

You should see:
```
📧 Email Service: Using Gmail to send real emails
📧 Sending from: your-email@gmail.com
```

### Step 4: Test It!

1. Register for an event as a participant
2. Check your email inbox
3. You should receive:
   - ✅ Registration confirmation
   - ✅ QR code image
   - ✅ Event details

## What Users Will See Now

### 1. **Immediate QR Code**: Right after registration, a modal pops up showing the QR code
### 2. **Email Copy**: A beautiful email is sent to the user's inbox with:
   - Event details
   - Ticket ID
   - QR code image
### 3. **My Registrations**: Users can always view their tickets in the "My Registrations" page

## Troubleshooting

### Error: "Authentication failed"
- Check that you're using an **App Password**, not your regular Gmail password
- Make sure the password has no spaces in the `.env` file

### Error: "Less secure app access"
- Gmail no longer supports "less secure apps"
- You **must** use 2FA + App Passwords

### Emails go to spam
- Add `SPF` and `DKIM` records to your domain (advanced)
- For testing, just check your spam folder

### Still not working?
1. Check console logs when backend starts
2. Look for: `📧 Email Service: Using Gmail to send real emails`
3. If you see "Test mode", your `.env` file is not loaded correctly

## Alternative: Use Test Emails

If you can't set up Gmail right now, you can still test:
1. Keep `NODE_ENV=development` in `.env`
2. After registration, check the backend console
3. Look for: `📧 Test Email Preview: https://ethereal.email/...`
4. Click that link to see the email preview

## Production Deployment

For production, consider using:
- **SendGrid** - 100 free emails/day
- **AWS SES** - Very cheap, reliable
- **Mailgun** - Good developer experience

All of these can replace Gmail by changing `EMAIL_SERVICE` and credentials.
