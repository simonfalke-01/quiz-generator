# Cloudflare R2 Setup Guide

This application now uses **Cloudflare R2** for file storage instead of Vercel Blob. R2 is S3-compatible and offers better pricing and performance.

## 🚀 Quick Setup

### 1. Create Cloudflare R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Create a new bucket (e.g., `bio-revision-uploads`)
4. Note your **Account ID** from the R2 overview page

### 2. Create R2 API Token

1. Go to **R2 > Manage R2 API tokens**
2. Create a new token with:
   - **Token name**: `bio-revision-app`
   - **Permissions**: Object Read & Write
   - **Bucket resource**: Include your bucket name
3. Save the **Access Key ID** and **Secret Access Key**

### 3. Update Environment Variables

Replace the Vercel Blob configuration in `.env.local`:

```bash
# Remove these old Vercel Blob variables:
# BLOB_READ_WRITE_TOKEN=...

# Add these R2 variables:
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id  
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=bio-revision-uploads
R2_PUBLIC_URL=https://your-custom-domain.com  # Optional
```

### 4. Configure Public Access (Optional)

For direct public file access:
1. Go to your R2 bucket settings
2. Enable **Public access** 
3. Set up a **Custom domain** (recommended)
4. Update `R2_PUBLIC_URL` in your environment

## 🏗️ Architecture Changes

### What Changed

- ✅ **File uploads** now go to Cloudflare R2
- ✅ **Pre-signed URLs** for direct client uploads  
- ✅ **Better error handling** with detailed R2 responses
- ✅ **Cost optimization** - R2 is significantly cheaper than Vercel Blob
- ✅ **S3-compatible API** for easy migration and tooling

### File Storage Structure

```
bucket-name/
└── uploads/
    ├── 1234567890-abc123.pdf
    ├── 1234567890-def456.txt  
    └── 1234567890-ghi789.md
```

### API Changes

| Endpoint | Change |
|----------|--------|
| `POST /api/upload` | Now uploads to R2 instead of Vercel Blob |
| `POST /api/upload-url` | Generates R2 pre-signed URLs |
| `POST /api/generate-bqc` | Downloads from R2 using file key/URL |
| `POST /api/chat/[topicId]` | Fetches source material from R2 |

## 🧪 Testing the Setup

### 1. Check Configuration

Make sure all environment variables are set:

```bash
echo "Account ID: $R2_ACCOUNT_ID"
echo "Bucket: $R2_BUCKET_NAME"
```

### 2. Test File Upload

Create a test file and upload:

```bash
echo "Hello R2!" > test.txt
curl -X POST -F "file=@test.txt" http://localhost:3000/api/upload
```

### 3. Verify in R2 Dashboard

Check your R2 bucket to see the uploaded file in the `uploads/` folder.

## 💰 Cost Comparison

| Service | Storage | Bandwidth | Requests |
|---------|---------|-----------|----------|
| **Vercel Blob** | ~$0.15/GB | ~$0.15/GB | ~$0.40/1M |
| **Cloudflare R2** | ~$0.015/GB | **FREE** | ~$0.36/1M |

**R2 is ~90% cheaper** for storage and has **free egress bandwidth**!

## 🔧 Advanced Configuration

### Custom Domain Setup

1. Add a custom domain in R2 bucket settings
2. Update DNS CNAME record: `files.yourdomain.com → bucket.account.r2.cloudflarestorage.com`
3. Set `R2_PUBLIC_URL=https://files.yourdomain.com`

### CORS Configuration

If using direct client uploads, configure CORS in R2:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### Security Best Practices

- ✅ Use separate R2 tokens for different environments
- ✅ Restrict token permissions to specific buckets
- ✅ Set up bucket policies for fine-grained access control
- ✅ Enable R2 audit logs for compliance

## 🔄 Migration Notes

### From Vercel Blob

The migration is **automatic** - no data migration needed since:
- Old quiz data in Redis still works
- New uploads use R2 
- Chat system gracefully falls back to BQC content if source files are unavailable

### Rollback Plan

If needed, you can quickly revert by:
1. Restoring `@vercel/blob` dependency
2. Reverting API route files
3. Updating environment variables

## 🐛 Troubleshooting

### Common Issues

**Error: "R2 service not configured"**
- Check all environment variables are set
- Verify R2 token has correct permissions

**Error: "Failed to upload file to storage"**  
- Check R2 bucket exists and is accessible
- Verify CORS settings if using direct uploads
- Check token permissions include bucket access

**Error: "Failed to download file from storage"**
- File may have been deleted from R2
- Check bucket public access settings
- Verify file key/URL format

### Debug Mode

Set environment variable for detailed R2 logging:
```bash
DEBUG=r2:*
```

## 📚 Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS S3 SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)

---

🎉 **Your application is now powered by Cloudflare R2!** Enjoy the improved performance and reduced costs.