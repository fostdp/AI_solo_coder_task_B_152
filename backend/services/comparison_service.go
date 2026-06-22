package services

import (
	"censer-simulation/models"
)

type ComparisonService struct {
	deviceComp *DeviceComparator
	eraComp    *EraComparator
	viscAnal   *ViscosityAnalyzer
	vrGimbal   *VrGimbal
}

func NewComparisonService() *ComparisonService {
	dc := NewDeviceComparator()
	return &ComparisonService{
		deviceComp: dc,
		eraComp:    NewEraComparator(dc),
		viscAnal:   NewViscosityAnalyzer(),
		vrGimbal:   NewVrGimbal(),
	}
}

func NewComparisonServiceWithDeps(
	dc *DeviceComparator,
	ec *EraComparator,
	va *ViscosityAnalyzer,
	vg *VrGimbal,
) *ComparisonService {
	return &ComparisonService{
		deviceComp: dc,
		eraComp:    ec,
		viscAnal:   va,
		vrGimbal:   vg,
	}
}

func (cs *ComparisonService) DeviceComparator() *DeviceComparator   { return cs.deviceComp }
func (cs *ComparisonService) EraComparator() *EraComparator         { return cs.eraComp }
func (cs *ComparisonService) ViscosityAnalyzer() *ViscosityAnalyzer { return cs.viscAnal }
func (cs *ComparisonService) VrGimbal() *VrGimbal                   { return cs.vrGimbal }

func (cs *ComparisonService) RunDeviceComparison(req *models.DeviceComparisonRequest) (*models.DeviceComparisonResponse, error) {
	return cs.deviceComp.RunDeviceComparison(req)
}

func (cs *ComparisonService) RunCrossEraComparison(req *models.CrossEraComparisonRequest) (*models.CrossEraComparisonResponse, error) {
	return cs.eraComp.RunCrossEraComparison(req)
}

func (cs *ComparisonService) RunViscosityScan(req *models.ViscosityScanRequest) (*models.ViscosityScanResponse, error) {
	return cs.viscAnal.RunViscosityScan(req)
}

func (cs *ComparisonService) StartExperience(req *models.ExperienceStartRequest) (*models.ExperienceStartResponse, error) {
	return cs.vrGimbal.StartExperience(req)
}

func (cs *ComparisonService) TickExperience(req *models.ExperienceTickRequest) (*models.ExperienceFrame, error) {
	return cs.vrGimbal.TickExperience(req)
}

func (cs *ComparisonService) EndExperience(sessionToken string) (*models.ExperienceEndResponse, error) {
	return cs.vrGimbal.EndExperience(sessionToken)
}
