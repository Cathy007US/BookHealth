import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query, queryOne } from '../config/database';
import { config } from '../config';
import { success, fail, paginate } from '../utils/response';
import { adminAuthRequired, adminSuperOnly } from '../middleware/auth';

const router = Router();

// ========== 管理员登录 ==========
router.post('/login', async (req, res) => {
  const schema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, '参数错误', 400);

  const admin = await queryOne<any>(
    'SELECT * FROM admins WHERE username = $1 AND status = 1',
    [parsed.data.username]
  );
  if (!admin) return fail(res, '管理员不存在', 404);

  const ok = await bcrypt.compare(parsed.data.password, admin.password_hash);
  if (!ok) return fail(res, '密码错误', 401);

  await query('UPDATE admins SET last_login_at = NOW() WHERE id = $1', [admin.id]);

  const token = jwt.sign(
    { adminId: admin.id, username: admin.username, role: admin.role },
    config.adminJwt.secret,
    { expiresIn: config.adminJwt.expiresIn as any }
  );

  return success(res, {
    token,
    admin: { id: admin.id, username: admin.username, real_name: admin.real_name, role: admin.role },
  });
});

// ========== 管理员管理 ==========
router.get('/admins', adminAuthRequired, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const totalRow = await queryOne<any>('SELECT COUNT(*)::int as total FROM admins');
  const total = totalRow?.total || 0;
  const list = await query<any>(
    'SELECT id, username, real_name, role, status, last_login_at, created_at FROM admins ORDER BY id LIMIT $1 OFFSET $2',
    [pageSize, (page - 1) * pageSize]
  );
  return paginate(res, list, total, page, pageSize);
});

router.post('/admins', adminAuthRequired, adminSuperOnly, async (req, res) => {
  const schema = z.object({
    username: z.string().min(1).max(50),
    password: z.string().min(6),
    real_name: z.string().optional(),
    role: z.enum(['admin', 'editor']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, '参数错误', 400);

  const hash = await bcrypt.hash(parsed.data.password, 10);
  const admin = await queryOne<any>(
    'INSERT INTO admins (username, password_hash, real_name, role) VALUES ($1, $2, $3, $4) RETURNING id, username, real_name, role',
    [parsed.data.username, hash, parsed.data.real_name || null, parsed.data.role]
  );
  return success(res, admin, '添加成功');
});

router.put('/admins/:id', adminAuthRequired, adminSuperOnly, async (req, res) => {
  const { id } = req.params;
  const { real_name, role, status, password } = req.body as any;

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await query(
      'UPDATE admins SET password_hash = $1, real_name = $2, role = $3, status = $4, updated_at = NOW() WHERE id = $5',
      [hash, real_name, role, status ?? 1, id]
    );
  } else {
    await query(
      'UPDATE admins SET real_name = $1, role = $2, status = $3, updated_at = NOW() WHERE id = $4',
      [real_name, role, status ?? 1, id]
    );
  }
  return success(res, null, '更新成功');
});

router.delete('/admins', adminAuthRequired, adminSuperOnly, async (req, res) => {
  const { ids } = req.body as { ids: number[] };
  if (!ids || !ids.length) return fail(res, '参数错误', 400);
  await query('DELETE FROM admins WHERE id = ANY($1::int[])', [ids]);
  return success(res, null, '删除成功');
});

// ========== 体检机构管理 ==========
router.get('/institutions', adminAuthRequired, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const totalRow = await queryOne<any>('SELECT COUNT(*)::int as total FROM institutions');
  const total = totalRow?.total || 0;
  const list = await query<any>(
    `SELECT i.*, c.name as city_name FROM institutions i
     LEFT JOIN cities c ON i.city_id = c.id ORDER BY i.id DESC LIMIT $1 OFFSET $2`,
    [pageSize, (page - 1) * pageSize]
  );
  return paginate(res, list, total, page, pageSize);
});

