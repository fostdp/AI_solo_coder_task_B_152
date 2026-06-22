package services

import (
	"fmt"
	"math"
	"sync"
	"time"

	"github.com/google/uuid"

	"censer-simulation/config"
	"censer-simulation/models"
	"censer-simulation/simulation"
)

type VrGimbal struct {
	sessions map[string]*ExperienceRuntime
	mu       sync.RWMutex
}

func NewVrGimbal() *VrGimbal {
	return &VrGimbal{sessions: make(map[string]*ExperienceRuntime)}
}

type ExperienceRuntime struct {
	Session    *models.VirtualExperienceSession
	Simulator  *simulation.MultiDeviceSimulator
	FrameIndex int64
	StartedAt  time.Time
	LastTick   time.Time
	Device     *config.DevicePreset
	ModeInfo   *models.MotionModeInfo
	UserName   string
	History    struct {
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

func (vg *VrGimbal) StartExperience(req *models.ExperienceStartRequest) (*models.ExperienceStartResponse, error) {
	mp := config.Mechanical
	if mp == nil {
		return nil, fmt.Errorf("config not loaded")
	}
	mode, ok := MotionModePresets[req.MotionMode]
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
		Session:       session,
		Simulator:     sim,
		StartedAt:     time.Now(),
		LastTick:      time.Now(),
		Device:        dev,
		ModeInfo:      mode,
		UserName:      userName,
		LongestStreak: 0,
		CurrentStreak: 0,
		SpillEvents:   0,
		MaxIntensity:  0,
		CurrentLevel:  "入门 · 初入宫廷",
		LevelProgress: 0,
	}
	vg.mu.Lock()
	vg.sessions[token] = runtime
	vg.mu.Unlock()

	go vg.cleanupExpiredSessions()

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

func (vg *VrGimbal) TickExperience(req *models.ExperienceTickRequest) (*models.ExperienceFrame, error) {
	vg.mu.RLock()
	rt, ok := vg.sessions[req.SessionToken]
	vg.mu.RUnlock()
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

func (vg *VrGimbal) EndExperience(sessionToken string) (*models.ExperienceEndResponse, error) {
	vg.mu.Lock()
	rt, ok := vg.sessions[sessionToken]
	if ok {
		delete(vg.sessions, sessionToken)
	}
	vg.mu.Unlock()
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
		"time_sec":       sampleFloat(linspace(0, dur, int(N)), 100),
		"balance_score":  sampleFloat(rt.History.BalanceScores, 100),
		"body_tilt_deg":  sampleFloat(rt.History.Tilts, 100),
		"spill_risk":     sampleFloat(rt.History.SpillRisks, 100),
		"user_intensity": sampleFloat(rt.History.Intensities, 100),
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

func (vg *VrGimbal) cleanupExpiredSessions() {
	time.Sleep(30 * time.Minute)
	vg.mu.Lock()
	defer vg.mu.Unlock()
	now := time.Now()
	for k, v := range vg.sessions {
		if now.Sub(v.LastTick) > 25*time.Minute {
			delete(vg.sessions, k)
		}
	}
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
