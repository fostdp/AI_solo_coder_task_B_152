package models

import (
	"time"

	"github.com/google/uuid"
)

type Censer struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Code        string    `json:"code" db:"code"`
	Description string    `json:"description,omitempty" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type SensorData struct {
	Time                time.Time  `json:"time" db:"time"`
	CenserID            uuid.UUID  `json:"censer_id" db:"censer_id"`
	InnerRingAngle      float64    `json:"inner_ring_angle" db:"inner_ring_angle"`
	OuterRingAngle      float64    `json:"outer_ring_angle" db:"outer_ring_angle"`
	BodyTilt            float64    `json:"body_tilt" db:"body_tilt"`
	SloshAcceleration   float64    `json:"slosh_acceleration" db:"slosh_acceleration"`
	InnerRingVelocity   *float64   `json:"inner_ring_velocity,omitempty" db:"inner_ring_velocity"`
	OuterRingVelocity   *float64   `json:"outer_ring_velocity,omitempty" db:"outer_ring_velocity"`
	BodyAngularVelocity *float64   `json:"body_angular_velocity,omitempty" db:"body_angular_velocity"`
	Temperature         *float64   `json:"temperature,omitempty" db:"temperature"`
	BalanceScore        *float64   `json:"balance_score,omitempty" db:"balance_score"`
	SpillRisk           *float64   `json:"spill_risk,omitempty" db:"spill_risk"`
	RawData             *string    `json:"raw_data,omitempty" db:"raw_data"`
}

type Alert struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	CenserID       uuid.UUID  `json:"censer_id" db:"censer_id"`
	AlertType      string     `json:"alert_type" db:"alert_type"`
	Severity       string     `json:"severity" db:"severity"`
	Message        string     `json:"message" db:"message"`
	ThresholdValue *float64   `json:"threshold_value,omitempty" db:"threshold_value"`
	ActualValue    *float64   `json:"actual_value,omitempty" db:"actual_value"`
	SensorDataTime *time.Time `json:"sensor_data_time,omitempty" db:"sensor_data_time"`
	Acknowledged   bool       `json:"acknowledged" db:"acknowledged"`
	AcknowledgedAt *time.Time `json:"acknowledged_at,omitempty" db:"acknowledged_at"`
	AcknowledgedBy *string    `json:"acknowledged_by,omitempty" db:"acknowledged_by"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
}

type SimulationConfig struct {
	ID                    uuid.UUID `json:"id" db:"id"`
	CenserID              uuid.UUID `json:"censer_id" db:"censer_id"`
	InnerRingMass         float64   `json:"inner_ring_mass" db:"inner_ring_mass"`
	OuterRingMass         float64   `json:"outer_ring_mass" db:"outer_ring_mass"`
	BodyMass              float64   `json:"body_mass" db:"body_mass"`
	InnerRingRadius       float64   `json:"inner_ring_radius" db:"inner_ring_radius"`
	OuterRingRadius       float64   `json:"outer_ring_radius" db:"outer_ring_radius"`
	BodyRadius            float64   `json:"body_radius" db:"body_radius"`
	FrictionCoefficient   float64   `json:"friction_coefficient" db:"friction_coefficient"`
	DampingCoefficient    float64   `json:"damping_coefficient" db:"damping_coefficient"`
	Gravity               float64   `json:"gravity" db:"gravity"`
	TiltAlarmThreshold    float64   `json:"tilt_alarm_threshold" db:"tilt_alarm_threshold"`
	BalanceAlarmThreshold float64   `json:"balance_alarm_threshold" db:"balance_alarm_threshold"`
	SpillAlarmThreshold   float64   `json:"spill_alarm_threshold" db:"spill_alarm_threshold"`
	PerfumeViscosity      float64   `json:"perfume_viscosity" db:"perfume_viscosity"`
	FillRatio             float64   `json:"fill_ratio" db:"fill_ratio"`
	CreatedAt             time.Time `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time `json:"updated_at" db:"updated_at"`
}

type SloshAnalysis struct {
	ID                uuid.UUID  `json:"id" db:"id"`
	CenserID          uuid.UUID  `json:"censer_id" db:"censer_id"`
	AnalysisType      string     `json:"analysis_type" db:"analysis_type"`
	MotionType        string     `json:"motion_type" db:"motion_type"`
	Frequency         float64    `json:"frequency" db:"frequency"`
	Amplitude         float64    `json:"amplitude" db:"amplitude"`
	DampingRatio      *float64   `json:"damping_ratio,omitempty" db:"damping_ratio"`
	ResonanceFactor   *float64   `json:"resonance_factor,omitempty" db:"resonance_factor"`
	MaxTiltAngle      *float64   `json:"max_tilt_angle,omitempty" db:"max_tilt_angle"`
	SpillProbability  *float64   `json:"spill_probability,omitempty" db:"spill_probability"`
	BalanceEfficiency *float64   `json:"balance_efficiency,omitempty" db:"balance_efficiency"`
	AnalysisData      *string    `json:"analysis_data,omitempty" db:"analysis_data"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
}

