# 古代被中香炉（银熏球）万向平衡机构仿真与抗晃荡分析系统

> 唐代葡萄花鸟纹银熏球 - 工艺史研究数字化仿真平台

基于多刚体动力学与流体力学的古代万向平衡机构数字化仿真系统，支持实时传感器数据接入、平衡性能评估、抗晃荡分析和智能告警。

---

## 目录

- [系统架构](#系统架构)
- [技术栈](#技术栈)
- [核心功能](#核心功能)
- [快速开始](#快速开始)
- [本地开发](#本地开发)
- [模拟器使用](#模拟器使用)
- [监控与调优](#监控与调优)
- [目录结构](#目录结构)

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Nginx (Gzip 压缩)                            │
│                  静态资源 / 反向代理 / WebSocket                      │
└───────────┬──────────────────────────────────┬──────────────────────┘
            │                                  │
            ▼                                  ▼
┌──────────────────────┐           ┌──────────────────────┐
│   前端 Three.js      │           │    Go Backend API    │
│  incense_burner_3d.js│           │  gimbal_panel.js    │
└──────────────────────┘           └──────────┬───────────┘
                                               │
                        ┌──────────────────────┼──────────────────────┐
                        │                      │                      │
                ┌───────▼───────┐    ┌───────▼───────┐    ┌───────▼───────┐
                │  dtu_receiver │    │   alarm_ws    │    │  Prometheus   │
                │  (数据采集校验)│    │  (告警+WS推送) │    │  (指标采集)    │
                └───────┬───────┘    └───────▲───────┘    └───────────────┘
                        │                      │
                        ▼                      │
                ┌───────────────┐              │
                │   MQTT Bus    │    SloshResultCh
                │  (Mosquitto)  │              │
                └───────▲───────┘              │
                        │                      │
                        │              ┌───────┴───────┐
                        │              │ slosh_analyzer│
                        │              │ (洒香概率评估) │
                        │              └───────▲───────┘
                        │                      │
                ┌───────┴───────┐              │
                │   模拟器       │    BalanceResultCh
                │ (Python)       │              │
                └───────────────┘              │
                                       ┌───────▼───────┐
                                       │gimbal_simulator│
                                       │ (多刚体动力学) │
                                       └───────┬───────┘
                                               │
                                       ┌───────▼───────┐
                                       │  TimescaleDB  │
                                       │ (降采样+保留) │
                                       └───────────────┘
```

### 后端微服务架构（Channel 通信）

```
 传感器数据
     │
     ▼
┌──────────────┐     SensorRawCh     ┌──────────────────┐
│ dtu_receiver │ ──────────────────▶ │ gimbal_simulator │
│  采集+校验   │                     │  多刚体动力学    │
└──────────────┘                     └────────┬─────────┘
                                              │
                                    BalanceResultCh
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │  slosh_analyzer  │
                                    │  频率响应分析     │
                                    └────────┬─────────┘
                                              │
                                     SloshResultCh
                                              │
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                    ┌───────────────┐               ┌───────────────┐
                    │   alarm_ws    │               │   PersistCh   │
                    │  告警判定+WS  │               │  异步写入DB   │
                    └───────────────┘               └───────┬───────┘
                                                            │
                                                            ▼
                                                    ┌───────────────┐
                                                    │  TimescaleDB  │
                                                    └───────────────┘
```

### 数据降采样层级

| 聚合粒度 | 保留时长 | 刷新间隔 | 典型用途 |
|---------|---------|---------|---------|
| 原始数据 | 7天 | - | 实时监控、告警判定 |
| 5分钟 | 30天 | 5分钟 | 小时级趋势分析 |
| 1小时 | 1年 | 30分钟 | 日级报表、趋势分析 |
| 1天 | 永久 | 6小时 | 年度研究、长期对比 |

---

## 技术栈

### 后端
- **Go 1.21** - 高性能后端服务
- **Gin** - Web 框架
- **TimescaleDB** - 时序数据库（基于 PostgreSQL）
- **Mosquitto** - MQTT 消息代理
- **Prometheus** - 指标监控
- **pprof** - Go 性能分析

### 前端
- **Three.js** - 3D 渲染
- **Canvas API** - 数据图表
- **WebSocket** - 实时数据推送

### 运维
- **Docker** - 容器化部署
- **docker-compose** - 服务编排
- **Nginx** - 反向代理 + Gzip 压缩

---

## 核心功能

### 1. 万向平衡机构仿真
- 基于多刚体动力学的三环常平架模型
- 陀螺力矩修正，解决高速章动问题
- 实时平衡评分计算（0~1）

### 2. 抗晃荡分析
- 单自由度受迫振动频率响应模型
- 斯托克斯流体阻尼（香料粘度影响）
- 洒香概率评估（5级风险）
- 6种运动工况：步行/骑马/奔跑/乘车/抬轿/静止

### 3. 实时告警
- 三级告警（info/warning/critical）
- 倾角超限告警
- 平衡失效告警
- 洒香高风险告警
- 30秒冷却去重机制
- WebSocket 实时推送

### 4. 数据采集
- HTTP API 接入
- MQTT 协议接入（支持多设备）
- 参数校验与设备认证
- 异步持久化

### 5. 3D 可视化
- 三层嵌套万向环透明线框渲染
- 实时姿态同步
- 深度排序保证渲染正确
- 鼠标交互（旋转/缩放）

---

## 快速开始

### 环境要求
- Docker 20.10+
- docker-compose 2.0+
- 至少 2GB 可用内存

### 一键启动

```bash
# 1. 克隆项目
git clone <repository_url>
cd AI_solo_coder_task_A_152

# 2. 复制环境变量配置
cp .env.example .env

# 3. 启动所有服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f backend
```

### 访问地址

启动成功后，访问以下地址：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端系统 | http://localhost/ | 主界面（Nginx 代理） |
| 后端 API | http://localhost:8080/api/v1/health | 健康检查 |
| WebSocket | ws://localhost/ws | 实时数据推送 |
| Prometheus | http://localhost:9090 | 指标监控 |
| pprof | http://localhost:8080/debug/pprof/ | Go 性能分析 |
| MQTT | localhost:1883 | MQTT Broker |
| 数据库 | localhost:5432 | TimescaleDB |

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（慎用！）
docker-compose down -v
```

---

## 本地开发

### 后端开发

```bash
cd backend

# 安装依赖
go mod download

# 运行
go run .

# 构建
go build -o censer-sim .

# 运行 pprof
go tool pprof http://localhost:8080/debug/pprof/profile?seconds=30
```

### 前端开发

直接用浏览器打开 `frontend/index.html`，或使用任何静态文件服务器：

```bash
cd frontend
python -m http.server 8000
# 访问 http://localhost:8000
```

### 数据库初始化

```bash
# 使用 docker-compose 自动初始化
docker-compose up -d timescaledb

# 或手动执行
psql -U censer -d censer_simulation -f db/init.sql
```

---

## 模拟器使用

### 快速运行（Docker）

```bash
# 使用 docker-compose 启动模拟器
docker-compose up -d simulator

# 查看模拟器日志
docker-compose logs -f simulator
```

### 本地运行

```bash
cd simulator

# 安装依赖
pip install -r requirements.txt

# 基础运行
python censer_simulator.py

# 快速演示模式（1秒间隔）
python censer_simulator.py --fast

# 指定运动模式
python censer_simulator.py -m horse_riding

# MQTT 上报模式
python censer_simulator.py --mqtt-broker tcp://localhost:1883 --mqtt-only

# 自定义颠簸参数
python censer_simulator.py --frequency 5.0 --amplitude 3.0
```

### 命令行参数

| 参数 | 简称 | 默认值 | 说明 |
|------|------|--------|------|
| `--censer` | `-c` | CENSER-001 | 香炉设备编号 |
| `--api` | `-a` | http://localhost:8080/api/v1 | 后端API地址，空字符串禁用HTTP |
| `--interval` | `-i` | 60 | 上报间隔（秒） |
| `--motion` | `-m` | walking | 运动模式 |
| `--number` | `-n` | 无限 | 运行指定次数后停止 |
| `--fast` | - | - | 快速模式（1秒间隔） |
| `--mqtt-broker` | - | - | MQTT Broker 地址 |
| `--mqtt-topic` | - | censer/sensor | MQTT 主题前缀 |
| `--mqtt-only` | - | - | 仅使用MQTT上报，禁用HTTP |
| `--frequency` | - | - | 自定义颠簸频率（Hz），覆盖运动模式 |
| `--amplitude` | - | - | 自定义颠簸幅度（g），覆盖运动模式 |
| `--multi` | - | 1 | 同时模拟多个香炉（1-3） |

### 运动模式

| 模式 | 频率 | 幅度 | 典型场景 |
|------|------|------|---------|
| `walking` | 2.0 Hz | 0.5 g | 步行 |
| `horse_riding` | 4.0 Hz | 2.0 g | 骑马 |
| `running` | 6.0 Hz | 1.5 g | 奔跑 |
| `car_ride` | 8.0 Hz | 1.0 g | 乘车 |
| `sedan_chair` | 1.5 Hz | 0.8 g | 抬轿 |
| `static` | 0.1 Hz | 0.05 g | 静止 |
| `violent` | 10.0 Hz | 5.0 g | 剧烈颠簸 |

### MQTT 消息格式

Topic: `censer/sensor/{censer_code}`

```json
{
  "censer_code": "CENSER-001",
  "inner_ring_angle": 5.234,
  "outer_ring_angle": -3.124,
  "body_tilt": 8.567,
  "slosh_acceleration": 1.234,
  "inner_ring_velocity": 0.123,
  "outer_ring_velocity": -0.045,
  "body_angular_velocity": 0.067,
  "temperature": 65.5,
  "timestamp": 1718956800
}
```

---

## 监控与调优

### Prometheus 指标

访问 `http://localhost:9090` 查看 Prometheus 控制台。

核心指标：

| 指标名 | 类型 | 说明 |
|--------|------|------|
| `censer_http_requests_total` | Counter | HTTP 请求总数 |
| `censer_http_request_duration_seconds` | Histogram | HTTP 请求延迟 |
| `censer_sensor_data_received_total` | Counter | 传感器数据接收量 |
| `censer_alerts_triggered_total` | Counter | 告警触发数 |
| `censer_balance_score` | Gauge | 平衡分数 |
| `censer_spill_risk` | Gauge | 洒香风险 |
| `censer_body_tilt_degrees` | Gauge | 炉体倾角 |
| `censer_websocket_clients` | Gauge | WebSocket 连接数 |
| `censer_mqtt_messages_received_total` | Counter | MQTT 消息数 |

### pprof 性能分析

访问 `http://localhost:8080/debug/pprof/` 查看 pprof 端点。

常用命令：

```bash
# CPU 分析（30秒）
go tool pprof http://localhost:8080/debug/pprof/profile?seconds=30

# 内存分析
go tool pprof http://localhost:8080/debug/pprof/heap

# goroutine 分析
go tool pprof http://localhost:8080/debug/pprof/goroutine

# 生成火焰图
go tool pprof -http=:8081 <profile_file>
```

---

## 目录结构

```
AI_solo_coder_task_A_152/
├── backend/                    # Go 后端服务
│   ├── main.go                 # 入口文件
│   ├── Dockerfile              # 多阶段构建
│   ├── config/                 # 配置文件
│   │   ├── mechanical_params.json  # 机构参数
│   │   ├── fluid_params.json       # 流体参数
│   │   └── loader.go               # 配置加载器
│   ├── services/               # 业务服务
│   │   ├── message_bus.go      # 消息总线（Channel）
│   │   ├── dtu_receiver.go     # 数据采集与校验
│   │   ├── mqtt_receiver.go    # MQTT 接收
│   │   ├── gimbal_simulator.go # 多刚体动力学
│   │   ├── slosh_analyzer.go   # 洒香分析
│   │   └── alarm_ws.go         # 告警+WebSocket
│   ├── handlers/               # HTTP 处理器
│   ├── middleware/             # 中间件
│   │   └── gzip.go             # Gzip 压缩
│   ├── metrics/                # Prometheus 指标
│   │   └── metrics.go
│   ├── database/               # 数据访问层
│   ├── models/                 # 数据模型
│   └── simulation/             # 仿真算法
├── frontend/                   # 前端
│   ├── index.html
│   ├── app.js                  # 入口
│   └── js/
│       ├── incense_burner_3d.js   # Three.js 3D 渲染
│       └── gimbal_panel.js        # 数据面板与交互
├── simulator/                  # Python 模拟器
│   ├── censer_simulator.py
│   ├── requirements.txt
│   └── Dockerfile
├── db/                         # 数据库脚本
│   └── init.sql                # 初始化+降采样配置
├── docker/                     # Docker 配置
│   ├── mosquitto/              # MQTT Broker 配置
│   ├── nginx/                  # Nginx 配置
│   └── prometheus/             # Prometheus 配置
├── docker-compose.yml          # 服务编排
├── .env.example                # 环境变量示例
└── README.md                   # 本文件
```

---

## API 端点一览

### 配置
- `GET /api/v1/config/mechanical` - 机构参数
- `GET /api/v1/config/fluid` - 流体参数
- `GET /api/v1/config/motion-profiles` - 运动模式
- `GET /api/v1/config/formulas` - 香料配方

### 设备
- `GET /api/v1/censers` - 香炉列表
- `GET /api/v1/censers/:id/config` - 仿真配置

### 传感器数据
- `POST /api/v1/sensor-data` - 上报数据
- `GET /api/v1/sensor-data/latest` - 最新数据
- `GET /api/v1/censers/:id/sensor-data` - 历史数据

### 分析
- `POST /api/v1/censers/:id/slosh-analysis` - 抗晃荡分析
- `GET /api/v1/censers/:id/slosh-analysis` - 分析历史
- `GET /api/v1/censers/:id/frequency-response` - 频率响应
- `POST /api/v1/censers/:id/gimbal-simulation` - 平衡仿真

### 告警
- `GET /api/v1/alerts/active` - 活动告警
- `GET /api/v1/censers/:id/alerts` - 告警历史
- `POST /api/v1/alerts/:id/acknowledge` - 确认告警

### 系统
- `GET /api/v1/health` - 健康检查
- `GET /metrics` - Prometheus 指标
- `GET /debug/pprof/` - pprof 分析
- `GET /ws` - WebSocket 连接

---

## License

MIT License
