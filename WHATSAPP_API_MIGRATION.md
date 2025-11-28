# WhatsApp Business Meta API Migration

## Overview
Successfully migrated WhatsApp messaging from TalkNTalk API to **Meta WhatsApp Business API** (Graph API v18.0).

## Changes Made

### 1. Updated WhatsApp Service (`server/services/whatsapp.ts`)
- Replaced TalkNTalk endpoint with Meta Graph API endpoint
- Updated to use Meta's official WhatsApp Business API
- Uses `messaging_product: "whatsapp"` for proper API routing

**Key Changes:**
- Uses Meta Graph API: `https://graph.instagram.com/v18.0/{phoneNumberId}/messages`
- Supports both text messages and template messages (OTP)
- Phone number formatting updated to Meta's requirements (no + prefix)

### 2. Updated Messaging Service (`server/services/messaging.ts`)
- Integrated `whatsappService` for WhatsApp delivery
- Removed TalkNTalk-specific WhatsApp session handling
- SMS delivery still uses TalkNTalk API (unchanged)
- WhatsApp now operates independently from SMS credentials

**Key Changes:**
- Removed `whatsappSessionId` from credentials
- `sendWhatsApp()` now uses the dedicated `whatsappService`
- Can send WhatsApp without SMS (and vice versa)
- All multi-channel methods updated to use new service

## Environment Variables Required

Add these to your `.env` or Replit secrets:

```
WHATSAPP_ACCESS_TOKEN=<your_meta_access_token>
WHATSAPP_PHONE_NUMBER_ID=<your_whatsapp_phone_number_id>
```

## How to Setup Meta WhatsApp Business API

1. **Create Meta Business Account**
   - Go to https://www.facebook.com/business/tools/meta-business-suite
   - Set up business profile

2. **Create WhatsApp App**
   - Go to https://developers.facebook.com/apps
   - Create new app → WhatsApp
   - Get your `Phone Number ID` and `Access Token`

3. **Create Message Template** (for OTP)
   - In WhatsApp Manager, create template named `otp_verification`
   - Template structure:
     ```
     Hi {{1}},
     Your verification code is {{1}}.
     Valid for 10 minutes.
     ```

4. **Add Environment Variables**
   - Store `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`

## Migration Benefits

✅ **Official API** - Direct from Meta, not third-party
✅ **Better Support** - Meta provides comprehensive documentation and support
✅ **Template Messages** - Use pre-approved templates for OTP (higher delivery rates)
✅ **Independent** - WhatsApp doesn't depend on SMS service anymore
✅ **Scalable** - Better for high-volume deployments

## SMS Service Still Works

- SMS delivery via TalkNTalk remains unchanged
- Admin can configure SMS independently in messaging settings
- Both channels can operate simultaneously for redundancy

## API Documentation

- Meta WhatsApp Business API: https://developers.facebook.com/docs/whatsapp/cloud-api/
- Message Types: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
- Templates: https://developers.facebook.com/docs/whatsapp/message-templates
