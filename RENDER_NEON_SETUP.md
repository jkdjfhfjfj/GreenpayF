# 🚀 Deploy GreenPay to Render + Neon PostgreSQL

This is a step-by-step guide for deploying GreenPay using **Render** (hosting) and **Neon** (PostgreSQL database).

---

## Prerequisites

✅ You already have:
- Neon PostgreSQL connection string
- GitHub account
- Render account (free to sign up)

---

## Step 1: Push Your Code to GitHub

If you haven't already:

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/yourusername/greenpay.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up on Render

### A. Create Web Service

1. Go to **[render.com](https://render.com)** and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the **greenpay** repository

### B. Configure Build Settings

**Name:** `greenpay` (or your preferred name)

**Environment:** `Node`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Plan:** Free (or select paid for better performance)

---

## Step 3: Add Environment Variables

In Render dashboard, go to **"Environment"** tab and add these variables:

### ⚡ Required Variables

```bash
# Database (use your Neon connection string)
DATABASE_URL=postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Session Secret (generate random string)
SESSION_SECRET=your-super-secret-random-32-character-string

# Environment
NODE_ENV=production
```

**To generate a SESSION_SECRET:**
```bash
openssl rand -hex 32
```
Or use an online generator: https://randomkeygen.com/

### 🔐 Optional Variables (for full functionality)

#### SMS/WhatsApp (TalkNTalk) - For OTP verification
```bash
TALKNTAL_API_KEY=your-talkntal-api-key
TALKNTAL_ACCOUNT_EMAIL=your-email@example.com
TALKNTAL_SENDER_ID=YourSenderID
TALKNTAL_WHATSAPP_SESSION_ID=your-whatsapp-session-id
```

#### Airtime (Statum) - For airtime purchases
```bash
STATUM_API_KEY=your-statum-api-key
STATUM_CONSUMER_KEY=your-statum-consumer-key
STATUM_CONSUMER_SECRET=your-statum-consumer-secret
```

#### PayHero - For automated virtual card payments
```bash
PAYHERO_API_KEY=your-payhero-api-key
PAYHERO_ACCOUNT_ID=your-payhero-account-id
PAYHERO_WEBHOOK_SECRET=your-payhero-webhook-secret
```

#### File Storage (choose one)

**Option 1: Cloudinary** (easiest)
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Option 2: AWS S3**
```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=greenpay-files
```

**Option 3: Google Cloud Storage**
```bash
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=greenpay-files
GCS_KEYFILE_PATH=/etc/secrets/keyfile.json
```

---

## Step 4: Deploy!

1. Click **"Create Web Service"**
2. Render will automatically start deploying
3. Watch the logs for any errors

---

## Step 5: Run Database Migration

After the first deployment, you need to create database tables:

### A. Open Render Shell

1. Go to your web service dashboard
2. Click **"Shell"** tab
3. Run:

```bash
npm run db:push -- --force
```

This creates all database tables in your Neon PostgreSQL database.

---

## Step 6: Get Your App URL

Once deployed, Render gives you a URL like:
```
https://greenpay.onrender.com
```

Visit this URL to see your app live! 🎉

---

## 🔧 Where to Find Your Values

### Neon Connection String

1. Go to **[console.neon.tech](https://console.neon.tech)**
2. Select your database
3. Click **"Connection Details"**
4. Copy the **Connection String** (looks like):
   ```
   postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Paste this as `DATABASE_URL` in Render

### PayHero Credentials

1. Go to **PayHero dashboard** (or contact PayHero support)
2. Get your API key, Account ID, and Webhook Secret
3. Add to Render environment variables

### TalkNTalk (SMS/WhatsApp)

1. Go to **TalkNTalk dashboard**
2. Get your API key and credentials
3. Add to Render environment variables

### Statum (Airtime)

1. Go to **Statum dashboard**
2. Get your Consumer Key and Secret
3. Add to Render environment variables

---

## ⚠️ Important: File Storage

**Replit Object Storage won't work on Render!**

You MUST set up one of these:

1. **Cloudinary** (recommended, easiest)
   - Sign up at [cloudinary.com](https://cloudinary.com)
   - Free tier: 25GB storage
   - Add credentials to Render

2. **AWS S3**
   - Create S3 bucket
   - Get access keys
   - Add to Render

3. **Google Cloud Storage**
   - Create GCS bucket
   - Download service account key
   - Add to Render

See **FILE_STORAGE_MIGRATION.md** for detailed instructions.

---

## 🐛 Troubleshooting

### Build Fails

**Check logs in Render dashboard**

Common issues:
- Missing environment variables → Add them
- Node version mismatch → Check package.json

### Database Connection Error

**Fix:**
1. Verify `DATABASE_URL` is correct
2. Make sure it includes `?sslmode=require`
3. Check Neon database is running

### App Crashes

**View logs:**
- Go to Render dashboard → **Logs** tab
- Look for error messages

Common issues:
- Missing `SESSION_SECRET` → Add it
- Database tables not created → Run `npm run db:push --force`

### File Uploads Don't Work

**Fix:**
- Set up file storage (Cloudinary/S3/GCS)
- See FILE_STORAGE_MIGRATION.md

---

## 💰 Costs

| Service | Free Tier | Paid (if needed) |
|---------|-----------|------------------|
| **Render** | 750 hours/month (sleeps after 15min inactivity) | $7/month (always on) |
| **Neon PostgreSQL** | 0.5GB storage, 3GB compute/month | $19/month (unlimited) |
| **Cloudinary** | 25GB storage + bandwidth | $99/month (if exceeded) |

**Total for free tier:** $0/month (with limitations)  
**Total for paid basic:** ~$26/month (always on, no limits)

---

## ✅ Post-Deployment Checklist

- [ ] Database connected (check Render logs)
- [ ] Database tables created (`npm run db:push --force`)
- [ ] File storage configured (Cloudinary/S3/GCS)
- [ ] App accessible at Render URL
- [ ] Test user registration
- [ ] Test login
- [ ] Test file uploads (profile photo, KYC)
- [ ] Test transactions

---

## 🎯 Next Steps

### Custom Domain

1. Go to Render dashboard → **Settings**
2. Click **"Custom Domain"**
3. Add `greenpay.world` (or your domain)
4. Update DNS records as instructed
5. Render auto-provisions SSL certificate

### Auto-Deploy from GitHub

Already enabled! Every time you push to GitHub, Render auto-deploys.

```bash
git add .
git commit -m "Update feature"
git push origin main
# Render automatically deploys!
```

---

## 📞 Need Help?

- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Neon Docs:** [neon.tech/docs](https://neon.tech/docs)
- **GreenPay Files:**
  - `DEPLOYMENT.md` - General deployment guide
  - `FILE_STORAGE_MIGRATION.md` - File storage setup
  - `.env.example` - All environment variables

---

**You're all set! Your GreenPay app is now live on Render! 🚀**
