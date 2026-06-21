package simulation

import (
	"math"

	"censer-simulation/config"
	"censer-simulation/models"
)

type DeviceType string

const (
	DeviceIncenseCenser  DeviceType = "incense_censer"
	DeviceBronzeJin      DeviceType = "bronze_jin"
	DeviceArmillaryMount DeviceType = "armillary_mount"
	DeviceModernGyro     DeviceType = "modern_gyro"
)

type ExtendedGimbalState struct {
	InnerAngle        float64
	OuterAngle        float64
	MiddleAngle       float64
	BodyAngle         float64
	InnerVelocity     float64
	OuterVelocity     float64
	MiddleVelocity    float64
	BodyVelocity      float64
	RotorSpinVelocity float64
}

type MultiDeviceSimulator struct {
	DevicePreset        *config.DevicePreset
	DeviceType          DeviceType
	RingsCount          int
	OuterLimit          float64
	InnerLimit          float64
	MiddleLimit         float64
	FrictionCoeff       float64
	DampingCoeff        float64
	Gravity             float64
	MassOuter           float64
	MassInner           float64
	MassMiddle          float64
	MassBody            float64
	RadiusOuter         float64
	RadiusInner         float64
	RadiusMiddle        float64
	RadiusBody          float64
	I_xx                float64
	I_yy                float64
	I_zz                float64
	RotorSpinRPS        float64
	State               *ExtendedGimbalState
	PerfumeViscosity    float64
	FillRatio           float64
	TiltAlarmThreshold  float64
	BalanceAlarmThresh  float64
}

func NewMultiDeviceSimulator(devicePreset *config.DevicePreset) *MultiDeviceSimulator {
	mp := devicePreset.Mechanical
	sim := &MultiDeviceSimulator{
		DevicePreset:       devicePreset,
		DeviceType:         DeviceType(devicePreset.DeviceType),
		RingsCount:         devicePreset.RingsCount,
		OuterLimit:         mp.OuterRing.RotationLimitDeg,
		InnerLimit:         mp.InnerRing.RotationLimitDeg,
		MiddleLimit:        mp.MiddleRing.RotationLimitDeg,
		FrictionCoeff:      mp.Bearings.FrictionCoefficient,
		DampingCoeff:       mp.Bearings.DampingCoefficient,
		Gravity:            mp.Environment.GravityMps2,
		MassOuter:          mp.OuterRing.MassKg,
		MassInner:          mp.InnerRing.MassKg,
		MassMiddle:         mp.MiddleRing.MassKg,
		MassBody:           mp.Body.MassKg,
		RadiusOuter:        mp.OuterRing.RadiusM,
		RadiusInner:        mp.InnerRing.RadiusM,
		RadiusMiddle:       mp.MiddleRing.RadiusM,
		RadiusBody:         mp.Body.RadiusM,
		I_xx:               mp.Body.MomentsOfInertia.Ixx,
		I_yy:               mp.Body.MomentsOfInertia.Iyy,
		I_zz:               mp.Body.MomentsOfInertia.Izz,
		PerfumeViscosity:   0.5,
		FillRatio:          0.55,
		TiltAlarmThreshold: 15.0,
		BalanceAlarmThresh: 0.3,
		State: &ExtendedGimbalState{
			InnerAngle:    0,
			OuterAngle:    0,
			MiddleAngle:   0,
			BodyAngle:     0,
			InnerVelocity: 0,
			OuterVelocity: 0,
			MiddleVelocity: 0,
			BodyVelocity:  0,
		},
	}
	if sim.DeviceType == DeviceModernGyro {
		sim.RotorSpinRPS = 24000.0 / 60.0
		sim.State.RotorSpinVelocity = sim.RotorSpinRPS * 2 * math.Pi
	}
	return sim
}

func (m *MultiDeviceSimulator) SetPerfumeParams(viscosityPas, fillRatio float64) {
	if viscosityPas > 0 {
		m.PerfumeViscosity = viscosityPas
	}
	if fillRatio > 0 && fillRatio <= 1 {
		m.FillRatio = fillRatio
	}
}

