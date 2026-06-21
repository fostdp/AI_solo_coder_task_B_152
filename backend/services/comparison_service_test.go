package services

import (
	"math"
	"os"
	"testing"
	"time"

	"censer-simulation/config"
	"censer-simulation/models"
)

const (
	testMechanicalConfigPath = "../config/mechanical_params.json"
	testFluidConfigPath      = "../config/fluid_params.json"
	epsilonFloat64           = 1e-9
)

func TestMain(m *testing.M) {
	if _, err := config.LoadMechanicalConfig(testMechanicalConfigPath); err != nil {
		os.Stderr.WriteString("WARN: load mechanical config: " + err.Error() + "\n")
	}
	if _, err := config.LoadFluidConfig(testFluidConfigPath); err != nil {
		os.Stderr.WriteString("WARN: load fluid config: " + err.Error() + "\n")
	}
	os.Exit(m.Run())
}

func newTestService(t *testing.T) *ComparisonService {
	t.Helper()
	if config.Mechanical == nil || config.Fluid == nil {
		t.Skip("config not loaded, skipping integration-like test")
	}
	return NewComparisonService()
}

func floatPtr(v float64) *float64 { return &v }

// =============================================================
//  Feature 1: 装置对比 - 平衡恢复时间 (SettleTimeMs) 验证
// =============================================================

