import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Response } from "express";
import { randomUUID } from "crypto";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryStorageService {
  constructor() {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('⚠️  Cloudinary credentials not configured. File uploads will fail.');
      console.warn('   Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
    } else {
      console.log(`✅ Cloudinary Storage initialized for: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    }
  }

  /**
   * Upload a file to Cloudinary
   * @param key The storage key/path for the file (e.g., "kyc/uuid.pdf")
   * @param buffer The file buffer to upload
   * @param contentType The MIME type of the file
   * @returns The Cloudinary public URL
   */
  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    try {
      console.log(`📤 Uploading file to Cloudinary: ${key} (${contentType})`);

      // Prefix with greenpay/ for organization
      const publicId = `greenpay/${key}`;

      return new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: this.getResourceType(contentType),
            // Don't use folder parameter - public_id already contains the path
          },
          (error, result) => {
            if (error) {
              console.error(`❌ Cloudinary upload error:`, error);
              reject(new Error(`Failed to upload file: ${error.message}`));
            } else if (result) {
              console.log(`✅ File uploaded to: ${result.secure_url}`);
              console.log(`   Public ID: ${result.public_id}`);
              resolve(result.secure_url);
            } else {
              reject(new Error('Upload failed: No result returned'));
            }
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      console.error(`❌ Error uploading file to Cloudinary:`, error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download a file from Cloudinary (fetch the image/file)
   * Note: Cloudinary serves files via URLs, so this fetches from the URL
   * @param keyOrUrl The storage key/path (public_id) or full Cloudinary URL
   * @returns The file buffer and metadata
   */
  async downloadFile(keyOrUrl: string): Promise<{ buffer: Buffer; contentType?: string }> {
    try {
      console.log(`📥 Downloading file from Cloudinary: ${keyOrUrl}`);
      
      // If it's already a URL, use it directly; otherwise construct the URL
      const url = (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://'))
        ? keyOrUrl
        : this.constructCloudinaryUrl(keyOrUrl);
      
      console.log(`🔗 Fetching from URL: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new ObjectNotFoundError();
        }
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      console.log(`✅ File downloaded successfully: ${keyOrUrl} (${contentType})`);
      return {
        buffer,
        contentType,
      };
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        throw error;
      }
      console.error(`❌ Error downloading file from Cloudinary:`, error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param keyOrUrl The storage key (e.g., "kyc/uuid.pdf") or full Cloudinary URL
   */
  async deleteFile(keyOrUrl: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting file from Cloudinary: ${keyOrUrl}`);
      
      // If it's a URL, extract the public_id; otherwise prepend greenpay/
      const publicId = (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://'))
        ? this.extractPublicIdFromUrl(keyOrUrl)
        : `greenpay/${keyOrUrl}`;
      
      const resourceType = this.guessResourceTypeFromKey(keyOrUrl);
      
      console.log(`🗑️ Deleting public_id: ${publicId} (type: ${resourceType})`);
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`✅ File deleted successfully: ${keyOrUrl}`);
    } catch (error) {
      console.error(`❌ Error deleting file from Cloudinary:`, error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a file exists in Cloudinary
   * @param keyOrUrl The storage key (e.g., "kyc/uuid.pdf") or full Cloudinary URL
   * @returns True if the file exists, false otherwise
   */
  async fileExists(keyOrUrl: string): Promise<boolean> {
    try {
      // If it's a URL, extract the public_id; otherwise prepend greenpay/
      const publicId = (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://'))
        ? this.extractPublicIdFromUrl(keyOrUrl)
        : `greenpay/${keyOrUrl}`;
      
      const resourceType = this.guessResourceTypeFromKey(keyOrUrl);
      
      const result = await cloudinary.api.resource(publicId, { resource_type: resourceType });
      return !!result;
    } catch (error: any) {
      if (error.error?.http_code === 404) {
        return false;
      }
      console.error(`❌ Error checking file existence:`, error);
      return false;
    }
  }

  /**
   * Generate a unique upload key for a file
   * @param folder The folder to upload to (e.g., 'kyc', 'chat', 'profile')
   * @param filename The original filename
   * @returns A unique storage key
   */
  generateUploadKey(folder: string, filename: string): string {
    const uuid = randomUUID();
    const extension = filename.split('.').pop() || 'bin';
    return `${folder}/${uuid}.${extension}`;
  }

  /**
   * Upload a KYC document
   * @returns Cloudinary URL
   */
  async uploadKycDocument(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const key = this.generateUploadKey('kyc', filename);
    console.log(`📋 Uploading KYC document: ${filename} -> ${key}`);
    return await this.uploadFile(key, buffer, contentType);
  }

  /**
   * Upload a chat file
   * @returns Cloudinary URL
   */
  async uploadChatFile(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const key = this.generateUploadKey('chat', filename);
    console.log(`💬 Uploading chat file: ${filename} -> ${key}`);
    return await this.uploadFile(key, buffer, contentType);
  }

  /**
   * Upload a profile picture
   * @returns Cloudinary URL
   */
  async uploadProfilePicture(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const key = this.generateUploadKey('profile', filename);
    console.log(`👤 Uploading profile picture: ${filename} -> ${key}`);
    return await this.uploadFile(key, buffer, contentType);
  }

  /**
   * Download a file and stream it to Express response
   * For Cloudinary, we redirect to the Cloudinary URL for direct download
   */
  async downloadToResponse(keyOrUrl: string, res: Response): Promise<void> {
    try {
      // If it's already a URL, redirect directly; otherwise construct the URL from the key
      if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
        console.log(`🔗 Redirecting to Cloudinary URL: ${keyOrUrl}`);
        res.redirect(keyOrUrl);
      } else {
        // Construct Cloudinary URL from the key
        const cloudinaryUrl = this.constructCloudinaryUrl(keyOrUrl);
        console.log(`🔗 Redirecting to constructed URL: ${cloudinaryUrl}`);
        res.redirect(cloudinaryUrl);
      }
    } catch (error) {
      console.error(`❌ Error streaming file to response:`, error);
      if (!res.headersSent) {
        if (error instanceof ObjectNotFoundError) {
          res.status(404).json({ error: 'File not found' });
        } else {
          res.status(500).json({ error: 'Error downloading file' });
        }
      }
    }
  }

  /**
   * List all files in a folder (Cloudinary folder)
   */
  async listFiles(prefix: string): Promise<string[]> {
    try {
      console.log(`📋 Listing files with prefix: ${prefix}`);
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: prefix,
        max_results: 500,
      });
      
      const files = result.resources.map((resource: any) => resource.secure_url);
      console.log(`✅ Found ${files.length} files`);
      return files;
    } catch (error) {
      console.error(`❌ Error listing files:`, error);
      return [];
    }
  }

  // Helper methods

  private getResourceType(contentType: string): 'image' | 'video' | 'raw' | 'auto' {
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.startsWith('video/')) return 'video';
    return 'raw';
  }

  private getFolderFromKey(key: string): string {
    const parts = key.split('/');
    return parts.length > 1 ? parts[0] : 'greenpay';
  }

  private getFormatFromContentType(contentType: string): string | undefined {
    const match = contentType.match(/\/(\w+)/);
    return match ? match[1] : undefined;
  }

  private extractPublicIdFromUrl(url: string): string {
    if (!url.includes('cloudinary.com')) {
      return url;
    }
    
    try {
      // Since all our uploads use "greenpay/" prefix, find where it starts
      const greenpayIndex = url.indexOf('/greenpay/');
      if (greenpayIndex !== -1) {
        // Extract from greenpay/ onwards, keeping the extension
        const publicIdWithSlash = url.substring(greenpayIndex + 1); // Skip the leading /
        const publicId = publicIdWithSlash.split('?')[0]; // Remove query params if any
        console.log(`📝 Extracted public_id from URL: ${publicId}`);
        return publicId;
      }
      
      // Fallback: parse URL the traditional way
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1) return url;
      
      // Find first part that looks like a path (not transformation params, not version)
      let startIndex = uploadIndex + 1;
      while (startIndex < parts.length) {
        const part = parts[startIndex];
        // Skip transformation parameters (contain commas or underscores with values)
        // Skip version tokens (start with 'v' followed by digits)
        if (part.includes(',') || part.includes('_') || /^v\d+$/.test(part)) {
          startIndex++;
        } else {
          break;
        }
      }
      
      const publicId = parts.slice(startIndex).join('/').split('?')[0]; // Remove query params
      console.log(`📝 Extracted public_id from URL: ${publicId}`);
      return publicId;
    } catch (error) {
      console.error(`❌ Error extracting public_id from URL:`, error);
      return url;
    }
  }

  private guessResourceTypeFromUrl(url: string): 'image' | 'video' | 'raw' {
    if (url.includes('/image/upload/')) return 'image';
    if (url.includes('/video/upload/')) return 'video';
    if (url.includes('/raw/upload/')) return 'raw';
    
    return this.guessResourceTypeFromKey(url);
  }

  private guessResourceTypeFromKey(keyOrUrl: string): 'image' | 'video' | 'raw' {
    const extension = keyOrUrl.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';
    if (['mp4', 'mov', 'avi', 'webm'].includes(extension || '')) return 'video';
    return 'raw';
  }

  /**
   * Construct a Cloudinary URL from a storage key (public_id)
   * @param key Storage key like "kyc/uuid.pdf" or "profile/uuid.jpg"
   * @returns Full Cloudinary URL
   */
  private constructCloudinaryUrl(key: string): string {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('CLOUDINARY_CLOUD_NAME not configured');
    }

    // Public ID matches what we uploaded: greenpay/{key}
    const publicId = `greenpay/${key}`;
    
    // Determine resource type from file extension
    const extension = key.split('.').pop()?.toLowerCase();
    let resourceType: 'image' | 'video' | 'raw' = 'raw'; // default for documents
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      resourceType = 'image';
    } else if (['mp4', 'mov', 'avi', 'webm'].includes(extension || '')) {
      resourceType = 'video';
    }

    // Use Cloudinary SDK to generate the URL (more reliable than manual construction)
    const url = cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
    });
    
    console.log(`🔗 Constructed Cloudinary URL: ${url} (from key: ${key})`);
    return url;
  }
}

export const cloudinaryStorage = new CloudinaryStorageService();
