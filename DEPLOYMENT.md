# GreenPay Deployment Guide

This guide explains how to deploy GreenPay to various hosting platforms.

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ Node.js 18+ installed locally
- ✅ PostgreSQL database (from hosting provider or external service)
- ✅ Git installed and project in a Git repository
- ✅ Environment variables configured (see `.env.example`)

---

## 🚀 Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)

**Why Railway?**
- Automatic detection of Node.js apps
- Built-in PostgreSQL database
- Free $5 credit monthly
- Modern dashboard and CLI

**Steps:**

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize & Deploy**
   ```bash
   railway init
   railway up
   ```

3. **Add PostgreSQL Database**
   ```bash
   railway add postgresql
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set SESSION_SECRET="your-random-secret-string"
   railway variables set NODE_ENV=production
   ```

5. **Get Your URL**
   ```bash
   railway open
   ```

**That's it!** Railway auto-detects the build and start commands.

---

### Option 2: Heroku

**Why Heroku?**
- Mature platform with extensive documentation
- Lots of add-ons available
- Easy Git-based deployment

**Steps:**

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login & Create App**
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Add PostgreSQL Database**
   ```bash
   heroku addons:create heroku-postgresql:essential-0
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set SESSION_SECRET="your-random-secret-string"
   heroku config:set NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Open App**
   ```bash
   heroku open
   ```

**Note:** The `Procfile` is already included in the project.

---

### Option 3: Render

**Why Render?**
- Free tier available
- Auto-deploys from GitHub
- Managed PostgreSQL included

**Steps:**

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/greenpay.git
   git push -u origin main
   ```

2. **Go to** [render.com](https://render.com)

3. **Create New Web Service**
   - Connect your GitHub repository
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

4. **Add PostgreSQL**
   - Create a new PostgreSQL database in Render
   - Copy the `DATABASE_URL`

5. **Set Environment Variables**
   - Add all variables from `.env.example`
   - Paste the PostgreSQL `DATABASE_URL`

6. **Deploy**
   - Render auto-deploys on every Git push

---

### Option 4: DigitalOcean App Platform

**Why DigitalOcean?**
- Simple pricing
- Integrated with managed databases
- Good for small-to-medium projects

**Steps:**

1. **Push to GitHub** (if not already done)

2. **Go to** [cloud.digitalocean.com](https://cloud.digitalocean.com)

3. **Create App**
   - Click "Apps" → "Create App"
   - Choose GitHub repository
   - Select branch (main)

4. **Configure Build**
   - Build Command: `npm install && npm run build`
   - Run Command: `npm start`
   - HTTP Port: `5000`

5. **Add PostgreSQL Database**
   - Go to "Resources" tab
   - Add a managed PostgreSQL database
   - DigitalOcean auto-injects `DATABASE_URL`

6. **Set Environment Variables**
   - Add all from `.env.example`

7. **Deploy**
   - DigitalOcean auto-deploys

---

## 🔧 Configuration Details

### Database Setup

All platforms require a PostgreSQL database. You can either:

1. **Use platform's managed database** (recommended)
   - Railway: Built-in PostgreSQL
   - Heroku: `heroku-postgresql` add-on
   - Render: Managed PostgreSQL service
   - DigitalOcean: Managed Database

2. **Use external database service**
   - [Neon](https://neon.tech) - Serverless PostgreSQL (free tier)
   - [Supabase](https://supabase.com) - PostgreSQL + more (free tier)
   - [ElephantSQL](https://www.elephantsql.com) - PostgreSQL as a Service

### Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

**Critical Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random string for sessions (generate with `openssl rand -hex 32`)
- `NODE_ENV=production`

**Optional Variables** (for full functionality):
- SMS/WhatsApp: `TALKNTAL_API_KEY`, etc.
- Airtime: `STATUM_API_KEY`, `STATUM_CONSUMER_KEY`, `STATUM_CONSUMER_SECRET`
- File Storage: AWS S3 or Google Cloud Storage credentials

### File Storage

**⚠️ Important:** Replit Object Storage is Replit-specific and won't work on external hosts.

**Alternatives:**

1. **AWS S3** (Recommended for production)
   ```bash
   # Add to .env
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=greenpay-files
   ```
   Update `server/storage.ts` to use AWS S3 SDK instead of Replit Object Storage.

2. **Cloudinary** (Easiest for images)
   - Sign up at [cloudinary.com](https://cloudinary.com)
   - Get API credentials
   - Use Cloudinary Node.js SDK

3. **Google Cloud Storage**
   - Create a bucket
   - Download service account key
   - Use `@google-cloud/storage` package (already installed!)

### Database Migration

After deploying, run the database migration:

```bash
# If using Railway
railway run npm run db:push -- --force

# If using Heroku
heroku run npm run db:push -- --force

# If using Render (via SSH)
npm run db:push -- --force
```

---

## 🔒 Security Checklist

Before going live:

- [ ] Generate a strong `SESSION_SECRET` (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (most platforms do this automatically)
- [ ] Set up database backups
- [ ] Review CORS settings if using separate frontend/backend
- [ ] Add rate limiting for API endpoints
- [ ] Validate all environment variables are set

---

## 📊 Monitoring & Logs

### View Logs

**Railway:**
```bash
railway logs
```

**Heroku:**
```bash
heroku logs --tail
```

**Render/DigitalOcean:**
- Use the web dashboard

---

## 💰 Cost Estimates (Monthly)

| Platform | Free Tier | Paid (Small App) |
|----------|-----------|------------------|
| **Railway** | $5 credit/month | ~$5-10/month |
| **Heroku** | Limited (sleep after 30min) | $7/month (Basic Dyno) |
| **Render** | 750 hours free | $7/month (Starter) |
| **DigitalOcean** | $200 credit (60 days) | $5/month (Basic App) |

**Database costs** are typically $7-15/month extra for managed PostgreSQL.

---

## 🆘 Troubleshooting

### Build Fails

**Check:**
- Node version in `package.json` engines field
- All dependencies in `package.json`
- Build command: `npm run build`

### App Crashes

**Check logs:**
- Database connection string is correct
- All required environment variables are set
- Port is using `process.env.PORT`

### Database Connection Error

**Fix:**
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Ensure database allows connections from your hosting platform's IP
- Run `npm run db:push -- --force` to create tables

---

## 🎯 Next Steps After Deployment

1. **Custom Domain** - Add your own domain (greenpay.world)
2. **SSL Certificate** - Enable HTTPS (usually automatic)
3. **Monitoring** - Set up error tracking (Sentry, LogRocket)
4. **Backups** - Configure automated database backups
5. **CI/CD** - Set up automated deployments from GitHub

---

## 📞 Need Help?

- Railway: [docs.railway.app](https://docs.railway.app)
- Heroku: [devcenter.heroku.com](https://devcenter.heroku.com)
- Render: [render.com/docs](https://render.com/docs)
- DigitalOcean: [docs.digitalocean.com](https://docs.digitalocean.com/products/app-platform/)

---

## 🔗 Useful Commands

```bash
# Test locally before deploying
npm install
npm run db:push -- --force
npm run build
npm start

# Generate session secret
openssl rand -hex 32

# Check environment variables
printenv | grep DATABASE

# Test database connection
psql $DATABASE_URL
```

---

**Good luck with your deployment! 🚀**