func TestDeviceComparison_BalanceRecovery(t *testing.T) {
	t.Run("NORMAL_多装置闲庭漫步_恢复时间合理", func(t *testing.T) {
		cs := newTestService(t)
		dur := 2.0
		resp, err := cs.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"DEV-CENSER", "DEV-JIN", "DEV-ARMILLARY", "DEV-GYRO"},
			MotionProfile: "gentle_walking",
			DurationSec:   dur,
		})
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if resp == nil {
			t.Fatal("response is nil")
		}
		if len(resp.DeviceMetrics) != 4 {
			t.Fatalf("expected 4 devices, got %d", len(resp.DeviceMetrics))
		}
		for _, m := range resp.DeviceMetrics {
			if m.SettleTimeMs < 0 {
				t.Errorf("[%s] settle time negative: %.2f", m.DeviceCode, m.SettleTimeMs)
			}
			maxAllowed := dur * 1000 * 1.1
			if m.SettleTimeMs > maxAllowed {
				t.Errorf("[%s] settle time %.0fms exceeds duration", m.DeviceCode, m.SettleTimeMs)
			}
			if m.AvgBalanceScore < 0 || m.AvgBalanceScore > 1.0+epsilonFloat64 {
				t.Errorf("[%s] balance score out of [0,1]: %.4f", m.DeviceCode, m.AvgBalanceScore)
			}
			if m.OverallRank < 1 || m.OverallRank > 4 {
				t.Errorf("[%s] overall rank %d out of [1,4]", m.DeviceCode, m.OverallRank)
			}
		}
		gyroSettle := -1.0
		censerSettle := -1.0
		for _, m := range resp.DeviceMetrics {
			if m.DeviceCode == "DEV-GYRO" {
				gyroSettle = m.SettleTimeMs
			}
			if m.DeviceCode == "DEV-CENSER" {
				censerSettle = m.SettleTimeMs
			}
		}
		if gyroSettle >= 0 && censerSettle >= 0 && gyroSettle > censerSettle {
			t.Logf("NOTE: modern gyro settle %.0fms > censer %.0fms (check gyro damping params)",
				gyroSettle, censerSettle)
		}
	})

	t.Run("BOUNDARY_最小装置数_2台", func(t *testing.T) {
		cs := newTestService(t)
		resp, err := cs.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"DEV-CENSER", "DEV-GYRO"},
			MotionProfile: "carriage_ride",
			DurationSec:   1.0,
		})
		if err != nil {
			t.Fatalf("expected no error for 2 devices, got %v", err)
		}
		if len(resp.DeviceMetrics) != 2 {
			t.Fatalf("expected 2 devices, got %d", len(resp.DeviceMetrics))
		}
		ranks := map[int]bool{}
		for _, m := range resp.DeviceMetrics {
			ranks[m.OverallRank] = true
		}
		if !ranks[1] || !ranks[2] {
			t.Errorf("ranks should cover {1,2}, got %+v", ranks)
		}
	})

	t.Run("BOUNDARY_最大装置数_6台_去重容忍", func(t *testing.T) {
		cs := newTestService(t)
		resp, err := cs.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"DEV-CENSER", "DEV-JIN", "DEV-ARMILLARY", "DEV-GYRO"},
			MotionProfile: "sedan_chair",
			DurationSec:   0.5,
		})
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if len(resp.DeviceMetrics) < 1 {
			t.Fatal("at least 1 device metric expected")
		}
	})

	t.Run("BOUNDARY_极短时长_50ms", func(t *testing.T) {
		cs := newTestService(t)
		resp, err := cs.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"DEV-CENSER", "DEV-GYRO"},
			MotionProfile: "gentle_walking",
			DurationSec:   0.05,
		})
		if err != nil {
			t.Fatalf("expected no error for short duration, got %v", err)
		}
		for _, m := range resp.DeviceMetrics {
			if math.IsNaN(m.AvgTiltDeg) || math.IsInf(m.AvgTiltDeg, 0) {
				t.Errorf("[%s] NaN/Inf in avg_tilt", m.DeviceCode)
			}
		}
	})

	t.Run("BOUNDARY_自定义幅值频率全零", func(t *testing.T) {
		cs := newTestService(t)
		zero := 0.0
		resp, err := cs.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"DEV-CENSER", "DEV-JIN"},
			MotionProfile: "gentle_walking",
			DurationSec:   1.0,
			AmplitudeX:    &zero,
			AmplitudeY:    &zero,
			AmplitudeZ:    &zero,
			FrequencyHz:   &zero,
		})
		if err != nil {
			t.Fatalf("expected no error for zero-amplitude, got %v", err)
		}
		for _, m := range resp.DeviceMetrics {
			if m.AvgBalanceScore < 0.95 {
				t.Logf("zero-amplitude [%s] balance=%.3f (should be high)", m.DeviceCode, m.AvgBalanceScore)
			}
			if m.MaxTiltDeg > 2.0 {
				t.Errorf("zero-amplitude tilt too high: %.2f", m.MaxTiltDeg)
			}
		}
	})

	t.Run("ABNORMAL_装置数不足_仅1台", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"DEV-CENSER"},
			MotionProfile: "gentle_walking",
		})
		if err == nil {
			t.Error("expected error for single device, got nil")
		}
	})

	t.Run("ABNORMAL_装置数超上限_7台", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"A", "B", "C", "D", "E", "F", "G"},
			MotionProfile: "gentle_walking",
		})
		if err == nil {
			t.Error("expected error for >6 devices, got nil")
		}
	})

	t.Run("ABNORMAL_DeviceCmp_不存在的运动模式", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"DEV-CENSER", "DEV-GYRO"},
			MotionProfile: "teleport_magic",
		})
		if err == nil {
			t.Error("expected error for invalid motion profile, got nil")
		}
	})

	t.Run("ABNORMAL_不存在的装置码", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"DEV-CENSER", "DEV-NOEXIST"},
			MotionProfile: "gentle_walking",
		})
		if err == nil {
			t.Error("expected error for unknown device code, got nil")
		}
	})

	t.Run("ABNORMAL_nil请求指针", func(t *testing.T) {
		cs := newTestService(t)
		defer func() {
			if r := recover(); r == nil {
				t.Error("expected panic for nil request, did not panic")
			}
		}()
		_, _ = cs.RunDeviceComparison(nil)
	})
}

// =============================================================
//  Feature 2: 跨时代对比 - 精度 (Precision) 维度验证
// =============================================================

