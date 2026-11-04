-- ============================================
-- 迁移：图片字段改为 TEXT，支持存储 base64 data URL
-- base64 图片通常 50~100KB，超出 VARCHAR(500) 限制
-- ============================================

-- 套餐封面图
ALTER TABLE packages ALTER COLUMN cover_image TYPE TEXT;

-- 机构 Logo / 图片
ALTER TABLE institutions ALTER COLUMN logo TYPE TEXT;
ALTER TABLE institutions ALTER COLUMN images TYPE TEXT[];

-- 套餐分类图标
ALTER TABLE package_categories ALTER COLUMN icon TYPE TEXT;

-- 医生 / 用户头像
ALTER TABLE doctors ALTER COLUMN avatar TYPE TEXT;
ALTER TABLE users ALTER COLUMN avatar TYPE TEXT;
