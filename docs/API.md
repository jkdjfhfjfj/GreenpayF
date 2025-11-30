# GreenPay Public API Documentation

**Base URL:** `https://greenpay.world/api`

**Latest Version:** 1.0.0  
**Last Updated:** November 2025

---

## Table of Contents
- [Authentication](#authentication)
- [Authentication Endpoints](#authentication-endpoints)
- [Financial Endpoints](#financial-endpoints)
- [User Profile Endpoints](#user-profile-endpoints)
- [Support Endpoints](#support-endpoints)
- [System Endpoints](#system-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

All API requests require authentication using an API key in the Authorization header:

```bash
Authorization: Bearer gpay_xxxxxxxxxxxxx
```

**Generate API Keys:**
1. Log in to GreenPay Admin Panel
2. Navigate to **Settings** → **API Keys**
3. Click **Generate New Key**
4. Copy the key (shown only once)
5. Use in all API requests

[View API Key Management Guide](./API_KEYS.md)

---

## Authentication Endpoints

### Sign Up
```
POST /auth/signup

Request:
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "country": "KE",
  "password": "SecurePass123!"
}

Response:
{
  "user": {
    "id": "user-id",
    "email": "john@example.com",
    "fullName": "John Doe",
    "phone": "+254712345678",
    "country": "KE",
    "isPhoneVerified": true,
    "isEmailVerified": true
  },
  "message": "Account created successfully"
}
```

### Login
```
POST /auth/login

Request:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "user": {
    "id": "user-id",
    "email": "john@example.com",
    "fullName": "John Doe",
    "balance": "0.00",
    "kycStatus": "pending"
  },
  "requiresTwoFactor": false,
  "message": "Login successful"
}
```

### Verify OTP
```
POST /auth/verify-otp

Request:
{
  "email": "john@example.com",
  "otpCode": "123456"
}

Response:
{
  "user": { ... },
  "message": "OTP verified successfully"
}
```

### Resend OTP
```
POST /auth/resend-otp

Request:
{
  "email": "john@example.com"
}

Response:
{
  "message": "OTP sent successfully"
}
```

### Forgot Password
```
POST /auth/forgot-password-email

Request:
{
  "email": "john@example.com"
}

Response:
{
  "message": "Password reset link sent to your email"
}
```

### Reset Password
```
POST /auth/reset-password-email

Request:
{
  "email": "john@example.com",
  "resetCode": "ABC123",
  "newPassword": "NewSecurePass123!"
}

Response:
{
  "message": "Password reset successfully"
}
```

### Setup 2FA
```
POST /auth/setup-2fa

Response:
{
  "qrCode": "data:image/png;base64,...",
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "backupCodes": ["code1", "code2", ...]
}
```

### Verify 2FA
```
POST /auth/2fa/verify

Request:
{
  "token": "123456"
}

Response:
{
  "message": "2FA verified successfully"
}
```

### Setup Biometric Login
```
POST /auth/setup-biometric

Response:
{
  "challenge": "random-challenge-string",
  "userId": "user-id"
}
```

### Biometric Login
```
POST /auth/biometric/login

Request:
{
  "userId": "user-id",
  "credential": "webauthn-credential-object"
}

Response:
{
  "user": { ... },
  "message": "Biometric login successful"
}
```

---

## Financial Endpoints

### Get Exchange Rates
```
GET /exchange-rates/:base

Example: GET /exchange-rates/USD

Response:
{
  "base": "USD",
  "rates": {
    "KES": 145.50,
    "EUR": 0.92,
    "GBP": 0.79
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Get Exchange Rate for Pair
```
GET /exchange-rates/:from/:to

Example: GET /exchange-rates/USD/KES

Response:
{
  "from": "USD",
  "to": "KES",
  "rate": 145.50,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Convert Currency
```
POST /exchange/convert

Request:
{
  "amount": "100",
  "fromCurrency": "USD",
  "toCurrency": "KES"
}

Response:
{
  "fromAmount": "100",
  "fromCurrency": "USD",
  "toAmount": "14550.00",
  "toCurrency": "KES",
  "rate": 145.50,
  "fee": "10.00",
  "netAmount": "14540.00"
}
```

### Get Transactions
```
GET /transactions

Response:
{
  "transactions": [
    {
      "id": "txn-id",
      "type": "send",
      "amount": "500",
      "currency": "KES",
      "status": "completed",
      "recipientName": "Jane Doe",
      "description": "Payment for invoice",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Initialize Deposit
```
POST /deposit/initialize-payment

Request:
{
  "amount": "1000",
  "currency": "KES",
  "paymentMethod": "mpesa"
}

Response:
{
  "paymentId": "pay-id",
  "amount": "1000",
  "currency": "KES",
  "status": "pending",
  "paymentLink": "https://pay.greenpay.world/...",
  "expiresAt": "2024-01-15T11:30:00Z"
}
```

### Purchase Airtime
```
POST /airtime/purchase

Request:
{
  "phoneNumber": "+254712345678",
  "amount": "50",
  "provider": "safaricom"
}

Response:
{
  "transaction": {
    "id": "txn-id",
    "status": "completed",
    "phoneNumber": "+254712345678",
    "amount": "50",
    "provider": "safaricom",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Generate QR Payment
```
POST /qr-payments/generate

Request:
{
  "amount": "1000",
  "currency": "KES",
  "description": "Invoice #123"
}

Response:
{
  "qrCode": "data:image/png;base64,...",
  "paymentId": "pay-id",
  "amount": "1000",
  "currency": "KES",
  "paymentLink": "https://pay.greenpay.world/..."
}
```

### Create Savings Goal
```
POST /savings-goals

Request:
{
  "title": "Emergency Fund",
  "targetAmount": "50000",
  "currency": "KES",
  "targetDate": "2024-12-31"
}

Response:
{
  "goal": {
    "id": "goal-id",
    "title": "Emergency Fund",
    "targetAmount": "50000",
    "currentAmount": "0",
    "currency": "KES",
    "targetDate": "2024-12-31",
    "progress": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Savings Goals
```
GET /savings-goals

Response:
{
  "goals": [
    {
      "id": "goal-id",
      "title": "Emergency Fund",
      "targetAmount": "50000",
      "currentAmount": "12000",
      "progress": 24,
      ...
    }
  ]
}
```

### Contribute to Savings Goal
```
POST /savings-goals/:goalId/contribute

Request:
{
  "amount": "5000"
}

Response:
{
  "goal": { ... },
  "contribution": {
    "amount": "5000",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "message": "Contribution successful"
}
```

### Create Payment Request
```
POST /payment-requests

Request:
{
  "toEmail": "john@example.com",
  "amount": "5000",
  "currency": "KES",
  "message": "Please pay for invoice #456"
}

Response:
{
  "request": {
    "id": "req-id",
    "toEmail": "john@example.com",
    "amount": "5000",
    "currency": "KES",
    "status": "pending",
    "paymentLink": "https://pay.greenpay.world/...",
    "expiresAt": "2024-01-22T10:30:00Z"
  }
}
```

### Get Payment Requests
```
GET /payment-requests

Response:
{
  "requests": [
    {
      "id": "req-id",
      "toEmail": "john@example.com",
      "amount": "5000",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## User Profile Endpoints

### Get User Profile
```
GET /users/profile

Response:
{
  "id": "user-id",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "country": "KE",
  "balance": "10000.00",
  "currency": "KES",
  "kycStatus": "verified",
  "hasVirtualCard": true,
  "notifications": { ... }
}
```

### Update Profile
```
PUT /users/profile

Request:
{
  "fullName": "John Updated",
  "phone": "+254712345679",
  "darkMode": true
}

Response:
{
  "user": { ... },
  "message": "Profile updated successfully"
}
```

### Submit KYC
```
POST /kyc/submit

Request:
{
  "documentType": "national_id",
  "frontImage": "base64-encoded-image",
  "backImage": "base64-encoded-image",
  "dateOfBirth": "1990-01-15"
}

Response:
{
  "kyc": {
    "id": "kyc-id",
    "status": "pending",
    "submittedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get KYC Status
```
GET /kyc/:userId

Response:
{
  "status": "verified",
  "verifiedAt": "2024-01-14T15:20:00Z",
  "expiresAt": "2025-01-14T15:20:00Z"
}
```

### Get Notifications
```
GET /notifications

Response:
{
  "notifications": [
    {
      "id": "notif-id",
      "title": "Payment Received",
      "message": "You received 1000 KES from John",
      "read": false,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Mark Notification as Read
```
PUT /notifications/:notificationId/read

Response:
{
  "message": "Notification marked as read"
}
```

### Get Spending Analytics
```
GET /analytics/spending

Response:
{
  "totalSpent": "15000",
  "currency": "KES",
  "period": "month",
  "byCategory": {
    "food": "5000",
    "transport": "3000",
    "utilities": "7000"
  },
  "trend": [
    { "date": "2024-01-01", "amount": "500" },
    { "date": "2024-01-02", "amount": "750" }
  ]
}
```

### Register for Push Notifications
```
POST /notifications/register

Request:
{
  "deviceToken": "device-token",
  "deviceType": "ios"
}

Response:
{
  "message": "Device registered for notifications"
}
```

---

## Support Endpoints

### Create Support Ticket
```
POST /support/tickets

Request:
{
  "issueType": "payment_issue",
  "description": "Transaction failed but money was deducted"
}

Response:
{
  "ticket": {
    "id": "ticket-id",
    "status": "open",
    "createdAt": "2024-01-15T10:30:00Z",
    "trackingUrl": "https://support.greenpay.world/tickets/..."
  }
}
```

### Get Support Tickets
```
GET /support/tickets

Response:
{
  "tickets": [
    {
      "id": "ticket-id",
      "status": "open",
      "issueType": "payment_issue",
      "description": "...",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T15:20:00Z"
    }
  ]
}
```

---

## System Endpoints

### System Status
```
GET /system/status

Response:
{
  "status": "operational",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "components": {
    "api": "operational",
    "database": "operational",
    "whatsapp": "operational",
    "email": "operational"
  }
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error Code",
  "message": "Human-readable error message",
  "code": 400
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Missing or invalid parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | API key lacks required scope |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Internal server error |

### Common Errors

**Missing API Key:**
```json
{
  "error": "Missing or invalid Authorization header",
  "message": "Include Authorization: Bearer YOUR_API_KEY",
  "code": 401
}
```

**Invalid API Key:**
```json
{
  "error": "Invalid or inactive API key",
  "message": "Check your API key or request a new one",
  "code": 403
}
```

**Rate Limited:**
```json
{
  "error": "Rate limited",
  "message": "Too many requests. Please try again later.",
  "code": 429,
  "retryAfter": 60
}
```

---

## Rate Limiting

All API calls are rate limited based on your API key:

| Tier | Requests/Min | Requests/Day |
|------|--------------|--------------|
| Free | 100 | 5,000 |
| Pro | 1,000 | 100,000 |
| Enterprise | 10,000 | 1,000,000 |

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705316400
```

### Handling Rate Limits

When you receive `429 Too Many Requests`:

```javascript
const resetTime = response.headers.get('X-RateLimit-Reset');
const delay = (resetTime * 1000) - Date.now();
console.log(`Rate limited. Retry after ${delay}ms`);
```

---

## SDK Examples

### JavaScript/Node.js
```javascript
const fetch = require('node-fetch');

async function sendMoney() {
  const response = await fetch('https://greenpay.world/api/transactions/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer gpay_xxxxx',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipientId: 'user-id',
      amount: '1000',
      currency: 'KES'
    })
  });
  
  const data = await response.json();
  return data;
}
```

### Python
```python
import requests

response = requests.post(
  'https://greenpay.world/api/transactions/send',
  headers={'Authorization': 'Bearer gpay_xxxxx'},
  json={
    'recipientId': 'user-id',
    'amount': '1000',
    'currency': 'KES'
  }
)

data = response.json()
print(data)
```

### cURL
```bash
curl -X POST https://greenpay.world/api/transactions/send \
  -H "Authorization: Bearer gpay_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "user-id",
    "amount": "1000",
    "currency": "KES"
  }'
```

---

## Webhooks

Configure webhooks to receive real-time notifications:

**Events:**
- `transaction.completed`
- `transaction.failed`
- `kyc.verified`
- `payment_request.paid`
- `support_ticket.resolved`

**Webhook Payload:**
```json
{
  "event": "transaction.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "transactionId": "txn-id",
    "amount": "1000",
    "currency": "KES"
  },
  "signature": "sha256=abc123..."
}
```

---

## Support

- **Documentation**: https://docs.greenpay.world
- **Support Email**: api-support@greenpay.world
- **Status Page**: https://status.greenpay.world
- **Issues**: https://github.com/greenpay/issues
