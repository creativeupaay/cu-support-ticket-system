import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../config/logger.js';

export interface CloudinarySignatureResult {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
  uploadUrl: string;
}

export function generateUploadSignature(projectKey: string): CloudinarySignatureResult {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `support-hub/${projectKey}`;

  if (!cloudName || !apiKey || !apiSecret) {
    logger.info({ projectKey }, 'Cloudinary env vars not set, generating mock signature payload');
    const mockSig = crypto.randomBytes(16).toString('hex');
    return {
      signature: mockSig,
      timestamp,
      folder,
      apiKey: apiKey || 'mock_api_key',
      cloudName: cloudName || 'mock_cloud',
      uploadUrl: `http://localhost:${process.env.PORT || 5001}/api/public/v1/mock-upload`,
    };
  }

  // Use Cloudinary SDK utility to generate valid signature
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    apiSecret
  );

  return {
    signature,
    timestamp,
    folder,
    apiKey,
    cloudName,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
  };
}
