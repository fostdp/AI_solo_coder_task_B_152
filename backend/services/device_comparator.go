package services

import (
	"fmt"
	"math"
	"sort"
	"sync"

	"github.com/google/uuid"

	"censer-simulation/config"
	"censer-simulation/models"
	"censer-simulation/simulation"
)

type DeviceComparator struct{}

func NewDeviceComparator() *DeviceComparator { return &DeviceComparator{} }

func simulateDeviceWorker(dev *config.DevicePreset, durationSec, dtMs float64, accelX, accelY, accelZ, rotRate func(float64) float64) (*models.DeviceBalanceMetrics, error) {
	sim := simulation.NewMultiDeviceSimulator(dev)

	tiltS, balS, _, _, avgT, maxT, minT, stdT, avgB, minB, settleT, overshoot, distGain, avgSp, maxSp, fricP :=
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

	m := &models.DeviceBalanceMetrics{
		DeviceCode:        dev.Code,
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

	return m, nil
}

func (dc *DeviceComparator) RunDeviceComparison(req *models.DeviceComparisonRequest) (*models.DeviceComparisonResponse, error) {
	mp := config.Mechanical
	if mp == nil {
		return nil, fmt.Errorf("mechanical config not loaded")
	}

	if len(req.DeviceCodes) < 2 || len(req.DeviceCodes) > 6 {
		return nil, fmt.Errorf("device count must be between 2 and 6, got %d", len(req.DeviceCodes))
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
			m, err := simulateDeviceWorker(dev, durationSec, dtMs, accelX, accelY, accelZ, rotRate)
			if err != nil {
				errCh <- err
				return
			}
			mu.Lock()
			metrics = append(metrics, *m)
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
		"total_devices":      len(metrics),
		"motion_profile":     req.MotionProfile,
		"duration_sec":       durationSec,
		"best_balance":       metrics[0].DeviceName,
		"best_balance_score": metrics[0].AvgBalanceScore,
		"worst_tilt":         metrics[len(metrics)-1].DeviceName,
		"worst_max_tilt_deg": metrics[len(metrics)-1].MaxTiltDeg,
		"champion_category":  categorizeChampion(metrics[0]),
		"notes":              generateComparisonNotes(metrics),
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
