# API Key Management Guide

## Overview

GreenPay provides API keys for programmatic access to the platform. Each key has specific scopes and rate limits, and can be rotated for security purposes.

---

## Generating an API Key

### Via Admin Dashboard

1. Log in to **GreenPay Admin Panel**
2. Navigate to **Settings** → **API Keys**
3. Click **Generate New Key**
4. Enter a descriptive name (e.g., "Mobile App", "Backend Service")
5. Select scopes:
   - `read` - Fetch user data and transactions
   - `write` - Create transactions and updates
   - `*` - All permissions (admin only)
6. Set rate limit (default: 1,000 requests/minute)
7. Click **Generate**
8. **Copy the key immediately** (shown only once for security)

### Via API (Admin Only)

```bash
curl -X POST https://greenpay.world/api/admin/api-keys/generate \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile App",
    "scope": ["read", "write"],
    "rateLimit": 1000
  }'
```

---

## Using API Keys

### Authorization Header

Include your API key in every request:

```bash
Authorization: Bearer gpay_xxxxxxxxxxxxx
```

### Example Request

```bash
curl -X GET https://greenpay.world/api/users/profile \
  -H "Authorization: Bearer gpay_xxxxxxxxxxxxx"
```

### JavaScript/Node.js Example

```javascript
const fetch = require('node-fetch');

const response = await fetch('https://greenpay.world/api/users/profile', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer gpay_xxxxxxxxxxxxx'
  }
});

const data = await response.json();
console.log(data);
```

---

## API Key Scopes

| Scope | Permissions |
|-------|------------|
| `read` | GET requests, view data |
| `write` | POST/PUT/DELETE requests, modify data |
| `kyc` | Submit KYC documents |
| `admin` | **Admin-only operations** |
| `*` | All permissions (unrestricted) |

### Recommended Scopes by Use Case

**Public Mobile App:**
```json
["read", "write"]
```

**Payment Processing:**
```json
["read", "write"]
```

**Data Analysis (Read-only):**
```json
["read"]
```

**KYC Integration:**
```json
["read", "kyc"]
```

---

## Security Best Practices

### 1. Never Commit Keys to Version Control

**❌ Bad:**
```javascript
// app.js
const API_KEY = "gpay_xxxxxxxxxxxxx";
```

**✓ Good:**
```javascript
// app.js
const API_KEY = process.env.GREENPAY_API_KEY;
```

**Environment file (.env):**
```
GREENPAY_API_KEY=gpay_xxxxxxxxxxxxx
```

### 2. Use Environment Variables

**Node.js:**
```javascript
const apiKey = process.env.GREENPAY_API_KEY;
```

**Python:**
```python
import os
api_key = os.getenv('GREENPAY_API_KEY')
```

**cURL:**
```bash
curl -H "Authorization: Bearer $GREENPAY_API_KEY" \
  https://greenpay.world/api/users/profile
```

### 3. Rotate Keys Regularly

**Every 90 days:**
1. Generate new API key
2. Update all applications using old key
3. Revoke old key from admin panel
4. Verify all systems work with new key

### 4. Use Separate Keys per Environment

```
Development:  gpay_dev_xxxxx
Staging:      gpay_staging_xxxxx
Production:   gpay_prod_xxxxx
```

This prevents accidental use of development keys in production.

### 5. Monitor API Usage

**Check usage in admin panel:**
- View API calls per key
- Monitor rate limit usage
- Set up alerts for unusual activity

**API Usage Endpoint (Admin):**
```bash
curl -X GET https://greenpay.world/api/admin/api-keys/usage \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6. Revoke Compromised Keys Immediately

```bash
curl -X POST https://greenpay.world/api/admin/api-keys/:keyId/revoke \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 7. Use Minimal Scopes

Only request the scopes you need:

```javascript
// If you only need to read user data
["read"]

// Avoid this unless necessary
["read", "write", "admin"]
```

---

## Rate Limiting

Your API key has rate limits to prevent abuse and ensure fair access.

### Rate Limit Tiers

| Tier | Requests/Minute | Requests/Day | Price |
|------|-----------------|--------------|-------|
| Free | 100 | 5,000 | $0 |
| Pro | 1,000 | 100,000 | $29/mo |
| Enterprise | 10,000 | 1,000,000 | Custom |

### Rate Limit Headers

