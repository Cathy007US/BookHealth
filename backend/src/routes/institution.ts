import { Router } from 'express';
import { query, queryOne } from '../config/database';
import { success, fail, paginate } from '../utils/response';

const router = Router();

// 首页推荐机构
router.get('/recommended', async (req, res) => {
  const list = await query<any>(
    `SELECT id, name, logo, description, address, images FROM institutions WHERE is_recommended = TRUE AND status = 1 ORDER BY id DESC`
  );
  return success(res, list);
});

// 机构列表（分页）
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const cityId = req.query.cityId as string;
  const keyword = req.query.keyword as string;

  let where = 'WHERE status = 1';
  const params: any[] = [];
  if (cityId) {
    params.push(cityId);
    where += ` AND city_id = $${params.length}`;
  }
  if (keyword) {
    params.push(`%${keyword}%`);
    where += ` AND name ILIKE $${params.length}`;
  }

  const totalRow = await queryOne<any>(`SELECT COUNT(*)::int as total FROM institutions ${where}`, params);
  const total = totalRow?.total || 0;

  params.push(pageSize, (page - 1) * pageSize);
  const list = await query<any>(
    `SELECT id, name, logo, description, address, phone, images, city_id FROM institutions ${where} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return paginate(res, list, total, page, pageSize);
});

// 机构详情
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const inst = await queryOne<any>(
    `SELECT i.*, c.name as city_name, p.name as province_name
     FROM institutions i
     LEFT JOIN cities c ON i.city_id = c.id
     LEFT JOIN provinces p ON c.province_id = p.id
     WHERE i.id = $1`,
    [id]
  );
  if (!inst) return fail(res, 'Institution not found', 404);

  // Get packages for this institution
  const packages = await query<any>(
    `SELECT p.id, p.name, p.price, p.original_price, p.cover_image, p.suitable_crowd
     FROM packages p
     INNER JOIN package_institutions pi ON p.id = pi.package_id
     WHERE pi.institution_id = $1 AND p.status = 1`,
    [id]
  );

  return success(res, { ...inst, packages });
});

// 获取省份列表
router.get('/provinces/all', async (req, res) => {
  const list = await query<any>('SELECT id, name, code FROM provinces ORDER BY id');
  return success(res, list);
});

// 根据省份获取城市
router.get('/cities/:provinceId', async (req, res) => {
  const { provinceId } = req.params;
  const list = await query<any>(
    'SELECT id, name, code FROM cities WHERE province_id = $1 ORDER BY id',
    [provinceId]
  );
  return success(res, list);
});

export default router;
