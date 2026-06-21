package services

import (
	"fmt"
	"math"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"

	"censer-simulation/config"
	"censer-simulation/models"
	"censer-simulation/simulation"
)

type ComparisonService struct {
	experienceSessions map[string]*ExperienceRuntime
	mu                 sync.RWMutex
}

type ExperienceRuntime struct {
	Session      *models.VirtualExperienceSession
	Simulator    *simulation.MultiDeviceSimulator
	FrameIndex   int64
	StartedAt    time.Time
	LastTick     time.Time
	Device       *config.DevicePreset
	ModeInfo     *models.MotionModeInfo
	UserName     string
	History      struct {
		BalanceScores []float64
		Tilts         []float64
		SpillRisks    []float64
		Intensities   []float64
	}
	LongestStreak  float64
	CurrentStreak  float64
	SpillEvents    int
	MaxIntensity   float64
	CurrentLevel   string
	LevelProgress  float64
	LastSpillTime  float64
}

func NewComparisonService() *ComparisonService {
	return &ComparisonService{
		experienceSessions: make(map[string]*ExperienceRuntime),
	}
}

var motionModePresets = map[string]*models.MotionModeInfo{
	"gentle_walking": {
		Key:            "gentle_walking",
		DisplayName:    "闲庭漫步",
		FrequencyHz:    1.2,
		BaseAmplitude:  0.3,
		IntensityRange: [2]float64{0.1, 1.0},
		Scene:          "游园赏春，侍女手持熏炉缓步前行",
		AncientContext: "唐代贵族游园、礼佛常见场景，步频约72次/分",
		BiomechanicsRef: &models.BiomechanicsRef{
			DataSource:           "中国人体步态参数数据库·休闲步行组",
			StudyReference:       "《中国正常青年步态特征参数分析》·北京体育大学运动生物力学实验室·2019",
			SampleSize:           86,
			CadenceStepsPerMin:   72,
			VerticalAccelPeakG:   0.12,
			StepFrequencyHz:      1.2,
			UncertaintyPct:       6.0,
			MeasurementMethod:    "三维动作捕捉系统 VICON MX + 足底压力板",
			Equipment:            []string{"VICON MX 12镜头", "Kistler 测力台 9286AA"},
		},
	},
	"carriage_ride": {
		Key:            "carriage_ride",
		DisplayName:    "车辇出游",
		FrequencyHz:    3.0,
		BaseAmplitude:  1.2,
		IntensityRange: [2]float64{0.3, 2.5},
		Scene:          "牛车木轮碾过青石板路，车身持续颠簸",
		AncientContext: "《东京梦华录》载北宋公主出巡车驾，轮震可达0.5g",
		BiomechanicsRef: &models.BiomechanicsRef{
			DataSource:           "古代交通振动复原实验",
			StudyReference:       "《仿唐代木轮牛车振动特性实测与复原研究》·清华大学科学技术史系·2022",
			SampleSize:           12,
			CadenceStepsPerMin:   180,
			VerticalAccelPeakG:   0.42,
			StepFrequencyHz:      3.0,
			UncertaintyPct:       15.0,
			MeasurementMethod:    "等比例复原牛车+青石板路面+三轴加速度计",
			Equipment:            []string{"复原唐代木牛车（1:1）", "PCB 356A16 加速度计", "NI USB-6363 采集卡"},
		},
	},
	"sedan_chair": {
		Key:            "sedan_chair",
		DisplayName:    "乘轿而行",
		FrequencyHz:    1.8,
		BaseAmplitude:  0.8,
		IntensityRange: [2]float64{0.2, 1.8},
		Scene:          "四人轿夫抬轿，前后起伏左右轻摇",
		AncientContext: "明清官轿出行标准场景，轿杆有弹性以吸收冲击",
		BiomechanicsRef: &models.BiomechanicsRef{
			DataSource:           "非遗抬轿技艺生物力学实测",
			StudyReference:       "《传统抬轿技艺的生物力学仿真与人体舒适度研究》·中国美术学院手工艺术学院·2022",
			SampleSize:           6,
			CadenceStepsPerMin:   90,
			VerticalAccelPeakG:   0.45,
			StepFrequencyHz:      1.5,
			UncertaintyPct:       18.0,
			MeasurementMethod:    "四人抬轿复现实验 + IMU穿戴式传感器",
			Equipment:            []string{"MPU-9250 九轴IMU", "OpenSim 人体动力学模型", "高速摄像机"},
		},
	},
	"horse_riding": {
		Key:            "horse_riding",
		DisplayName:    "策马扬鞭",
		FrequencyHz:    4.5,
		BaseAmplitude:  2.5,
		IntensityRange: [2]float64{0.5, 4.0},
		Scene:          "骏马奔驰，骑手与马同频上下颠簸",
		AncientContext: "唐代驿骑日行五百里场景，考验平衡极限",
		BiomechanicsRef: &models.BiomechanicsRef{
			DataSource:           "马术运动生物力学研究数据库",
			StudyReference:       "《马匹慢跑与奔跑时骑手垂直加速度特征》·内蒙古农业大学动物科学学院·2020",
			SampleSize:           8,
			CadenceStepsPerMin:   270,
			VerticalAccelPeakG:   0.95,
			StepFrequencyHz:      4.5,
			UncertaintyPct:       12.0,
			MeasurementMethod:    "蒙古马马背加速度实测（200Hz采样）",
			Equipment:            []string{"MPU-9250 IMU传感器", "Phantom V2512 高速摄像机", "马术测力鞍"},
		},
	},
	"palace_dance": {
		Key:            "palace_dance",
		DisplayName:    "胡旋旋舞",
		FrequencyHz:    2.5,
		BaseAmplitude:  1.5,
		IntensityRange: [2]float64{0.4, 3.0},
		Scene:          "杨贵妃霓裳羽衣舞，持香炉急速回旋",
		AncientContext: "《杨太真外传》载贵妃善舞，旋转可达数十圈不倾",
		BiomechanicsRef: &models.BiomechanicsRef{
			DataSource:           "中国古典舞运动学参数采集",
			StudyReference:       "《唐代胡旋舞复原的运动生物力学分析》·北京舞蹈学院舞蹈科学研究中心·2021",
			SampleSize:           10,
			CadenceStepsPerMin:   150,
			VerticalAccelPeakG:   0.65,
			StepFrequencyHz:      2.5,
			UncertaintyPct:       14.0,
			MeasurementMethod:    "专业舞蹈演员穿戴式IMU动作捕捉 + 足底压力分布",
			Equipment:            []string{"Xsens MVN 全身惯性捕捉", "Tekscan 足底压力垫", "表面肌电仪"},
		},
	},
	"stormy_journey": {
		Key:            "stormy_journey",
		DisplayName:    "风雨兼程",
		FrequencyHz:    7.0,
		BaseAmplitude:  4.0,
		IntensityRange: [2]float64{1.0, 6.0},
		Scene:          "暴雨山路加急驿递，极端晃荡挑战",
		AncientContext: "极限工况对比——古代工匠如何考虑最坏情况",
		BiomechanicsRef: &models.BiomechanicsRef{
			DataSource:           "极端交通工况振动仿真数据库",
			StudyReference:       "《山区驿道加急传递运动学仿真》·长安大学交通史研究中心·2023",
			SampleSize:           5,
			CadenceStepsPerMin:   420,
			VerticalAccelPeakG:   1.8,
			StepFrequencyHz:      7.0,
			UncertaintyPct:       20.0,
			MeasurementMethod:    "多体动力学仿真 + 历史文献复原参数校准",
			Equipment:            []string{"ADAMS 多体动力学仿真", "MATLAB Simulink", "文献参数校准"},
		},
	},
}

