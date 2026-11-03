import { Router } from 'express';
import { query, queryOne } from '../config/database';
import { success, fail, paginate } from '../utils/response';
import { authRequired } from '../middleware/auth';

const router = Router();

// 我的报告列表
router.get('/', authRequired, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;

  const totalRow = await queryOne<any>(
    'SELECT COUNT(*)::int as total FROM reports WHERE user_id = $1',
    [req.user!.userId]
  );
  const total = totalRow?.total || 0;

  const list = await query<any>(
    `SELECT r.id, r.report_no, r.exam_date, r.report_date, r.status, r.summary,
            e.name as examinee_name, i.name as institution_name, r.pdf_url
     FROM reports r
     LEFT JOIN examinees e ON r.examinee_id = e.id
     LEFT JOIN institutions i ON r.institution_id = i.id
     WHERE r.user_id = $1 ORDER BY r.report_date DESC NULLS LAST LIMIT $2 OFFSET $3`,
    [req.user!.userId, pageSize, (page - 1) * pageSize]
  );
  return paginate(res, list, total, page, pageSize);
});

// 报告详情（含项目明细）
router.get('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  const report = await queryOne<any>(
    `SELECT r.*, e.name as examinee_name, e.gender as examinee_gender, e.birthday as examinee_birthday,
            i.name as institution_name, i.address as institution_address
     FROM reports r
     LEFT JOIN examinees e ON r.examinee_id = e.id
     LEFT JOIN institutions i ON r.institution_id = i.id
     WHERE r.id = $1 AND r.user_id = $2`,
    [id, req.user!.userId]
  );
  if (!report) return fail(res, 'Report not found', 404);

  // Report item details
  const items = await query<any>(
    `SELECT ri.*, ei.category FROM report_items ri
     LEFT JOIN exam_items ei ON ri.exam_item_id = ei.id
     WHERE ri.report_id = $1 ORDER BY ri.sort_order`,
    [id]
  );

  return success(res, { ...report, items });
});

// Send report to email (mock)
router.post('/:id/send-email', authRequired, async (req, res) => {
  const { id } = req.params;
  const { email } = req.body as { email: string };
  if (!email) return fail(res, 'Email cannot be empty', 400);

  const report = await queryOne<any>(
    'SELECT pdf_url FROM reports WHERE id = $1 AND user_id = $2',
    [id, req.user!.userId]
  );
  if (!report) return fail(res, 'Report not found', 404);

  // Mock email send
  console.log(`[Email] Send report ${id} to ${email}`);
  return success(res, null, 'Sent to email');
});

export default router;
