import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne, transaction } from '../config/database';
import { success, fail, paginate } from '../utils/response';
import { authRequired } from '../middleware/auth';
import { generateOrderNo } from '../utils/order';

const router = Router();

// 我的预约列表
router.get('/', authRequired, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const status = req.query.status as string;

  let where = 'WHERE o.user_id = $1';
  const params: any[] = [req.user!.userId];
  if (status !== undefined && status !== '') {
    params.push(status);
    where += ` AND o.status = $${params.length}`;
  }

  const totalRow = await queryOne<any>(`SELECT COUNT(*)::int as total FROM orders o ${where}`, params);
  const total = totalRow?.total || 0;

  params.push(pageSize, (page - 1) * pageSize);
  const list = await query<any>(
    `SELECT o.*, p.name as package_name, p.cover_image as package_image,
            i.name as institution_name, i.address as institution_address,
            e.name as examinee_name
     FROM orders o
     LEFT JOIN packages p ON o.package_id = p.id
     LEFT JOIN institutions i ON o.institution_id = i.id
     LEFT JOIN examinees e ON o.examinee_id = e.id
     ${where} ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return paginate(res, list, total, page, pageSize);
});

// 订单详情
router.get('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  const order = await queryOne<any>(
    `SELECT o.*, p.name as package_name, p.cover_image as package_image, p.description as package_description,
            i.name as institution_name, i.address as institution_address, i.phone as institution_phone,
            e.name as examinee_name, e.id_card as examinee_id_card, e.phone as examinee_phone, e.gender as examinee_gender
     FROM orders o
     LEFT JOIN packages p ON o.package_id = p.id
     LEFT JOIN institutions i ON o.institution_id = i.id
     LEFT JOIN examinees e ON o.examinee_id = e.id
     WHERE o.id = $1 AND o.user_id = $2`,
    [id, req.user!.userId]
  );
  if (!order) return fail(res, '订单不存在', 404);

  // 加项信息
  const addons = await query<any>(
    `SELECT oa.*, ei.name as item_name FROM order_addons oa
     LEFT JOIN exam_items ei ON oa.exam_item_id = ei.id WHERE oa.order_id = $1`,
    [id]
  );

  return success(res, { ...order, addons });
});

// 创建订单（选择体检人后添加订单）
router.post('/', authRequired, async (req, res) => {
  const schema = z.object({
    package_id: z.number().int(),
    institution_id: z.number().int(),
    examinee_id: z.number().int(),
    exam_date: z.string(),
    exam_time: z.string().optional(),
    addon_item_ids: z.array(z.number().int()).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, '参数错误', 400);

  const { package_id, institution_id, examinee_id, exam_date, exam_time, addon_item_ids } = parsed.data;

  // 验证体检人归属
  const examinee = await queryOne<any>(
    'SELECT id FROM examinees WHERE id = $1 AND user_id = $2',
    [examinee_id, req.user!.userId]
  );
  if (!examinee) return fail(res, '体检人不存在', 400);

  // 获取套餐价格
  const pkg = await queryOne<any>('SELECT price FROM packages WHERE id = $1 AND status = 1', [package_id]);
  if (!pkg) return fail(res, '套餐不存在', 400);

  // 计算加项价格
  let addonPrice = 0;
  if (addon_item_ids && addon_item_ids.length > 0) {
    const items = await query<any>(
      `SELECT id, price FROM exam_items WHERE id = ANY($1::int[])`,
      [addon_item_ids]
    );
    addonPrice = items.reduce((sum: number, item: any) => sum + parseFloat(item.price), 0);
  }

  const totalPrice = parseFloat(pkg.price) + addonPrice;
  const orderNo = generateOrderNo();

  const order = await transaction(async (client) => {
    const orderResult = await client.query(
      `INSERT INTO orders (order_no, user_id, examinee_id, package_id, institution_id, exam_date, exam_time,
         package_price, addon_price, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0) RETURNING *`,
      [orderNo, req.user!.userId, examinee_id, package_id, institution_id, exam_date, exam_time || null,
       pkg.price, addonPrice, totalPrice]
    );
    const newOrder = orderResult.rows[0];

    if (addon_item_ids && addon_item_ids.length > 0) {
      for (const itemId of addon_item_ids) {
        const item = await client.query('SELECT price FROM exam_items WHERE id = $1', [itemId]);
        if (item.rows[0]) {
          await client.query(
            'INSERT INTO order_addons (order_id, exam_item_id, price) VALUES ($1, $2, $3)',
            [newOrder.id, itemId, item.rows[0].price]
          );
        }
      }
    }

    return newOrder;
  });

  return success(res, order, '订单创建成功');
});

// 支付（模拟）
router.post('/:id/pay', authRequired, async (req, res) => {
  const { id } = req.params;
  const schema = z.object({
    pay_method: z.enum(['wechat', 'alipay']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, '参数错误', 400);

  const order = await queryOne<any>(
    'SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status = 0',
    [id, req.user!.userId]
  );
  if (!order) return fail(res, '订单不存在或状态异常', 400);

  // 模拟支付成功
  await query(
    `UPDATE orders SET status = 1, pay_method = $1, pay_price = total_price, pay_time = NOW(), updated_at = NOW() WHERE id = $2`,
    [parsed.data.pay_method, id]
  );

  const updated = await queryOne<any>('SELECT * FROM orders WHERE id = $1', [id]);
  return success(res, updated, '支付成功');
});

// 更新体检时间
router.put('/:id/exam-date', authRequired, async (req, res) => {
  const { id } = req.params;
  const schema = z.object({ exam_date: z.string(), exam_time: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, '参数错误', 400);

  const order = await queryOne<any>(
    'SELECT id FROM orders WHERE id = $1 AND user_id = $2 AND status IN (0, 1)',
    [id, req.user!.userId]
  );
  if (!order) return fail(res, '订单不存在或状态异常', 400);

  await query(
    'UPDATE orders SET exam_date = $1, exam_time = $2, updated_at = NOW() WHERE id = $3',
    [parsed.data.exam_date, parsed.data.exam_time || null, id]
  );
  return success(res, null, '体检时间已更新');
});

// 取消预约
router.put('/:id/cancel', authRequired, async (req, res) => {
  const { id } = req.params;
  const schema = z.object({ cancel_reason: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, '参数错误', 400);

  const order = await queryOne<any>(
    'SELECT id FROM orders WHERE id = $1 AND user_id = $2 AND status IN (0, 1)',
    [id, req.user!.userId]
  );
  if (!order) return fail(res, '订单不存在或状态异常', 400);

  await query(
    'UPDATE orders SET status = 3, cancel_reason = $1, updated_at = NOW() WHERE id = $2',
    [parsed.data.cancel_reason || null, id]
  );
  return success(res, null, '预约已取消');
});

// 体检加项（为已有订单添加加项）
router.post('/:id/addons', authRequired, async (req, res) => {
  const { id } = req.params;
  const schema = z.object({
    addon_item_ids: z.array(z.number().int()).min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, '参数错误', 400);

  const order = await queryOne<any>(
    'SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status IN (0, 1)',
    [id, req.user!.userId]
  );
  if (!order) return fail(res, '订单不存在或状态异常', 400);

  const items = await query<any>(
    'SELECT id, name, price FROM exam_items WHERE id = ANY($1::int[])',
    [parsed.data.addon_item_ids]
  );

  let addonTotal = 0;
  for (const item of items) {
    await query(
      'INSERT INTO order_addons (order_id, exam_item_id, price) VALUES ($1, $2, $3)',
      [id, item.id, item.price]
    );
    addonTotal += parseFloat(item.price);
  }

  const newAddonPrice = parseFloat(order.addon_price) + addonTotal;
  const newTotalPrice = parseFloat(order.package_price) + newAddonPrice;

  await query(
    'UPDATE orders SET addon_price = $1, total_price = $2, updated_at = NOW() WHERE id = $3',
    [newAddonPrice, newTotalPrice, id]
  );

  return success(res, { addon_price: newAddonPrice, total_price: newTotalPrice }, '加项成功');
});

export default router;
