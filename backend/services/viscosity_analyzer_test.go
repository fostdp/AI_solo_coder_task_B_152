package services

import (
	"math"
	"testing"

	"censer-simulation/config"
	"censer-simulation/models"
)

func newTestViscosityAnalyzer(t *testing.T) *ViscosityAnalyzer {
	t.Helper()
	if config.Mechanical == nil || config.Fluid == nil {
		t.Skip("config not loaded, skipping")
	}
	return NewViscosityAnalyzer()
}

func TestViscosityAnalyzer(t *testing.T) {
	t.Run("NORMAL_5粘度点扫描_验证R2和最优粘度", func(t *testing.T) {
		va := newTestViscosityAnalyzer(t)
		viscs := []float64{0.001, 0.01, 0.1, 1.0, 10.0}
		resp, err := va.RunViscosityScan(&models.ViscosityScanRequest{
			DeviceCode:        "DEV-CENSER",
			MotionProfile:     "gentle_walking",
			ViscosityRangePas: viscs,
		})
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if len(resp.ScanPoints) != 5 {
			t.Fatalf("expected 5 scan points, got %d", len(resp.ScanPoints))
		}
		if resp.CorrelationR2 < 0 || resp.CorrelationR2 > 1.0+epsilonFloat64 {
			t.Errorf("R² %.4f out of [0,1]", resp.CorrelationR2)
		}
		if resp.OptimalViscosityPas <= 0 {
			t.Error("optimal viscosity should be > 0")
		}
		if len(resp.FitEquation) < 3 {
			t.Errorf("fit equation too short: %q", resp.FitEquation)
		}
		if resp.DeviceCode != "DEV-CENSER" {
			t.Errorf("device_code=%s, want DEV-CENSER", resp.DeviceCode)
		}
		if resp.DeviceName == "" {
			t.Error("device_name empty")
		}
		for _, p := range resp.ScanPoints {
			if math.IsNaN(p.SpillProbability) || math.IsInf(p.SpillProbability, 0) {
				t.Errorf("NaN/Inf spill prob at μ=%.3f", p.ViscosityPas)
			}
			if p.SpillProbability < 0 || p.SpillProbability > 1.0+epsilonFloat64 {
				t.Errorf("spill prob %.4f out of [0,1] at μ=%.3f", p.SpillProbability, p.ViscosityPas)
			}
			if p.StokesAttenuationDB > 0 {
				t.Errorf("stokes attenuation db should be <=0, got %.2f", p.StokesAttenuationDB)
			}
			if math.IsNaN(p.DampingRatio) || math.IsInf(p.DampingRatio, 0) {
				t.Errorf("NaN/Inf damping_ratio at μ=%.3f", p.ViscosityPas)
			}
		}
	})

	t.Run("BOUNDARY_1个粘度点", func(t *testing.T) {
		va := newTestViscosityAnalyzer(t)
		resp, err := va.RunViscosityScan(&models.ViscosityScanRequest{
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
		if resp.OptimalViscosityPas != 0.1 {
			t.Errorf("optimal viscosity=%.3f, expected 0.1", resp.OptimalViscosityPas)
		}
	})

	t.Run("BOUNDARY_0个粘度点_使用默认或报错", func(t *testing.T) {
		va := newTestViscosityAnalyzer(t)
		resp, err := va.RunViscosityScan(&models.ViscosityScanRequest{
			DeviceCode:        "DEV-CENSER",
			MotionProfile:     "gentle_walking",
			ViscosityRangePas: []float64{},
		})
		if err != nil {
			t.Logf("empty viscosity array returned error (no config defaults): %v", err)
			return
		}
		if len(resp.ScanPoints) == 0 {
			t.Error("scan points empty when config has defaults")
		}
	})

	t.Run("ABNORMAL_不存在的device_code", func(t *testing.T) {
		va := newTestViscosityAnalyzer(t)
		_, err := va.RunViscosityScan(&models.ViscosityScanRequest{
			DeviceCode:        "DEV-PHANTOM",
			MotionProfile:     "gentle_walking",
			ViscosityRangePas: []float64{1.0},
		})
		if err == nil {
			t.Error("expected error for unknown device code, got nil")
		}
	})
}
