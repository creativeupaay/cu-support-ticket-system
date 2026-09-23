import { Storage } from '@google-cloud/storage';
import { logger } from '../config/logger.js';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

const bucketName = process.env.GCS_BUCKET_NAME || 'support-ticket-management';
const projectId = process.env.GCS_PROJECT_ID || 'cu-internal-tools';

let storageClient: Storage | null = null;

export function getGCSStorage(): Storage {
  if (!storageClient) {
    storageClient = new Storage({
      projectId,
    });
  }
  return storageClient;
}

export interface UploadResult {
  fileUrl: string;
  filePath: string;
  fileName: string;
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.pdf':
      return 'application/pdf';
    case '.txt':
      return 'text/plain';
    case '.json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Upload an attachment buffer to the private GCS bucket + local disk cache
 */
export async function uploadToGCS(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  projectKey: string
): Promise<UploadResult> {
  const sanitized = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const fileBasename = `${timestamp}_${sanitized}`;
  const destination = `attachments/${projectKey}/${fileBasename}`;

  // 1. Always save to local disk cache for instant local preview & resilience
  try {
    const localUploadsDir = path.resolve(process.cwd(), 'uploads', 'attachments', projectKey);
    await fs.promises.mkdir(localUploadsDir, { recursive: true });
    const localFilePath = path.join(localUploadsDir, fileBasename);
    await fs.promises.writeFile(localFilePath, fileBuffer);
    logger.info({ localFilePath }, 'Attachment saved to local disk cache');
  } catch (fsErr) {
    logger.warn({ fsErr }, 'Could not cache attachment to local filesystem');
  }

  // 2. Upload to Google Cloud Storage
  try {
    const storage = getGCSStorage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(destination);

    await file.save(fileBuffer, {
      contentType: mimeType || getMimeType(originalName),
      resumable: false,
      metadata: {
        projectKey,
        originalName,
      },
    });

    logger.info({ destination, bucketName }, 'File successfully uploaded to Google Cloud Storage bucket');
  } catch (error: any) {
    logger.warn({ error: error?.message || error, destination }, 'GCS upload warning, using local proxy storage');
  }

  // Consistent proxy URL through backend attachment endpoint
  const fileUrl = `/api/public/v1/attachments/${destination}`;

  return {
    fileUrl,
    filePath: destination,
    fileName: originalName,
  };
}

/**
 * Stream a private file from GCS bucket or local disk cache for client/dashboard preview
 */
export async function getFileStreamFromGCS(filePath: string): Promise<{
  stream: Readable;
  contentType: string;
  contentLength?: number | string;
} | null> {
  // Prevent directory traversal attacks
  if (filePath.includes('..') || filePath.includes('\\')) {
    logger.warn({ filePath }, 'Blocked potential path traversal attempt');
    return null;
  }

  const cleanPath = filePath.replace(/^\/+/, '');
  // Normalize candidate file paths
  const candidates = [
    cleanPath,
    cleanPath.startsWith('attachments/') ? cleanPath : `attachments/${cleanPath}`,
    cleanPath.replace(/^attachments\//, ''),
  ];

  // 1. Try Google Cloud Storage
  try {
    const storage = getGCSStorage();
    const bucket = storage.bucket(bucketName);

    for (const cand of candidates) {
      const file = bucket.file(cand);
      const [exists] = await file.exists().catch(() => [false]);
      if (exists) {
        const [metadata] = await file.getMetadata();
        const stream = file.createReadStream();
        return {
          stream,
          contentType: metadata.contentType || getMimeType(cand),
          contentLength: metadata.size,
        };
      }
    }
  } catch (err: any) {
    logger.warn({ err: err?.message || err, filePath }, 'GCS bucket read skipped, checking local disk cache');
  }

  // 2. Check local disk cache (under ./uploads/...)
  const allowedBase = path.resolve(process.cwd());
  for (const cand of candidates) {
    const localCandidates = [
      path.resolve(process.cwd(), 'uploads', cand),
      path.resolve(process.cwd(), cand),
      path.resolve(process.cwd(), 'uploads', 'attachments', path.basename(cand)),
    ];

    for (const localPath of localCandidates) {
      if (localPath.startsWith(allowedBase) && fs.existsSync(localPath)) {
        const stats = fs.statSync(localPath);
        if (stats.isFile()) {
          const stream = fs.createReadStream(localPath);
          return {
            stream,
            contentType: getMimeType(localPath),
            contentLength: stats.size,
          };
        }
      }
    }
  }

  logger.warn({ filePath }, 'File not found in GCS bucket or local disk cache');
  return null;
}
