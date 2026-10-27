import { Router } from 'express';
import { upload } from '../middleware/upload';
import { success, fail } from '../utils/response';
import { config } from '../config';
import path from 'path';
import fs from 'fs';

const router = Router();

// 上传文件
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return fail(res, '请选择文件', 400);

  const url = `${req.protocol}://${req.get('host')}/${config.upload.dir}/${req.file.filename}`;
  return success(res, {
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    url,
  });
});

// 删除文件
router.delete('/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(config.upload.dir, filename);

  if (!fs.existsSync(filePath)) return fail(res, '文件不存在', 404);
  fs.unlinkSync(filePath);
  return success(res, null, '删除成功');
});

export default router;