type LatestSensorData struct {
	Time              time.Time `json:"time" db:"time"`
	CenserID          uuid.UUID `json:"censer_id" db:"censer_id"`
	CenserName        string    `json:"censer_name" db:"censer_name"`
	CenserCode        string    `json:"censer_code" db:"censer_code"`
	InnerRingAngle    float64   `json:"inner_ring_angle" db:"inner_ring_angle"`
	OuterRingAngle    float64   `json:"outer_ring_angle" db:"outer_ring_angle"`
	BodyTilt          float64   `json:"body_tilt" db:"body_tilt"`
	SloshAcceleration float64   `json:"slosh_acceleration" db:"slosh_acceleration"`
	BalanceScore      *float64  `json:"balance_score,omitempty" db:"balance_score"`
	SpillRisk         *float64  `json:"spill_risk,omitempty" db:"spill_risk"`
}

type StabilityStats struct {
	CenserID         uuid.UUID `json:"censer_id" db:"censer_id"`
	CenserName       string    `json:"censer_name" db:"censer_name"`
	CenserCode       string    `json:"censer_code" db:"censer_code"`
	DataPoints       int64     `json:"data_points" db:"data_points"`
	AvgTilt          *float64  `json:"avg_tilt,omitempty" db:"avg_tilt"`
	MaxTilt          *float64  `json:"max_tilt,omitempty" db:"max_tilt"`
	MinBalanceScore  *float64  `json:"min_balance_score,omitempty" db:"min_balance_score"`
	AvgBalanceScore  *float64  `json:"avg_balance_score,omitempty" db:"avg_balance_score"`
	AvgSpillRisk     *float64  `json:"avg_spill_risk,omitempty" db:"avg_spill_risk"`
	MaxSpillRisk     *float64  `json:"max_spill_risk,omitempty" db:"max_spill_risk"`
}

type ActiveAlerts struct {
	CenserID      uuid.UUID `json:"censer_id" db:"censer_id"`
	CenserName    string    `json:"censer_name" db:"censer_name"`
	CenserCode    string    `json:"censer_code" db:"censer_code"`
	CriticalCount int64     `json:"critical_count" db:"critical_count"`
	WarningCount  int64     `json:"warning_count" db:"warning_count"`
	TotalCount    int64     `json:"total_count" db:"total_count"`
}

type WebsocketMessage struct {
	Type    string      `json:"type"`
	Data    interface{} `json:"data"`
	Time    time.Time   `json:"time"`
}

type GimbalState struct {
	InnerAngle     float64
	OuterAngle     float64
	BodyAngle      float64
	InnerVelocity  float64
	OuterVelocity  float64
	BodyVelocity   float64
}

type ExternalForce struct {
	AccelerationX float64
	AccelerationY float64
	AccelerationZ float64
	RotationRate  float64
}

type SloshAnalysisResult struct {
	MotionType        string    `json:"motion_type"`
	Frequency         float64   `json:"frequency"`
	Amplitude         float64   `json:"amplitude"`
	DampingRatio      float64   `json:"damping_ratio"`
	ResonanceFactor   float64   `json:"resonance_factor"`
	MaxTiltAngle      float64   `json:"max_tilt_angle"`
	SpillProbability  float64   `json:"spill_probability"`
	BalanceEfficiency float64   `json:"balance_efficiency"`
	TimeSeries        []float64 `json:"time_series,omitempty"`
}

