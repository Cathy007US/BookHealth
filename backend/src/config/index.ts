import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 配置来源（后者只补齐前者缺失的 key，不会覆盖已有值）：
// 1) 显式指定的 ENV_FILE
// 2) 当前工作目录下的 .env（backend/.env，通常放本地数据库连接）
// 3) 项目根目录的 bookhealth-api.env（账号密码/JWT，与服务器同一份）
// 容器里 process.env 由 compose 的 env_file 注入，优先级最高，不会被文件覆盖
const envCandidates = [
  process.env.ENV_FILE,
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', 'bookhealth-api.env'),
].filter(Boolean) as string[];

for (const file of envCandidates) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file, override: false });
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'bookhealth',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  adminJwt: {
    secret: process.env.ADMIN_JWT_SECRET || 'admin_default_secret',
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '24h',
  },
  // 由 bookhealth-api.env 直接控制的登录账号（改文件即改密码，无需改库）
  auth: {
    adminUser: (process.env.ADMIN_USER || '').trim(),
    adminPass: process.env.ADMIN_PASS || '',
    appUser: (process.env.APP_USER || '').trim(),
    appPass: process.env.APP_PASS || '',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  },
  wx: {
    appid: process.env.WX_APPID || '',
    secret: process.env.WX_SECRET || '',
  },
};