router.post('/institutions', adminAuthRequired, async (req, res) => {
  const { name, parent_id, logo, description, address, phone, city_id, longitude, latitude, images, is_recommended, status } = req.body as any;
  const inst = await queryOne<any>(
    `INSERT INTO institutions (name, parent_id, logo, description, address, phone, city_id, longitude, latitude, images, is_recommended, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [name, parent_id || null, logo || null, description || null, address || null, phone || null,
     city_id || null, longitude || null, latitude || null, images || null, is_recommended || false, status ?? 1]
  );
  return success(res, inst, '添加成功');
});

router.put('/institutions/:id', adminAuthRequired, async (req, res) => {
  const { id } = req.params;
  const { name, parent_id, logo, description, address, phone, city_id, longitude, latitude, images, is_recommended, status } = req.body as any;
  await query(
    `UPDATE institutions SET name=$1, parent_id=$2, logo=$3, description=$4, address=$5, phone=$6,
     city_id=$7, longitude=$8, latitude=$9, images=$10, is_recommended=$11, status=$12, updated_at=NOW() WHERE id=$13`,
    [name, parent_id || null, logo, description, address, phone, city_id, longitude, latitude, images, is_recommended ?? false, status ?? 1, id]
  );
  return success(res, null, '更新成功');
});

router.delete('/institutions', adminAuthRequired, async (req, res) => {
  const { ids } = req.body as { ids: number[] };
  await query('DELETE FROM institutions WHERE id = ANY($1::int[])', [ids]);
  return success(res, null, '删除成功');
});

router.put('/institutions/:id/status', adminAuthRequired, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: number };
  await query('UPDATE institutions SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  return success(res, null, '状态已更新');
});

// ========== 体检项管理 ==========
router.get('/exam-items', adminAuthRequired, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const totalRow = await queryOne<any>('SELECT COUNT(*)::int as total FROM exam_items');
  const total = totalRow?.total || 0;
  const list = await query<any>(
    'SELECT * FROM exam_items ORDER BY id DESC LIMIT $1 OFFSET $2',
    [pageSize, (page - 1) * pageSize]
  );
  return paginate(res, list, total, page, pageSize);
});

router.post('/exam-items', adminAuthRequired, async (req, res) => {
  const { name, code, description, price, category, status } = req.body as any;
  const item = await queryOne<any>(
    'INSERT INTO exam_items (name, code, description, price, category, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, code || null, description || null, price || 0, category || null, status ?? 1]
  );
  return success(res, item, '添加成功');
});

router.put('/exam-items/:id', adminAuthRequired, async (req, res) => {
  const { id } = req.params;
  const { name, code, description, price, category, status } = req.body as any;
  await query(
    'UPDATE exam_items SET name=$1, code=$2, description=$3, price=$4, category=$5, status=$6, updated_at=NOW() WHERE id=$7',
    [name, code, description, price, category, status ?? 1, id]
  );
  return success(res, null, '更新成功');
});

router.delete('/exam-items', adminAuthRequired, async (req, res) => {
  const { ids } = req.body as { ids: number[] };
  await query('DELETE FROM exam_items WHERE id = ANY($1::int[])', [ids]);
  return success(res, null, '删除成功');
});

router.put('/exam-items/:id/status', adminAuthRequired, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: number };
  await query('UPDATE exam_items SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  return success(res, null, '状态已更新');
});

// ========== 套餐管理 ==========
router.get('/packages', adminAuthRequired, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const totalRow = await queryOne<any>('SELECT COUNT(*)::int as total FROM packages');
  const total = totalRow?.total || 0;
  const list = await query<any>(
    `SELECT p.*, pc.name as category_name FROM packages p
     LEFT JOIN package_categories pc ON p.category_id = pc.id ORDER BY p.id DESC LIMIT $1 OFFSET $2`,
    [pageSize, (page - 1) * pageSize]
  );
  return paginate(res, list, total, page, pageSize);
});

router.post('/packages', adminAuthRequired, async (req, res) => {
  const { name, category_id, description, price, original_price, cover_image, detail_images, content, suitable_crowd, is_recommended, status, exam_item_ids, institution_ids } = req.body as any;
  const pkg = await queryOne<any>(
    `INSERT INTO packages (name, category_id, description, price, original_price, cover_image, detail_images, content, suitable_crowd, is_recommended, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [name, category_id || null, description || null, price, original_price || null,
     cover_image || null, detail_images || null, content || null, suitable_crowd || null,
     is_recommended || false, status ?? 1]
  );

  if (exam_item_ids && exam_item_ids.length) {
    for (const itemId of exam_item_ids) {
      await query('INSERT INTO package_items (package_id, exam_item_id) VALUES ($1, $2)', [pkg.id, itemId]);
    }
  }
  if (institution_ids && institution_ids.length) {
    for (const instId of institution_ids) {
      await query('INSERT INTO package_institutions (package_id, institution_id) VALUES ($1, $2)', [pkg.id, instId]);
    }
  }

  return success(res, pkg, '添加成功');
});

router.put('/packages/:id', adminAuthRequired, async (req, res) => {
  const { id } = req.params;
  const { name, category_id, description, price, original_price, cover_image, detail_images, content, suitable_crowd, is_recommended, status } = req.body as any;
  await query(
    `UPDATE packages SET name=$1, category_id=$2, description=$3, price=$4, original_price=$5,
     cover_image=$6, detail_images=$7, content=$8, suitable_crowd=$9, is_recommended=$10, status=$11, updated_at=NOW() WHERE id=$12`,
    [name, category_id, description, price, original_price, cover_image, detail_images,
     content, suitable_crowd, is_recommended ?? false, status ?? 1, id]
  );
  return success(res, null, '更新成功');
});

router.delete('/packages', adminAuthRequired, async (req, res) => {
  const { ids } = req.body as { ids: number[] };
  await query('DELETE FROM packages WHERE id = ANY($1::int[])', [ids]);
  return success(res, null, '删除成功');
});

router.put('/packages/:id/status', adminAuthRequired, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: number };
  await query('UPDATE packages SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  return success(res, null, '状态已更新');
});

