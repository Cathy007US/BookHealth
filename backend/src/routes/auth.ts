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
  if (!parsed.success) return fail(res, 'Invalid parameters', 400);

  const { code, nickname, avatar } = parsed.data;

  // Mock WeChat code-to-openid (should call WeChat API in production)
  // const openid = await getWxOpenid(code, config.wx.appid, config.wx.secret);
  const openid = `wx_${code.slice(0, 20)}`;

  let user = await queryOne<any>(
    'SELECT id, openid, nickname, avatar, phone, gender FROM users WHERE openid = $1',
    [openid]
  );

  if (!user) {
    user = await queryOne<any>(
      `INSERT INTO users (openid, nickname, avatar) VALUES ($1, $2, $3) RETURNING id, openid, nickname, avatar, phone, gender`,
      [openid, nickname || 'WeChat User', avatar || '']
    );
  }

  const token = jwt.sign({ userId: user.id, openid: user.openid }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });

  return success(res, { token, user });
});

// 手机号：支持国际格式（13800138000 / +8613800138000 / +14151234567）
const PHONE_RE = /^\+?\d{6,15}$/;

// 手机号+密码登录
router.post('/login', async (req, res) => {
  const schema = z.object({
    account: z.string().min(1),
    password: z.string().min(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, 'Invalid parameters', 400);

  const account = parsed.data.account.trim();
  const { password } = parsed.data;

  // ① 环境变量账号优先：bookhealth-api.env 里的 APP_USER / APP_PASS
  //    改文件即改密码，不需要动数据库，重启后端容器生效
  const { appUser, appPass } = config.auth;
  if (appUser && account.toLowerCase() === appUser.toLowerCase()) {
    if (password !== appPass) return fail(res, 'Incorrect password', 401);

    let user = await queryOne<any>(
      'SELECT * FROM users WHERE phone = $1 OR nickname = $1',
      [account]
    );
    if (!user) {
      // 首次用 env 账号登录时自动建一条用户记录，订单/体检人等关联才有 user_id
      const phone = PHONE_RE.test(account) ? account : null;
      user = await queryOne<any>(
        'INSERT INTO users (phone, nickname) VALUES ($1, $2) RETURNING *',
        [phone, appUser]
      );
    }

    const token = jwt.sign({ userId: user.id, phone: user.phone }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    return success(res, {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        gender: user.gender,
      },
    });
  }

  const user = await queryOne<any>(
    'SELECT * FROM users WHERE phone = $1 OR nickname = $1',
    [account]
  );
  if (!user) return fail(res, 'User not found', 404);

  if (!user.password_hash) return fail(res, 'Please use verification code login', 400);

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return fail(res, 'Incorrect password', 401);

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
  const phone = String(req.body?.phone || '').trim();
  if (!PHONE_RE.test(phone)) return fail(res, 'Invalid phone number format', 400);

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await query(
    `INSERT INTO sms_codes (phone, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
    [phone, code]
  );

  // 生产环境应接入短信服务；这里把验证码打到日志，便于排查
  console.log(`[SMS] ${phone}: ${code}`);

  // 非生产环境把验证码回传，方便前端直接登录（生产环境不返回）
  const isProd = process.env.NODE_ENV === 'production';
  return success(res, isProd ? null : { code }, 'Verification code sent');
});

// 手机号+验证码登录
router.post('/login-by-code', async (req, res) => {
  const phone = String(req.body?.phone || '').trim();
  const code = String(req.body?.code || '').trim();
  if (!PHONE_RE.test(phone) || code.length !== 6) {
    return fail(res, 'Invalid parameters', 400);
  }

  const record = await queryOne<any>(
    `SELECT * FROM sms_codes WHERE phone = $1 AND code = $2 AND expires_at > NOW() AND used = FALSE ORDER BY id DESC LIMIT 1`,
    [phone, code]
  );
  if (!record) return fail(res, 'Invalid or expired verification code', 400);

  await query('UPDATE sms_codes SET used = TRUE WHERE id = $1', [record.id]);

  let user = await queryOne<any>('SELECT * FROM users WHERE phone = $1', [phone]);
  if (!user) {
    user = await queryOne<any>(
      'INSERT INTO users (phone, nickname) VALUES ($1, $2) RETURNING *',
      [phone, `User${phone.slice(-4)}`]
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

// 重置密码（凭验证码，用于忘记密码）
router.post('/reset-password', async (req, res) => {
  const phone = String(req.body?.phone || '').trim();
  const code = String(req.body?.code || '').trim();
  const newPassword = String(req.body?.newPassword || '');

  if (!PHONE_RE.test(phone) || code.length !== 6) {
    return fail(res, 'Invalid parameters', 400);
  }
  if (newPassword.length < 6) return fail(res, 'Password must be at least 6 characters', 400);

  const record = await queryOne<any>(
    `SELECT * FROM sms_codes WHERE phone = $1 AND code = $2 AND expires_at > NOW() AND used = FALSE ORDER BY id DESC LIMIT 1`,
    [phone, code]
  );
  if (!record) return fail(res, 'Invalid or expired verification code', 400);

  const user = await queryOne<any>('SELECT id FROM users WHERE phone = $1', [phone]);
  if (!user) return fail(res, 'User not found', 404);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);
  await query('UPDATE sms_codes SET used = TRUE WHERE id = $1', [record.id]);

  return success(res, null, 'Password reset successfully');
});

// 获取当前用户信息
router.get('/profile', authRequired, async (req, res) => {
  const user = await queryOne<any>(
    'SELECT id, openid, phone, nickname, avatar, gender, created_at FROM users WHERE id = $1',
    [req.user!.userId]
  );
  if (!user) return fail(res, 'User not found', 404);
  return success(res, user);
});

// ========== Examinee Management ==========

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
  if (!parsed.success) return fail(res, 'Invalid parameters', 400);

  const { name, id_card, phone, gender, birthday, relationship } = parsed.data;

  const examinee = await queryOne<any>(
    `INSERT INTO examinees (user_id, name, id_card, phone, gender, birthday, relationship)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user!.userId, name, id_card || null, phone || null, gender || 0, birthday || null, relationship || null]
  );
  return success(res, examinee, 'Added successfully');
});

// Delete examinee
router.delete('/examinees/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  await query('DELETE FROM examinees WHERE id = $1 AND user_id = $2', [id, req.user!.userId]);
  return success(res, null, 'Deleted successfully');
});

export default router;
