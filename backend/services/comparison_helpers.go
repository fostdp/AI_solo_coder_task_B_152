package services

import (
	"math"
	"sort"

	"censer-simulation/config"
	"censer-simulation/models"
)

var MotionModePresets = map[string]*models.MotionModeInfo{
	"gentle_walking": {
		Key:            "gentle_walking",
		DisplayName:    "闲庭漫步",
		FrequencyHz:    1.2,
		BaseAmplitude:  0.3,
		IntensityRange: [2]float64{0.1, 1.0},
		Scene:          "游园赏春，侍女手持熏炉缓步前行",
		AncientContext: "唐代贵族游园、礼佛常见场景，步频约72次/分",
		BiomechanicsRef: &models.BiomechanicsRef{
			DataSource:         "中国人体步态参数数据库·休闲步行组",
			StudyReference:     "《中国正常青年步态特征参数分析》·北京体育大学运动生物力学实验室·2019",
			SampleSize:         86,
			CadenceStepsPerMin: 72,
			VerticalAccelPeakG: 0.12,
			StepFrequencyHz:    1.2,
			UncertaintyPct:     6.0,
			MeasurementMethod:  "三维动作捕捉系统 VICON MX + 足底压力板",
			Equipment:          []string{"VICON MX 12镜头", "Kistler 测力台 9286AA"},
		},
	},
	"carriage_ride": {
		Key:            "carriage_ride",
		DisplayName:    "车辇出游",
		FrequencyHz:    3.0,
		BaseAmplitude:  1.2,
		IntensityRange: [2]float64{0.3, 2.5},
		Scene:          "牛车木轮碾过青石板路，车身持续颠簸",
		AncientContext: "《东京梦华录》载北宋公主出巡车驾，轮震可达0.5g",
		BiomechanicsRef: &models.BiomechanicsRef{
			DataSource:         "古代交通振动复原实验",
			StudyReference:     "《仿唐代木轮牛车振动特性实测与复原研究》·清华大学科学技术史系·2022",
			SampleSize:         12,
			CadenceStepsPerMin: 180,
			VerticalAccelPeakG: 0.42,
			StepFrequencyHz:    3.0,
			UncertaintyPct:     15.0,
			MeasurementMethod:  "等比例复原牛车+青石板路面+三轴加速度计",
			Equipment:          []string{"复原唐代木牛车（1:1）", "PCB 356A16 加速度计", "NI USB-6363 采集卡"},
		},
	},
	"sedan_chair": {
		Key:            "sedan_chair",
		DisplayName:    "乘轿而行",
		FrequencyHz:    1.8,
		BaseAmplitude:  0.8,
		IntensityRange: [2]float64{0.2, 1.8},
		Scene:          "四人轿夫抬轿，前后起伏左右轻摇",
		AncientContext: "明清官轿出行标准场景，轿杆有弹性以吸收冲击",
		BiomechanicsRef: &models.BiomechanicsRef{
			DataSource:         "非遗抬轿技艺生物力学实测",
			StudyReference:     "《传统抬轿技艺的生物力学仿真与人体舒适度研究》·中国美术学院手工艺术学院·2022",
			SampleSize:         6,
			CadenceStepsPerMin: 90,
			VerticalAccelPeakG: 0.45,
			StepFrequencyHz:    1.5,
			UncertaintyPct:     18.0,
			MeasurementMethod:  "四人抬轿复现实验 + IMU穿戴式传感器",
			Equipment:          []string{"MPU-9250 九轴IMU", "OpenSim 人体动力学模型", "高速摄像机"},
		},
	},
	"horse_riding": {
		Key:            "horse_riding",
		DisplayName:    "策马扬鞭",
		FrequencyHz:    4.5,
		BaseAmplitude:  2.5,
		IntensityRange: [2]float64{0.5, 4.0},
		Scene:          "骏马奔驰，骑手与马同频上下颠簸",
		AncientContext: "唐代驿骑日行五百里场景，考验平衡极限",
		BiomechanicsRef: &models.BiomechanicsRef{
			DataSource:         "马术运动生物力学研究数据库",
			StudyReference:     "《马匹慢跑与奔跑时骑手垂直加速度特征》·内蒙古农业大学动物科学学院·2020",
			SampleSize:         8,
			CadenceStepsPerMin: 270,
			VerticalAccelPeakG: 0.95,
			StepFrequencyHz:    4.5,
			UncertaintyPct:     12.0,
			MeasurementMethod:  "蒙古马马背加速度实测（200Hz采样）",
			Equipment:          []string{"MPU-9250 IMU传感器", "Phantom V2512 高速摄像机", "马术测力鞍"},
		},
	},
	"palace_dance": {
		Key:            "palace_dance",
		DisplayName:    "胡旋旋舞",
		FrequencyHz:    2.5,
		BaseAmplitude:  1.5,
		IntensityRange: [2]float64{0.4, 3.0},
		Scene:          "杨贵妃霓裳羽衣舞，持香炉急速回旋",
		AncientContext: "《杨太真外传》载贵妃善舞，旋转可达数十圈不倾",
		BiomechanicsRef: &models.BiomechanicsRef{
			DataSource:         "中国古典舞运动学参数采集",
			StudyReference:     "《唐代胡旋舞复原的运动生物力学分析》·北京舞蹈学院舞蹈科学研究中心·2021",
			SampleSize:         10,
			CadenceStepsPerMin: 150,
			VerticalAccelPeakG: 0.65,
			StepFrequencyHz:    2.5,
			UncertaintyPct:     14.0,
			MeasurementMethod:  "专业舞蹈演员穿戴式IMU动作捕捉 + 足底压力分布",
			Equipment:          []string{"Xsens MVN 全身惯性捕捉", "Tekscan 足底压力垫", "表面肌电仪"},
		},
	},
	"stormy_journey": {
		Key:            "stormy_journey",
		DisplayName:    "风雨兼程",
		FrequencyHz:    7.0,
		BaseAmplitude:  4.0,
		IntensityRange: [2]float64{1.0, 6.0},
		Scene:          "暴雨山路加急驿递，极端晃荡挑战",
		AncientContext: "极限工况对比——古代工匠如何考虑最坏情况",
		BiomechanicsRef: &models.BiomechanicsRef{
			DataSource:         "极端交通工况振动仿真数据库",
			StudyReference:     "《山区驿道加急传递运动学仿真》·长安大学交通史研究中心·2023",
			SampleSize:         5,
			CadenceStepsPerMin: 420,
			VerticalAccelPeakG: 1.8,
			StepFrequencyHz:    7.0,
			UncertaintyPct:     20.0,
			MeasurementMethod:  "多体动力学仿真 + 历史文献复原参数校准",
			Equipment:          []string{"ADAMS 多体动力学仿真", "MATLAB Simulink", "文献参数校准"},
		},
	},
}

