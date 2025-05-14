# Setting Up Email Verification for PrintiFy

This guide will help you set up email verification using Gmail for your PrintiFy application.

## 1. Create App Password for Gmail

To use Gmail for sending verification emails, you need to create an App Password:

1. Go to your [Google Account Security settings](https://myaccount.google.com/security)
2. Make sure 2-Step Verification is enabled
3. Scroll down to "App passwords" (it's under the "Signing in to Google" section)
4. Click on "App passwords"
5. Select "Mail" as the app and "Other (Custom name)" as the device
6. Enter "PrintiFy" as the name and click "Generate"
7. Copy the 16-character password that appears

## 2. Add Email Credentials to .env File

Add the following lines to your `.env` file in the server directory:

```
# Email configuration for verification
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
```

Replace:
- `your_gmail_address@gmail.com` with your actual Gmail address
- `your_16_character_app_password` with the app password generated in step 1

## 3. Testing Email Verification

To test the email verification system:

1. Start both your client and server applications
2. Register a new user
3. You should be redirected to the verification page
4. Check your email for the verification code (check spam/junk folders if not found)
5. Enter the code on the verification page
6. Once verified, you'll be automatically logged in

## Troubleshooting

If verification emails are not being sent:

1. Verify your Gmail app password is correct
2. Make sure you're using the same Gmail address in both the .env file and app password
3. Check server logs for any error messages related to email sending
4. Verify your Gmail account doesn't have additional security restrictions

---

Note: Gmail may limit the number of emails you can send per day. For production use, consider using a dedicated email service like SendGrid, Mailgun, or Amazon SES. 