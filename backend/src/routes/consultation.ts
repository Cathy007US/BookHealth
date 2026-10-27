import { Router } from 'express';
import { query, queryOne } from '../config/database';
import { success, fail } from '../utils/response';
import { authRequired } from '../middleware/auth';

const router = Router();

// 医生列表
router.get('/doctors', async (req, res) => {
  const list = await query<any>(
    'SELECT id, name, title, hospital, avatar, introduction FROM doctors WHERE status = 1 ORDER BY id'
  );
  return success(res, list);
});

// 我的咨询列表
router.get('/consultations', authRequired, async (req, res) => {
  const list = await query<any>(
    `SELECT c.*, d.name as doctor_name, d.avatar as doctor_avatar, d.title as doctor_title
     FROM consultations c
     LEFT JOIN doctors d ON c.doctor_id = d.id
     WHERE c.user_id = $1 ORDER BY c.created_at DESC`,
    [req.user!.userId]
  );
  return success(res, list);
});

// 创建咨询
router.post('/consultations', authRequired, async (req, res) => {
  const { doctor_id, report_id, content } = req.body as {
    doctor_id: number;
    report_id?: number;
    content: string;
  };
  if (!doctor_id || !content) return fail(res, '参数错误', 400);

  const consultation = await queryOne<any>(
    `INSERT INTO consultations (user_id, doctor_id, report_id, content, status)
     VALUES ($1, $2, $3, $4, 0) RETURNING *`,
    [req.user!.userId, doctor_id, report_id || null, content]
  );
  return success(res, consultation, '咨询已提交');
});

export default router;
