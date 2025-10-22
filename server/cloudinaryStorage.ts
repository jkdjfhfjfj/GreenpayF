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
   * @param key The storage key/path for the file (used as public_id)
   * @param buffer The file buffer to upload
   * @param contentType The MIME type of the file
   * @returns The Cloudinary public URL
   */
  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    try {
      console.log(`📤 Uploading file to Cloudinary: ${key} (${contentType})`);

      return new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: key,
            resource_type: this.getResourceType(contentType),
            folder: this.getFolderFromKey(key),
            format: this.getFormatFromContentType(contentType),
          },
          (error, result) => {
            if (error) {
              console.error(`❌ Cloudinary upload error:`, error);
              reject(new Error(`Failed to upload file: ${error.message}`));
            } else if (result) {
              console.log(`✅ File uploaded successfully to Cloudinary: ${result.secure_url}`);
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
   * @param key The storage key/path of the file (public_id)
   * @returns The file buffer and metadata
   */
  async downloadFile(key: string): Promise<{ buffer: Buffer; contentType?: string }> {
    try {
      console.log(`📥 Downloading file from Cloudinary: ${key}`);
      
      const response = await fetch(key);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new ObjectNotFoundError();
        }
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      console.log(`✅ File downloaded successfully: ${key} (${contentType})`);
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
   * @param key The Cloudinary URL or public_id
   */
  async deleteFile(key: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting file from Cloudinary: ${key}`);
      
      const publicId = this.extractPublicIdFromUrl(key);
      const resourceType = this.guessResourceTypeFromUrl(key);
      
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`✅ File deleted successfully: ${key}`);
    } catch (error) {
      console.error(`❌ Error deleting file from Cloudinary:`, error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a file exists in Cloudinary
   * @param key The Cloudinary URL or public_id
   * @returns True if the file exists, false otherwise
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const publicId = this.extractPublicIdFromUrl(key);
      const resourceType = this.guessResourceTypeFromUrl(key);
      
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
   * For Cloudinary, we can just redirect to the URL or proxy the download
   */
  async downloadToResponse(key: string, res: Response): Promise<void> {
    try {
      if (key.startsWith('http://') || key.startsWith('https://')) {
        res.redirect(key);
      } else {
        const { buffer, contentType } = await this.downloadFile(key);
        
        res.set({
          'Content-Type': contentType || 'application/octet-stream',
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'private, max-age=3600',
        });

        res.send(buffer);
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
    
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return url;
    
    const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
    const publicId = pathAfterUpload.split('.')[0];
    return publicId;
  }

  private guessResourceTypeFromUrl(url: string): 'image' | 'video' | 'raw' {
    if (url.includes('/image/upload/')) return 'image';
    if (url.includes('/video/upload/')) return 'video';
    if (url.includes('/raw/upload/')) return 'raw';
    
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';
    if (['mp4', 'mov', 'avi', 'webm'].includes(extension || '')) return 'video';
    return 'raw';
  }
}

export const cloudinaryStorage = new CloudinaryStorageService();
