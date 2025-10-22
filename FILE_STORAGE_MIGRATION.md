# File Storage Migration Guide

## ⚠️ Important Notice

Your GreenPay app currently uses **Replit Object Storage** for file uploads (KYC documents, profile photos, chat images). This service **only works on Replit** and will not function on external hosting platforms.

Before deploying to an external host, you MUST migrate to one of these alternatives:

---

## 🎯 Recommended Solutions

### Option 1: AWS S3 (Most Popular)

**Pros:** Industry standard, scalable, reliable  
**Cons:** Requires AWS account, slightly complex setup  
**Cost:** ~$0.023/GB/month + transfer costs (very cheap for small apps)

**Setup:**

1. **Create S3 Bucket**
   - Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
   - Create bucket (e.g., `greenpay-files`)
   - Set region (e.g., `us-east-1`)
   - Enable public access for uploaded files (or use signed URLs)

2. **Get Access Keys**
   - Go to IAM → Users → Create User
   - Attach policy: `AmazonS3FullAccess`
   - Create access key → Save `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

3. **Install AWS SDK** (already done!)
   ```bash
   # Already in package.json:
   # @google-cloud/storage (can also use @aws-sdk/client-s3)
   ```

4. **Update Code**

   In `server/storage.ts` or wherever Replit Object Storage is used:

   ```typescript
   import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
   
   const s3Client = new S3Client({
     region: process.env.AWS_REGION,
     credentials: {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
     },
   });

   // Upload file
   async function uploadFile(buffer: Buffer, filename: string) {
     const command = new PutObjectCommand({
       Bucket: process.env.AWS_S3_BUCKET,
       Key: filename,
       Body: buffer,
       ContentType: 'image/jpeg', // or detect from file
     });
     
     await s3Client.send(command);
     return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;
   }
   ```

5. **Environment Variables**
   ```env
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=greenpay-files
   ```

---

### Option 2: Cloudinary (Easiest)

**Pros:** Simplest setup, auto-optimizes images, free tier generous  
**Cons:** Primarily for images (not great for PDFs/documents)  
**Cost:** Free up to 25GB storage + 25GB bandwidth/month

**Setup:**

1. **Sign Up**
   - Go to [cloudinary.com](https://cloudinary.com)
   - Get your credentials (Cloud Name, API Key, API Secret)

2. **Install SDK**
   ```bash
   npm install cloudinary
   ```

3. **Update Code**

   ```typescript
   import { v2 as cloudinary } from 'cloudinary';

   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET,
   });

   // Upload file
   async function uploadFile(buffer: Buffer, filename: string) {
     return new Promise((resolve, reject) => {
       cloudinary.uploader.upload_stream(
         { folder: 'greenpay', public_id: filename },
         (error, result) => {
           if (error) reject(error);
           else resolve(result.secure_url);
         }
       ).end(buffer);
     });
   }
   ```

4. **Environment Variables**
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

---

### Option 3: Google Cloud Storage

**Pros:** Free $300 credit for new users, integrated with other Google services  
**Cons:** Requires Google Cloud account  
**Cost:** ~$0.020/GB/month

**Setup:**

1. **Create GCS Bucket**
   - Go to [Google Cloud Console](https://console.cloud.google.com/storage)
   - Create bucket (e.g., `greenpay-files`)

2. **Create Service Account**
   - Go to IAM & Admin → Service Accounts → Create
   - Grant "Storage Object Admin" role
   - Create key (JSON) → Download `keyfile.json`

3. **Already Installed!**
   ```bash
   # Package already in dependencies:
   # @google-cloud/storage
   ```

4. **Update Code**

   ```typescript
   import { Storage } from '@google-cloud/storage';

   const storage = new Storage({
     projectId: process.env.GCS_PROJECT_ID,
     keyFilename: process.env.GCS_KEYFILE_PATH,
   });

   const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

   // Upload file
   async function uploadFile(buffer: Buffer, filename: string) {
     const file = bucket.file(filename);
     await file.save(buffer, {
       contentType: 'image/jpeg',
     });
     
     return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${filename}`;
   }
   ```

5. **Environment Variables**
   ```env
   GCS_PROJECT_ID=your-project-id
   GCS_BUCKET_NAME=greenpay-files
   GCS_KEYFILE_PATH=/app/keyfile.json
   ```

---

## 📝 Files to Update

Search for `@replit/object-storage` usage in your codebase:

```bash
grep -r "@replit/object-storage" server/
grep -r "getClient()" server/
```

**Likely files:**
- `server/routes.ts` - KYC document uploads, profile photo uploads, chat file uploads
- `server/storage.ts` - Storage helper functions
- Any file handling `multer` uploads

**Replace all instances of:**

```typescript
// OLD (Replit Object Storage)
import { getClient } from '@replit/object-storage';
const storage = getClient();
await storage.uploadFromBytes(filename, buffer);
const url = await storage.downloadAsURL(filename);
```

**With your chosen alternative** (S3, Cloudinary, or GCS from examples above).

---

## 🔄 Migration Checklist

Before deploying externally:

- [ ] Choose file storage provider (S3, Cloudinary, or GCS)
- [ ] Create account and get credentials
- [ ] Install SDK (if not already installed)
- [ ] Replace all Replit Object Storage code
- [ ] Add environment variables to hosting platform
- [ ] Test file uploads locally first
- [ ] Test file downloads/retrieval
- [ ] Deploy and verify uploads work in production

---

## 🧪 Testing Locally

After making changes, test file uploads:

```bash
# Set environment variables in .env
cp .env.example .env
# Fill in your chosen storage credentials

# Run app locally
npm run dev

# Test:
# 1. Profile photo upload
# 2. KYC document upload
# 3. Chat file upload
# Verify files appear in your storage bucket
```

---

## 💡 Pro Tips

1. **Use environment variable to switch storage backends**
   ```typescript
   const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 's3';
   
   if (STORAGE_PROVIDER === 's3') {
     // Use S3
   } else if (STORAGE_PROVIDER === 'cloudinary') {
     // Use Cloudinary
   }
   ```

2. **Keep file naming consistent**
   - Use UUIDs for unique filenames
   - Organize by folder: `kyc/`, `profiles/`, `chat/`

3. **Set up CDN** for faster delivery (CloudFront for S3, built-in for Cloudinary)

4. **Implement file size limits** to avoid storage costs spiraling

5. **Clean up old files** periodically to save costs

---

## 🆘 Need Help?

- **AWS S3 Docs:** [docs.aws.amazon.com/s3](https://docs.aws.amazon.com/s3/)
- **Cloudinary Docs:** [cloudinary.com/documentation](https://cloudinary.com/documentation)
- **GCS Docs:** [cloud.google.com/storage/docs](https://cloud.google.com/storage/docs)

---

**Remember:** File storage migration is REQUIRED for external hosting. The app will fail to upload files without it! 🚨