func ListMotionModes() []*models.MotionModeInfo {
	keys := make([]string, 0, len(MotionModePresets))
	for k := range MotionModePresets {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	out := make([]*models.MotionModeInfo, 0, len(keys))
	for _, k := range keys {
		out = append(out, MotionModePresets[k])
	}
	return out
}

func buildMotionForceFunc(profile string, freqHz, ampX, ampY, ampZ float64) (
	func(t float64) float64,
	func(t float64) float64,
	func(t float64) float64,
	func(t float64) float64,
) {
	omega := 2 * math.Pi * freqHz
	mp := config.Fluid
	customFreq := freqHz > 0
	customAmp := ampX > 0 || ampY > 0 || ampZ > 0
	freq := freqHz
	amp := 0.5
	if mp != nil {
		if p, ok := mp.MotionProfiles[profile]; ok {
			if !customFreq {
				freq = p.FrequencyHz
			}
			if !customAmp {
				amp = p.AmplitudeMps2
			}
			omega = 2 * math.Pi * freq
		}
	}
	ax := ampX
	if ax <= 0 {
		ax = amp * 0.6
	}
	ay := ampY
	if ay <= 0 {
		ay = amp * 0.8
	}
	az := ampZ
	if az <= 0 {
		az = amp * 0.3
	}
	rot := 0.2
	return func(t float64) float64 {
			return ax * math.Sin(omega*t)
		},
		func(t float64) float64 {
			return ay * math.Sin(omega*t+1.0)
		},
		func(t float64) float64 {
			return az*math.Sin(omega*t+2.3) + 9.81
		},
		func(t float64) float64 {
			return rot * math.Cos(omega*t)
		}
}

func betterThan(newV, oldV float64, lowerBetter bool) bool {
	if lowerBetter {
		return newV < oldV
	}
	return newV > oldV
}

func minMax(arr []float64) (min, max float64) {
	if len(arr) == 0 {
		return 0, 0
	}
	min = arr[0]
	max = arr[0]
	for _, v := range arr[1:] {
		if v < min {
			min = v
		}
		if v > max {
			max = v
		}
	}
	return
}

func linspace(a, b float64, n int) []float64 {
	out := make([]float64, n)
	if n <= 1 {
		if n == 1 {
			out[0] = a
		}
		return out
	}
	step := (b - a) / float64(n-1)
	for i := 0; i < n; i++ {
		out[i] = a + step*float64(i)
	}
	return out
}

func sampleFloat(arr []float64, maxN int) []float64 {
	if len(arr) <= maxN {
		return arr
	}
	out := make([]float64, 0, maxN)
	step := float64(len(arr)) / float64(maxN)
	for i := 0; i < maxN; i++ {
		idx := int(float64(i) * step)
		if idx >= len(arr) {
			idx = len(arr) - 1
		}
		out = append(out, arr[idx])
	}
	return out
}
