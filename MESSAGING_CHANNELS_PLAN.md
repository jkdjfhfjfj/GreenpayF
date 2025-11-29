# GreenPay Messaging Channels Plan & Templates

## Overview
GreenPay uses 3 messaging channels: **Email**, **SMS**, and **WhatsApp** for 8 different message types.

---

## Message Types Breakdown

### 1. **OTP (One-Time Password) Verification**
**Purpose:** Account verification during signup/login  
**Trigger:** User requests verification code  
**Expiry:** 10 minutes

| Channel | Subject/Header | Sample Message |
|---------|----------------|----------------|
| **Email** | `Your GreenPay Verification Code` | Hello! We received a request to verify your GreenPay account. Use the verification code below to complete the process. **Code: 123456** ⏰ This code expires in 10 minutes. For your security, do not share this code with anyone. |
| **SMS** | N/A | Your GreenPay verification code is: **123456**. Valid for 10 minutes. Do not share with anyone. |
| **WhatsApp** | N/A (Template) | Your verification code is **{{1}}**. Valid for 10 minutes. |

---

### 2. **Password Reset**
**Purpose:** Account security - password recovery  
**Trigger:** User initiates password reset  
**Expiry:** 10 minutes

| Channel | Subject/Header | Sample Message |
|---------|----------------|----------------|
| **Email** | `Reset Your GreenPay Password` | Hello! We received a request to reset your GreenPay account password. Use the code below to create a new password. **Reset Code: 789456** ⚠️ SECURITY ALERT: This code expires in 10 minutes. If you didn't request this, secure your account immediately. |
| **SMS** | N/A | Password reset code: **789456**. Valid 10 mins. If not you, ignore this. |
| **WhatsApp** | N/A (Template) | Your password reset code is **{{1}}**. Valid for 10 minutes. |

---

### 3. **Welcome Email**
**Purpose:** New user onboarding  
**Trigger:** Account successfully created  
**Frequency:** Once per account

| Channel | Subject/Header | Sample Message |
|---------|----------------|----------------|
| **Email** | `Welcome to GreenPay! 🎉` | Welcome to GreenPay, John! We're thrilled to have you join our community! GreenPay makes sending money to Africa simple, secure, and affordable. **Get Started:** • Complete your profile verification • Add funds to your account • Send money to friends and family • Get your virtual card for online payments [Dashboard Button] Need help? Our support team is available 24/7. |
| **SMS** | N/A | Welcome to GreenPay! Complete verification, add funds & send money to Africa. Need help? Visit greenpay.world/help |
| **WhatsApp** | N/A | Not currently implemented for Welcome |

---

### 4. **Fund Receipt Notification**
**Purpose:** Notify user of incoming funds  
**Trigger:** Money successfully received  
**Frequency:** Per transaction

| Channel | Subject/Header | Sample Message |
|---------|----------------|----------------|
| **Email** | `You've Received USD 100.00` | Hello John! 💰 Great news! You've received money in your GreenPay account. **USD 100.00** From: Jane Smith Amount: USD 100.00 Status: ✓ Completed Date: November 29, 2024 @ 2:04 PM Your new balance is now available in your account and ready to use. [View Transaction] |
| **SMS** | N/A | You received USD 100.00 from Jane Smith. New balance available in your GreenPay account. |
| **WhatsApp** | N/A (Template) | You have received {{1}} {{2}} from {{3}}. Your new balance is available in your wallet. |

---

### 5. **Transaction Notification**
**Purpose:** Notify user of transaction status (Send/Withdraw/Transfer)  
**Trigger:** Transaction initiated/completed/failed  
**Frequency:** Per transaction

| Channel | Subject/Header | Sample Message |
|---------|----------------|----------------|
| **Email** | `Transfer Completed: USD 50.00` | Hello John! Your transfer has been completed. **USD 50.00** Type: Transfer Amount: USD 50.00 Status: ✓ Completed Transaction ID: TXN-20241129-001234 Date: November 29, 2024 @ 2:15 PM [View All Transactions] |
| **SMS** | N/A | Transfer completed: USD 50.00 sent successfully. Transaction ID: TXN-20241129-001234 |
| **WhatsApp** | N/A | Not currently implemented for transactions |

---

### 6. **Login Alert (Security)**
**Purpose:** Notify user of new account login  
**Trigger:** Successful login from new device/location  
**Frequency:** Per new login

| Channel | Subject/Header | Sample Message |
|---------|----------------|----------------|
| **Email** | `🔐 New Login to Your GreenPay Account` | Hello John! 🔐 We detected a new login to your GreenPay account. If this was you, you can safely ignore this email. Location: Nairobi, Kenya IP Address: 197.89.23.45 Time: November 29, 2024 @ 2:20 PM ⚠️ WAS THIS YOU? If you don't recognize this activity, secure your account immediately by changing your password and enabling 2FA. [Secure My Account] |
| **SMS** | N/A | New login detected on your GreenPay account from Nairobi, Kenya (197.89.23.45). If not you, change password immediately. |
| **WhatsApp** | N/A (Template) | New login detected on your account from {{1}} ({{2}}). If this wasn't you, please secure your account immediately. |

---

### 7. **KYC Verification Complete**
**Purpose:** Notify user that account is verified and all features unlocked  
**Trigger:** Admin approves KYC submission  
**Frequency:** Once per account

