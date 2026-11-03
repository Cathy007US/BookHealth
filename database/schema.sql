-- ============================================
-- BookHealth 体检预约系统 数据库建表脚本
-- PostgreSQL
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    openid VARCHAR(100) UNIQUE,          -- 微信openid
    phone VARCHAR(20),
    password_hash VARCHAR(255),          -- bcrypt加密
    nickname VARCHAR(100),
    avatar VARCHAR(500),
    gender SMALLINT DEFAULT 0,            -- 0未知 1男 2女
    status SMALLINT DEFAULT 1,            -- 0禁用 1正常
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'editor',    -- admin / editor
    status SMALLINT DEFAULT 1,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 省份表
CREATE TABLE IF NOT EXISTS provinces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) UNIQUE
);

-- 城市表
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    province_id INTEGER REFERENCES provinces(id),
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) UNIQUE
);

-- 体检机构表
CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES institutions(id),  -- 总部ID，NULL为总部
    logo VARCHAR(500),
    description TEXT,
    address VARCHAR(300),
    phone VARCHAR(20),
    city_id INTEGER REFERENCES cities(id),
    longitude DECIMAL(10,7),
    latitude DECIMAL(10,7),
    images TEXT[],                        -- 机构图片
    is_recommended BOOLEAN DEFAULT FALSE, -- 首页推荐
    status SMALLINT DEFAULT 1,            -- 0禁用 1启用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 体检项表（单个检查项目）
CREATE TABLE IF NOT EXISTS exam_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE,              -- 项目编码
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    category VARCHAR(50),                 -- 分类：如"血液检查"、"影像检查"
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 套餐分类表
CREATE TABLE IF NOT EXISTS package_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    status SMALLINT DEFAULT 1
);