func (m *MultiDeviceSimulator) SetThresholds(tiltDeg, balanceScore float64) {
	if tiltDeg > 0 {
		m.TiltAlarmThreshold = tiltDeg
	}
	if balanceScore > 0 && balanceScore < 1 {
		m.BalanceAlarmThresh = balanceScore
	}
}

func (m *MultiDeviceSimulator) Step(dt float64, force *models.ExternalForce) *ExtendedGimbalState {
	switch m.DeviceType {
	case DeviceBronzeJin:
		m.stepTwoRing(dt, force)
	case DeviceIncenseCenser:
		m.stepThreeRing(dt, force)
	case DeviceModernGyro:
		m.stepThreeRingGyro(dt, force)
	case DeviceArmillaryMount:
		m.stepFourRing(dt, force)
	default:
		m.stepThreeRing(dt, force)
	}
	m.enforceLimits()
	m.applyFriction(dt)
	return m.State
}

func (m *MultiDeviceSimulator) stepTwoRing(dt float64, force *models.ExternalForce) {
	I_outer := m.MassOuter * m.RadiusOuter * m.RadiusOuter
	I_inner := m.MassInner * m.RadiusInner * m.RadiusInner
	I_body := m.MassBody * m.RadiusBody * m.RadiusBody

	oRad := m.State.OuterAngle * math.Pi / 180
	iRad := m.State.InnerAngle * math.Pi / 180
	bRad := m.State.BodyAngle * math.Pi / 180

	omega_o := m.State.OuterVelocity * math.Pi / 180
	omega_i := m.State.InnerVelocity * math.Pi / 180
	omega_b := m.State.BodyVelocity * math.Pi / 180

	{
		gravT := m.MassOuter * m.Gravity * m.RadiusOuter * math.Sin(oRad)
		aT := m.MassOuter * m.RadiusOuter *
			math.Sqrt(force.AccelerationX*force.AccelerationX+force.AccelerationY*force.AccelerationY) *
			math.Cos(oRad)
		gyroT := (I_inner + I_body) * omega_i * omega_b * math.Sin(oRad)
		tau := -gravT - aT + gyroT
		alpha := tau / I_outer
		m.State.OuterVelocity += alpha * dt * (180 / math.Pi)
		m.State.OuterAngle += m.State.OuterVelocity * dt
	}
	{
		gravT := m.MassInner * m.Gravity * m.RadiusInner * math.Sin(iRad) * math.Cos(oRad)
		accelZ := force.AccelerationZ
		accelXY := math.Sqrt(force.AccelerationX*force.AccelerationX + force.AccelerationY*force.AccelerationY)
		aT := m.MassInner * m.RadiusInner *
			(accelZ*math.Cos(iRad) - accelXY*math.Sin(iRad)*math.Sin(oRad))
		gyroT := -(I_inner + I_body) * omega_o * omega_b * math.Sin(oRad)
		tau := -gravT - aT + gyroT
		alpha := tau / I_inner
		m.State.InnerVelocity += alpha * dt * (180 / math.Pi)
		m.State.InnerAngle += m.State.InnerVelocity * dt
	}
	{
		effG := m.Gravity * math.Cos(iRad) * math.Cos(oRad)
		gravT := m.MassBody * effG * m.RadiusBody * math.Sin(bRad)
		cplT := m.DampingCoeff * (omega_i + omega_o - omega_b)
		gyroT := -I_body * omega_o * omega_i * math.Cos(oRad) * math.Sin(iRad)
		tau := -gravT - cplT + gyroT
		alpha := tau / I_body
		m.State.BodyVelocity += alpha * dt * (180 / math.Pi)
		m.State.BodyAngle += m.State.BodyVelocity * dt
	}
}

