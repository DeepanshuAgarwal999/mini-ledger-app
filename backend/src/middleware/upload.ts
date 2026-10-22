import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { badRequest } from '../lib/http-error.js';

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
};

export function imageUpload(uploadDir: string, maxBytes: number) {
  fs.mkdirSync(uploadDir, { recursive: true });

  return multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (_req, file, cb) => cb(null, `${randomUUID()}${IMAGE_EXTENSIONS[file.mimetype]}`),
    }),
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype in IMAGE_EXTENSIONS) cb(null, true);
      else cb(badRequest('Receipt must be a JPEG, PNG, WebP or HEIC image'));
    },
  });
}

export const uploadedFileName = (file?: Express.Multer.File) => (file ? path.basename(file.path) : null);