// ----------------- Feature 1: 古代常平架装置对比 -----------------

type DeviceBalanceComparison struct {
	ID                uuid.UUID  `json:"id" db:"id"`
	SessionID         string     `json:"session_id" db:"session_id"`
	DeviceCodes       []string   `json:"device_codes" db:"-"`
	DeviceCodesStr    string     `json:"-" db:"device_codes_str"`
	MotionProfile     string     `json:"motion_profile" db:"motion_profile"`
	DurationSec       float64    `json:"duration_sec" db:"duration_sec"`
	AnalysisDataJSON  *string    `json:"analysis_data,omitempty" db:"analysis_data_json"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
}

type DeviceBalanceMetrics struct {
	DeviceCode        string  `json:"device_code"`
	DeviceName        string  `json:"device_name"`
	DeviceType        string  `json:"device_type"`
	Dynasty           string  `json:"dynasty"`
	RingsCount        int     `json:"rings_count"`
	AvgTiltDeg        float64 `json:"avg_tilt_deg"`
	MaxTiltDeg        float64 `json:"max_tilt_deg"`
	MinTiltDeg        float64 `json:"min_tilt_deg"`
	TiltStdDev        float64 `json:"tilt_std_dev"`
	AvgBalanceScore   float64 `json:"avg_balance_score"`
	MinBalanceScore   float64 `json:"min_balance_score"`
	SettleTimeMs      float64 `json:"settle_time_ms"`
	OvershootPercent  float64 `json:"overshoot_percent"`
	DisturbanceGain   float64 `json:"disturbance_gain"`
	SpillRiskAvg      float64 `json:"spill_risk_avg"`
	SpillRiskMax      float64 `json:"spill_risk_max"`
	FrictionPowerW    float64 `json:"friction_power_w"`
	OverallRank       int     `json:"overall_rank"`
	TiltTimeSeries    []float64 `json:"tilt_time_series,omitempty"`
	BalanceTimeSeries []float64 `json:"balance_time_series,omitempty"`
}

type DeviceComparisonRequest struct {
	DeviceCodes   []string `json:"device_codes" binding:"required,min=2,max=6"`
	MotionProfile string   `json:"motion_profile" binding:"required"`
	DurationSec   float64  `json:"duration_sec"`
	AmplitudeX    *float64 `json:"amplitude_x,omitempty"`
	AmplitudeY    *float64 `json:"amplitude_y,omitempty"`
	AmplitudeZ    *float64 `json:"amplitude_z,omitempty"`
	FrequencyHz   *float64 `json:"frequency_hz,omitempty"`
}

type DeviceComparisonResponse struct {
	SessionID       string                   `json:"session_id"`
	MotionProfile   string                   `json:"motion_profile"`
	DurationSec     float64                  `json:"duration_sec"`
	TimeStepMs      float64                  `json:"time_step_ms"`
	DeviceMetrics   []DeviceBalanceMetrics   `json:"device_metrics"`
	RankingSummary  map[string]interface{}   `json:"ranking_summary"`
}

// ----------------- Feature 2: 跨时代对比 -----------------

type CrossEraComparisonRequest struct {
	AncientDeviceCodes []string `json:"ancient_device_codes"`
	ModernDeviceCodes  []string `json:"modern_device_codes"`
	MotionProfile      string   `json:"motion_profile"`
	IncludeHistorical  bool     `json:"include_historical_context"`
}

type CrossEraMetricPoint struct {
	DeviceCode      string  `json:"device_code"`
	DeviceName      string  `json:"device_name"`
	EraTag          string  `json:"era_tag"`
	Value           float64 `json:"value"`
	NormalizedScore float64 `json:"normalized_score"`
}

type CrossEraDimensionResult struct {
	DimensionKey    string              `json:"dimension_key"`
	DimensionLabel  string              `json:"dimension_label"`
	LowerIsBetter   bool                `json:"lower_is_better"`
	AncientBest     CrossEraMetricPoint `json:"ancient_best"`
	ModernBest      CrossEraMetricPoint `json:"modern_best"`
	ImprovementRatio float64             `json:"improvement_ratio"`
	ImprovementLogDB float64             `json:"improvement_log_db"`
	Points          []CrossEraMetricPoint `json:"points"`
}

type CrossEraComparisonResponse struct {
	ID               uuid.UUID                  `json:"id"`
	CreatedAt        time.Time                  `json:"created_at"`
	Title            string                     `json:"title"`
	HistoricalIntro  string                     `json:"historical_intro"`
	Dimensions       []CrossEraDimensionResult  `json:"dimensions"`
	AncientSummary   map[string]interface{}     `json:"ancient_summary"`
	ModernSummary    map[string]interface{}     `json:"modern_summary"`
	PhilosophyNote   string                     `json:"philosophy_note"`
	OverallScore     map[string]float64         `json:"overall_score"`
	TimeSeriesPlots  map[string][]TimeSeriesPair `json:"time_series_plots,omitempty"`
}

type TimeSeriesPair struct {
	T float64 `json:"t"`
	V float64 `json:"v"`
}

// ----------------- Feature 3: 香料粘度影响分析 -----------------

type ViscosityScanRequest struct {
	DeviceCode        string    `json:"device_code"`
	MotionProfile     string    `json:"motion_profile"`
	ViscosityRangePas []float64 `json:"viscosity_range_pas"`
	TemperatureC      *float64  `json:"temperature_c,omitempty"`
	FillRatio         *float64  `json:"fill_ratio,omitempty"`
	DensityKgm3       *float64  `json:"density_kgm3,omitempty"`
	SurfaceTension    *float64  `json:"surface_tension_nm,omitempty"`
}

type ViscosityDataPoint struct {
	ViscosityPas        float64 `json:"viscosity_pas"`
	SpillProbability    float64 `json:"spill_probability"`
	AvgTiltDeg          float64 `json:"avg_tilt_deg"`
	MaxTiltDeg          float64 `json:"max_tilt_deg"`
	DampingRatio        float64 `json:"damping_ratio"`
	ResonanceFactor     float64 `json:"resonance_factor"`
	StokesAttenuationDB float64 `json:"stokes_attenuation_db"`
	BalanceEfficiency   float64 `json:"balance_efficiency"`
	OptimalFillRatio    float64 `json:"optimal_fill_ratio"`
}

type ViscosityScanResponse struct {
	ID                  uuid.UUID                   `json:"id"`
	CreatedAt           time.Time                   `json:"created_at"`
	DeviceCode          string                      `json:"device_code"`
	DeviceName          string                      `json:"device_name"`
	MotionProfile       string                      `json:"motion_profile"`
	DefaultTemperatureC float64                     `json:"default_temperature_c"`
	DefaultFillRatio    float64                     `json:"default_fill_ratio"`
	ScanPoints          []ViscosityDataPoint        `json:"scan_points"`
	OptimalViscosityPas float64                     `json:"optimal_viscosity_pas"`
	CriticalViscosityPas float64                    `json:"critical_viscosity_pas"`
	FitEquation         string                      `json:"fit_equation"`
	CorrelationR2       float64                     `json:"correlation_r2"`
	Recommendation      string                      `json:"recommendation"`
	TemperatureMap      *[][]ViscosityDataPoint     `json:"temperature_map,omitempty"`
	FillRatioMap        *[][]ViscosityDataPoint     `json:"fill_ratio_map,omitempty"`
}

type TempFillSweepRequest struct {
	DeviceCode        string    `json:"device_code"`
	MotionProfile     string    `json:"motion_profile"`
	ViscosityPas      *float64  `json:"viscosity_pas,omitempty"`
	TemperatureRangeC []float64 `json:"temperature_range_c"`
	FillRatioRange    []float64 `json:"fill_ratio_range"`
}

// ----------------- Feature 4: 公众虚拟体验 -----------------

type VirtualExperienceSession struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	SessionToken   string     `json:"session_token" db:"session_token"`
	UserID         *string    `json:"user_id,omitempty" db:"user_id"`
	DeviceCode     string     `json:"device_code" db:"device_code"`
	MotionMode     string     `json:"motion_mode" db:"motion_mode"`
	StartedAt      time.Time  `json:"started_at" db:"started_at"`
	EndedAt        *time.Time `json:"ended_at,omitempty" db:"ended_at"`
	ParamsJSON     *string    `json:"params,omitempty" db:"params_json"`
}

type ExperienceStartRequest struct {
	DeviceCode string  `json:"device_code" binding:"required"`
	MotionMode string  `json:"motion_mode" binding:"required"`
	UserName   *string `json:"user_name,omitempty"`
}

type ExperienceStartResponse struct {
	SessionToken string        `json:"session_token"`
	DeviceCode   string        `json:"device_code"`
	DeviceName   string        `json:"device_name"`
	MotionMode   string        `json:"motion_mode"`
	ModeInfo     MotionModeInfo `json:"mode_info"`
	ExpiresAt    time.Time     `json:"expires_at"`
	HistoricalContext string  `json:"historical_context"`
}

type MotionModeInfo struct {
	Key             string  `json:"key"`
	DisplayName     string  `json:"display_name"`
	FrequencyHz     float64 `json:"frequency_hz"`
	BaseAmplitude   float64 `json:"base_amplitude"`
	IntensityRange  [2]float64 `json:"intensity_range"`
	Scene           string  `json:"scene"`
	AncientContext  string  `json:"ancient_context"`
	BiomechanicsRef *BiomechanicsRef `json:"biomechanics_ref,omitempty"`
}

type BiomechanicsRef struct {
	DataSource       string   `json:"data_source"`
	StudyReference   string   `json:"study_reference"`
	SampleSize       int      `json:"sample_size"`
	CadenceStepsPerMin float64 `json:"cadence_steps_per_min"`
	VerticalAccelPeakG float64 `json:"vertical_accel_peak_g"`
	StepFrequencyHz  float64  `json:"step_frequency_hz"`
	UncertaintyPct   float64  `json:"uncertainty_pct"`
	MeasurementMethod string  `json:"measurement_method,omitempty"`
	Equipment        []string `json:"equipment,omitempty"`
}

type ExperienceTickRequest struct {
	SessionToken string    `json:"session_token" binding:"required"`
	UserIntensity float64  `json:"user_intensity"`
	UserRotationX *float64 `json:"user_rotation_x,omitempty"`
	UserRotationY *float64 `json:"user_rotation_y,omitempty"`
	UserRotationZ *float64 `json:"user_rotation_z,omitempty"`
	TimeStepMs    float64  `json:"time_step_ms"`
}

type ExperienceFrame struct {
	TimeSec                float64            `json:"time_sec"`
	FrameIndex             int64              `json:"frame_index"`
	UserIntensity          float64            `json:"user_intensity"`
	InnerRingAngleDeg      float64            `json:"inner_ring_angle_deg"`
	OuterRingAngleDeg      float64            `json:"outer_ring_angle_deg"`
	MiddleRingAngleDeg     *float64           `json:"middle_ring_angle_deg,omitempty"`
	BodyTiltDeg            float64            `json:"body_tilt_deg"`
	BodyRotationDeg        float64            `json:"body_rotation_deg"`
	BalanceScore           float64            `json:"balance_score"`
	SpillRisk              float64            `json:"spill_risk"`
	InputAccelMps2         [3]float64         `json:"input_accel_mps2"`
	AngularVelocityDegS    [3]float64         `json:"angular_velocity_deg_s"`
	IsSpillEvent           bool               `json:"is_spill_event"`
	Level                  string             `json:"level"`
	LevelProgress          float64            `json:"level_progress"`
	HintText               *string            `json:"hint_text,omitempty"`
}

type ExperienceEndResponse struct {
	SessionToken     string                   `json:"session_token"`
	DurationSec      float64                  `json:"duration_sec"`
	TotalFrames      int64                    `json:"total_frames"`
	MaxIntensity     float64                  `json:"max_intensity"`
	AvgBalanceScore  float64                  `json:"avg_balance_score"`
	SpillEvents      int                      `json:"spill_events"`
	LongestStreakSec float64                  `json:"longest_streak_sec"`
	FinalLevel       string                   `json:"final_level"`
	AchievementTags  []string                 `json:"achievement_tags"`
	HistoricalInsight string                  `json:"historical_insight"`
	SummaryChartData map[string][]float64     `json:"summary_chart_data"`
}