func (m *MultiDeviceSimulator) stepThreeRing(dt float64, force *models.ExternalForce) {
	I_outer := m.MassOuter * m.RadiusOuter * m.RadiusOuter
	I_middle := m.MassMiddle * m.RadiusMiddle * m.RadiusMiddle
	I_inner := m.MassInner * m.RadiusInner * m.RadiusInner
	I_body := m.MassBody * m.RadiusBody * m.RadiusBody
	if I_body < m.I_yy {
		I_body = m.I_yy
	}

	oRad := m.State.OuterAngle * math.Pi / 180
	midRad := m.State.MiddleAngle * math.Pi / 180
	iRad := m.State.InnerAngle * math.Pi / 180
	bRad := m.State.BodyAngle * math.Pi / 180

	omega_o := m.State.OuterVelocity * math.Pi / 180
	omega_m := m.State.MiddleVelocity * math.Pi / 180
	omega_i := m.State.InnerVelocity * math.Pi / 180
	omega_b := m.State.BodyVelocity * math.Pi / 180

	{
		gravT := m.MassOuter * m.Gravity * m.RadiusOuter * math.Sin(oRad)
		accelXY := math.Sqrt(force.AccelerationX*force.AccelerationX + force.AccelerationY*force.AccelerationY)
		aT := m.MassOuter * m.RadiusOuter * accelXY * math.Cos(oRad)
		gyroT := (I_middle + I_inner + I_body) * omega_m * omega_b * math.Sin(oRad)
		tau := -gravT - aT + gyroT
		alpha := tau / I_outer
		m.State.OuterVelocity += alpha * dt * (180 / math.Pi)
		m.State.OuterAngle += m.State.OuterVelocity * dt
	}
	{
		if I_middle > 0 {
			gravT := m.MassMiddle * m.Gravity * m.RadiusMiddle * math.Sin(midRad) * math.Cos(oRad)
			accelXY := math.Sqrt(force.AccelerationX*force.AccelerationX + force.AccelerationY*force.AccelerationY)
			aT := m.MassMiddle * m.RadiusMiddle *
				(force.AccelerationZ*math.Cos(midRad) - accelXY*math.Sin(midRad)*math.Sin(oRad))
			gyroT := (I_inner + I_body) * (omega_i*omega_b*math.Sin(midRad) - omega_o*omega_b*math.Sin(oRad))
			tau := -gravT - aT + gyroT
			alpha := tau / I_middle
			m.State.MiddleVelocity += alpha * dt * (180 / math.Pi)
			m.State.MiddleAngle += m.State.MiddleVelocity * dt
		}
	}
	{
		gravT := m.MassInner * m.Gravity * m.RadiusInner * math.Sin(iRad) * math.Cos(midRad) * math.Cos(oRad)
		accelZ := force.AccelerationZ
		accelXY := math.Sqrt(force.AccelerationX*force.AccelerationX + force.AccelerationY*force.AccelerationY)
		aT := m.MassInner * m.RadiusInner *
			(accelZ*math.Cos(iRad) - accelXY*math.Sin(iRad)*math.Sin(midRad))
		gyroT := -(I_inner + I_body) * (omega_m*omega_b*math.Sin(midRad) + omega_o*omega_b*math.Sin(oRad))
		tau := -gravT - aT + gyroT
		alpha := tau / I_inner
		m.State.InnerVelocity += alpha * dt * (180 / math.Pi)
		m.State.InnerAngle += m.State.InnerVelocity * dt
	}
	{
		effG := m.Gravity * math.Cos(iRad) * math.Cos(midRad) * math.Cos(oRad)
		gravT := m.MassBody * effG * m.RadiusBody * math.Sin(bRad)
		cplT := m.DampingCoeff * (omega_i + omega_m + omega_o - omega_b)
		gyroT := -I_body * (omega_o*omega_i*math.Cos(oRad)*math.Sin(iRad) +
			omega_m*omega_i*math.Cos(midRad)*math.Sin(iRad))
		tau := -gravT - cplT + gyroT
		alpha := tau / I_body
		m.State.BodyVelocity += alpha * dt * (180 / math.Pi)
		m.State.BodyAngle += m.State.BodyVelocity * dt
	}
}

