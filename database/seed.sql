-- ============================================
-- BookHealth 种子数据（54条）
-- 在服务器上执行: docker compose exec -T db psql -U postgres -d bookhealth < database/seed.sql
-- ============================================

-- 清空已有数据（按外键依赖顺序）
DELETE FROM consultations;
DELETE FROM report_items;
DELETE FROM reports;
DELETE FROM order_addons;
DELETE FROM orders;
DELETE FROM examinees;
DELETE FROM sms_codes;
DELETE FROM addon_package_items;
DELETE FROM addon_packages;
DELETE FROM package_items;
DELETE FROM package_institutions;
DELETE FROM packages;
DELETE FROM exam_items;
DELETE FROM package_categories;
DELETE FROM institutions;
DELETE FROM cities;
DELETE FROM provinces;
DELETE FROM doctors;
DELETE FROM standard_metrics;
DELETE FROM admins;
DELETE FROM users;

-- 重置自增序列
SELECT setval('users_id_seq', 1, false);
SELECT setval('admins_id_seq', 1, false);
SELECT setval('provinces_id_seq', 1, false);
SELECT setval('cities_id_seq', 1, false);
SELECT setval('institutions_id_seq', 1, false);
SELECT setval('exam_items_id_seq', 1, false);
SELECT setval('package_categories_id_seq', 1, false);
SELECT setval('packages_id_seq', 1, false);
SELECT setval('examinees_id_seq', 1, false);
SELECT setval('orders_id_seq', 1, false);
SELECT setval('reports_id_seq', 1, false);
SELECT setval('doctors_id_seq', 1, false);

-- ============================================
-- 1. 省份 (5条)
-- ============================================
INSERT INTO provinces (name, code) VALUES
    ('Beijing', '110000'),
    ('Shanghai', '310000'),
    ('Guangdong', '440000'),
    ('Zhejiang', '330000'),
    ('Jiangsu', '320000');

-- ============================================
-- 2. 城市 (6条)
-- ============================================
INSERT INTO cities (province_id, name, code) VALUES
    (1, 'Beijing', '110100'),
    (2, 'Shanghai', '310100'),
    (3, 'Guangzhou', '440100'),
    (3, 'Shenzhen', '440300'),
    (4, 'Hangzhou', '330100'),
    (5, 'Nanjing', '320100');

-- ============================================
-- 3. 套餐分类 (6条)
-- ============================================
INSERT INTO package_categories (name, sort_order) VALUES
    ('Pre-employment Checkup', 1),
    ('Youth Checkup', 2),
    ('Middle-aged & Senior Checkup', 3),
    ('Female Checkup', 4),
    ('Male Checkup', 5),
    ('Family Checkup', 6);

-- ============================================
-- 4. 体检机构 (6条)
-- ============================================
INSERT INTO institutions (name, logo, description, address, phone, city_id, is_recommended, status) VALUES
    ('Beijing United Health Checkup Center', NULL, 'Professional health checkup center with advanced equipment', 'No.88 Jianguo Road, Chaoyang District, Beijing', '010-88880001', 1, TRUE, 1),
    ('Shanghai Renji Health Examination Center', NULL, 'Leading health examination institution in Shanghai', 'No.163 Dongfang Road, Pudong, Shanghai', '021-66660002', 2, TRUE, 1),
    ('Guangzhou Huashan Health Checkup Center', NULL, 'Comprehensive health checkup services', 'No.52 Tianhe Road, Tianhe District, Guangzhou', '020-33330003', 3, FALSE, 1),
    ('Shenzhen Kangmei Health Center', NULL, 'Modern health management center', 'No.18 Binhe Road, Futian District, Shenzhen', '0755-22220004', 4, FALSE, 1),
    ('Hangzhou Zheyi Health Checkup Center', NULL, 'Premium health checkup experience', 'No.79 Qingchun Road, Shangcheng District, Hangzhou', '0571-11110005', 5, FALSE, 1),
    ('Nanjing Gulou Health Examination Center', NULL, 'Trusted health checkup provider', 'No.35 Zhongshan Road, Gulou District, Nanjing', '025-55550006', 6, FALSE, 1);