// ========== 标准指标管理 ==========
router.get('/metrics', adminAuthRequired, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const totalRow = await queryOne<any>('SELECT COUNT(*)::int as total FROM standard_metrics');
  const total = totalRow?.total || 0;
  const list = await query<any>(
    'SELECT * FROM standard_metrics ORDER BY id DESC LIMIT $1 OFFSET $2',
    [pageSize, (page - 1) * pageSize]
  );
  return paginate(res, list, total, page, pageSize);
});

router.post('/metrics', adminAuthRequired, async (req, res) => {
  const { name, code, unit, reference_range, is_compare, status } = req.body as any;
  const metric = await queryOne<any>(
    'INSERT INTO standard_metrics (name, code, unit, reference_range, is_compare, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [name, code || null, unit || null, reference_range || null, is_compare ?? true, status ?? 1]
  );
  return success(res, metric, '添加成功');
});

router.put('/metrics/:id', adminAuthRequired, async (req, res) => {
  const { id } = req.params;
  const { name, code, unit, reference_range, is_compare, status } = req.body as any;
  await query(
    'UPDATE standard_metrics SET name=$1, code=$2, unit=$3, reference_range=$4, is_compare=$5, status=$6 WHERE id=$7',
    [name, code, unit, reference_range, is_compare ?? true, status ?? 1, id]
  );
  return success(res, null, '更新成功');
});

router.delete('/metrics', adminAuthRequired, async (req, res) => {
  const { ids } = req.body as { ids: number[] };
  await query('DELETE FROM standard_metrics WHERE id = ANY($1::int[])', [ids]);
  return success(res, null, '删除成功');
});

// ========== 预约信息查询 ==========
router.get('/orders', adminAuthRequired, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const status = req.query.status as string;
  const keyword = req.query.keyword as string;

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (status !== undefined && status !== '') {
    params.push(status);
    where += ` AND o.status = $${params.length}`;
  }
  if (keyword) {
    params.push(`%${keyword}%`);
    where += ` AND (o.order_no ILIKE $${params.length} OR e.name ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
  }

  const totalRow = await queryOne<any>(
    `SELECT COUNT(*)::int as total FROM orders o
     LEFT JOIN examinees e ON o.examinee_id = e.id
     LEFT JOIN users u ON o.user_id = u.id ${where}`,
    params
  );
  const total = totalRow?.total || 0;

  params.push(pageSize, (page - 1) * pageSize);
  const list = await query<any>(
    `SELECT o.*, p.name as package_name, i.name as institution_name,
            e.name as examinee_name, u.phone as user_phone
     FROM orders o
     LEFT JOIN packages p ON o.package_id = p.id
     LEFT JOIN institutions i ON o.institution_id = i.id
     LEFT JOIN examinees e ON o.examinee_id = e.id
     LEFT JOIN users u ON o.user_id = u.id
     ${where} ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return paginate(res, list, total, page, pageSize);
});

router.put('/orders/:id/status', adminAuthRequired, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: number };
  await query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  return success(res, null, '订单状态已更新');
});

router.put('/orders/:id/exam-date', adminAuthRequired, async (req, res) => {
  const { id } = req.params;
  const { exam_date, exam_time } = req.body as { exam_date: string; exam_time?: string };
  await query('UPDATE orders SET exam_date = $1, exam_time = $2, updated_at = NOW() WHERE id = $3', [exam_date, exam_time || null, id]);
  return success(res, null, '体检时间已更新');
});

// ========== 左侧菜单 ==========
router.get('/menu', adminAuthRequired, (req, res) => {
  const menu = [
    {
      key: 'dashboard', label: '工作台', icon: 'dashboard', path: '/admin/dashboard',
    },
    {
      key: 'institution', label: '体检机构管理', icon: 'hospital', path: '/admin/institutions',
    },
    {
      key: 'exam-item', label: '体检项管理', icon: 'list', path: '/admin/exam-items',
    },
    {
      key: 'package', label: '套餐管理', icon: 'shopping', path: '/admin/packages',
    },
    {
      key: 'metric', label: '标准指标管理', icon: 'bar-chart', path: '/admin/metrics',
    },
    {
      key: 'order', label: '预约信息查询', icon: 'calendar', path: '/admin/orders',
    },
    {
      key: 'admin', label: '管理员管理', icon: 'user', path: '/admin/admins',
    },
  ];
  return success(res, menu);
});

export default router;