func (m *MultiDeviceSimulator) stepThreeRingGyro(dt float64, force *models.ExternalForce) {
	m.stepThreeRing(dt, force)
	L := m.I_zz * m.State.RotorSpinVelocity
	oRad := m.State.OuterAngle * math.Pi / 180
	iRad := m.State.InnerAngle * math.Pi / 180
	omega_o := m.State.OuterVelocity * math.Pi / 180
	omega_i := m.State.InnerVelocity * math.Pi / 180

	gyroStabilizationOuter := -L * omega_i * math.Sin(oRad) * 25.0
	gyroStabilizationInner := -L * omega_o * math.Cos(oRad) * 25.0

	I_outer := m.MassOuter * m.RadiusOuter * m.RadiusOuter
	I_inner := m.MassInner * m.RadiusInner * m.RadiusInner
	if I_outer > 0 {
		m.State.OuterVelocity += (gyroStabilizationOuter / I_outer) * dt * (180 / math.Pi)
	}
	if I_inner > 0 {
		m.State.InnerVelocity += (gyroStabilizationInner / I_inner) * dt * (180 / math.Pi)
	}
}

func (m *MultiDeviceSimulator) stepFourRing(dt float64, force *models.ExternalForce) {
	m.stepThreeRing(dt, force)
	if m.RingsCount >= 4 {
		I_4th := m.MassOuter * 0.8 * m.RadiusOuter * 0.9 * m.RadiusOuter * 0.9
		alpha4 := -m.State.OuterVelocity * m.DampingCoeff / math.Max(I_4th, 1e-6)
		m.State.OuterVelocity += alpha4 * dt * 0.3
	}
}

func (m *MultiDeviceSimulator) enforceLimits() {
	limit := func(angle, vel *float64, lim float64) {
		if lim <= 0 || lim >= 360 {
			return
		}
		if *angle > lim {
			*angle = lim
			*vel = -*vel * 0.5
		}
		if *angle < -lim {
			*angle = -lim
			*vel = -*vel * 0.5
		}
	}
	limit(&m.State.OuterAngle, &m.State.OuterVelocity, m.OuterLimit)
	limit(&m.State.InnerAngle, &m.State.InnerVelocity, m.InnerLimit)
	limit(&m.State.MiddleAngle, &m.State.MiddleVelocity, m.MiddleLimit)

	for {
		changed := false
		if m.State.BodyAngle > 180 {
			m.State.BodyAngle -= 360
			changed = true
		}
		if m.State.BodyAngle < -180 {
			m.State.BodyAngle += 360
			changed = true
		}
		if !changed {
			break
		}
	}
}

func (m *MultiDeviceSimulator) applyFriction(dt float64) {
	factor := math.Exp(-m.FrictionCoeff * dt)
	m.State.OuterVelocity *= factor
	m.State.InnerVelocity *= factor
	m.State.MiddleVelocity *= factor
	m.State.BodyVelocity *= factor

	deadzone := 0.001
	if math.Abs(m.State.OuterVelocity) < deadzone {
		m.State.OuterVelocity = 0
	}
	if math.Abs(m.State.InnerVelocity) < deadzone {
		m.State.InnerVelocity = 0
	}
	if math.Abs(m.State.MiddleVelocity) < deadzone {
		m.State.MiddleVelocity = 0
	}
	if math.Abs(m.State.BodyVelocity) < deadzone {
		m.State.BodyVelocity = 0
	}
}

func (m *MultiDeviceSimulator) CalculateBodyTilt() float64 {
	iRad := m.State.InnerAngle * math.Pi / 180
	oRad := m.State.OuterAngle * math.Pi / 180
	mRad := m.State.MiddleAngle * math.Pi / 180
	bRad := m.State.BodyAngle * math.Pi / 180

	cos := math.Cos(iRad) * math.Cos(oRad) * math.Cos(bRad) * math.Cos(mRad)
	if cos > 1 {
		cos = 1
	}
	if cos < -1 {
		cos = -1
	}
	return math.Acos(cos) * 180 / math.Pi
}