-- ============================================
-- 5. 体检项 (30条)
-- ============================================
INSERT INTO exam_items (name, code, description, price, category, status) VALUES
    ('Complete Blood Count', 'CBC', 'Routine blood test including WBC, RBC, hemoglobin', 30.00, 'Blood Test', 1),
    ('Liver Function Test', 'LFT', 'ALT, AST, total bilirubin assessment', 50.00, 'Blood Test', 1),
    ('Kidney Function Test', 'KFT', 'BUN, creatinine, uric acid', 45.00, 'Blood Test', 1),
    ('Blood Glucose', 'GLU', 'Fasting blood glucose level', 15.00, 'Blood Test', 1),
    ('Blood Lipid Panel', 'LIPID', 'Total cholesterol, triglycerides, HDL, LDL', 40.00, 'Blood Test', 1),
    ('Thyroid Function Test', 'TFT', 'TSH, T3, T4 levels', 80.00, 'Blood Test', 1),
    ('Tumor Marker Screening', 'TUMOR', 'AFP, CEA, CA19-9, PSA', 120.00, 'Blood Test', 1),
    ('Routine Urinalysis', 'URINE', 'Urine routine examination', 10.00, 'Urine Test', 1),
    ('Electrocardiogram', 'ECG', '12-lead ECG for heart rhythm', 25.00, 'Cardiovascular', 1),
    ('Chest X-Ray', 'CXR', 'Chest radiography', 35.00, 'Imaging', 1),
    ('Abdominal Ultrasound', 'US', 'Liver, gallbladder, spleen, kidney ultrasound', 60.00, 'Imaging', 1),
    ('Thyroid Ultrasound', 'THYUS', 'Thyroid gland ultrasound', 50.00, 'Imaging', 1),
    ('Breast Ultrasound', 'BRUS', 'Breast tissue ultrasound', 55.00, 'Imaging', 1),
    ('Carotid Ultrasound', 'CARUS', 'Carotid artery Doppler', 65.00, 'Cardiovascular', 1),
    ('Cardiac Ultrasound', 'ECHOCG', 'Echocardiography', 90.00, 'Cardiovascular', 1),
    ('Low-Dose Chest CT', 'LDCT', 'Low-dose spiral CT of chest', 150.00, 'Imaging', 1),
    ('Bone Mineral Density', 'BMD', 'Bone density measurement', 70.00, 'Bone Health', 1),
    ('Eye Examination', 'EYE', 'Visual acuity, intraocular pressure', 20.00, 'Ophthalmology', 1),
    ('ENT Examination', 'ENT', 'Ear, nose, throat checkup', 15.00, 'ENT', 1),
    ('Dental Examination', 'DENTAL', 'Oral health checkup', 15.00, 'Dental', 1),
    ('Blood Pressure', 'BP', 'Blood pressure measurement', 5.00, 'Vital Signs', 1),
    ('BMI Measurement', 'BMI', 'Body mass index assessment', 5.00, 'Vital Signs', 1),
    ('Pulmonary Function Test', 'PFT', 'Lung capacity assessment', 40.00, 'Respiratory', 1),
    ('Gastroscopy', 'GASTRO', 'Upper GI endoscopy', 200.00, 'Gastrointestinal', 1),
    ('Colonoscopy', 'COLON', 'Lower GI endoscopy', 250.00, 'Gastrointestinal', 1),
    ('HPV Screening', 'HPV', 'Human papillomavirus test', 100.00, 'Gynecology', 1),
    ('TCT Cervical Cytology', 'TCT', 'Thin-prep cytologic test', 80.00, 'Gynecology', 1),
    ('Helicobacter Pylori', 'HP', 'H. pylori breath test', 30.00, 'Gastrointestinal', 1),
    ('Vitamin D Test', 'VITD', '25-OH Vitamin D level', 60.00, 'Blood Test', 1),
    ('Allergy Screening', 'ALLERGY', 'Common allergen panel', 90.00, 'Blood Test', 1);

