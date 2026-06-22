package services

import (
	"math"
	"testing"

	"censer-simulation/config"
	"censer-simulation/models"
)

func newTestDeviceComparator(t *testing.T) *DeviceComparator {
	t.Helper()
	if config.Mechanical == nil || config.Fluid == nil {
		t.Skip("config not loaded, skipping")
	}
	return NewDeviceComparator()
}

func TestDeviceComparator(t *testing.T) {
	t.Run("NORMAL_3装置对比_验证排名和指标", func(t *testing.T) {
		dc := newTestDeviceComparator(t)
		resp, err := dc.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"DEV-CENSER", "DEV-JIN", "DEV-ARMILLARY"},
			MotionProfile: "gentle_walking",
			DurationSec:   2.0,
		})
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if len(resp.DeviceMetrics) != 3 {
			t.Fatalf("expected 3 devices, got %d", len(resp.DeviceMetrics))
		}
		ranks := map[int]bool{}
		for _, m := range resp.DeviceMetrics {
			ranks[m.OverallRank] = true
			if m.OverallRank < 1 || m.OverallRank > 3 {
				t.Errorf("[%s] rank %d out of [1,3]", m.DeviceCode, m.OverallRank)
			}
			if m.AvgBalanceScore < 0 || m.AvgBalanceScore > 1.0+epsilonFloat64 {
				t.Errorf("[%s] balance score %.4f out of [0,1]", m.DeviceCode, m.AvgBalanceScore)
			}
			if m.SettleTimeMs < 0 {
				t.Errorf("[%s] settle time negative: %.2f", m.DeviceCode, m.SettleTimeMs)
			}
			if math.IsNaN(m.AvgTiltDeg) || math.IsInf(m.AvgTiltDeg, 0) {
				t.Errorf("[%s] NaN/Inf in avg_tilt", m.DeviceCode)
			}
		}
		if !ranks[1] || !ranks[2] || !ranks[3] {
			t.Errorf("ranks should cover {1,2,3}, got %v", ranks)
		}
		if resp.RankingSummary == nil {
			t.Error("ranking_summary should not be nil")
		}
	})

	t.Run("BOUNDARY_2装置_最小数量", func(t *testing.T) {
		dc := newTestDeviceComparator(t)
		resp, err := dc.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"DEV-CENSER", "DEV-GYRO"},
			MotionProfile: "gentle_walking",
			DurationSec:   1.0,
		})
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if len(resp.DeviceMetrics) != 2 {
			t.Fatalf("expected 2, got %d", len(resp.DeviceMetrics))
		}
		ranks := map[int]bool{}
		for _, m := range resp.DeviceMetrics {
			ranks[m.OverallRank] = true
		}
		if !ranks[1] || !ranks[2] {
			t.Errorf("ranks should cover {1,2}, got %v", ranks)
		}
	})

	t.Run("BOUNDARY_1装置_应报错", func(t *testing.T) {
		dc := newTestDeviceComparator(t)
		_, err := dc.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"DEV-CENSER"},
			MotionProfile: "gentle_walking",
		})
		if err == nil {
			t.Error("expected error for 1 device, got nil")
		}
	})

	t.Run("BOUNDARY_7装置_应报错", func(t *testing.T) {
		dc := newTestDeviceComparator(t)
		_, err := dc.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"A", "B", "C", "D", "E", "F", "G"},
			MotionProfile: "gentle_walking",
		})
		if err == nil {
			t.Error("expected error for 7 devices, got nil")
		}
	})

	t.Run("ABNORMAL_不存在的device_code", func(t *testing.T) {
		dc := newTestDeviceComparator(t)
		_, err := dc.RunDeviceComparison(&models.DeviceComparisonRequest{
			DeviceCodes:   []string{"DEV-CENSER", "DEV-PHANTOM"},
			MotionProfile: "gentle_walking",
		})
		if err == nil {
			t.Error("expected error for unknown device code, got nil")
		}
	})

	t.Run("NORMAL_simulateDeviceWorker独立验证", func(t *testing.T) {
		if config.Mechanical == nil {
			t.Skip("config not loaded, skipping")
		}
		dev := config.Mechanical.GetDevicePreset("DEV-CENSER")
		if dev == nil {
			t.Fatal("DEV-CENSER not found in config")
		}
		accelX := func(t float64) float64 { return 0.5 * math.Sin(2*math.Pi*1.2*t) }
		accelY := func(t float64) float64 { return 0.5 * math.Sin(2*math.Pi*1.2*t + 1.0) }
		accelZ := func(t float64) float64 { return 9.81 }
		rotRate := func(t float64) float64 { return 0.2 * math.Cos(2*math.Pi*1.2*t) }

		m, err := simulateDeviceWorker(dev, 2.0, 16.0, accelX, accelY, accelZ, rotRate)
		if err != nil {
			t.Fatalf("simulateDeviceWorker error: %v", err)
		}
		if m.DeviceCode != "DEV-CENSER" {
			t.Errorf("device_code=%s, want DEV-CENSER", m.DeviceCode)
		}
		if m.AvgBalanceScore < 0 || m.AvgBalanceScore > 1.0+epsilonFloat64 {
			t.Errorf("balance score %.4f out of [0,1]", m.AvgBalanceScore)
		}
		if math.IsNaN(m.AvgTiltDeg) || math.IsInf(m.AvgTiltDeg, 0) {
			t.Error("NaN/Inf in avg_tilt")
		}
		if len(m.TiltTimeSeries) == 0 {
			t.Error("tilt time series empty")
		}
		if len(m.BalanceTimeSeries) == 0 {
			t.Error("balance time series empty")
		}
		if m.DeviceName == "" {
			t.Error("device_name empty")
		}
		if m.DeviceType == "" {
			t.Error("device_type empty")
		}
	})
}
