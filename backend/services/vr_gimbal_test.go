package services

import (
	"testing"
	"time"

	"censer-simulation/config"
	"censer-simulation/models"
)

func newTestVrGimbal(t *testing.T) *VrGimbal {
	t.Helper()
	if config.Mechanical == nil || config.Fluid == nil {
		t.Skip("config not loaded, skipping")
	}
	return NewVrGimbal()
}

func TestVrGimbal(t *testing.T) {
	t.Run("NORMAL_Start_Tick_End_验证等级和成就", func(t *testing.T) {
		vg := newTestVrGimbal(t)
		sr, err := vg.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "DEV-CENSER",
			MotionMode: "gentle_walking",
		})
		if err != nil {
			t.Fatalf("start error: %v", err)
		}
		if sr.SessionToken == "" {
			t.Fatal("session token empty")
		}
		if !sr.ExpiresAt.After(time.Now()) {
			t.Errorf("expires_at %s should be in future", sr.ExpiresAt)
		}
		if sr.DeviceCode != "DEV-CENSER" {
			t.Errorf("device_code=%s, want DEV-CENSER", sr.DeviceCode)
		}
		if sr.MotionMode != "gentle_walking" {
			t.Errorf("motion_mode=%s, want gentle_walking", sr.MotionMode)
		}

		for i := 0; i < 10; i++ {
			fr, err := vg.TickExperience(&models.ExperienceTickRequest{
				SessionToken:  sr.SessionToken,
				UserIntensity: 0.3,
				TimeStepMs:    16.0,
			})
			if err != nil {
				t.Fatalf("tick %d error: %v", i, err)
			}
			if fr.BalanceScore < 0 || fr.BalanceScore > 1.0+epsilonFloat64 {
				t.Errorf("tick%d balance %.4f out of [0,1]", i, fr.BalanceScore)
			}
			if fr.SpillRisk < 0 || fr.SpillRisk > 1.0+epsilonFloat64 {
				t.Errorf("tick%d spill_risk %.4f out of [0,1]", i, fr.SpillRisk)
			}
			if fr.Level == "" {
				t.Errorf("tick%d level empty", i)
			}
			if fr.FrameIndex != int64(i+1) {
				t.Errorf("tick%d frame_index=%d, expected %d", i, fr.FrameIndex, i+1)
			}
		}

		er, err := vg.EndExperience(sr.SessionToken)
		if err != nil {
			t.Fatalf("end error: %v", err)
		}
		if er.TotalFrames != 10 {
			t.Errorf("total frames=%d, expected 10", er.TotalFrames)
		}
		if er.FinalLevel == "" {
			t.Error("final level empty")
		}
		if er.DurationSec <= 0 {
			t.Error("duration_sec should be > 0")
		}
		if len(er.AchievementTags) == 0 {
			t.Log("NOTE: no achievements unlocked (short session)")
		}
		if len(er.SummaryChartData) == 0 {
			t.Error("summary chart data empty")
		}
	})

	t.Run("BOUNDARY_高强度Tick", func(t *testing.T) {
		vg := newTestVrGimbal(t)
		sr, err := vg.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "DEV-JIN",
			MotionMode: "stormy_journey",
		})
		if err != nil {
			t.Fatalf("start error: %v", err)
		}
		spillCount := 0
		for i := 0; i < 50; i++ {
			fr, err := vg.TickExperience(&models.ExperienceTickRequest{
				SessionToken:  sr.SessionToken,
				UserIntensity: 6.0,
				TimeStepMs:    16.0,
			})
			if err != nil {
				t.Fatalf("tick error: %v", err)
			}
			if fr.IsSpillEvent {
				spillCount++
			}
		}
		er, _ := vg.EndExperience(sr.SessionToken)
		if er != nil && er.SpillEvents < spillCount {
			t.Errorf("end.spill_events=%d < counted=%d", er.SpillEvents, spillCount)
		}
		if er != nil && er.MaxIntensity < 6.0-epsilonFloat64 {
			t.Errorf("max_intensity=%.2f < 6.0", er.MaxIntensity)
		}
	})

	t.Run("BOUNDARY_零时长End", func(t *testing.T) {
		vg := newTestVrGimbal(t)
		sr, err := vg.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "DEV-CENSER",
			MotionMode: "gentle_walking",
		})
		if err != nil {
			t.Fatalf("start error: %v", err)
		}
		er, err := vg.EndExperience(sr.SessionToken)
		if err != nil {
			t.Fatalf("end error: %v", err)
		}
		if er.TotalFrames != 0 {
			t.Errorf("total frames=%d, expected 0", er.TotalFrames)
		}
		if er.DurationSec < 0 {
			t.Error("duration should be >= 0")
		}
		if er.FinalLevel == "" {
			t.Error("final level should have default value")
		}
	})

	t.Run("ABNORMAL_无效sessionToken", func(t *testing.T) {
		vg := newTestVrGimbal(t)
		_, err := vg.TickExperience(&models.ExperienceTickRequest{
			SessionToken:  "INVALID-TOKEN-XYZ",
			UserIntensity: 0.5,
		})
		if err == nil {
			t.Error("expected error for invalid token tick, got nil")
		}
		_, err = vg.EndExperience("INVALID-TOKEN-XYZ")
		if err == nil {
			t.Error("expected error for invalid token end, got nil")
		}
	})

	t.Run("ABNORMAL_不存在motionMode", func(t *testing.T) {
		vg := newTestVrGimbal(t)
		_, err := vg.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "DEV-CENSER",
			MotionMode: "warp_drive",
		})
		if err == nil {
			t.Error("expected error for unknown motion mode, got nil")
		}
	})

	t.Run("NORMAL_cleanupExpiredSessions_会话生命周期验证", func(t *testing.T) {
		vg := newTestVrGimbal(t)
		sr1, err := vg.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "DEV-CENSER",
			MotionMode: "gentle_walking",
		})
		if err != nil {
			t.Fatalf("start1 error: %v", err)
		}
		vg.mu.RLock()
		rt, exists := vg.sessions[sr1.SessionToken]
		vg.mu.RUnlock()
		if !exists {
			t.Fatal("session not found in map after start")
		}
		if rt == nil {
			t.Fatal("session runtime is nil")
		}
		if rt.CurrentLevel == "" {
			t.Error("initial level should not be empty")
		}

		_, err = vg.EndExperience(sr1.SessionToken)
		if err != nil {
			t.Fatalf("end1 error: %v", err)
		}
		vg.mu.RLock()
		_, exists = vg.sessions[sr1.SessionToken]
		vg.mu.RUnlock()
		if exists {
			t.Error("session should be removed after EndExperience")
		}

		_, err = vg.TickExperience(&models.ExperienceTickRequest{
			SessionToken:  sr1.SessionToken,
			UserIntensity: 0.5,
		})
		if err == nil {
			t.Error("expected error ticking ended session, got nil")
		}

		sr2, err := vg.StartExperience(&models.ExperienceStartRequest{
			DeviceCode: "DEV-ARMILLARY",
			MotionMode: "carriage_ride",
		})
		if err != nil {
			t.Fatalf("start2 error: %v", err)
		}
		vg.mu.RLock()
		count := len(vg.sessions)
		vg.mu.RUnlock()
		if count != 1 {
			t.Errorf("expected 1 active session, got %d", count)
		}
		_, _ = vg.EndExperience(sr2.SessionToken)
	})
}