-- ============================================
-- 6. 体检套餐 (8条)
-- ============================================
INSERT INTO packages (name, category_id, description, price, original_price, suitable_crowd, is_recommended, status) VALUES
    ('Comprehensive Health Checkup Package A', 1, 'Full body checkup suitable for pre-employment requirements', 599.00, 799.00, 'Job applicants, pre-employment', TRUE, 1),
    ('Youth Vitality Checkup Package', 2, 'Basic health screening for young adults aged 18-35', 399.00, 599.00, 'Young adults 18-35', TRUE, 1),
    ('Female Wellness Checkup Package', 4, 'Comprehensive health checkup designed for women', 899.00, 1299.00, 'Women aged 25-55', TRUE, 1),
    ('Male Vitality Checkup Package', 5, 'Health screening tailored for men', 799.00, 1099.00, 'Men aged 25-55', FALSE, 1),
    ('Family Care Checkup Package', 6, 'Comprehensive checkup for the whole family', 1499.00, 1999.00, 'Families with children and elderly', TRUE, 1),
    ('Middle-aged Health Guard Package', 1, 'Thorough checkup for adults aged 40+', 1199.00, 1599.00, 'Adults aged 40-60', FALSE, 1),
    ('Executive Premium Checkup Package', 2, 'Premium checkup for business executives', 2599.00, 3299.00, 'Business executives, high stress', FALSE, 1),
    ('Senior Care Checkup Package', 3, 'Gentle checkup designed for elderly', 999.00, 1399.00, 'Seniors aged 60+', TRUE, 1);

-- ============================================
-- 7. 套餐适用机构映射
-- ============================================
INSERT INTO package_institutions (package_id, institution_id) VALUES
    (1,1),(1,2),(1,3),
    (2,1),(2,2),(2,4),
    (3,2),(3,3),(3,5),
    (4,1),(4,4),(4,6),
    (5,2),(5,5),(5,6),
    (6,3),(6,5),(6,6),
    (7,1),(7,2),(7,3),
    (8,4),(8,5),(8,6);

-- ============================================
-- 8. 套餐体检项映射
-- ============================================
INSERT INTO package_items (package_id, exam_item_id) VALUES
    -- Package 1: Comprehensive (items 1-10)
    (1,1),(1,2),(1,3),(1,4),(1,5),(1,8),(1,9),(1,10),(1,11),(1,21),
    -- Package 2: Youth (items 1,4,8,9,10,21,22)
    (2,1),(2,4),(2,8),(2,9),(2,10),(2,21),(2,22),
    -- Package 3: Female (items 1,2,4,5,6,11,13,26,27)
    (3,1),(3,2),(3,4),(3,5),(3,6),(3,11),(3,13),(3,26),(3,27),
    -- Package 4: Male (items 1,2,3,4,5,9,11,14,21)
    (4,1),(4,2),(4,3),(4,4),(4,5),(4,9),(4,11),(4,14),(4,21),
    -- Package 5: Family (items 1-14,21,22)
    (5,1),(5,2),(5,3),(5,4),(5,5),(5,6),(5,8),(5,9),(5,10),(5,11),(5,12),(5,13),(5,14),(5,21),(5,22),
    -- Package 6: Middle-aged (items 1-12,16,17,21)
    (6,1),(6,2),(6,3),(6,4),(6,5),(6,6),(6,7),(6,8),(6,9),(6,10),(6,11),(6,12),(6,16),(6,17),(6,21),
    -- Package 7: Executive (items 1-16,28,29)
    (7,1),(7,2),(7,3),(7,4),(7,5),(7,6),(7,7),(7,8),(7,9),(7,10),(7,11),(7,12),(7,13),(7,14),(7,15),(7,16),(7,28),(7,29),
    -- Package 8: Senior (items 1-6,9,10,11,12,16,17,21)
    (8,1),(8,2),(8,3),(8,4),(8,5),(8,6),(8,9),(8,10),(8,11),(8,12),(8,16),(8,17),(8,21);

-- ============================================
-- 9. 用户 (test01, password: a123456)
-- ============================================
INSERT INTO users (openid, phone, password_hash, nickname, gender, status) VALUES
    (NULL, '+14151234567', '$2b$10$vUcRQSrIt42HpVy1ZxuABOxxM7WIrM3rGgOvK773raYrr6p9Bie/S', 'test01', 1, 1);

-- ============================================
-- 10. 管理员 (test01, password: a123456)
-- ============================================
INSERT INTO admins (username, password_hash, real_name, role, status) VALUES
    ('test01', '$2b$10$vUcRQSrIt42HpVy1ZxuABOxxM7WIrM3rGgOvK773raYrr6p9Bie/S', 'Test Admin', 'admin', 1);

-- ============================================
-- 11. 体检人 (3条)
-- ============================================
INSERT INTO examinees (user_id, name, id_card, phone, gender, birthday, relationship) VALUES
    (1, 'Zhang San', '110101199001011234', '13800000001', 1, '1990-01-01', 'Self'),
    (1, 'Li Si', '110101196505052345', '13800000002', 1, '1965-05-05', 'Father'),
    (1, 'Wang Mei', '110101199203033456', '13800000003', 2, '1992-03-03', 'Spouse');

