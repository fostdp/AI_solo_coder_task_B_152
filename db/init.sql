-- ============================================================
-- 古代被中香炉（银熏球）万向平衡机构仿真与抗晃荡分析系统
-- TimescaleDB 初始化脚本
-- ============================================================

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 香炉设备表
-- ============================================================
CREATE TABLE IF NOT EXISTS censers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 传感器数据表（核心时序表）
-- ============================================================
CREATE TABLE IF NOT EXISTS sensor_data (
    time TIMESTAMPTZ NOT NULL,
    censer_id UUID NOT NULL REFERENCES censers(id) ON DELETE CASCADE,
    inner_ring_angle DOUBLE PRECISION NOT NULL,
    outer_ring_angle DOUBLE PRECISION NOT NULL,
    body_tilt DOUBLE PRECISION NOT NULL,
    slosh_acceleration DOUBLE PRECISION NOT NULL,
    inner_ring_velocity DOUBLE PRECISION,
    outer_ring_velocity DOUBLE PRECISION,
    body_angular_velocity DOUBLE PRECISION,
    temperature DOUBLE PRECISION,
    balance_score DOUBLE PRECISION,
    spill_risk DOUBLE PRECISION,
    raw_data JSONB
);

-- 创建hypertable（TimescaleDB核心特性）
SELECT create_hypertable('sensor_data', 'time', if_not_exists => TRUE);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sensor_data_censer_id ON sensor_data (censer_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_balance_score ON sensor_data (censer_id, time DESC) WHERE balance_score < 0.5;
CREATE INDEX IF NOT EXISTS idx_sensor_data_spill_risk ON sensor_data (censer_id, time DESC) WHERE spill_risk > 0.3;

-- ============================================================
-- 告警记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    censer_id UUID NOT NULL REFERENCES censers(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'warning',
    message TEXT NOT NULL,
    threshold_value DOUBLE PRECISION,
    actual_value DOUBLE PRECISION,
    sensor_data_time TIMESTAMPTZ,
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_censer_id ON alerts (censer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unacknowledged ON alerts (acknowledged) WHERE acknowledged = FALSE;

-- ============================================================
-- 仿真配置参数表
-- ============================================================
CREATE TABLE IF NOT EXISTS simulation_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    censer_id UUID UNIQUE REFERENCES censers(id) ON DELETE CASCADE,
    inner_ring_mass DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    outer_ring_mass DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    body_mass DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    inner_ring_radius DOUBLE PRECISION NOT NULL DEFAULT 0.04,
    outer_ring_radius DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    body_radius DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    friction_coefficient DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    damping_coefficient DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    gravity DOUBLE PRECISION NOT NULL DEFAULT 9.81,
    tilt_alarm_threshold DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    balance_alarm_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    spill_alarm_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    perfume_viscosity DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    fill_ratio DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='simulation_configs' AND column_name='perfume_viscosity') THEN
        ALTER TABLE simulation_configs ADD COLUMN perfume_viscosity DOUBLE PRECISION NOT NULL DEFAULT 0.5;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='simulation_configs' AND column_name='fill_ratio') THEN
        ALTER TABLE simulation_configs ADD COLUMN fill_ratio DOUBLE PRECISION NOT NULL DEFAULT 0.6;
    END IF;
END $$;

-- ============================================================
-- 抗晃荡分析结果表
-- ============================================================
CREATE TABLE IF NOT EXISTS slosh_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    censer_id UUID NOT NULL REFERENCES censers(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    motion_type VARCHAR(50) NOT NULL,
    frequency DOUBLE PRECISION NOT NULL,
    amplitude DOUBLE PRECISION NOT NULL,
    damping_ratio DOUBLE PRECISION,
    resonance_factor DOUBLE PRECISION,
    max_tilt_angle DOUBLE PRECISION,
    spill_probability DOUBLE PRECISION,
    balance_efficiency DOUBLE PRECISION,
    analysis_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slosh_analysis_censer_id ON slosh_analysis (censer_id, created_at DESC);

-- ============================================================
-- 视图：最近传感器数据
-- ============================================================
CREATE OR REPLACE VIEW v_latest_sensor_data AS
SELECT DISTINCT ON (censer_id)
    sd.time,
    sd.censer_id,
    c.name AS censer_name,
    c.code AS censer_code,
    sd.inner_ring_angle,
    sd.outer_ring_angle,
    sd.body_tilt,
    sd.slosh_acceleration,
    sd.balance_score,
    sd.spill_risk
FROM sensor_data sd
JOIN censers c ON c.id = sd.censer_id
ORDER BY censer_id, time DESC;

-- ============================================================
-- 视图：活动告警统计
-- ============================================================
CREATE OR REPLACE VIEW v_active_alerts AS
SELECT
    c.id AS censer_id,
    c.name AS censer_name,
    c.code AS censer_code,
    COUNT(a.id) FILTER (WHERE a.severity = 'critical') AS critical_count,
    COUNT(a.id) FILTER (WHERE a.severity = 'warning') AS warning_count,
    COUNT(a.id) AS total_count
FROM censers c
LEFT JOIN alerts a ON a.censer_id = c.id AND a.acknowledged = FALSE
GROUP BY c.id, c.name, c.code;

-- ============================================================
-- 视图：香炉稳定性统计（1小时窗口）
-- ============================================================
CREATE OR REPLACE VIEW v_stability_stats AS
SELECT
    c.id AS censer_id,
    c.name AS censer_name,
    c.code AS censer_code,
    COUNT(sd.id) AS data_points,
    AVG(sd.body_tilt) AS avg_tilt,
    MAX(sd.body_tilt) AS max_tilt,
    MIN(sd.balance_score) AS min_balance_score,
    AVG(sd.balance_score) AS avg_balance_score,
    AVG(sd.spill_risk) AS avg_spill_risk,
    MAX(sd.spill_risk) AS max_spill_risk
FROM censers c
LEFT JOIN sensor_data sd ON sd.censer_id = c.id
    AND sd.time > NOW() - INTERVAL '1 hour'
GROUP BY c.id, c.name, c.code;

-- ============================================================
-- 连续聚合：5分钟平衡指标聚合
-- ============================================================
SELECT create_hypertable(
    'sensor_data',
    'time',
    if_not_exists => TRUE
);

CREATE MATERIALIZED VIEW IF NOT EXISTS sensor_data_5m
WITH (timescaledb.continuous) AS
SELECT
    censer_id,
    time_bucket('5 minutes', time) AS bucket,
    AVG(inner_ring_angle) AS avg_inner_ring_angle,
    MAX(ABS(inner_ring_angle)) AS max_inner_ring_angle,
    AVG(outer_ring_angle) AS avg_outer_ring_angle,
    MAX(ABS(outer_ring_angle)) AS max_outer_ring_angle,
    AVG(body_tilt) AS avg_body_tilt,
    MAX(ABS(body_tilt)) AS max_body_tilt,
    AVG(slosh_acceleration) AS avg_slosh_acceleration,
    MAX(slosh_acceleration) AS max_slosh_acceleration,
    AVG(balance_score) AS avg_balance_score,
    MIN(balance_score) AS min_balance_score,
    AVG(spill_risk) AS avg_spill_risk,
    MAX(spill_risk) AS max_spill_risk,
    COUNT(*) AS sample_count
FROM sensor_data
GROUP BY censer_id, time_bucket('5 minutes', time)
WITH NO DATA;

-- 启用实时聚合
ALTER MATERIALIZED VIEW sensor_data_5m SET (timescaledb.materialized_only = false);

-- ============================================================
-- 初始数据：插入示例香炉
-- ============================================================
INSERT INTO censers (name, code, description) VALUES
    ('唐代葡萄花鸟纹银熏球', 'CENSER-001', '陕西历史博物馆藏，直径约4.6cm，1970年西安何家村出土'),
    ('唐代鎏金鸿雁纹银熏球', 'CENSER-002', '法门寺地宫出土，鎏金工艺，饰鸿雁纹'),
    ('复原模型A型', 'CENSER-003', '工艺史团队复原研究模型，标准万向平衡结构')
ON CONFLICT (code) DO NOTHING;

-- 为每个香炉创建默认仿真配置
INSERT INTO simulation_configs (censer_id)
SELECT id FROM censers
WHERE id NOT IN (SELECT censer_id FROM simulation_configs);

-- ============================================================
-- 自动更新时间戳触发器
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS censers_update_updated_at ON censers;
CREATE TRIGGER censers_update_updated_at
    BEFORE UPDATE ON censers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS configs_update_updated_at ON simulation_configs;
CREATE TRIGGER configs_update_updated_at
    BEFORE UPDATE ON simulation_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 连续聚合：1小时聚合
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS sensor_data_1h
WITH (timescaledb.continuous) AS
SELECT
    censer_id,
    time_bucket('1 hour', time) AS bucket,
    AVG(inner_ring_angle) AS avg_inner_ring_angle,
    MAX(ABS(inner_ring_angle)) AS max_inner_ring_angle,
    AVG(outer_ring_angle) AS avg_outer_ring_angle,
    MAX(ABS(outer_ring_angle)) AS max_outer_ring_angle,
    AVG(body_tilt) AS avg_body_tilt,
    MAX(ABS(body_tilt)) AS max_body_tilt,
    AVG(slosh_acceleration) AS avg_slosh_acceleration,
    MAX(slosh_acceleration) AS max_slosh_acceleration,
    AVG(balance_score) AS avg_balance_score,
    MIN(balance_score) AS min_balance_score,
    AVG(spill_risk) AS avg_spill_risk,
    MAX(spill_risk) AS max_spill_risk,
    COUNT(*) AS sample_count
FROM sensor_data
GROUP BY censer_id, time_bucket('1 hour', time)
WITH NO DATA;

ALTER MATERIALIZED VIEW sensor_data_1h SET (timescaledb.materialized_only = false);

-- ============================================================
-- 连续聚合：1天聚合
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS sensor_data_1d
WITH (timescaledb.continuous) AS
SELECT
    censer_id,
    time_bucket('1 day', time) AS bucket,
    AVG(inner_ring_angle) AS avg_inner_ring_angle,
    MAX(ABS(inner_ring_angle)) AS max_inner_ring_angle,
    AVG(outer_ring_angle) AS avg_outer_ring_angle,
    MAX(ABS(outer_ring_angle)) AS max_outer_ring_angle,
    AVG(body_tilt) AS avg_body_tilt,
    MAX(ABS(body_tilt)) AS max_body_tilt,
    AVG(slosh_acceleration) AS avg_slosh_acceleration,
    MAX(slosh_acceleration) AS max_slosh_acceleration,
    AVG(balance_score) AS avg_balance_score,
    MIN(balance_score) AS min_balance_score,
    AVG(spill_risk) AS avg_spill_risk,
    MAX(spill_risk) AS max_spill_risk,
    COUNT(*) AS sample_count
FROM sensor_data
GROUP BY censer_id, time_bucket('1 day', time)
WITH NO DATA;

ALTER MATERIALIZED VIEW sensor_data_1d SET (timescaledb.materialized_only = false);

-- ============================================================
-- 数据保留策略
-- ============================================================
-- 原始数据：保留7天
SELECT add_retention_policy('sensor_data', INTERVAL '7 days', if_not_exists => TRUE);

-- 5分钟聚合：保留30天
SELECT add_retention_policy('sensor_data_5m', INTERVAL '30 days', if_not_exists => TRUE);

-- 1小时聚合：保留1年
SELECT add_retention_policy('sensor_data_1h', INTERVAL '1 year', if_not_exists => TRUE);

-- 1天聚合：永久保留（不设置保留策略）

-- ============================================================
-- 连续聚合自动刷新策略
-- ============================================================
-- 5分钟聚合：每5分钟刷新一次，刷新最近1小时数据
SELECT add_continuous_aggregate_policy(
    'sensor_data_5m',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes',
    if_not_exists => TRUE
);

-- 1小时聚合：每30分钟刷新一次，刷新最近6小时数据
SELECT add_continuous_aggregate_policy(
    'sensor_data_1h',
    start_offset => INTERVAL '6 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '30 minutes',
    if_not_exists => TRUE
);

-- 1天聚合：每6小时刷新一次，刷新最近2天数据
SELECT add_continuous_aggregate_policy(
    'sensor_data_1d',
    start_offset => INTERVAL '2 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '6 hours',
    if_not_exists => TRUE
);

-- ============================================================
-- 告警数据保留策略
-- ============================================================
-- 注意：alerts 表非hypertable，保留策略需通过pg_cron定期清理
-- 建议保留90天告警记录，以下SQL可配合pg_cron使用：
-- SELECT cron.schedule('clean-old-alerts', '0 2 * * *', 
--   $$DELETE FROM alerts WHERE created_at < NOW() - INTERVAL ''90 days'';$$);
-- ============================================================

-- ============================================================
-- 压缩策略（可选，节省存储空间）
-- ============================================================
-- 原始数据：3天后压缩
-- 注意：压缩后数据为只读，会影响某些查询性能
-- SELECT add_compression_policy('sensor_data', INTERVAL '3 days', if_not_exists => TRUE);

-- ============================================================
-- 数据降采样层级总结
-- ============================================================
-- | 聚合粒度 | 保留时长  | 刷新间隔  |
-- |----------|-----------|-----------|
-- | raw      | 7天       | -         |
-- | 5分钟    | 30天      | 5分钟     |
-- | 1小时    | 1年       | 30分钟    |
-- | 1天      | 永久      | 6小时     |
-- ============================================================

-- ============================================================
-- Feature 扩展: 古代常平架装置信息表
-- ============================================================
CREATE TABLE IF NOT EXISTS gimbal_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_code VARCHAR(64) UNIQUE NOT NULL,
    device_type VARCHAR(64) NOT NULL,
    name VARCHAR(256) NOT NULL,
    dynasty VARCHAR(128),
    origin VARCHAR(256),
    rings_count INTEGER NOT NULL DEFAULT 3,
    description TEXT,
    historical_note TEXT,
    era_tag VARCHAR(32) NOT NULL DEFAULT 'ancient_china',
    mechanical_params JSONB,
    aesthetic_config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gimbal_devices_era ON gimbal_devices(era_tag);
CREATE INDEX IF NOT EXISTS idx_gimbal_devices_type ON gimbal_devices(device_type);

-- ============================================================
-- Feature 扩展: 装置对比分析结果表
-- ============================================================
CREATE TABLE IF NOT EXISTS device_balance_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(128) UNIQUE NOT NULL,
    motion_profile VARCHAR(64) NOT NULL,
    duration_sec FLOAT8 NOT NULL DEFAULT 10,
    time_step_ms FLOAT8 NOT NULL DEFAULT 16,
    device_codes VARCHAR(128) NOT NULL,
    ranking_summary JSONB,
    analysis_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comparisons_profile ON device_balance_comparisons(motion_profile);
CREATE INDEX IF NOT EXISTS idx_comparisons_created ON device_balance_comparisons(created_at DESC);

-- ============================================================
-- Feature 扩展: 跨时代对比结果表
-- ============================================================
CREATE TABLE IF NOT EXISTS cross_era_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(256),
    ancient_device_codes VARCHAR(256) NOT NULL,
    modern_device_codes VARCHAR(256) NOT NULL,
    motion_profile VARCHAR(64),
    dimensions JSONB,
    ancient_summary JSONB,
    modern_summary JSONB,
    overall_score JSONB,
    historical_intro TEXT,
    philosophy_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cross_era_created ON cross_era_comparisons(created_at DESC);

-- ============================================================
-- Feature 扩展: 香料粘度扫描结果表
-- ============================================================
CREATE TABLE IF NOT EXISTS viscosity_scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_code VARCHAR(64) NOT NULL,
    motion_profile VARCHAR(64) NOT NULL,
    temperature_c FLOAT8 NOT NULL DEFAULT 25,
    fill_ratio FLOAT8 NOT NULL DEFAULT 0.55,
    scan_points JSONB NOT NULL,
    optimal_viscosity_pas FLOAT8,
    critical_viscosity_pas FLOAT8,
    fit_equation VARCHAR(256),
    correlation_r2 FLOAT8,
    recommendation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_viscosity_device ON viscosity_scan_results(device_code);
CREATE INDEX IF NOT EXISTS idx_viscosity_profile ON viscosity_scan_results(motion_profile);

-- ============================================================
-- Feature 扩展: 虚拟体验会话表
-- ============================================================
CREATE TABLE IF NOT EXISTS virtual_experience_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(128) UNIQUE NOT NULL,
    user_id VARCHAR(128),
    device_code VARCHAR(64) NOT NULL,
    motion_mode VARCHAR(64) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_sec FLOAT8,
    total_frames BIGINT,
    avg_balance_score FLOAT8,
    spill_events INTEGER,
    longest_streak_sec FLOAT8,
    final_level VARCHAR(128),
    achievement_tags VARCHAR(256),
    max_intensity FLOAT8,
    summary_chart JSONB,
    params JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exp_token ON virtual_experience_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_exp_device ON virtual_experience_sessions(device_code);
CREATE INDEX IF NOT EXISTS idx_exp_started ON virtual_experience_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_exp_level ON virtual_experience_sessions(final_level);

-- ============================================================
-- 体验成就排行榜视图
-- ============================================================
CREATE OR REPLACE VIEW v_experience_leaderboard AS
SELECT
    ROW_NUMBER() OVER (
        ORDER BY (avg_balance_score * 100 - spill_events * 15 + COALESCE(longest_streak_sec,0)) DESC
    ) AS rank,
    id,
    COALESCE(user_id, '匿名访客') AS user_name,
    device_code,
    motion_mode,
    final_level,
    ROUND(COALESCE(avg_balance_score,0)*100, 1) AS balance_score_100,
    COALESCE(spill_events, 0) AS spill_events,
    ROUND(COALESCE(longest_streak_sec,0), 1) AS longest_streak_sec,
    ROUND(COALESCE(duration_sec,0), 0) AS duration_sec,
    achievement_tags,
    started_at
FROM virtual_experience_sessions
WHERE ended_at IS NOT NULL AND duration_sec > 30
ORDER BY rank ASC
LIMIT 100;

-- ============================================================
-- 扩展触发器
-- ============================================================
DROP TRIGGER IF EXISTS devices_update_updated_at ON gimbal_devices;
CREATE TRIGGER devices_update_updated_at
    BEFORE UPDATE ON gimbal_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 初始化装置预设（如无数据时）
-- ============================================================
INSERT INTO gimbal_devices (device_code, device_type, name, dynasty, origin, rings_count, era_tag, description, historical_note)
VALUES
    ('DEV-CENSER', 'incense_censer', '被中香炉（三环常平架）', '唐代 公元618-907年', '陕西西安何家村窖藏', 3, 'ancient_china',
     '银质球形熏炉，三重嵌套环+宝石轴承，万向平衡机构最早实物之一。',
     '体现唐代工匠对"常平"原理的深刻理解，比卡尔达诺环早约800年。'),
    ('DEV-JIN', 'bronze_jin', '云纹铜禁承托（双环常平架）', '春秋晚期 约公元前550年', '河南淅川下寺楚墓', 2, 'ancient_china',
     '失蜡法铸造青铜酒器承托台，双层嵌套环支撑酒樽防倾覆。',
     '迄今所见最早的失蜡法铸件之一，双层常平结构用于礼仪场合。'),
    ('DEV-ARMILLARY', 'armillary_mount', '浑仪万向支架（多环嵌套）', '北宋 公元1088年 苏颂水运仪象台', '北宋汴京', 4, 'ancient_china',
     '苏颂、韩公廉研制天文仪器支架，四重嵌套环保证观测轴稳定。',
     '常平原理是现代航空陀螺仪的直接先驱。'),
    ('DEV-GYRO', 'modern_gyro', '现代航空姿态陀螺仪（磁浮轴承）', '21世纪', '当代航空航天工业', 3, 'modern',
     '高转速转子+磁悬浮轴承，三轴常平架+电子姿态解算。',
     '现代陀螺精度比唐代香炉提高了约8个数量级。')
ON CONFLICT (device_code) DO NOTHING;

-- ============================================================
-- Feature 扩展总结
-- ============================================================
-- 新增表:
--   gimbal_devices                古代/现代常平装置元信息
--   device_balance_comparisons   装置对比分析结果
--   cross_era_comparisons        跨时代对比结果
--   viscosity_scan_results       香料粘度扫描结果
--   virtual_experience_sessions  公众虚拟体验会话
--   v_experience_leaderboard     体验成就排行榜
-- ============================================================