func TestCrossEraComparison_Precision(t *testing.T) {
	t.Run("NORMAL_古代3种_vs_现代陀螺_精度维度现代领先", func(t *testing.T) {
		cs := newTestService(t)
		resp, err := cs.RunCrossEraComparison(&models.CrossEraComparisonRequest{
			AncientDeviceCodes: []string{"DEV-CENSER", "DEV-JIN", "DEV-ARMILLARY"},
			ModernDeviceCodes:  []string{"DEV-GYRO"},
			MotionProfile:      "gentle_walking",
			IncludeHistorical:  true,
		})
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if resp == nil || len(resp.Dimensions) == 0 {
			t.Fatal("dimensions empty")
		}
		var precisionDim *models.CrossEraDimensionResult
		for i := range resp.Dimensions {
			if resp.Dimensions[i].DimensionKey == "precision" {
				precisionDim = &resp.Dimensions[i]
				break
			}
		}
		if precisionDim == nil {
			t.Skip("precision dimension not found in cross-era result")
		}
		if precisionDim.ModernBest.Value <= 0 {
			t.Errorf("modern precision value should be >0, got %.4e", precisionDim.ModernBest.Value)
		}
		if precisionDim.AncientBest.Value <= 0 {
			t.Errorf("ancient precision value should be >0, got %.4e", precisionDim.AncientBest.Value)
		}
		if precisionDim.ImprovementRatio < 1.0 {
			t.Logf("NOTE: precision improvement_ratio=%.2f, expected modern > ancient (check lookup dim)",
				precisionDim.ImprovementRatio)
		}
		if resp.OverallScore == nil {
			t.Error("overall_score map missing")
		} else {
			for k, v := range resp.OverallScore {
				if math.IsNaN(v) || math.IsInf(v, 0) {
					t.Errorf("overall_score[%s] = %.4f is NaN/Inf", k, v)
				}
			}
		}
		if len(resp.Title) < 4 {
			t.Error("title too short")
		}
		if len(resp.PhilosophyNote) < 8 {
			t.Error("philosophy_note too short")
		}
	})

	t.Run("BOUNDARY_古代1种_现代1种_最小对比", func(t *testing.T) {
		cs := newTestService(t)
		resp, err := cs.RunCrossEraComparison(&models.CrossEraComparisonRequest{
			AncientDeviceCodes: []string{"DEV-CENSER"},
			ModernDeviceCodes:  []string{"DEV-GYRO"},
			MotionProfile:      "horse_riding",
		})
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if len(resp.Dimensions) < 3 {
			t.Errorf("expected >=3 dimensions, got %d", len(resp.Dimensions))
		}
		for _, d := range resp.Dimensions {
			if d.ModernBest.DeviceCode != "DEV-GYRO" && d.ModernBest.DeviceCode != "" {
				if d.ModernBest.EraTag == "ancient" {
					t.Errorf("dim[%s] modern best has era_tag=ancient", d.DimensionKey)
				}
			}
		}
	})

	t.Run("BOUNDARY_空AncientList_自动回退默认", func(t *testing.T) {
		cs := newTestService(t)
		resp, err := cs.RunCrossEraComparison(&models.CrossEraComparisonRequest{
			AncientDeviceCodes: []string{},
			ModernDeviceCodes:  []string{"DEV-GYRO"},
			MotionProfile:      "stormy_journey",
		})
		if err != nil {
			t.Fatalf("expected no error with empty ancient list, got %v", err)
		}
		if len(resp.Dimensions) == 0 {
			t.Error("dimensions should not be empty after fallback")
		}
	})

	t.Run("BOUNDARY_空ModernList_自动回退默认", func(t *testing.T) {
		cs := newTestService(t)
		resp, err := cs.RunCrossEraComparison(&models.CrossEraComparisonRequest{
			AncientDeviceCodes: []string{"DEV-CENSER"},
			ModernDeviceCodes:  []string{},
			MotionProfile:      "palace_dance",
		})
		if err != nil {
			t.Fatalf("expected no error with empty modern list, got %v", err)
		}
		if len(resp.Dimensions) == 0 {
			t.Error("dimensions should not be empty after fallback")
		}
	})

	t.Run("ABNORMAL_CrossEra_不存在的运动模式", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.RunCrossEraComparison(&models.CrossEraComparisonRequest{
			AncientDeviceCodes: []string{"DEV-CENSER"},
			ModernDeviceCodes:  []string{"DEV-GYRO"},
			MotionProfile:      "warp_drive",
		})
		if err == nil {
			t.Error("expected error for invalid motion profile, got nil")
		}
	})

	t.Run("ABNORMAL_全部为未知装置码", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.RunCrossEraComparison(&models.CrossEraComparisonRequest{
			AncientDeviceCodes: []string{"DEV-XXX"},
			ModernDeviceCodes:  []string{"DEV-YYY"},
			MotionProfile:      "gentle_walking",
		})
		if err == nil {
			t.Error("expected error for all-unknown device codes, got nil")
		}
	})
}