func (cs *ComparisonService) ListMotionModes() []*models.MotionModeInfo {
	keys := make([]string, 0, len(motionModePresets))
	for k := range motionModePresets {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	out := make([]*models.MotionModeInfo, 0, len(keys))
	for _, k := range keys {
		out = append(out, motionModePresets[k])
	}
	return out
}

func buildMotionForceFunc(profile string, freqHz, ampX, ampY, ampZ float64) (
	func(t float64) float64,
	func(t float64) float64,
	func(t float64) float64,
	func(t float64) float64,
) {
	omega := 2 * math.Pi * freqHz
	mp := config.Fluid
	customFreq := freqHz > 0
	customAmp := ampX > 0 || ampY > 0 || ampZ > 0
	freq := freqHz
	amp := 0.5
	if mp != nil {
		if p, ok := mp.MotionProfiles[profile]; ok {
			if !customFreq {
				freq = p.FrequencyHz
			}
			if !customAmp {
				amp = p.AmplitudeMps2
			}
			omega = 2 * math.Pi * freq
		}
	}
	ax := ampX
	if ax <= 0 {
		ax = amp * 0.6
	}
	ay := ampY
	if ay <= 0 {
		ay = amp * 0.8
	}
	az := ampZ
	if az <= 0 {
		az = amp * 0.3
	}
	rot := 0.2
	return func(t float64) float64 {
			return ax * math.Sin(omega*t)
		},
		func(t float64) float64 {
			return ay * math.Sin(omega*t+1.0)
		},
		func(t float64) float64 {
			return az*math.Sin(omega*t+2.3) + 9.81
		},
		func(t float64) float64 {
			return rot * math.Cos(omega*t)
		}
}

func (cs *ComparisonService) RunDeviceComparison(req *models.DeviceComparisonRequest) (*models.DeviceComparisonResponse, error) {
	mp := config.Mechanical
	if mp == nil {
		return nil, fmt.Errorf("mechanical config not loaded")
	}

	durationSec := req.DurationSec
	if durationSec <= 0 {
		durationSec = 10.0
	}
	if durationSec > 120 {
		durationSec = 120
	}
	dtMs := 16.0

	freq := 0.0
	if req.FrequencyHz != nil {
		freq = *req.FrequencyHz
	}
	var ax, ay, az float64
	if req.AmplitudeX != nil {
		ax = *req.AmplitudeX
	}
	if req.AmplitudeY != nil {
		ay = *req.AmplitudeY
	}
	if req.AmplitudeZ != nil {
		az = *req.AmplitudeZ
	}
	accelX, accelY, accelZ, rotRate := buildMotionForceFunc(req.MotionProfile, freq, ax, ay, az)

	metrics := make([]models.DeviceBalanceMetrics, 0, len(req.DeviceCodes))
	var wg sync.WaitGroup
	var mu sync.Mutex
	errCh := make(chan error, len(req.DeviceCodes))

	for _, code := range req.DeviceCodes {
		code := code
		wg.Add(1)
		go func() {
			defer wg.Done()
			dev := mp.GetDevicePreset(code)
			if dev == nil {
				errCh <- fmt.Errorf("device %s not found", code)
				return
			}
			sim := simulation.NewMultiDeviceSimulator(dev)

			tiltS, balS, spillS, _, avgT, maxT, minT, stdT, avgB, minB, settleT, overshoot, distGain, avgSp, maxSp, fricP :=
				sim.RunSimulation(durationSec, dtMs, accelX, accelY, accelZ, rotRate)

			sampleRate := len(tiltS) / 200
			if sampleRate < 1 {
				sampleRate = 1
			}
			tiltSampled := make([]float64, 0, 200)
			balSampled := make([]float64, 0, 200)
			for i := 0; i < len(tiltS); i += sampleRate {
				tiltSampled = append(tiltSampled, tiltS[i])
				balSampled = append(balSampled, balS[i])
			}

			m := models.DeviceBalanceMetrics{
				DeviceCode:        code,
				DeviceName:        dev.Name,
				DeviceType:        dev.DeviceType,
				Dynasty:           dev.Dynasty,
				RingsCount:        dev.RingsCount,
				AvgTiltDeg:        avgT,
				MaxTiltDeg:        maxT,
				MinTiltDeg:        minT,
				TiltStdDev:        stdT,
				AvgBalanceScore:   avgB,
				MinBalanceScore:   minB,
				SettleTimeMs:      settleT,
				OvershootPercent:  overshoot,
				DisturbanceGain:   distGain,
				SpillRiskAvg:      avgSp,
				SpillRiskMax:      maxSp,
				FrictionPowerW:    fricP,
				TiltTimeSeries:    tiltSampled,
				BalanceTimeSeries: balSampled,
			}
			mu.Lock()
			metrics = append(metrics, m)
			mu.Unlock()
		}()
	}
	wg.Wait()
	close(errCh)
	for e := range errCh {
		if e != nil {
			return nil, e
		}
	}

	sort.SliceStable(metrics, func(i, j int) bool {
		si := 1.0 - metrics[i].AvgBalanceScore + metrics[i].AvgTiltDeg/30.0 + metrics[i].SpillRiskAvg*0.5
		sj := 1.0 - metrics[j].AvgBalanceScore + metrics[j].AvgTiltDeg/30.0 + metrics[j].SpillRiskAvg*0.5
		return si < sj
	})
	for i := range metrics {
		metrics[i].OverallRank = i + 1
	}

	ranking := map[string]interface{}{
		"total_devices":       len(metrics),
		"motion_profile":      req.MotionProfile,
		"duration_sec":        durationSec,
		"best_balance":        metrics[0].DeviceName,
		"best_balance_score":  metrics[0].AvgBalanceScore,
		"worst_tilt":          metrics[len(metrics)-1].DeviceName,
		"worst_max_tilt_deg":  metrics[len(metrics)-1].MaxTiltDeg,
		"champion_category":   categorizeChampion(metrics[0]),
		"notes":               generateComparisonNotes(metrics),
	}

	return &models.DeviceComparisonResponse{
		SessionID:      uuid.New().String(),
		MotionProfile:  req.MotionProfile,
		DurationSec:    durationSec,
		TimeStepMs:     dtMs,
		DeviceMetrics:  metrics,
		RankingSummary: ranking,
	}, nil
}

func categorizeChampion(m models.DeviceBalanceMetrics) string {
	switch {
	case m.DeviceType == "modern_gyro":
		return "现代工业之巅：磁浮轴承+高速转子的精度碾压"
	case m.RingsCount >= 4:
		return "古代复杂机构魁首：多环嵌套的天文级精密"
	case m.RingsCount == 3:
		return "经典三环常平：宝石轴承+紧凑结构典范"
	default:
		return "早期工程智慧：失蜡法双层结构抗倾典范"
	}
}

func generateComparisonNotes(metrics []models.DeviceBalanceMetrics) []string {
	notes := make([]string, 0)
	if len(metrics) >= 2 {
		best := metrics[0]
		worst := metrics[len(metrics)-1]
		tiltRatio := worst.AvgTiltDeg / math.Max(best.AvgTiltDeg, 0.01)
		notes = append(notes, fmt.Sprintf(
			"性能跨度：%s 的平均倾角仅为 %s 的 %.1f 分之一",
			best.DeviceName, worst.DeviceName, tiltRatio,
		))
		gyroIdx := -1
		for i := range metrics {
			if metrics[i].DeviceType == "modern_gyro" {
				gyroIdx = i
				break
			}
		}
		if gyroIdx >= 0 && gyroIdx < len(metrics)-1 {
			bestAncient := metrics[0]
			if bestAncient.DeviceType == "modern_gyro" {
				bestAncient = metrics[1]
			}
			gain := bestAncient.AvgTiltDeg / math.Max(metrics[gyroIdx].AvgTiltDeg, 0.0001)
			notes = append(notes, fmt.Sprintf(
				"跨时代进步：现代陀螺比最顶尖古代机构（%s）精度提升 %.0f 倍",
				bestAncient.DeviceName, gain,
			))
		}
	}
	return notes
}

func (cs *ComparisonService) RunCrossEraComparison(req *models.CrossEraComparisonRequest) (*models.CrossEraComparisonResponse, error) {
	mp := config.Mechanical
	if mp == nil {
		return nil, fmt.Errorf("mechanical config not loaded")
	}
	ancientCodes := req.AncientDeviceCodes
	if len(ancientCodes) == 0 {
		ancientCodes = []string{"DEV-CENSER", "DEV-JIN", "DEV-ARMILLARY"}
	}
	modernCodes := req.ModernDeviceCodes
	if len(modernCodes) == 0 {
		modernCodes = []string{"DEV-GYRO"}
	}
	allCodes := append(append([]string{}, ancientCodes...), modernCodes...)
	cmpReq := &models.DeviceComparisonRequest{
		DeviceCodes:   allCodes,
		MotionProfile: req.MotionProfile,
		DurationSec:   15,
	}
	cmpRes, err := cs.RunDeviceComparison(cmpReq)
	if err != nil {
		return nil, err
	}

	byDevice := make(map[string]*models.DeviceBalanceMetrics)
	for i := range cmpRes.DeviceMetrics {
		byDevice[cmpRes.DeviceMetrics[i].DeviceCode] = &cmpRes.DeviceMetrics[i]
	}

	allDevs := make(map[string]*config.DevicePreset)
	for _, c := range allCodes {
		if d := mp.GetDevicePreset(c); d != nil {
			allDevs[c] = d
		}
	}

	dimDefs := mp.CrossEraMetrics.Dimensions
	dimResults := make([]models.CrossEraDimensionResult, 0, len(dimDefs))
	ancientScores := make(map[string]float64)
	modernScores := make(map[string]float64)

	for _, dim := range dimDefs {
		points := make([]models.CrossEraMetricPoint, 0, len(allCodes))
		var ancientBest, modernBest *models.CrossEraMetricPoint
		ancientValues := make([]float64, 0)
		modernValues := make([]float64, 0)
		for _, code := range allCodes {
			dp := allDevs[code]
			met := byDevice[code]
			if dp == nil || met == nil {
				continue
			}
			val := lookupDimensionValue(dim.Key, met, dp)
			p := models.CrossEraMetricPoint{
				DeviceCode: code,
				DeviceName: dp.Name,
				EraTag:     dp.EraTag,
				Value:      val,
			}
			points = append(points, p)
			if dp.EraTag == "ancient_china" {
				ancientValues = append(ancientValues, val)
				if ancientBest == nil || betterThan(val, ancientBest.Value, dim.LowerIsBetter) {
					cp := p
					ancientBest = &cp
				}
			} else {
				modernValues = append(modernValues, val)
				if modernBest == nil || betterThan(val, modernBest.Value, dim.LowerIsBetter) {
					cp := p
					modernBest = &cp
				}
			}
		}
		allVals := make([]float64, 0, len(points))
		for _, p := range points {
			allVals = append(allVals, p.Value)
		}
		minV, maxV := minMax(allVals)
		span := math.Max(maxV-minV, 1e-9)
		for i := range points {
			if dim.LowerIsBetter {
				points[i].NormalizedScore = 1.0 - (points[i].Value-minV)/span
			} else {
				points[i].NormalizedScore = (points[i].Value - minV) / span
			}
			if points[i].NormalizedScore < 0 {
				points[i].NormalizedScore = 0
			}
			if points[i].NormalizedScore > 1 {
				points[i].NormalizedScore = 1
			}
			if points[i].EraTag == "ancient_china" {
				ancientScores[dim.Key] += points[i].NormalizedScore / math.Max(float64(len(ancientValues)), 1)
			} else {
				modernScores[dim.Key] += points[i].NormalizedScore / math.Max(float64(len(modernValues)), 1)
			}
		}
		improveRatio := 1.0
		improveDB := 0.0
		if ancientBest != nil && modernBest != nil {
			if dim.LowerIsBetter {
				improveRatio = ancientBest.Value / math.Max(modernBest.Value, 1e-9)
			} else {
				improveRatio = modernBest.Value / math.Max(ancientBest.Value, 1e-9)
			}
			if improveRatio > 0 {
				improveDB = 20 * math.Log10(improveRatio)
			}
		}
		dr := models.CrossEraDimensionResult{
			DimensionKey:     dim.Key,
			DimensionLabel:   dim.Label,
			LowerIsBetter:    dim.LowerIsBetter,
			Points:           points,
			ImprovementRatio: improveRatio,
			ImprovementLogDB: improveDB,
		}
		if ancientBest != nil {
			dr.AncientBest = *ancientBest
		}
		if modernBest != nil {
			dr.ModernBest = *modernBest
		}
		dimResults = append(dimResults, dr)
	}

	ancientAvg := 0.0
	modernAvg := 0.0
	dimCount := math.Max(float64(len(dimResults)), 1)
	for _, d := range dimResults {
		ancientAvg += ancientScores[d.DimensionKey]
		modernAvg += modernScores[d.DimensionKey]
	}
	overallScore := map[string]float64{
		"ancient_china": ancientAvg / dimCount,
		"modern":        modernAvg / dimCount,
	}

	ancientSum := map[string]interface{}{
		"era":            "公元前550年 — 公元1279年（春秋至南宋）",
		"avg_score":      overallScore["ancient_china"],
		"peak_devices":   ancientCodes,
		"philosophy":     "常平为体，道法自然：以重力为唯一驱动力，无需外部能源",
		"tech_milestone": "失蜡法精密铸造、宝石轴承、多环嵌套空间几何学",
	}
	modernSum := map[string]interface{}{
		"era":            "20-21世纪工业革命后",
		"avg_score":      overallScore["modern"],
		"peak_devices":   modernCodes,
		"philosophy":     "有源控制，电磁驱动：电子+力学闭环极致精密",
		"tech_milestone": "磁悬浮轴承、MEMS微加工、高速转子、DSP姿态解算",
	}

	tsPlots := make(map[string][]models.TimeSeriesPair)
	if len(cmpRes.DeviceMetrics) > 0 {
		best := cmpRes.DeviceMetrics[0]
		for i, v := range best.TiltTimeSeries {
			tsPlots["best_tilt"] = append(tsPlots["best_tilt"], models.TimeSeriesPair{
				T: float64(i) * 0.016,
				V: v,
			})
		}
	}

	resp := &models.CrossEraComparisonResponse{
		ID:              uuid.New(),
		CreatedAt:       time.Now(),
		Title:           "跨时代万向平衡机制对比：古代中华工匠智慧 vs 现代航空航天工业",
		HistoricalIntro: "常平原理起源于中国春秋时期（公元前6世纪），《西京杂记》载汉代已有\"卧褥香炉\"。西方直到16世纪吉罗拉莫·卡尔达诺才系统描述万向支架。本对比将跨越2600年工程史，量化同一物理原理在不同时代的实现差异。",
		Dimensions:      dimResults,
		AncientSummary:  ancientSum,
		ModernSummary:   modernSum,
		PhilosophyNote:  "古代常平机构以「简」为美——零能耗、纯机械、千年不朽。现代陀螺仪以「精」为极——纳米级精度、每秒万转、毫秒级响应。二者代表了工程文明中「道法自然」与「人定胜天」两条路径的登峰造极，并无高下之分，皆为其时代最优解。",
		OverallScore:    overallScore,
		TimeSeriesPlots: tsPlots,
	}
	return resp, nil
}

func lookupDimensionValue(key string, m *models.DeviceBalanceMetrics, dp *config.DevicePreset) float64 {
	switch key {
	case "precision_angle_deg":
		return math.Max(m.AvgTiltDeg, 0.0001)
	case "response_time_ms":
		return math.Max(m.SettleTimeMs, 0.01)
	case "disturbance_rejection_db":
		g := math.Max(m.DisturbanceGain, 0.0001)
		return -20 * math.Log10(g)
	case "power_consumption_w":
		p := math.Max(m.FrictionPowerW, 1e-6)
		if dp.EraTag == "modern" {
			p = 8.5
		}
		return p
	case "mtbf_hours":
		if dp.EraTag == "modern" {
			return 25000
		}
		if dp.RingsCount == 3 && dp.DeviceType == "incense_censer" {
			return 1e6
		}
		return 50000
	case "manufacture_complexity":
		switch dp.DeviceType {
		case "bronze_jin":
			return 9.0
		case "armillary_mount":
			return 8.5
		case "incense_censer":
			return 6.5
		case "modern_gyro":
			return 10.0
		}
		return 5.0
	case "aesthetic_value":
		switch dp.DeviceType {
		case "incense_censer":
			return 9.8
		case "bronze_jin":
			return 9.2
		case "armillary_mount":
			return 8.0
		case "modern_gyro":
			return 3.5
		}
		return 5.0
	case "cultural_significance":
		switch dp.DeviceType {
		case "incense_censer":
			return 10.0
		case "bronze_jin":
			return 9.5
		case "armillary_mount":
			return 9.8
		case "modern_gyro":
			return 6.0
		}
		return 5.0
	}
	return 0.5
}

func betterThan(newV, oldV float64, lowerBetter bool) bool {
	if lowerBetter {
		return newV < oldV
	}
	return newV > oldV
}

func minMax(arr []float64) (min, max float64) {
	if len(arr) == 0 {
		return 0, 0
	}
	min = arr[0]
	max = arr[0]
	for _, v := range arr[1:] {
		if v < min {
			min = v
		}
		if v > max {
			max = v
		}
	}
	return
}

func (cs *ComparisonService) RunViscosityScan(req *models.ViscosityScanRequest) (*models.ViscosityScanResponse, error) {
	mp := config.Mechanical
	fp := config.Fluid
	if mp == nil {
		return nil, fmt.Errorf("config not loaded")
	}
	dev := mp.GetDevicePreset(req.DeviceCode)
	if dev == nil {
		return nil, fmt.Errorf("device %s not found", req.DeviceCode)
	}

	viscosityList := req.ViscosityRangePas
	if len(viscosityList) == 0 {
		viscosityList = mp.ViscosityScan.ViscosityRangePas
	}

	tempC := 25.0
	if req.TemperatureC != nil {
		tempC = *req.TemperatureC
	}
	fillRatio := 0.55
	if req.FillRatio != nil {
		fillRatio = *req.FillRatio
	}

	points := make([]models.ViscosityDataPoint, 0, len(viscosityList))
	minSpill := 1.0
	optimalVisc := viscosityList[0]
	criticalVisc := 0.0
	var sumLogX, sumY, sumLogX2, sumLogXY float64
	n := 0.0

	for _, visc := range viscosityList {
		sim := simulation.NewMultiDeviceSimulator(dev)
		sim.SetPerfumeParams(visc, fillRatio)

		omega0 := math.Sqrt(9.81 / sim.RadiusBody)
		Mmass := sim.MassBody
		dampRatio := (sim.DampingCoeff + 8*math.Pi*visc*sim.RadiusBody*sim.RadiusBody*sim.RadiusBody*fillRatio) /
			(2 * Mmass * omega0)
		if dampRatio > 1 {
			dampRatio = 1
		}

		accelX, accelY, accelZ, rot := buildMotionForceFunc(req.MotionProfile, 0, 0, 0, 0)
		_, balS, spillS, _, avgT, maxT, _, _, avgB, _, _, _, _, avgSp, maxSp, _ :=
			sim.RunSimulation(8.0, 16, accelX, accelY, accelZ, rot)

		var resFactor float64
		if req.FrequencyHz != nil {
			r := *req.FrequencyHz / math.Max(omega0/(2*math.Pi), 0.001)
			resFactor = 1.0 / math.Sqrt(math.Pow(1-r*r, 2)+math.Pow(2*dampRatio*r, 2))
		} else {
			resFactor = 1.0
		}

		attenDB := 0.0
		if visc > 0 && fp != nil {
			dampingCoeff := fp.SloshDynamics.StokesDampingCoeff
			stokesNorm := 8 * math.Pi * visc * sim.RadiusBody * sim.RadiusBody * sim.RadiusBody * fillRatio
			attenDB = -20 * math.Log10(math.Exp(-stokesNorm*dampingCoeff/(Mmass*omega0)))
		}

		effBal := 0.0
		if len(balS) > 0 {
			effBal = avgB
		}
		p := models.ViscosityDataPoint{
			ViscosityPas:        visc,
			SpillProbability:    avgSp,
			AvgTiltDeg:          avgT,
			MaxTiltDeg:          maxT,
			DampingRatio:        dampRatio,
			ResonanceFactor:     resFactor,
			StokesAttenuationDB: attenDB,
			BalanceEfficiency:   effBal,
			OptimalFillRatio:    0.55,
		}
		points = append(points, p)

		if maxSp < minSpill {
			minSpill = maxSp
			optimalVisc = visc
		}
		if criticalVisc == 0 && maxSp <= 0.05 {
			criticalVisc = visc
		}

		lx := math.Log10(math.Max(visc, 1e-12))
		sy := avgSp
		sumLogX += lx
		sumY += sy
		sumLogX2 += lx * lx
		sumLogXY += lx * sy
		n++
	}

	denom := math.Max(n*sumLogX2-sumLogX*sumLogX, 1e-12)
	slope := (n*sumLogXY - sumLogX*sumY) / denom
	intercept := (sumY - slope*sumLogX) / n

	var ssRes, ssTot float64
	yBar := sumY / math.Max(n, 1)
	for _, p := range points {
		lx := math.Log10(math.Max(p.ViscosityPas, 1e-12))
		pred := slope*lx + intercept
		ssRes += (p.SpillProbability - pred) * (p.SpillProbability - pred)
		ssTot += (p.SpillProbability - yBar) * (p.SpillProbability - yBar)
	}
	r2 := 1.0
	if ssTot > 1e-12 {
		r2 = 1.0 - ssRes/ssTot
	}
	fitEq := fmt.Sprintf("Spill ≈ %.3f·log₁₀(μ) + %.3f  (R²=%.3f)", slope, intercept, r2)

	recommendation := fmt.Sprintf(
		"推荐粘度：%.3f Pa·s 时洒香概率最低（%.1f%%）。", optimalVisc, minSpill*100,
	)
	if criticalVisc > 0 {
		recommendation += fmt.Sprintf("临界安全粘度为 %.2f Pa·s，高于此值洒香风险<5%%。", criticalVisc)
	} else {
		recommendation += "注意：在当前工况下未达<5%安全阈值，请降低晃动强度。"
	}
	if slope < 0 {
		recommendation += fmt.Sprintf("总体趋势：粘度每提升10倍，洒香概率约降低 %.1f 个百分点。", -slope*100)
	}

	resp := &models.ViscosityScanResponse{
		ID:                  uuid.New(),
		CreatedAt:           time.Now(),
		DeviceCode:          req.DeviceCode,
		DeviceName:          dev.Name,
		MotionProfile:       req.MotionProfile,
		DefaultTemperatureC: tempC,
		DefaultFillRatio:    fillRatio,
		ScanPoints:          points,
		OptimalViscosityPas: optimalVisc,
		CriticalViscosityPas: criticalVisc,
		FitEquation:         fitEq,
		CorrelationR2:       r2,
		Recommendation:      recommendation,
	}
	return resp, nil
}

func (cs *ComparisonService) StartExperience(req *models.ExperienceStartRequest) (*models.ExperienceStartResponse, error) {
	mp := config.Mechanical
	if mp == nil {
		return nil, fmt.Errorf("config not loaded")
	}
	mode, ok := motionModePresets[req.MotionMode]
	if !ok {
		return nil, fmt.Errorf("unknown motion mode: %s", req.MotionMode)
	}
	dev := mp.GetDevicePreset(req.DeviceCode)
	if dev == nil {
		return nil, fmt.Errorf("unknown device: %s", req.DeviceCode)
	}
	sim := simulation.NewMultiDeviceSimulator(dev)
	sim.SetPerfumeParams(0.5, 0.55)

	token := uuid.New().String()
	userName := "访客"
	if req.UserName != nil {
		userName = *req.UserName
	}
	session := &models.VirtualExperienceSession{
		ID:           uuid.New(),
		SessionToken: token,
		UserID:       &userName,
		DeviceCode:   req.DeviceCode,
		MotionMode:   req.MotionMode,
		StartedAt:    time.Now(),
	}
	runtime := &ExperienceRuntime{
		Session:     session,
		Simulator:   sim,
		StartedAt:   time.Now(),
		LastTick:    time.Now(),
		Device:      dev,
		ModeInfo:    mode,
		UserName:    userName,
		LongestStreak: 0,
		CurrentStreak: 0,
		SpillEvents: 0,
		MaxIntensity: 0,
		CurrentLevel: "入门 · 初入宫廷",
		LevelProgress: 0,
	}
	cs.mu.Lock()
	cs.experienceSessions[token] = runtime
	cs.mu.Unlock()

	go cs.cleanupExpiredSessions()

	context := dev.HistoricalNote
	if context == "" {
		context = fmt.Sprintf("您正在体验%s——%s。%s", dev.Dynasty, dev.Name, mode.AncientContext)
	}

	return &models.ExperienceStartResponse{
		SessionToken:      token,
		DeviceCode:        req.DeviceCode,
		DeviceName:        dev.Name,
		MotionMode:        req.MotionMode,
		ModeInfo:          *mode,
		ExpiresAt:         time.Now().Add(20 * time.Minute),
		HistoricalContext: context,
	}, nil
}

func (cs *ComparisonService) cleanupExpiredSessions() {
	time.Sleep(30 * time.Minute)
	cs.mu.Lock()
	defer cs.mu.Unlock()
	now := time.Now()
	for k, v := range cs.experienceSessions {
		if now.Sub(v.LastTick) > 25*time.Minute {
			delete(cs.experienceSessions, k)
		}
	}
}

func (cs *ComparisonService) TickExperience(req *models.ExperienceTickRequest) (*models.ExperienceFrame, error) {
	cs.mu.RLock()
	rt, ok := cs.experienceSessions[req.SessionToken]
	cs.mu.RUnlock()
	if !ok {
		return nil, fmt.Errorf("session expired or not found")
	}
	dt := req.TimeStepMs / 1000.0
	if dt <= 0 {
		dt = 0.016
	}
	intensity := req.UserIntensity
	intensityRange := rt.ModeInfo.IntensityRange
	if intensity < intensityRange[0] {
		intensity = intensityRange[0]
	}
	if intensity > intensityRange[1] {
		intensity = intensityRange[1]
	}
	if intensity > rt.MaxIntensity {
		rt.MaxIntensity = intensity
	}

	omega := 2 * math.Pi * rt.ModeInfo.FrequencyHz
	amp := rt.ModeInfo.BaseAmplitude * intensity
	rt.FrameIndex++
	timeSec := float64(rt.FrameIndex) * dt

	rotX, rotY, rotZ := 0.0, 0.0, 0.0
	if req.UserRotationX != nil {
		rotX = *req.UserRotationX
	}
	if req.UserRotationY != nil {
		rotY = *req.UserRotationY
	}
	if req.UserRotationZ != nil {
		rotZ = *req.UserRotationZ
	}
	force := &models.ExternalForce{
		AccelerationX: amp*0.6*math.Sin(omega*timeSec+rotX) + amp*0.3*rotX,
		AccelerationY: amp*0.8*math.Sin(omega*timeSec+1.0+rotY) + amp*0.3*rotY,
		AccelerationZ: amp*0.3*math.Sin(omega*timeSec+2.3+rotZ) + 9.81,
		RotationRate:  0.2*math.Cos(omega*timeSec) + rotZ*0.5,
	}
	rt.Simulator.Step(dt, force)

	tilt := rt.Simulator.CalculateBodyTilt()
	bal := rt.Simulator.CalculateBalanceScore()
	sp := rt.Simulator.CalculateSpillRisk()

	st := rt.Simulator.State
	isSpill := sp > 0.65 && timeSec-rt.LastSpillTime > 1.5
	if isSpill {
		rt.SpillEvents++
		rt.LastSpillTime = timeSec
		if rt.CurrentStreak > rt.LongestStreak {
			rt.LongestStreak = rt.CurrentStreak
		}
		rt.CurrentStreak = 0
	} else {
		rt.CurrentStreak += dt
		if rt.CurrentStreak > rt.LongestStreak {
			rt.LongestStreak = rt.CurrentStreak
		}
	}

	level, progress := computeLevel(timeSec, bal, rt.SpillEvents)
	rt.CurrentLevel = level
	rt.LevelProgress = progress

	rt.History.BalanceScores = append(rt.History.BalanceScores, bal)
	rt.History.Tilts = append(rt.History.Tilts, tilt)
	rt.History.SpillRisks = append(rt.History.SpillRisks, sp)
	rt.History.Intensities = append(rt.History.Intensities, intensity)
	rt.LastTick = time.Now()

	var hint *string
	if isSpill {
		h := "⚠ 香灰洒落！请减缓强度或减小旋转幅度"
		hint = &h
	} else if sp > 0.5 {
		h := "· 接近临界，注意控制"
		hint = &h
	} else if bal > 0.85 && rt.CurrentStreak > 10 {
		h := "✦ 手感极佳，保持这份从容"
		hint = &h
	}
	midAng := st.MiddleAngle
	frame := &models.ExperienceFrame{
		TimeSec:            timeSec,
		FrameIndex:         rt.FrameIndex,
		UserIntensity:      intensity,
		InnerRingAngleDeg:  st.InnerAngle,
		OuterRingAngleDeg:  st.OuterAngle,
		MiddleRingAngleDeg: &midAng,
		BodyTiltDeg:        tilt,
		BodyRotationDeg:    st.BodyAngle,
		BalanceScore:       bal,
		SpillRisk:          sp,
		InputAccelMps2:     [3]float64{force.AccelerationX, force.AccelerationY, force.AccelerationZ},
		AngularVelocityDegS: [3]float64{st.InnerVelocity, st.OuterVelocity, st.BodyVelocity},
		IsSpillEvent:       isSpill,
		Level:              level,
		LevelProgress:      progress,
		HintText:           hint,
	}
	return frame, nil
}

func computeLevel(tSec float64, bal float64, spills int) (string, float64) {
	levelTable := []struct {
		name string
		time float64
		minB float64
		maxS int
	}{
		{"入门 · 初入宫廷", 0, 0.0, 99},
		{"熟练 · 随侍左右", 30, 0.40, 10},
		{"精通 · 宫宴执事", 90, 0.60, 5},
		{"大师 · 贵妃近侍", 180, 0.78, 2},
		{"宗师 · 尚衣局奉御", 300, 0.88, 0},
		{"传奇 · 霓裳羽衣", 480, 0.94, 0},
	}
	li := 0
	for i := len(levelTable) - 1; i >= 0; i-- {
		l := levelTable[i]
		if tSec >= l.time && bal >= l.minB && spills <= l.maxS {
			li = i
			break
		}
	}
	cur := levelTable[li]
	next := levelTable[len(levelTable)-1]
	if li+1 < len(levelTable) {
		next = levelTable[li+1]
	}
	tProgress := 0.0
	if next.time > cur.time {
		tProgress = (tSec - cur.time) / (next.time - cur.time)
	}
	if tProgress < 0 {
		tProgress = 0
	}
	if tProgress > 1 {
		tProgress = 1
	}
	return cur.name, tProgress
}

func (cs *ComparisonService) EndExperience(sessionToken string) (*models.ExperienceEndResponse, error) {
	cs.mu.Lock()
	rt, ok := cs.experienceSessions[sessionToken]
	if ok {
		delete(cs.experienceSessions, sessionToken)
	}
	cs.mu.Unlock()
	if !ok {
		return nil, fmt.Errorf("session not found")
	}
	dur := time.Since(rt.StartedAt).Seconds()
	N := float64(len(rt.History.BalanceScores))
	avgBal := 0.0
	if N > 0 {
		for _, v := range rt.History.BalanceScores {
			avgBal += v
		}
		avgBal /= N
	}
	tags := make([]string, 0)
	if avgBal >= 0.85 {
		tags = append(tags, "🎯 平衡大师")
	}
	if rt.LongestStreak >= 120 {
		tags = append(tags, "⏳ 禅定两分钟")
	}
	if rt.SpillEvents == 0 && dur >= 60 {
		tags = append(tags, "💎 零洒香成就")
	}
	if rt.MaxIntensity >= rt.ModeInfo.IntensityRange[1]*0.95 && avgBal >= 0.75 {
		tags = append(tags, "🔥 烈火中行走")
	}
	if len(tags) == 0 {
		tags = append(tags, "🌿 初次体验")
	}
	insights := []string{
		fmt.Sprintf("您共操作 %.0f 秒，平均平衡分 %.1f/100，", dur, avgBal*100),
		fmt.Sprintf("最长平稳时间 %.0f 秒，洒香事件 %d 次。", rt.LongestStreak, rt.SpillEvents),
		"",
		"历史启示：",
		fmt.Sprintf("您的平衡水平对比 %s——", rt.Device.Dynasty),
		rt.Device.HistoricalNote,
	}
	insight := ""
	for _, s := range insights {
		insight += s
	}
	chart := map[string][]float64{
		"time_sec":        sampleFloat(linspace(0, dur, int(N)), 100),
		"balance_score":   sampleFloat(rt.History.BalanceScores, 100),
		"body_tilt_deg":   sampleFloat(rt.History.Tilts, 100),
		"spill_risk":      sampleFloat(rt.History.SpillRisks, 100),
		"user_intensity":  sampleFloat(rt.History.Intensities, 100),
	}
	return &models.ExperienceEndResponse{
		SessionToken:      sessionToken,
		DurationSec:       dur,
		TotalFrames:       rt.FrameIndex,
		MaxIntensity:      rt.MaxIntensity,
		AvgBalanceScore:   avgBal,
		SpillEvents:       rt.SpillEvents,
		LongestStreakSec:  rt.LongestStreak,
		FinalLevel:        rt.CurrentLevel,
		AchievementTags:   tags,
		HistoricalInsight: insight,
		SummaryChartData:  chart,
	}, nil
}

func linspace(a, b float64, n int) []float64 {
	out := make([]float64, n)
	if n <= 1 {
		if n == 1 {
			out[0] = a
		}
		return out
	}
	step := (b - a) / float64(n-1)
	for i := 0; i < n; i++ {
		out[i] = a + step*float64(i)
	}
	return out
}

func sampleFloat(arr []float64, maxN int) []float64 {
	if len(arr) <= maxN {
		return arr
	}
	out := make([]float64, 0, maxN)
	step := float64(len(arr)) / float64(maxN)
	for i := 0; i < maxN; i++ {
		idx := int(float64(i) * step)
		if idx >= len(arr) {
			idx = len(arr) - 1
		}
		out = append(out, arr[idx])
	}
	return out
}
