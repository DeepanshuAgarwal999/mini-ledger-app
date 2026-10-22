import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from '../../lib/validate.js';
import { currentUser } from '../../middleware/auth.js';
import { imageUpload, uploadedFileName } from '../../middleware/upload.js';
import { createLoanSchema, listLoansQuery, loanIdParams } from './loans.schema.js';
import type { LoanService } from './loans.service.js';

interface LoanRoutesOptions {
  uploadDir: string;
  maxUploadBytes: number;
}

export function loanRoutes(service: LoanService, { uploadDir, maxUploadBytes }: LoanRoutesOptions): Router {
  const router = Router();
  const upload = imageUpload(uploadDir, maxUploadBytes);

  router.get('/summary', async (req, res) => {
    res.json(await service.summary(currentUser(req).id));
  });

  router.get('/', async (req, res) => {
    const { status } = parse(listLoansQuery, req.query);
    res.json({ loans: await service.list(currentUser(req).id, status) });
  });

  // Accepts JSON or multipart/form-data with an optional `receipt` image.
  router.post('/', upload.single('receipt'), async (req, res) => {
    const input = parse(createLoanSchema, req.body ?? {});
    const loan = await service.create(currentUser(req).id, input, uploadedFileName(req.file));
    res.status(201).json({ loan });
  });

  router.patch('/:id/repay', async (req, res) => {
    const { id } = parse(loanIdParams, req.params);
    res.json({ loan: await service.markRepaid(currentUser(req).id, id) });
  });

  router.delete('/:id', async (req, res) => {
    const { id } = parse(loanIdParams, req.params);
    const receipt = await service.remove(currentUser(req).id, id);
    if (receipt) await fs.unlink(path.join(uploadDir, receipt)).catch(() => {});
    res.status(204).end();
  });

  router.get('/:id/receipt', async (req, res) => {
    const { id } = parse(loanIdParams, req.params);
    const file = await service.receiptPath(currentUser(req).id, id);
    res.sendFile(file, { root: uploadDir });
  });

  return router;
}
