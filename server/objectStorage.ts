import { Client } from "@replit/object-storage";
import { Response } from "express";
import { randomUUID } from "crypto";

// Initialize Replit Object Storage client with the specific bucket
const BUCKET_ID = "replit-objstore-6f67444f-b771-4c8f-bea8-fd3ebf96c798";
export const objectStorageClient = new Client({ bucketId: BUCKET_ID });

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  private client: Client;

  constructor() {
    this.client = objectStorageClient;
    console.log(`✅ Object Storage initialized with bucket ID: ${BUCKET_ID}`);
  }

  /**
   * Upload a file to object storage
   * @param key The storage key/path for the file
   * @param buffer The file buffer to upload
   * @param contentType The MIME type of the file
   * @returns The storage key where the file was saved
   */
  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    try {
      console.log(`📤 Uploading file to object storage: ${key} (${contentType})`);
      // Replit Object Storage doesn't support metadata, so we just upload the file
      // Content type will be determined from file extension when downloading
      await this.client.uploadFromBytes(key, buffer);
      console.log(`✅ File uploaded successfully: ${key}`);
      return key;
    } catch (error) {
      console.error(`❌ Error uploading file to object storage:`, error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download a file from object storage
   * @param key The storage key/path of the file
   * @returns The file buffer and metadata
   */
  async downloadFile(key: string): Promise<{ buffer: Buffer; contentType?: string }> {
    try {
      console.log(`📥 Downloading file from object storage: ${key}`);
      const exists = await this.client.exists(key);
      if (!exists) {
        throw new ObjectNotFoundError();
      }

      const buffer = await this.client.downloadAsBytes(key);
      
      // Determine content type from file extension
      const extension = key.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
        case 'pdf':
          contentType = 'application/pdf';
          break;
        case 'txt':
          contentType = 'text/plain';
          break;
        case 'doc':
          contentType = 'application/msword';
          break;
        case 'docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
      }
      
      console.log(`✅ File downloaded successfully: ${key} (${contentType})`);
      return {
        buffer: Buffer.from(buffer),
        contentType,
      };
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        throw error;
      }
      console.error(`❌ Error downloading file from object storage:`, error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from object storage
   * @param key The storage key/path of the file
   */
  async deleteFile(key: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting file from object storage: ${key}`);
      await this.client.delete(key);
      console.log(`✅ File deleted successfully: ${key}`);
    } catch (error) {
      console.error(`❌ Error deleting file from object storage:`, error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a file exists in object storage
   * @param key The storage key/path of the file
   * @returns True if the file exists, false otherwise
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      return await this.client.exists(key);
    } catch (error) {
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
   * @returns Full URL path to access the document via /objects/ endpoint
   */
  async uploadKycDocument(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const key = this.generateUploadKey('kyc', filename);
    console.log(`📋 Uploading KYC document: ${filename} -> ${key}`);
    await this.uploadFile(key, buffer, contentType);
    return `/objects/${key}`;
  }

  /**
   * Upload a chat file
   * @returns Full URL path to access the file via /objects/ endpoint
   */
  async uploadChatFile(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const key = this.generateUploadKey('chat', filename);
    console.log(`💬 Uploading chat file: ${filename} -> ${key}`);
    await this.uploadFile(key, buffer, contentType);
    return `/objects/${key}`;
  }

  /**
   * Upload a profile picture
   * @returns Full URL path to access the picture via /objects/ endpoint
   */
  async uploadProfilePicture(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const key = this.generateUploadKey('profile', filename);
    console.log(`👤 Uploading profile picture: ${filename} -> ${key}`);
    await this.uploadFile(key, buffer, contentType);
    return `/objects/${key}`;
  }

  /**
   * Download a file and stream it to Express response
   */
  async downloadToResponse(key: string, res: Response): Promise<void> {
    try {
      const { buffer, contentType } = await this.downloadFile(key);
      
      res.set({
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
      });

      res.send(buffer);
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
   * List all files in a folder
   */
  async listFiles(prefix: string): Promise<string[]> {
    try {
      console.log(`📋 Listing files with prefix: ${prefix}`);
      const files = await this.client.list({ prefix });
      console.log(`✅ Found ${files.length} files`);
      return files;
    } catch (error) {
      console.error(`❌ Error listing files:`, error);
      return [];
    }
  }
}

export const objectStorage = new ObjectStorageService();