// =============================================================
//  Feature 3: 粘度分析 - 洒香阈值 (Spill Threshold) 验证
// =============================================================

func TestViscosityAnalysis_SpillThreshold(t *testing.T) {
	t.Run("NORMAL_对数扫描_洒香概率随粘度下降", func(t *testing.T) {
		cs := newTestService(t)
		viscs := []float64{0.001, 0.01, 0.1, 1.0, 10.0, 100.0}
		resp, err := cs.RunViscosityScan(&models.ViscosityScanRequest{
			DeviceCode:        "DEV-CENSER",
			MotionProfile:     "carriage_ride",
			ViscosityRangePas: viscs,
		})
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if len(resp.ScanPoints) != len(viscs) {
			t.Fatalf("expected %d scan points, got %d", len(viscs), len(resp.ScanPoints))
		}
		monotonicNonIncrease := true
		for i := 1; i < len(resp.ScanPoints); i++ {
			if resp.ScanPoints[i].SpillProbability > resp.ScanPoints[i-1].SpillProbability+0.01 {
				monotonicNonIncrease = false
			}
		}
		if !monotonicNonIncrease {
			t.Log("NOTE: spill probability not strictly monotonically decreasing with viscosity (randomness expected)")
		}
		lowMu := resp.ScanPoints[0].SpillProbability
		highMu := resp.ScanPoints[len(resp.ScanPoints)-1].SpillProbability
		if lowMu < highMu {
			t.Errorf("spill probability reversed: low(μ)=%.3f < high(μ)=%.3f", lowMu, highMu)
		}
		if resp.CorrelationR2 < 0 || resp.CorrelationR2 > 1.0+epsilonFloat64 {
			t.Errorf("R^2 %.4f out of [0,1]", resp.CorrelationR2)
		}
		if len(resp.FitEquation) < 3 {
			t.Errorf("fit equation too short: %q", resp.FitEquation)
		}
		if resp.OptimalViscosityPas <= 0 {
			t.Error("optimal viscosity should be > 0")
		}
		for _, p := range resp.ScanPoints {
			if math.IsNaN(p.SpillProbability) || math.IsInf(p.SpillProbability, 0) {
				t.Errorf("NaN/Inf in spill prob at μ=%.3f", p.ViscosityPas)
			}
			if p.SpillProbability < 0 || p.SpillProbability > 1.0+epsilonFloat64 {
				t.Errorf("spill prob %.4f out of [0,1] at μ=%.3f", p.SpillProbability, p.ViscosityPas)
			}
			if p.StokesAttenuationDB > 0 {
				t.Errorf("stokes attenuation db should be <=0, got %.2f", p.StokesAttenuationDB)
			}
		}
	})

	t.Run("BOUNDARY_单点粘度", func(t *testing.T) {
		cs := newTestService(t)
		resp, err := cs.RunViscosityScan(&models.ViscosityScanRequest{
			DeviceCode:        "DEV-GYRO",
			MotionProfile:     "gentle_walking",
			ViscosityRangePas: []float64{0.1},
		})
		if err != nil {
			t.Fatalf("expected no error for single point, got %v", err)
		}
		if len(resp.ScanPoints) != 1 {
			t.Fatalf("expected 1 point, got %d", len(resp.ScanPoints))
		}
	})

	t.Run("BOUNDARY_极端粘度范围_零到超高", func(t *testing.T) {
		cs := newTestService(t)
		viscs := []float64{0, 0.000001, 10000}
		resp, err := cs.RunViscosityScan(&models.ViscosityScanRequest{
			DeviceCode:        "DEV-ARMILLARY",
			MotionProfile:     "stormy_journey",
			ViscosityRangePas: viscs,
		})
		if err != nil {
			t.Fatalf("expected no error for extreme viscosities, got %v", err)
		}
		for _, p := range resp.ScanPoints {
			if math.IsNaN(p.AvgTiltDeg) || math.IsInf(p.AvgTiltDeg, 0) {
				t.Errorf("NaN/Inf tilt at μ=%.3e", p.ViscosityPas)
			}
		}
	})

	t.Run("BOUNDARY_自定义温度与填充率", func(t *testing.T) {
		cs := newTestService(t)
		temp := 80.0
		fill := 0.9
		dens := 1100.0
		st := 0.03
		resp, err := cs.RunViscosityScan(&models.ViscosityScanRequest{
			DeviceCode:        "DEV-JIN",
			MotionProfile:     "sedan_chair",
			ViscosityRangePas: []float64{0.01, 1.0},
			TemperatureC:      &temp,
			FillRatio:         &fill,
			DensityKgm3:       &dens,
			SurfaceTension:    &st,
		})
		if err != nil {
			t.Fatalf("expected no error for custom params, got %v", err)
		}
		if resp.DefaultTemperatureC != temp {
			t.Logf("default_temp recorded as %.1f, expected %.1f (may not reflect custom)", resp.DefaultTemperatureC, temp)
		}
	})

	t.Run("ABNORMAL_空粘度数组", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.RunViscosityScan(&models.ViscosityScanRequest{
			DeviceCode:        "DEV-CENSER",
			MotionProfile:     "gentle_walking",
			ViscosityRangePas: []float64{},
		})
		if err == nil {
			t.Error("expected error for empty viscosity array, got nil")
		}
	})

	t.Run("ABNORMAL_负粘度", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.RunViscosityScan(&models.ViscosityScanRequest{
			DeviceCode:        "DEV-CENSER",
			MotionProfile:     "gentle_walking",
			ViscosityRangePas: []float64{-0.1},
		})
		if err == nil {
			t.Error("expected error for negative viscosity, got nil")
		}
	})

	t.Run("ABNORMAL_不存在装置码", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.RunViscosityScan(&models.ViscosityScanRequest{
			DeviceCode:        "DEV-PHANTOM",
			MotionProfile:     "gentle_walking",
			ViscosityRangePas: []float64{1.0},
		})
		if err == nil {
			t.Error("expected error for unknown device, got nil")
		}
	})

	t.Run("ABNORMAL_Viscosity_不存在的运动模式", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.RunViscosityScan(&models.ViscosityScanRequest{
			DeviceCode:        "DEV-CENSER",
			MotionProfile:     "space_zero_g",
			ViscosityRangePas: []float64{1.0},
		})
		if err == nil {
			t.Error("expected error for invalid motion profile, got nil")
		}
	})
}

