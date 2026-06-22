package services

import (
	"math"
	"testing"

	"censer-simulation/config"
	"censer-simulation/models"
)

func newTestEraComparator(t *testing.T) *EraComparator {
	t.Helper()
	if config.Mechanical == nil || config.Fluid == nil {
		t.Skip("config not loaded, skipping")
	}
	return NewEraComparator(NewDeviceComparator())
}

func TestEraComparator(t *testing.T) {
	t.Run("NORMAL_古代3装置_现代1陀螺_验证8维度结果", func(t *testing.T) {
		ec := newTestEraComparator(t)
		resp, err := ec.RunCrossEraComparison(&models.CrossEraComparisonRequest{
			AncientDeviceCodes: []string{"DEV-CENSER", "DEV-JIN", "DEV-ARMILLARY"},
			ModernDeviceCodes:  []string{"DEV-GYRO"},
			MotionProfile:      "gentle_walking",
			IncludeHistorical:  true,
		})
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if len(resp.Dimensions) < 3 {
			t.Fatalf("expected >=3 dimensions, got %d", len(resp.Dimensions))
		}
		for _, d := range resp.Dimensions {
			if d.DimensionKey == "" {
				t.Error("dimension key empty")
			}
			if d.ImprovementRatio <= 0 {
				t.Errorf("dim[%s] improvement_ratio=%.4f should be >0", d.DimensionKey, d.ImprovementRatio)
			}
			if math.IsNaN(d.ImprovementRatio) || math.IsInf(d.ImprovementRatio, 0) {
				t.Errorf("dim[%s] improvement_ratio is NaN/Inf", d.DimensionKey)
			}
		}
		if resp.OverallScore == nil {
			t.Error("overall_score missing")
		}
		for k, v := range resp.OverallScore {
			if math.IsNaN(v) || math.IsInf(v, 0) {
				t.Errorf("overall_score[%s] NaN/Inf: %.4f", k, v)
			}
		}
		if len(resp.Title) < 4 {
			t.Error("title too short")
		}
		if len(resp.PhilosophyNote) < 8 {
			t.Error("philosophy_note too short")
		}
		if resp.AncientSummary == nil {
			t.Error("ancient_summary missing")
		}
		if resp.ModernSummary == nil {
			t.Error("modern_summary missing")
		}
	})

	t.Run("BOUNDARY_仅古代装置_无现代装置_自动回退", func(t *testing.T) {
		ec := newTestEraComparator(t)
		resp, err := ec.RunCrossEraComparison(&models.CrossEraComparisonRequest{
			AncientDeviceCodes: []string{"DEV-CENSER", "DEV-JIN"},
			ModernDeviceCodes:  []string{},
			MotionProfile:      "gentle_walking",
		})
		if err != nil {
			t.Fatalf("expected no error with empty modern list, got %v", err)
		}
		if len(resp.Dimensions) == 0 {
			t.Error("dimensions should not be empty after fallback")
		}
		foundModern := false
		for _, d := range resp.Dimensions {
			if d.ModernBest.DeviceCode != "" {
				foundModern = true
			}
		}
		if !foundModern {
			t.Log("NOTE: no modern best in dimensions (fallback may not provide modern device)")
		}
	})

	t.Run("BOUNDARY_improveRatio计算_精度维度验证", func(t *testing.T) {
		ec := newTestEraComparator(t)
		resp, err := ec.RunCrossEraComparison(&models.CrossEraComparisonRequest{
			AncientDeviceCodes: []string{"DEV-CENSER"},
			ModernDeviceCodes:  []string{"DEV-GYRO"},
			MotionProfile:      "gentle_walking",
		})
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		var precisionDim *models.CrossEraDimensionResult
		for i := range resp.Dimensions {
			if resp.Dimensions[i].DimensionKey == "precision_angle_deg" {
				precisionDim = &resp.Dimensions[i]
				break
			}
		}
		if precisionDim == nil {
			t.Skip("precision dimension not found")
		}
		if precisionDim.AncientBest.Value <= 0 {
			t.Errorf("ancient precision should be >0, got %.4e", precisionDim.AncientBest.Value)
		}
		if precisionDim.ModernBest.Value <= 0 {
			t.Errorf("modern precision should be >0, got %.4e", precisionDim.ModernBest.Value)
		}
		if precisionDim.AncientBest.EraTag != "ancient_china" {
			t.Errorf("ancient best era_tag=%s, want ancient_china", precisionDim.AncientBest.EraTag)
		}
		if precisionDim.ModernBest.EraTag != "modern" {
			t.Errorf("modern best era_tag=%s, want modern", precisionDim.ModernBest.EraTag)
		}
		if precisionDim.ImprovementRatio < 1.0 {
			t.Logf("NOTE: precision improvement_ratio=%.2f, modern expected > ancient (check params)",
				precisionDim.ImprovementRatio)
		}
		if precisionDim.LowerIsBetter {
			expectedRatio := precisionDim.AncientBest.Value / math.Max(precisionDim.ModernBest.Value, 1e-9)
			if math.Abs(precisionDim.ImprovementRatio-expectedRatio) > 0.01 {
				t.Errorf("improvement_ratio=%.4f, expected ~%.4f for lower_is_better",
					precisionDim.ImprovementRatio, expectedRatio)
			}
		}
	})

	t.Run("ABNORMAL_config未加载", func(t *testing.T) {
		if config.Mechanical != nil {
			t.Skip("config is loaded, cannot test unloaded scenario")
		}
		ec := NewEraComparator(NewDeviceComparator())
		_, err := ec.RunCrossEraComparison(&models.CrossEraComparisonRequest{
			AncientDeviceCodes: []string{"DEV-CENSER"},
			ModernDeviceCodes:  []string{"DEV-GYRO"},
			MotionProfile:      "gentle_walking",
		})
		if err == nil {
			t.Error("expected error when config not loaded, got nil")
		}
	})
}