func (m *MultiDeviceSimulator) CalculateBalanceScore() float64 {
	bodyTilt := m.CalculateBodyTilt()
	threshold := m.TiltAlarmThreshold
	if threshold <= 0 {
		threshold = 15
	}
	tiltScore := math.Exp(-bodyTilt * bodyTilt / (2 * threshold * threshold))

	totalVel := math.Abs(m.State.InnerVelocity) +
		math.Abs(m.State.OuterVelocity) +
		math.Abs(m.State.MiddleVelocity) +
		math.Abs(m.State.BodyVelocity)
	velocityScore := math.Exp(-totalVel / 60.0)

	score := 0.7*tiltScore + 0.3*velocityScore
	if score < 0 {
		score = 0
	}
	if score > 1 {
		score = 1
	}
	return score
}

func (m *MultiDeviceSimulator) CalculateSpillRisk() float64 {
	bodyTilt := m.CalculateBodyTilt()
	balanceScore := m.CalculateBalanceScore()
	tiltThreshold := m.TiltAlarmThreshold
	if tiltThreshold <= 0 {
		tiltThreshold = 15
	}
	balanceThreshold := m.BalanceAlarmThresh
	if balanceThreshold <= 0 {
		balanceThreshold = 0.3
	}
	viscosity := m.PerfumeViscosity
	if viscosity <= 0 {
		viscosity = 0.5
	}
	fillRatio := m.FillRatio
	if fillRatio <= 0 || fillRatio > 1 {
		fillRatio = 0.6
	}

	R := m.RadiusBody
	fluidDamping := 8.0 * math.Pi * viscosity * R * R * R * fillRatio
	maxFluidDamping := 8.0 * math.Pi * 100.0 * R * R * R * 1.0
	normalizedDamping := fluidDamping / maxFluidDamping
	if normalizedDamping > 1 {
		normalizedDamping = 1
	}

	omega_body := math.Abs(m.State.BodyVelocity) * math.Pi / 180.0
	omega_inner := math.Abs(m.State.InnerVelocity) * math.Pi / 180.0
	omega_outer := math.Abs(m.State.OuterVelocity) * math.Pi / 180.0
	totalOmega := omega_body + omega_inner + omega_outer
	criticalOmega := 3.0
	sloshExcitation := totalOmega / criticalOmega
	if sloshExcitation > 1 {
		sloshExcitation = 1
	}

	fluidDampingFactor := math.Exp(-normalizedDamping * 2.5)
	fillFactor := 1.0 - 0.6*fillRatio + 0.4*fillRatio*fillRatio

	tiltRisk := 0.0
	if bodyTilt > tiltThreshold*0.5 {
		tiltRisk = (bodyTilt - tiltThreshold*0.5) / (tiltThreshold * 0.5)
		if tiltRisk > 1 {
			tiltRisk = 1
		}
	}
	balanceRisk := 0.0
	if balanceScore < 1.0-balanceThreshold {
		balanceRisk = (1.0 - balanceThreshold - balanceScore) / (1.0 - balanceThreshold)
		if balanceRisk > 1 {
			balanceRisk = 1
		}
	}
	sloshRisk := sloshExcitation * fluidDampingFactor * fillFactor
	if sloshRisk > 1 {
		sloshRisk = 1
	}

	risk := 0.45*tiltRisk + 0.25*balanceRisk + 0.30*sloshRisk
	if risk < 0 {
		risk = 0
	}
	if risk > 1 {
		risk = 1
	}
	return risk
}

