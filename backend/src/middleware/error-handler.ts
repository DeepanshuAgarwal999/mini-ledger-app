import type { ErrorRequestHandler, RequestHandler } from 'express';
import fs from 'node:fs/promises';
import multer from 'multer';
import { HttpError } from '../lib/http-error.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = async (err, req, res, _next) => {
  // A request that failed after multer stored its file should not leave an orphan on disk.
  if (req.file) await fs.unlink(req.file.path).catch(() => {});

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Receipt image is too large (max 5 MB)' : err.message;
    res.status(400).json({ error: message });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Malformed JSON body' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