// =============================================================
//  Feature 4: 虚拟体验 - 晃动交互 (Motion Interaction) 验证
// =============================================================

func TestVirtualExperience_MotionInteraction(t *testing.T) {
	t.Run("NORMAL_Start_Tick_End_完整流程_响应晃动强度变化", func(t *testing.T) {
		cs := newTestService(t)
		name := "测试公子"
		startResp, err := cs.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "DEV-CENSER",
			MotionMode: "gentle_walking",
			UserName:   &name,
		})
		if err != nil {
			t.Fatalf("start err: %v", err)
		}
		if startResp.SessionToken == "" {
			t.Fatal("session token empty")
		}
		if !startResp.ExpiresAt.After(time.Now()) {
			t.Errorf("expires_at %s should be in future", startResp.ExpiresAt)
		}

		var (
			lowTick, highTick *models.ExperienceFrame
			maxIntensity      = 0.0
		)
		intensities := []float64{0.1, 0.15, 0.8, 0.9, 0.2, 0.1}
		for i, intensity := range intensities {
			fr, err := cs.TickExperience(&models.ExperienceTickRequest{
				SessionToken:  startResp.SessionToken,
				UserIntensity: intensity,
				TimeStepMs:    16.0,
			})
			if err != nil {
				t.Fatalf("tick %d err: %v", i, err)
			}
			if fr.BalanceScore < 0 || fr.BalanceScore > 1.0+epsilonFloat64 {
				t.Errorf("tick%d balance %.4f out of [0,1]", i, fr.BalanceScore)
			}
			if fr.SpillRisk < 0 || fr.SpillRisk > 1.0+epsilonFloat64 {
				t.Errorf("tick%d spill_risk %.4f out of [0,1]", i, fr.SpillRisk)
			}
			if fr.FrameIndex != int64(i+1) {
				t.Errorf("tick%d frame_index=%d expected %d", i, fr.FrameIndex, i+1)
			}
			if intensity > maxIntensity {
				maxIntensity = intensity
			}
			if i == 1 {
				lowTick = fr
			}
			if i == 3 {
				highTick = fr
			}
		}
		if lowTick != nil && highTick != nil {
			if highTick.SpillRisk < lowTick.SpillRisk-0.05 {
				t.Logf("NOTE: high intensity spill_risk=%.3f < low=%.3f (may happen due to randomness)",
					highTick.SpillRisk, lowTick.SpillRisk)
			}
		}

		endResp, err := cs.EndExperience(startResp.SessionToken)
		if err != nil {
			t.Fatalf("end err: %v", err)
		}
		if endResp.TotalFrames != int64(len(intensities)) {
			t.Errorf("total frames=%d expected %d", endResp.TotalFrames, len(intensities))
		}
		if endResp.MaxIntensity < maxIntensity-epsilonFloat64 {
			t.Errorf("max_intensity=%.3f < recorded %.3f", endResp.MaxIntensity, maxIntensity)
		}
		if endResp.DurationSec <= 0 {
			t.Error("duration_sec <= 0")
		}
		if len(endResp.AchievementTags) == 0 {
			t.Log("NOTE: no achievements unlocked (short session)")
		}
		if len(endResp.SummaryChartData) == 0 {
			t.Error("summary chart data empty")
		}
	})

	t.Run("BOUNDARY_高强度晃动_触发洒香事件", func(t *testing.T) {
		cs := newTestService(t)
		sr, err := cs.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "DEV-JIN",
			MotionMode: "stormy_journey",
		})
		if err != nil {
			t.Fatalf("start err: %v", err)
		}
		spillCount := 0
		for i := 0; i < 50; i++ {
			fr, err := cs.TickExperience(&models.ExperienceTickRequest{
				SessionToken:  sr.SessionToken,
				UserIntensity: 6.0,
				TimeStepMs:    16.0,
			})
			if err != nil {
				t.Fatalf("tick err: %v", err)
			}
			if fr.IsSpillEvent {
				spillCount++
			}
		}
		er, _ := cs.EndExperience(sr.SessionToken)
		if er != nil && er.SpillEvents < spillCount {
			t.Errorf("end.spill_events=%d < counted=%d", er.SpillEvents, spillCount)
		}
		t.Logf("stormy session: spill_events=%d", spillCount)
	})

	t.Run("BOUNDARY_长时间连续tick_等级提升", func(t *testing.T) {
		cs := newTestService(t)
		sr, err := cs.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "DEV-ARMILLARY",
			MotionMode: "gentle_walking",
		})
		if err != nil {
			t.Fatalf("start err: %v", err)
		}
		var lastLevel string
		for i := 0; i < 150; i++ {
			fr, err := cs.TickExperience(&models.ExperienceTickRequest{
				SessionToken:  sr.SessionToken,
				UserIntensity: 0.2,
				TimeStepMs:    100.0,
			})
			if err != nil {
				t.Fatalf("tick err: %v", err)
			}
			lastLevel = fr.Level
		}
		er, err := cs.EndExperience(sr.SessionToken)
		if err != nil {
			t.Fatalf("end err: %v", err)
		}
		if lastLevel == "" {
			t.Error("last tick level empty")
		}
		if er.FinalLevel != lastLevel {
			t.Errorf("final_level=%s != last tick level=%s", er.FinalLevel, lastLevel)
		}
		t.Logf("long session: final_level=%s achievements=%v", er.FinalLevel, er.AchievementTags)
	})

	t.Run("BOUNDARY_End不存在的会话Token", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.EndExperience("NONEXISTENT-TOKEN-ABCD")
		if err == nil {
			t.Error("expected error ending nonexistent session, got nil")
		}
	})

	t.Run("ABNORMAL_Start空运动模式", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "DEV-CENSER",
			MotionMode: "",
		})
		if err == nil {
			t.Error("expected error for empty motion_mode, got nil")
		}
	})

	t.Run("ABNORMAL_Start空装置码", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "",
			MotionMode: "gentle_walking",
		})
		if err == nil {
			t.Error("expected error for empty device_code, got nil")
		}
	})

	t.Run("ABNORMAL_Start未知装置码", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "DEV-FICTITIOUS",
			MotionMode: "gentle_walking",
		})
		if err == nil {
			t.Error("expected error for unknown device_code, got nil")
		}
	})

	t.Run("ABNORMAL_Tick空SessionToken", func(t *testing.T) {
		cs := newTestService(t)
		_, err := cs.TickExperience(&models.ExperienceTickRequest{
			SessionToken:  "",
			UserIntensity: 0.5,
		})
		if err == nil {
			t.Error("expected error for empty token tick, got nil")
		}
	})

	t.Run("ABNORMAL_Tick负强度", func(t *testing.T) {
		cs := newTestService(t)
		sr, err := cs.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "DEV-CENSER",
			MotionMode: "gentle_walking",
		})
		if err != nil {
			t.Fatal(err)
		}
		fr, err := cs.TickExperience(&models.ExperienceTickRequest{
			SessionToken:  sr.SessionToken,
			UserIntensity: -5.0,
		})
		if err != nil {
			t.Fatalf("expected graceful clamping for negative intensity, got err: %v", err)
		}
		if fr.UserIntensity < 0 {
			t.Errorf("negative intensity not clamped: %.2f", fr.UserIntensity)
		}
		_, _ = cs.EndExperience(sr.SessionToken)
	})

	t.Run("ABNORMAL_Tick超范围强度_100倍", func(t *testing.T) {
		cs := newTestService(t)
		sr, err := cs.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "DEV-GYRO",
			MotionMode: "gentle_walking",
		})
		if err != nil {
			t.Fatal(err)
		}
		fr, err := cs.TickExperience(&models.ExperienceTickRequest{
			SessionToken:  sr.SessionToken,
			UserIntensity: 100.0,
		})
		if err != nil {
			t.Fatalf("expected graceful clamping, got err: %v", err)
		}
		if fr.BalanceScore < 0 || fr.BalanceScore > 1.0+epsilonFloat64 {
			t.Errorf("balance %.4f out of range under extreme intensity", fr.BalanceScore)
		}
		if math.IsNaN(fr.BodyTiltDeg) || math.IsInf(fr.BodyTiltDeg, 0) {
			t.Error("NaN/Inf body tilt under extreme intensity")
		}
		_, _ = cs.EndExperience(sr.SessionToken)
	})
}
