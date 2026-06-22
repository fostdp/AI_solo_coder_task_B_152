package services

import (
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"

	"censer-simulation/config"
	"censer-simulation/models"
)

type EraComparator struct {
	deviceComp *DeviceComparator
}

func NewEraComparator(dc *DeviceComparator) *EraComparator {
	return &EraComparator{deviceComp: dc}
}

func (ec *EraComparator) RunCrossEraComparison(req *models.CrossEraComparisonRequest) (*models.CrossEraComparisonResponse, error) {
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
	cmpRes, err := ec.deviceComp.RunDeviceComparison(cmpReq)
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
