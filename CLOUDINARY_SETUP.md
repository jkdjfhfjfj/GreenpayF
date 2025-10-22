# 🖼️ Cloudinary Setup Guide for GreenPay

Your GreenPay app now uses **Cloudinary** for file storage (KYC documents, profile photos, chat files).

---

## ✅ What's Already Done

- ✅ Cloudinary package installed
- ✅ Storage service created (`server/cloudinaryStorage.ts`)
- ✅ All upload routes updated (KYC, profile, chat)
- ✅ File downloads integrated

**You just need to add your Cloudinary credentials!**

---

## 🚀 Step 1: Sign Up for Cloudinary (FREE)

1. Go to **[cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)**
2. Sign up with your email (or Google/GitHub)
3. Verify your email

**Free tier includes:**
- 25GB storage
- 25GB bandwidth/month
- Unlimited transformations
- Forever free (no credit card required!)

---

## 🔑 Step 2: Get Your Credentials

After signing in:

1. Go to **Dashboard** (you'll see it immediately after login)
2. Look for the **"Product Environment Credentials"** section
3. You'll see:
   - **Cloud Name** (e.g., `dxxxxx123`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (click "👁️ Show" to reveal)

**Copy these three values** - you'll need them next!

---

## 📝 Step 3: Add to Render Environment Variables

### If deploying to Render:

1. Go to your **Render dashboard**
2. Select your **greenpay web service**
3. Click **"Environment"** tab
4. Click **"Add Environment Variable"**

Add these three variables:

```
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here
```

**Example:**
```
CLOUDINARY_CLOUD_NAME=dxxxxx123
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUv
```

4. Click **"Save Changes"**
5. Render will automatically restart your app

---

## 🧪 Step 4: Test Locally (Optional)

Before deploying, you can test file uploads on your local machine:

1. **Create `.env` file** in your project root:
   ```bash
   cp .env.example .env
   ```

2. **Open `.env` and add your Cloudinary credentials:**
   ```env
   DATABASE_URL=your-neon-connection-string
   SESSION_SECRET=your-session-secret
   NODE_ENV=development
   
   # Cloudinary (for file uploads)
   CLOUDINARY_CLOUD_NAME=dxxxxx123
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUv
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Test file uploads:**
   - Upload a profile photo
   - Upload KYC documents
   - Send an image in chat

---

## ✅ Step 5: Verify It's Working

### On Render (after deployment):

1. Go to your app URL (e.g., `https://greenpay.onrender.com`)
2. Try uploading a profile photo
3. Check **Status page**: `/status`
   - Look for "📁 File Uploads" - should show "healthy"

### In Cloudinary Dashboard:

1. Go to **[console.cloudinary.com](https://console.cloudinary.com)**
2. Click **"Media Library"** in the left sidebar
3. You should see folders:
   - `greenpay/profile/` - Profile photos
   - `greenpay/kyc/` - KYC documents
   - `greenpay/chat/` - Chat images

---

## 📂 How Files Are Organized

Cloudinary automatically organizes your files:

```
greenpay/
├── profile/
│   └── uuid-123.jpg (profile photos)
├── kyc/
│   ├── uuid-456.pdf (ID front)
│   ├── uuid-789.jpg (ID back)
│   └── uuid-abc.png (selfies)
└── chat/
    └── uuid-def.jpg (chat images)
```

---

## 🔒 Security Features

✅ **Unique filenames** - Each file gets a random UUID  
✅ **HTTPS delivery** - All files served over secure connection  
✅ **Access control** - URLs are non-guessable  
✅ **CDN delivery** - Fast worldwide file access

---

## 💰 Cost Information

**Free Tier Limits:**
- 25GB storage
- 25GB bandwidth/month
- Unlimited image transformations

**If you exceed (unlikely for small app):**
- Storage: $0.10/GB/month
- Bandwidth: $0.10/GB

**For most small apps, the free tier is enough!**

---

## 🐛 Troubleshooting

### Problem: "File storage not configured" error

**Fix:**
1. Check environment variables are set in Render
2. Verify credentials are correct (no extra spaces)
3. Restart your Render service

### Problem: File upload fails with 401 error

**Fix:**
1. Double-check your `API_SECRET` (case-sensitive!)
2. Make sure you copied the full secret (click "👁️ Show" in Cloudinary)

### Problem: Can't see uploaded files in Cloudinary

**Fix:**
1. Check the correct folder in Media Library
2. Look under `greenpay/profile/`, `greenpay/kyc/`, or `greenpay/chat/`

---

## 📊 Monitoring File Storage

### View uploaded files:

1. **Cloudinary Dashboard** → **Media Library**
2. Filter by folder (e.g., `greenpay/kyc`)
3. See file size, upload date, and URL

### Check storage usage:

1. **Cloudinary Dashboard** → **Dashboard** (home)
2. Look at **"Storage & Bandwidth"** widget
3. See how much of your free 25GB you've used

---

## 🎯 What File Types Are Supported?

Your app supports:

**Images:**
- JPG, JPEG, PNG, GIF, WebP

**Documents:**
- PDF
- DOC, DOCX (Microsoft Word)
- TXT (Text files)

**Size limit:** 10MB per file

---

## 🔧 Advanced: Custom Cloudinary Settings (Optional)

### Enable auto-backup:

1. Go to **Settings** → **Upload**
2. Enable **"Backup"**
3. Your files will be backed up to external storage

### Add webhooks for upload notifications:

1. Go to **Settings** → **Webhooks**
2. Add webhook URL
3. Get notified when files are uploaded

---

## ✅ Checklist

Before deploying to production:

- [ ] Created Cloudinary account (free)
- [ ] Got Cloud Name, API Key, and API Secret
- [ ] Added environment variables to Render
- [ ] Tested file upload (profile photo, KYC, or chat)
- [ ] Verified files appear in Cloudinary Media Library
- [ ] Checked `/status` page shows file uploads as "healthy"

---

## 📞 Need Help?

- **Cloudinary Docs:** [cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Cloudinary Support:** [support.cloudinary.com](https://support.cloudinary.com)
- **Node.js SDK Docs:** [cloudinary.com/documentation/node_integration](https://cloudinary.com/documentation/node_integration)

---

## 🎉 You're Done!

Your GreenPay app now has professional file storage with:
- ✅ Secure file uploads
- ✅ Fast CDN delivery
- ✅ 25GB free storage
- ✅ Ready for production!

**Next steps:** Complete your Render deployment following `RENDER_NEON_SETUP.md`
