import express from 'express';
import { upload, uploadFile } from '../controllers/uploadController';

const router = express.Router();

router.post('/', upload.single('file'), uploadFile);

export default router; 