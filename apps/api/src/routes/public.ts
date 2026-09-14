import { Router, Request, Response, NextFunction } from 'express';
import { validateProjectAndOrigin } from '../middleware/originCheck.js';
import { publicTicketRateLimiter } from '../middleware/rateLimiter.js';
import { generateUploadSignature } from '../services/cloudinaryService.js';
import {
  createTicketFromPublicSubmission,
  getPublicTicketStatus,
} from '../services/ticketService.js';
import { CreateTicketPublicSchema } from '@support-hub/shared-types';

import multer from 'multer';
import { uploadToGCS, getFileStreamFromGCS } from '../services/gcsStorageService.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

export const publicRouter = Router();

// 1. Get Project Schema for Widget Rendering
publicRouter.get(
  '/projects/:projectKey/schema',
  validateProjectAndOrigin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = req.project!;
      res.json({
        data: {
          projectKey: project.projectKey,
          name: project.name,
          formFields: project.formFields.sort((a, b) => a.order - b.order),
          widgetSettings: project.widgetSettings,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// 2. Direct File Upload to Google Cloud Storage (Bucket: support-ticket-management)
publicRouter.post(
  '/projects/:projectKey/upload',
  validateProjectAndOrigin,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file provided for upload' } });
      }

      const project = req.project!;
      const result = await uploadToGCS(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        project.projectKey
      );

      res.json({
        data: {
          fileUrl: result.fileUrl,
          fileName: result.fileName,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// 3. Cloudinary Upload Signature (Kept for backward compatibility)
publicRouter.post(
  '/projects/:projectKey/upload-signature',
  validateProjectAndOrigin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = req.project!;
      const signaturePayload = generateUploadSignature(project.projectKey);
      res.json({ data: signaturePayload });
    } catch (error) {
      next(error);
    }
  }
);

// 4. Submit New Ticket from Widget
publicRouter.post(
  '/projects/:projectKey/tickets',
  publicTicketRateLimiter,
  validateProjectAndOrigin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = req.project!;
      const { formResponses } = CreateTicketPublicSchema.parse(req.body);

      const { ticket, statusUrl } = await createTicketFromPublicSubmission(project, formResponses);

      res.status(201).json({
        data: {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          statusToken: ticket.statusToken,
          statusUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// 5. Public End-user Status Page Endpoint
publicRouter.get('/status/:statusToken', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statusData = await getPublicTicketStatus(req.params.statusToken);
    res.json({ data: statusData });
  } catch (error) {
    next(error);
  }
});

// 6. Secure Attachment Streaming Endpoint (Streams from Private GCS Bucket)
publicRouter.get('/attachments/*', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filePath = req.params[0];
    if (!filePath) {
      return res.status(400).json({ error: { code: 'INVALID_PATH', message: 'Missing file path' } });
    }

    const fileData = await getFileStreamFromGCS(filePath);
    if (!fileData) {
      return res.status(404).json({ error: { code: 'FILE_NOT_FOUND', message: 'File not found in storage' } });
    }

    res.setHeader('Content-Type', fileData.contentType);
    if (fileData.contentLength) {
      res.setHeader('Content-Length', fileData.contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');

    fileData.stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// 7. Mock Upload Endpoint (Fallback for Local Dev)
publicRouter.post('/mock-upload', (req: Request, res: Response) => {
  res.json({
    secure_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80',
    public_id: `mock_upload_${Date.now()}`,
  });
});