func (m *MultiDeviceSimulator) RunSimulation(
	durationSec, dtMs float64,
	accelXFunc, accelYFunc, accelZFunc func(t float64) float64,
	rotRateFunc func(t float64) float64,
) (
	tiltSeries []float64,
	balanceSeries []float64,
	spillRiskSeries []float64,
	states []*ExtendedGimbalState,
	avgTilt, maxTilt, minTilt, stdTilt float64,
	avgBalance, minBalance float64,
	settleTimeMs float64,
	overshootPct float64,
	disturbanceGain float64,
	avgSpillRisk, maxSpillRisk float64,
	frictionPowerW float64,
) {
	dt := dtMs / 1000.0
	n := int(durationSec / dt)
	tiltSeries = make([]float64, 0, n)
	balanceSeries = make([]float64, 0, n)
	spillRiskSeries = make([]float64, 0, n)
	states = make([]*ExtendedGimbalState, 0, n)

	force := &models.ExternalForce{}
	firstTilt := 0.0
	peakTilt := 0.0
	steadyStateTilt := 0.0
	settledIdx := -1
	steadyWindow := 50
	var sumAccel float64
	for i := 0; i < n; i++ {
		t := float64(i) * dt
		force.AccelerationX = accelXFunc(t)
		force.AccelerationY = accelYFunc(t)
		force.AccelerationZ = accelZFunc(t)
		force.RotationRate = rotRateFunc(t)
		sumAccel += math.Abs(force.AccelerationX) + math.Abs(force.AccelerationY) + math.Abs(force.AccelerationZ)

		state := m.Step(dt, force)
		cp := *state
		states = append(states, &cp)

		tilt := m.CalculateBodyTilt()
		bal := m.CalculateBalanceScore()
		sp := m.CalculateSpillRisk()
		tiltSeries = append(tiltSeries, tilt)
		balanceSeries = append(balanceSeries, bal)
		spillRiskSeries = append(spillRiskSeries, sp)

		if i == 0 {
			firstTilt = tilt
		}
		if tilt > peakTilt {
			peakTilt = tilt
		}
		if i > n*3/4 && settledIdx == -1 {
			steadyStateTilt += tilt
			if (i - n*3/4) >= steadyWindow {
				avgWin := steadyStateTilt / float64(steadyWindow+1)
				lastWin := tiltSeries[i-steadyWindow : i+1]
				stable := true
				for _, v := range lastWin {
					if math.Abs(v-avgWin) > 0.1 {
						stable = false
						break
					}
				}
				if stable {
					settledIdx = i - steadyWindow
				}
				steadyStateTilt = 0
			}
		}
	}

	var sumT, sumT2, sumB, sumSp float64
	minTilt = 1e9
	minBalance = 1.0
	maxSpillRisk = 0
	maxTilt = 0
	for i := 0; i < len(tiltSeries); i++ {
		sumT += tiltSeries[i]
		sumT2 += tiltSeries[i] * tiltSeries[i]
		sumB += balanceSeries[i]
		sumSp += spillRiskSeries[i]
		if tiltSeries[i] > maxTilt {
			maxTilt = tiltSeries[i]
		}
		if tiltSeries[i] < minTilt {
			minTilt = tiltSeries[i]
		}
		if balanceSeries[i] < minBalance {
			minBalance = balanceSeries[i]
		}
		if spillRiskSeries[i] > maxSpillRisk {
			maxSpillRisk = spillRiskSeries[i]
		}
	}
	N := float64(len(tiltSeries))
	avgTilt = sumT / N
	avgBalance = sumB / N
	avgSpillRisk = sumSp / N
	varT := sumT2/N - avgTilt*avgTilt
	if varT < 0 {
		varT = 0
	}
	stdTilt = math.Sqrt(varT)

	if settledIdx >= 0 {
		settleTimeMs = float64(settledIdx) * dtMs
	} else {
		settleTimeMs = durationSec * 1000
	}
	if firstTilt < 0.01 {
		firstTilt = 0.01
	}
	overshootPct = math.Max(0, (peakTilt-avgTilt)/firstTilt) * 100.0
	if overshootPct > 1000 {
		overshootPct = 1000
	}
	inputAmp := sumAccel / math.Max(float64(n), 1)
	if inputAmp < 1e-6 {
		inputAmp = 1e-6
	}
	disturbanceGain = avgTilt / inputAmp

	frictionPowerW = m.FrictionCoeff * (m.MassOuter*m.RadiusOuter +
		m.MassInner*m.RadiusInner + m.MassMiddle*m.RadiusMiddle) *
		m.Gravity * avgTilt * math.Pi / 180.0 * 2.0

	return
}