-- 体检套餐表
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES package_categories(id),
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),         -- 原价（划线价）
    cover_image VARCHAR(500),
    detail_images TEXT[],
    content TEXT,                         -- 套餐详情（富文本）
    suitable_crowd VARCHAR(200),          -- 适用人群
    is_recommended BOOLEAN DEFAULT FALSE, -- 首页推荐
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 套餐包含的体检项（多对多）
CREATE TABLE IF NOT EXISTS package_items (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES packages(id) ON DELETE CASCADE,
    exam_item_id INTEGER REFERENCES exam_items(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 套餐适用机构（多对多）
CREATE TABLE IF NOT EXISTS package_institutions (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES packages(id) ON DELETE CASCADE,
    institution_id INTEGER REFERENCES institutions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 加项包表
CREATE TABLE IF NOT EXISTS addon_packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    institution_id INTEGER REFERENCES institutions(id),
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 加项包包含的体检项
CREATE TABLE IF NOT EXISTS addon_package_items (
    id SERIAL PRIMARY KEY,
    addon_package_id INTEGER REFERENCES addon_packages(id) ON DELETE CASCADE,
    exam_item_id INTEGER REFERENCES exam_items(id)
);

-- 体检人表
CREATE TABLE IF NOT EXISTS examinees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    id_card VARCHAR(20),                  -- 身份证号
    phone VARCHAR(20),
    gender SMALLINT DEFAULT 0,
    birthday DATE,
    relationship VARCHAR(20),             -- 本人/父母/配偶/子女
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订单/预约表
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(64) UNIQUE NOT NULL, -- 订单号
    user_id INTEGER REFERENCES users(id),
    examinee_id INTEGER REFERENCES examinees(id),
    package_id INTEGER REFERENCES packages(id),
    institution_id INTEGER REFERENCES institutions(id),
    exam_date DATE,                       -- 体检日期
    exam_time VARCHAR(20),               -- 体检时段
    package_price DECIMAL(10,2) NOT NULL, -- 套餐价格
    addon_price DECIMAL(10,2) DEFAULT 0,  -- 加项价格
    total_price DECIMAL(10,2) NOT NULL,   -- 总价
    pay_price DECIMAL(10,2),              -- 实付金额
    status SMALLINT DEFAULT 0,            -- 0待支付 1已支付/待体检 2已体检 3已取消 4已退款
    pay_method VARCHAR(20),               -- wechat / alipay
    pay_time TIMESTAMP,
    cancel_reason VARCHAR(200),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订单加项关联表
CREATE TABLE IF NOT EXISTS order_addons (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    addon_package_id INTEGER REFERENCES addon_packages(id),
    exam_item_id INTEGER REFERENCES exam_items(id),
    price DECIMAL(10,2) DEFAULT 0
);

-- 体检报告表
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    user_id INTEGER REFERENCES users(id),
    examinee_id INTEGER REFERENCES examinees(id),
    institution_id INTEGER REFERENCES institutions(id),
    report_no VARCHAR(64),                -- 报告编号
    exam_date DATE,
    report_date DATE,
    summary TEXT,                         -- 总结
    suggestion TEXT,                      -- 建议
    status SMALLINT DEFAULT 0,            -- 0待出 1已出
    pdf_url VARCHAR(500),                -- PDF下载链接
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 报告项明细（每个体检项的结果）
CREATE TABLE IF NOT EXISTS report_items (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    exam_item_id INTEGER REFERENCES exam_items(id),
    item_name VARCHAR(100),
    result VARCHAR(200),                  -- 检查结果值
    unit VARCHAR(50),                     -- 单位
    reference_range VARCHAR(200),         -- 参考范围
    is_abnormal SMALLINT DEFAULT 0,       -- 0正常 1偏高 2偏低 3异常
    doctor_advice TEXT,                   -- 医生建议
    sort_order INTEGER DEFAULT 0
);

-- 标准指标表（后台管理）
CREATE TABLE IF NOT EXISTS standard_metrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE,
    unit VARCHAR(50),
    reference_range VARCHAR(200),
    is_compare BOOLEAN DEFAULT TRUE,      -- 是否参与对比
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 机构指标映射表（机构项目 ↔ 标准指标）
CREATE TABLE IF NOT EXISTS institution_metrics (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES institutions(id),
    exam_item_id INTEGER REFERENCES exam_items(id),
    standard_metric_id INTEGER REFERENCES standard_metrics(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 验证码表
CREATE TABLE IF NOT EXISTS sms_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 医生表（报告解读/咨询）
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    title VARCHAR(50),                    -- 职称
    hospital VARCHAR(100),
    avatar VARCHAR(500),
    introduction TEXT,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 咨询/问诊表
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    doctor_id INTEGER REFERENCES doctors(id),
    report_id INTEGER REFERENCES reports(id),
    status SMALLINT DEFAULT 0,            -- 0待回复 1已回复 2已关闭
    content TEXT,                         -- 咨询内容
    reply TEXT,                           -- 医生回复
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_institutions_city ON institutions(city_id);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(status);
CREATE INDEX IF NOT EXISTS idx_packages_category ON packages(category_id);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_examinees_user ON examinees(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_order ON reports(order_id);
CREATE INDEX IF NOT EXISTS idx_report_items_report ON report_items(report_id);
CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone);

-- ============================================
-- 初始数据
-- ============================================
INSERT INTO provinces (name, code) VALUES
    ('Beijing', '110000'),
    ('Shanghai', '310000'),
    ('Guangdong', '440000'),
    ('Zhejiang', '330000'),
    ('Jiangsu', '320000')
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, code) VALUES
    (1, 'Beijing', '110100'),
    (2, 'Shanghai', '310100'),
    (3, 'Guangzhou', '440100'),
    (3, 'Shenzhen', '440300'),
    (4, 'Hangzhou', '330100'),
    (5, 'Nanjing', '320100')
ON CONFLICT DO NOTHING;

INSERT INTO package_categories (name, sort_order) VALUES
    ('Pre-employment Checkup', 1),
    ('Youth Checkup', 2),
    ('Middle-aged & Senior Checkup', 3),
    ('Female Checkup', 4),
    ('Male Checkup', 5),
    ('Family Checkup', 6)
ON CONFLICT DO NOTHING;

-- Initial admin (password: admin123, bcrypt hash)
INSERT INTO admins (username, password_hash, real_name, role) VALUES
    ('admin', '$2b$10$WQqPvXxQvQXxQvQXxQvQXeQXxQvQXxQvQXxQvQXxQvQXxQvQXx', 'Super Admin', 'admin')
ON CONFLICT DO NOTHING;