Every API response includes rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705316400
```

### Handling Rate Limits

When you receive `429 Too Many Requests`:

**JavaScript/Node.js:**
```javascript
async function apiCallWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      const delay = (resetTime * 1000) - Date.now();
      
      console.log(`Rate limited. Waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    return response;
  }
}
```

**Python:**
```python
import time
import requests

def api_call_with_retry(url, headers, max_retries=3):
    for i in range(max_retries):
        response = requests.get(url, headers=headers)
        
        if response.status_code == 429:
            reset_time = int(response.headers.get('X-RateLimit-Reset'))
            delay = reset_time - time.time()
            print(f"Rate limited. Waiting {delay} seconds...")
            time.sleep(delay)
            continue
        
        return response
    
    return response
```

### Optimization Tips

1. **Batch Requests**: Combine multiple operations into single requests
2. **Cache Results**: Store API responses locally when possible
3. **Implement Backoff**: Use exponential backoff for retries
4. **Upgrade Plan**: Move to Pro tier for higher limits

---

## API Key Expiration

- **Free tier**: No expiration (revoke manually)
- **Pro tier**: 1 year expiration (auto-renew with notification)
- **Enterprise**: Custom expiration policies

**Check expiration:**
```bash
curl -X GET https://greenpay.world/api/admin/api-keys/:keyId \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Monitoring & Logs

### View All API Keys (Admin)

```bash
curl -X GET https://greenpay.world/api/admin/api-keys \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View API Usage

```bash
curl -X GET https://greenpay.world/api/admin/api-keys/usage \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Access Logs

```bash
curl -X GET "https://greenpay.world/api/admin/logs?filter=api_access" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Set Up Alerts

Configure in admin panel:
- Alert when rate limit approaches
- Alert when key is accessed from new IP
- Alert when unusual usage patterns detected

---

## Webhook Signatures

GreenPay signs all webhooks using your API key for security.

**Webhook Headers:**
```
X-Signature: sha256=abc123...
X-Timestamp: 1705316400
```

**Verify Webhook in Node.js:**
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, apiKey) {
  const hash = crypto
    .createHmac('sha256', apiKey)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

// In your webhook handler
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifyWebhookSignature(payload, signature, process.env.API_KEY)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  res.json({ success: true });
});
```

**Verify Webhook in Python:**
```python
import hmac
import hashlib
import json

def verify_webhook_signature(payload_str, signature, api_key):
    expected_hash = hmac.new(
        api_key.encode(),
        payload_str.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_hash, signature)

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Signature')
    payload = request.get_data(as_text=True)
    
    if not verify_webhook_signature(payload, signature, os.getenv('API_KEY')):
        return {'error': 'Invalid signature'}, 401
    
    data = json.loads(payload)
    # Process webhook
    return {'success': True}
```

---

## Troubleshooting

### "Invalid API Key"

**Causes:**
- Typo in key
- Key doesn't start with `gpay_`
- Key has been revoked
- Key has expired

**Solution:**
1. Check key format (must start with `gpay_`)
2. Generate a new key from admin panel
3. Update your code with new key

### "Missing Authorization Header"

**Causes:**
- Forgot to include `Authorization` header
- Wrong header format

**Solution:**
```javascript
// Correct format
headers: {
  'Authorization': 'Bearer gpay_xxxxx'
}

// Wrong formats ❌
'Bearer: gpay_xxxxx'        // Missing space
'Authorization: gpay_xxxxx' // Missing Bearer
'API-Key: gpay_xxxxx'       // Wrong header name
```

### "Insufficient Permissions"

**Causes:**
- API key lacks required scope
- Endpoint requires higher permissions

**Solution:**
1. Check your key's scopes in admin panel
2. Generate new key with required scopes
3. Or request scope upgrade from admin

### "Rate Limited (429)"

**Causes:**
- Exceeded rate limit for your tier
- Too many concurrent requests

**Solution:**
1. Wait for rate limit reset time
2. Implement exponential backoff
3. Upgrade to higher tier
4. Batch requests to use fewer calls

---

## Support

- **API Documentation**: https://docs.greenpay.world/api
- **Support Email**: api-support@greenpay.world
- **Status Page**: https://status.greenpay.world
- **GitHub Issues**: https://github.com/greenpay/issues
- **Community Forum**: https://community.greenpay.world

---

## API Key Formats

GreenPay uses the following API key format:

```
gpay_[32-character-random-string]
```

**Examples:**
```
gpay_abc123def456ghi789jkl012mno345pqr
gpay_xyz789uvw456rst123opq890mno567ijk
```

Keys always start with `gpay_` for easy identification.
