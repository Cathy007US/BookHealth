import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query, queryOne } from '../config/database';
import { config } from '../config';
import { success, fail } from '../utils/response';
import { authRequired } from '../middleware/auth';

const router = Router();

// 微信登录
router.post('/wx-login', async (req, res) => {
  const schema = z.object({
    code: z.string(),
    nickname: z.string().optional(),
    avatar: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, '参数错误', 400);

  const { code, nickname, avatar } = parsed.data;

  // 模拟微信 code 换 openid（实际应调用微信 API）
  // const openid = await getWxOpenid(code, config.wx.appid, config.wx.secret);
  const openid = `wx_${code.slice(0, 20)}`;

  let user = await queryOne<any>(
    'SELECT id, openid, nickname, avatar, phone, gender FROM users WHERE openid = $1',
    [openid]
  );

  if (!user) {
    user = await queryOne<any>(
      `INSERT INTO users (openid, nickname, avatar) VALUES ($1, $2, $3) RETURNING id, openid, nickname, avatar, phone, gender`,
      [openid, nickname || '微信用户', avatar || '']
    );
  }

  const token = jwt.sign({ userId: user.id, openid: user.openid }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });

  return success(res, { token, user });
});

// 手机号+密码登录
router.post('/login', async (req, res) => {
  const schema = z.object({
    account: z.string().min(1),
    password: z.string().min(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, '参数错误', 400);

  const { account, password } = parsed.data;

  const user = await queryOne<any>(
    'SELECT * FROM users WHERE phone = $1 OR nickname = $1',
    [account]
  );
  if (!user) return fail(res, '用户不存在', 404);

  if (!user.password_hash) return fail(res, '请使用验证码登录', 400);

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return fail(res, '密码错误', 401);

  const token = jwt.sign({ userId: user.id, phone: user.phone }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });

  return success(res, {
    token,
    user: { id: user.id, nickname: user.nickname, avatar: user.avatar, phone: user.phone, gender: user.gender },
  });
});

// 发送验证码
router.post('/send-code', async (req, res) => {
  const schema = z.object({ phone: z.string().regex(/^1\d{10}$/) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, '手机号格式错误', 400);

  const { phone } = parsed.data;
  const code = Math.random().toString().slice(2, 8);

  await query(
    `INSERT INTO sms_codes (phone, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
    [phone, code]
  );

  // 实际应调用短信服务发送
  console.log(`[SMS] ${phone}: ${code}`);

  return success(res, null, '验证码已发送');
});

// 手机号+验证码登录
router.post('/login-by-code', async (req, res) => {
  const schema = z.object({
    phone: z.string().regex(/^1\d{10}$/),
    code: z.string().length(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, '参数错误', 400);

  const { phone, code } = parsed.data;

  const record = await queryOne<any>(
    `SELECT * FROM sms_codes WHERE phone = $1 AND code = $2 AND expires_at > NOW() AND used = FALSE ORDER BY id DESC LIMIT 1`,
    [phone, code]
  );
  if (!record) return fail(res, '验证码错误或已过期', 400);

  await query('UPDATE sms_codes SET used = TRUE WHERE id = $1', [record.id]);

  let user = await queryOne<any>('SELECT * FROM users WHERE phone = $1', [phone]);
  if (!user) {
    user = await queryOne<any>(
      'INSERT INTO users (phone, nickname) VALUES ($1, $2) RETURNING *',
      [phone, `用户${phone.slice(-4)}`]
    );
  }

  const token = jwt.sign({ userId: user.id, phone: user.phone }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });

  return success(res, {
    token,
    user: { id: user.id, nickname: user.nickname, avatar: user.avatar, phone: user.phone, gender: user.gender },
  });
});

// 获取当前用户信息
router.get('/profile', authRequired, async (req, res) => {
  const user = await queryOne<any>(
    'SELECT id, openid, phone, nickname, avatar, gender, created_at FROM users WHERE id = $1',
    [req.user!.userId]
  );
  if (!user) return fail(res, '用户不存在', 404);
  return success(res, user);
});

// ========== 体检人管理 ==========

// 获取体检人列表
router.get('/examinees', authRequired, async (req, res) => {
  const list = await query<any>(
    'SELECT * FROM examinees WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user!.userId]
  );
  return success(res, list);
});

// 添加体检人
router.post('/examinees', authRequired, async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(50),
    id_card: z.string().optional(),
    phone: z.string().optional(),
    gender: z.number().min(0).max(2).optional(),
    birthday: z.string().optional(),
    relationship: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, '参数错误', 400);

  const { name, id_card, phone, gender, birthday, relationship } = parsed.data;

  const examinee = await queryOne<any>(
    `INSERT INTO examinees (user_id, name, id_card, phone, gender, birthday, relationship)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user!.userId, name, id_card || null, phone || null, gender || 0, birthday || null, relationship || null]
  );
  return success(res, examinee, '添加成功');
});

// 删除体检人
router.delete('/examinees/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  await query('DELETE FROM examinees WHERE id = $1 AND user_id = $2', [id, req.user!.userId]);
  return success(res, null, '删除成功');
});

export default router;