-- ============================================
-- 12. 订单 (3条: 待体检/已体检/已取消)
-- ============================================
INSERT INTO orders (order_no, user_id, examinee_id, package_id, institution_id, exam_date, exam_time, package_price, addon_price, total_price, pay_price, status, pay_method, pay_time) VALUES
    ('BH20260101001', 1, 1, 1, 1, '2026-11-15', '09:00-10:00', 599.00, 0, 599.00, 599.00, 1, 'wechat', '2026-11-01 10:30:00'),
    ('BH20260101002', 1, 2, 3, 2, '2026-10-20', '10:00-11:00', 899.00, 0, 899.00, 899.00, 2, 'wechat', '2026-10-15 14:20:00'),
    ('BH20260101003', 1, 3, 2, 3, '2026-11-10', '14:00-15:00', 399.00, 0, 399.00, 0, 3, NULL, NULL);

-- ============================================
-- 13. 体检报告 (1条，对应已体检订单)
-- ============================================
INSERT INTO reports (order_id, user_id, examinee_id, institution_id, report_no, exam_date, report_date, summary, suggestion, status) VALUES
    (2, 1, 2, 2, 'RPT20261020001', '2026-10-20', '2026-10-22', 'Overall health is good. Minor elevated blood lipids noted.', 'Recommend dietary adjustment and regular exercise.', 1);

-- ============================================
-- 14. 报告项明细 (对应已体检订单的体检项)
-- ============================================
INSERT INTO report_items (report_id, exam_item_id, item_name, result, unit, reference_range, is_abnormal, doctor_advice, sort_order) VALUES
    (1, 1, 'Complete Blood Count', 'Normal', '', 'WBC 4-10', 0, 'All values within normal range', 1),
    (1, 2, 'Liver Function Test', 'Normal', '', 'ALT 0-40 U/L', 0, 'Liver function normal', 2),
    (1, 4, 'Blood Glucose', '5.2', 'mmol/L', '3.9-6.1', 0, 'Normal fasting glucose', 3),
    (1, 5, 'Blood Lipid Panel', 'Total: 6.2', 'mmol/L', 'Total < 5.2', 1, 'Slightly elevated total cholesterol. Reduce saturated fat intake.', 4),
    (1, 6, 'Thyroid Function Test', 'Normal', '', 'TSH 0.4-4.0', 0, 'Thyroid function normal', 5),
    (1, 11, 'Abdominal Ultrasound', 'Normal', '', '', 0, 'No abnormalities detected', 6),
    (1, 13, 'Breast Ultrasound', 'Normal', '', '', 0, 'No abnormalities detected', 7),
    (1, 26, 'HPV Screening', 'Negative', '', '', 0, 'HPV test negative', 8),
    (1, 27, 'TCT Cervical Cytology', 'Normal', '', '', 0, 'Normal cytology', 9);

-- ============================================
-- 15. 医生 (3条)
-- ============================================
INSERT INTO doctors (name, title, hospital, avatar, introduction, status) VALUES
    ('Dr. Chen Wei', 'Chief Physician', 'Beijing United Hospital', NULL, '20 years experience in internal medicine and health management', 1),
    ('Dr. Liu Fang', 'Associate Chief Physician', 'Shanghai Renji Hospital', NULL, 'Specialized in cardiology and preventive medicine', 1),
    ('Dr. Zhao Ming', 'Attending Physician', 'Guangzhou Huashan Hospital', NULL, 'Expert in gastroenterology and endoscopy', 1);

-- ============================================
-- 16. 标准指标 (5条)
-- ============================================
INSERT INTO standard_metrics (name, code, unit, reference_range, is_compare, status) VALUES
    ('White Blood Cell Count', 'WBC', '10^9/L', '4.0-10.0', TRUE, 1),
    ('Hemoglobin', 'HGB', 'g/L', '120-160', TRUE, 1),
    ('Fasting Blood Glucose', 'FBG', 'mmol/L', '3.9-6.1', TRUE, 1),
    ('Total Cholesterol', 'TC', 'mmol/L', '< 5.2', TRUE, 1),
    ('Creatinine', 'CR', 'umol/L', '44-133', TRUE, 1);