| Channel | Subject/Header | Sample Message |
|---------|----------------|----------------|
| **Email** | `✅ Your Account is Now Verified!` | Congratulations, John! ✅ Your GreenPay account has been successfully verified! You now have full access to all our features. 🎉 **What's Now Available:** • Send money internationally without limits • Request and receive payments • Order virtual cards for online shopping • Access premium features and lower fees [Explore Your Account] |
| **SMS** | N/A | Congratulations! Your GreenPay account is verified. You can now send unlimited funds & order virtual cards. |
| **WhatsApp** | N/A (Template) | Congratulations! Your account has been verified. You can now enjoy all GreenPay features. |

---

### 8. **Virtual Card Activation**
**Purpose:** Notify user that their virtual card is ready to use  
**Trigger:** Card successfully created and activated  
**Frequency:** Per card created

| Channel | Subject/Header | Sample Message |
|---------|----------------|----------------|
| **Email** | `💳 Your Virtual Card is Active!` | Hello John! 💳 Your virtual card is now active and ready to use! Card Ending In: 4242 Your virtual card is ready for online shopping, subscriptions, and international payments. [View Card Details] **Card Features:** • Instantly activated • Use anywhere Mastercard is accepted • Set spending limits • Easy to manage |
| **SMS** | N/A | Your GreenPay virtual card ending in 4242 is now active. Ready for online payments & shopping! |
| **WhatsApp** | N/A (Template) | Your virtual card ending in {{1}} has been activated and is ready to use. |

---

### 9. **Test Email** (Admin Testing)
**Purpose:** Admin verification that email service is configured correctly  
**Trigger:** Admin clicks "Send Test Email" in settings  
**Frequency:** Manual testing only

| Channel | Subject/Header | Sample Message |
|---------|----------------|----------------|
| **Email** | `Test Email from GreenPay` | This is a test email from GreenPay. If you received this, your email settings are configured correctly! Email Configuration Status: ✅ Connected Successfully |
| **SMS** | N/A | Not implemented |
| **WhatsApp** | N/A | Not implemented |

---

## Channel-Specific Configuration

### **Email Configuration**
- **Service:** SMTP (Nodemailer)
- **Currently Using:** Zoho Mail
- **Default Credentials:** support@greenpay.world
- **Admin Configuration:** Via Mail Management panel
- **Default Settings:**
  - Host: smtp.zoho.com
  - Port: 465
  - Secure: true
  - From Name: GreenPay
  - From Email: support@greenpay.world

### **SMS Configuration**
- **Service:** Twilio / PayHero API
- **Implemented:** Basic message sending
- **Admin Configuration:** Via Messaging Settings
- **Features:** Support for all 6 core message types

### **WhatsApp Configuration**
- **Service:** Meta Business API (Graph API v24.0)
- **Template Categories:** 
  - `AUTHENTICATION` - OTP, password reset, account verification
  - `UTILITY` - KYC verified, card activation, fund receipt, login alert
- **WABA ID:** 526034077251940
- **Admin Configuration:** Via WhatsApp Templates panel
- **Features:**
  - Pre-approved templates only
  - Template-based messaging
  - Parameter customization per user
  - Retry/recreation for failed templates

---

## Message Toggle Settings (Admin Controlled)

Admins can enable/disable each message type per channel:

1. ✅ `enable_otp_messages` - OTP verification codes
2. ✅ `enable_password_reset_messages` - Password reset codes
3. ✅ `enable_kyc_verified_messages` - KYC completion notification
4. ✅ `enable_card_activation_messages` - Virtual card activation
5. ✅ `enable_fund_receipt_messages` - Fund received notification
6. ✅ `enable_login_alert_messages` - Login security alerts

---

## Admin Features

### Template Management (WhatsApp)
- View all created templates with status
- Create new templates with custom text
- Retry/recreate failed templates
- Send specific templates to individual users with custom parameters

### Messaging Settings
- Configure SMTP credentials for Email
- Configure WhatsApp credentials (Access Token, WABA ID)
- View messaging channel status
- Toggle each message type on/off per channel

### Mail Management
- Send test emails
- Configure email address
- Configure SMTP settings
- View mail delivery status

---

## Sample Use Cases

### Scenario 1: New User Signup
1. Welcome Email sent
2. OTP Email sent for verification
3. User verifies → Welcome SMS sent
4. User completes KYC → KYC Verified Email sent

### Scenario 2: User Sends Money
1. Transaction Notification Email sent (status: pending)
2. Recipient gets Fund Receipt Email
3. Sender gets Transaction Notification Email (status: completed)

### Scenario 3: Account Security
1. Login Alert Email sent
2. User attempts password reset → Password Reset SMS + Email
3. User changes password successfully

---

## Implementation Priorities

### Phase 1: Core Setup (Current)
- ✅ Email service configured
- ✅ SMS messaging configured
- ✅ WhatsApp templates created
- ✅ Admin toggle system implemented

### Phase 2: Enhancement
- Email template customization per brand
- SMS personalization (recipient name)
- WhatsApp read receipts tracking
- Message delivery analytics

### Phase 3: Advanced
- Multi-language support
- Template A/B testing
- Smart retry logic
- Delivery rate optimization
