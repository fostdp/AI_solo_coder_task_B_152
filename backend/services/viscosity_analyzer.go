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

type ViscosityAnalyzer struct{}

func NewViscosityAnalyzer() *ViscosityAnalyzer { return &ViscosityAnalyzer{} }

type viscScanJob struct {
	visc     float64
	result   *models.ViscosityDataPoint
	maxSpill float64
	err      error
}

func (va *ViscosityAnalyzer) RunViscosityScan(req *models.ViscosityScanRequest) (*models.ViscosityScanResponse, error) {
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
	if len(viscosityList) == 0 {
		return nil, fmt.Errorf("no viscosity values provided")
	}

	tempC := 25.0
	if req.TemperatureC != nil {
		tempC = *req.TemperatureC
	}
	fillRatio := 0.55
	if req.FillRatio != nil {
		fillRatio = *req.FillRatio
	}

	jobs := make(chan viscScanJob, len(viscosityList))
	var wg sync.WaitGroup

	for _, visc := range viscosityList {
		wg.Add(1)
		go func(v float64) {
			defer wg.Done()
			job := viscScanJob{visc: v}

			sim := simulation.NewMultiDeviceSimulator(dev)
			sim.SetPerfumeParams(v, fillRatio)

			omega0 := math.Sqrt(9.81 / sim.RadiusBody)
			Mmass := sim.MassBody
			dampRatio := (sim.DampingCoeff + 8*math.Pi*v*sim.RadiusBody*sim.RadiusBody*sim.RadiusBody*fillRatio) /
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
			if v > 0 && fp != nil {
				dampingCoeff := fp.SloshDynamics.StokesDampingCoeff
				stokesNorm := 8 * math.Pi * v * sim.RadiusBody * sim.RadiusBody * sim.RadiusBody * fillRatio
				attenDB = -20 * math.Log10(math.Exp(-stokesNorm*dampingCoeff/(Mmass*omega0)))
			}

			effBal := 0.0
			if len(balS) > 0 {
				effBal = avgB
			}
			_ = spillS

			p := &models.ViscosityDataPoint{
				ViscosityPas:        v,
				SpillProbability:    avgSp,
				AvgTiltDeg:          avgT,
				MaxTiltDeg:          maxT,
				DampingRatio:        dampRatio,
				ResonanceFactor:     resFactor,
				StokesAttenuationDB: attenDB,
				BalanceEfficiency:   effBal,
				OptimalFillRatio:    0.55,
			}
			job.result = p
			job.maxSpill = maxSp
			jobs <- job
		}(visc)
	}

	go func() {
		wg.Wait()
		close(jobs)
	}()

	var results []viscScanJob
	for job := range jobs {
		if job.err != nil {
			return nil, job.err
		}
		results = append(results, job)
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].visc < results[j].visc
	})

	points := make([]models.ViscosityDataPoint, 0, len(results))
	minSpill := 1.0
	optimalVisc := results[0].visc
	criticalVisc := 0.0
	var sumLogX, sumY, sumLogX2, sumLogXY float64
	n := 0.0

	for _, r := range results {
		points = append(points, *r.result)
		if r.maxSpill < minSpill {
			minSpill = r.maxSpill
			optimalVisc = r.visc
		}
		if criticalVisc == 0 && r.maxSpill <= 0.05 {
			criticalVisc = r.visc
		}
		lx := math.Log10(math.Max(r.visc, 1e-12))
		sy := r.result.SpillProbability
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
		ID:                   uuid.New(),
		CreatedAt:            time.Now(),
		DeviceCode:           req.DeviceCode,
		DeviceName:           dev.Name,
		MotionProfile:        req.MotionProfile,
		DefaultTemperatureC:  tempC,
		DefaultFillRatio:     fillRatio,
		ScanPoints:           points,
		OptimalViscosityPas:  optimalVisc,
		CriticalViscosityPas: criticalVisc,
		FitEquation:          fitEq,
		CorrelationR2:        r2,
		Recommendation:       recommendation,
	}
	return resp, nil
}
