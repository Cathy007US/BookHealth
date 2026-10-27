import { Router } from 'express';
import { query, queryOne } from '../config/database';
import { success, fail, paginate } from '../utils/response';

const router = Router();

// 首页推荐套餐
router.get('/recommended', async (req, res) => {
  const list = await query<any>(
    `SELECT id, name, price, original_price, cover_image, suitable_crowd, description
     FROM packages WHERE is_recommended = TRUE AND status = 1 ORDER BY id DESC`
  );
  return success(res, list);
});

// 套餐分类
router.get('/categories/all', async (req, res) => {
  const list = await query<any>(
    'SELECT id, name, icon, sort_order FROM package_categories WHERE status = 1 ORDER BY sort_order'
  );
  return success(res, list);
});

// 套餐列表（分页）
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const categoryId = req.query.categoryId as string;
  const keyword = req.query.keyword as string;
  const institutionId = req.query.institutionId as string;

  let where = 'WHERE p.status = 1';
  const params: any[] = [];
  if (categoryId) {
    params.push(categoryId);
    where += ` AND p.category_id = $${params.length}`;
  }
  if (keyword) {
    params.push(`%${keyword}%`);
    where += ` AND p.name ILIKE $${params.length}`;
  }
  if (institutionId) {
    params.push(institutionId);
    where += ` AND EXISTS (SELECT 1 FROM package_institutions pi WHERE pi.package_id = p.id AND pi.institution_id = $${params.length})`;
  }

  const totalRow = await queryOne<any>(`SELECT COUNT(*)::int as total FROM packages p ${where}`, params);
  const total = totalRow?.total || 0;

  params.push(pageSize, (page - 1) * pageSize);
  const list = await query<any>(
    `SELECT p.id, p.name, p.price, p.original_price, p.cover_image, p.suitable_crowd, p.description,
            pc.name as category_name
     FROM packages p
     LEFT JOIN package_categories pc ON p.category_id = pc.id
     ${where} ORDER BY p.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return paginate(res, list, total, page, pageSize);
});

// 套餐详情
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const pkg = await queryOne<any>(
    `SELECT p.*, pc.name as category_name FROM packages p
     LEFT JOIN package_categories pc ON p.category_id = pc.id WHERE p.id = $1`,
    [id]
  );
  if (!pkg) return fail(res, '套餐不存在', 404);

  // 套餐包含的体检项
  const items = await query<any>(
    `SELECT ei.id, ei.name, ei.code, ei.description, ei.category FROM package_items pi
     INNER JOIN exam_items ei ON pi.exam_item_id = ei.id WHERE pi.package_id = $1`,
    [id]
  );

  // 适用机构
  const institutions = await query<any>(
    `SELECT i.id, i.name, i.logo, i.address, i.phone FROM package_institutions pin
     INNER JOIN institutions i ON pin.institution_id = i.id WHERE pin.package_id = $1 AND i.status = 1`,
    [id]
  );

  return success(res, { ...pkg, exam_items: items, institutions });
});

// 获取加项包列表
router.get('/:id/addons', async (req, res) => {
  const { id } = req.params;
  const list = await query<any>(
    `SELECT ap.*, array_agg(json_build_object('id', ei.id, 'name', ei.name, 'description', ei.description)) as items
     FROM addon_packages ap
     LEFT JOIN addon_package_items api ON ap.id = api.addon_package_id
     LEFT JOIN exam_items ei ON api.exam_item_id = ei.id
     WHERE ap.institution_id IN (SELECT institution_id FROM package_institutions WHERE package_id = $1)
     AND ap.status = 1
     GROUP BY ap.id`,
    [id]
  );
  return success(res, list);
});

export default router;
