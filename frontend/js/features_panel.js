import { DeviceComparatorPanel } from './device_comparator_panel.js';
import { EraComparatorPanel } from './era_comparator_panel.js';
import { ViscosityAnalyzerPanel } from './viscosity_analyzer_panel.js';
import { VrGimbalPanel } from './vr_gimbal_panel.js';

const FP_STYLES = `
.fp-container {
    font-family: 'Songti SC', 'STSong', 'SimSun', 'PingFang SC', serif;
    background: linear-gradient(135deg, #0d0a06 0%, #1a0e08 50%, #0d0a06 100%);
    color: #f5e6c8;
    min-height: 100vh;
    padding: 24px;
    position: relative;
    overflow-x: hidden;
}
.fp-container::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
        radial-gradient(circle at 20% 30%, rgba(212, 168, 83, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(192, 57, 43, 0.05) 0%, transparent 40%);
    pointer-events: none;
    z-index: 0;
}
.fp-tabs {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 4px;
    margin-bottom: 24px;
    padding: 6px;
    background: rgba(26, 14, 8, 0.8);
    border: 2px solid;
    border-image: linear-gradient(135deg, #c9a84c 0%, #8b6914 50%, #c9a84c 100%) 1;
    border-radius: 2px;
}
.fp-tab {
    flex: 1;
    padding: 14px 18px;
    background: transparent;
    border: 1px solid transparent;
    color: #a89070;
    font-size: 15px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    letter-spacing: 2px;
    font-weight: 500;
}
.fp-tab:hover {
    color: #d4a853;
    background: rgba(212, 168, 83, 0.08);
}
.fp-tab.fp-active {
    color: #f5e6c8;
    background: linear-gradient(180deg, rgba(192, 57, 43, 0.3) 0%, rgba(192, 57, 43, 0.1) 100%);
    border-color: #c9a84c;
    box-shadow: inset 0 0 20px rgba(212, 168, 83, 0.15);
}
.fp-tab.fp-active::before {
    content: '';
    position: absolute;
    top: -2px; left: 20%; right: 20%;
    height: 3px;
    background: linear-gradient(90deg, transparent, #c9a84c, transparent);
}
.fp-panel {
    position: relative;
    z-index: 1;
    display: none;
    animation: fpFadeIn 0.4s ease;
}
.fp-panel.fp-visible { display: block; }
@keyframes fpFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.fp-card {
    background: linear-gradient(145deg, rgba(26, 14, 8, 0.95) 0%, rgba(18, 10, 6, 0.98) 100%);
    border: 1px solid;
    border-image: linear-gradient(135deg, #8b6914 0%, #c9a84c 50%, #8b6914 100%) 1;
    border-radius: 3px;
    padding: 24px;
    margin-bottom: 20px;
    position: relative;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5), inset 0 0 40px rgba(212, 168, 83, 0.03);
}
.fp-card::before, .fp-card::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    border: 2px solid #c9a84c;
}
.fp-card::before {
    top: -1px; left: -1px;
    border-right: none;
    border-bottom: none;
}
.fp-card::after {
    bottom: -1px; right: -1px;
    border-left: none;
    border-top: none;
}
.fp-section-title {
    color: #d4a853;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 18px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(212, 168, 83, 0.3);
    display: flex;
    align-items: center;
    gap: 10px;
    letter-spacing: 3px;
}
.fp-section-title::before {
    content: '❖';
    color: #c0392b;
    font-size: 14px;
}
.fp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.fp-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 900px) {
    .fp-grid-2, .fp-grid-3 { grid-template-columns: 1fr; }
}
.fp-label {
    display: block;
    color: #c9a84c;
    font-size: 13px;
    margin-bottom: 8px;
    letter-spacing: 1px;
}
.fp-select, .fp-input {
    width: 100%;
    padding: 10px 14px;
    background: rgba(13, 10, 6, 0.8);
    border: 1px solid #5a4420;
    border-radius: 2px;
    color: #f5e6c8;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.3s;
}
.fp-select:focus, .fp-input:focus {
    outline: none;
    border-color: #c9a84c;
    box-shadow: 0 0 12px rgba(212, 168, 83, 0.2);
    background: rgba(13, 10, 6, 0.95);
}
.fp-btn {
    padding: 11px 28px;
    background: linear-gradient(135deg, #8b1a1a 0%, #c0392b 50%, #8b1a1a 100%);
    border: 1px solid #d4a853;
    color: #f5e6c8;
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
    letter-spacing: 3px;
    transition: all 0.3s;
    border-radius: 2px;
    position: relative;
    overflow: hidden;
    font-weight: 500;
}
.fp-btn:hover {
    background: linear-gradient(135deg, #a01e1e 0%, #e74c3c 50%, #a01e1e 100%);
    box-shadow: 0 0 20px rgba(192, 57, 43, 0.4), inset 0 0 20px rgba(212, 168, 83, 0.15);
    transform: translateY(-1px);
}
.fp-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}
.fp-btn-gold {
    background: linear-gradient(135deg, #8b6914 0%, #d4a853 50%, #8b6914 100%);
    color: #1a0e08;
    border-color: #f5e6c8;
    font-weight: 600;
}
.fp-btn-gold:hover {
    background: linear-gradient(135deg, #a87c1a 0%, #f4d487 50%, #a87c1a 100%);
    box-shadow: 0 0 20px rgba(212, 168, 83, 0.5);
}
.fp-checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.fp-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(13, 10, 6, 0.6);
    border: 1px solid #5a4420;
    border-radius: 2px;
    cursor: pointer;
    font-size: 13px;
    color: #a89070;
    transition: all 0.25s;
    user-select: none;
}
.fp-checkbox:hover {
    border-color: #8b6914;
    color: #d4a853;
}
.fp-checkbox.fp-checked {
    background: rgba(192, 57, 43, 0.15);
    border-color: #c9a84c;
    color: #f5e6c8;
    box-shadow: inset 0 0 10px rgba(212, 168, 83, 0.1);
}
.fp-checkbox input { display: none; }
.fp-stat-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px dashed rgba(212, 168, 83, 0.15);
    font-size: 13px;
}
.fp-stat-row:last-child { border-bottom: none; }
.fp-stat-label { color: #a89070; }
.fp-stat-value { color: #f5e6c8; font-family: 'Courier New', monospace; }
.fp-stat-value.gold { color: #d4a853; font-weight: 600; }
.fp-stat-value.red { color: #e74c3c; }
.fp-stat-value.green { color: #2ecc71; }
.fp-canvas-wrap {
    background: rgba(5, 3, 2, 0.6);
    border: 1px solid #3a2c14;
    border-radius: 2px;
    padding: 12px;
    position: relative;
}
.fp-canvas-wrap canvas {
    width: 100%;
    display: block;
}
.fp-chart-title {
    color: #c9a84c;
    font-size: 13px;
    margin-bottom: 10px;
    text-align: center;
    letter-spacing: 2px;
}
.fp-loading {
    color: #d4a853;
    text-align: center;
    padding: 40px;
    letter-spacing: 3px;
}
.fp-loading::after {
    content: '';
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #c9a84c;
    border-top-color: transparent;
    border-radius: 50%;
    animation: fpSpin 0.8s linear infinite;
    margin-left: 12px;
    vertical-align: middle;
}
@keyframes fpSpin { to { transform: rotate(360deg); } }
.fp-error {
    color: #e74c3c;
    padding: 16px;
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.3);
    border-radius: 2px;
    letter-spacing: 1px;
}
.fp-score-card {
    background: linear-gradient(135deg, rgba(26, 14, 8, 0.9) 0%, rgba(40, 20, 10, 0.95) 100%);
    border: 2px solid;
    border-radius: 4px;
    padding: 24px;
    text-align: center;
    position: relative;
}
.fp-score-card.ancient { border-image: linear-gradient(135deg, #8b6914, #d4a853, #8b6914) 1; }
.fp-score-card.modern { border-image: linear-gradient(135deg, #2c3e50, #3498db, #2c3e50) 1; }
.fp-score-era {
    font-size: 13px;
    color: #a89070;
    letter-spacing: 4px;
    margin-bottom: 8px;
}
.fp-score-num {
    font-size: 48px;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    line-height: 1;
    margin: 12px 0;
}
.fp-score-card.ancient .fp-score-num { color: #d4a853; text-shadow: 0 0 20px rgba(212, 168, 83, 0.4); }
.fp-score-card.modern .fp-score-num { color: #5dade2; text-shadow: 0 0 20px rgba(93, 173, 226, 0.4); }
.fp-slider-wrap {
    padding: 16px 0;
}
.fp-slider {
    width: 100%;
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    background: linear-gradient(90deg, #2ecc71 0%, #f1c40f 50%, #e74c3c 100%);
    border-radius: 4px;
    outline: none;
    cursor: pointer;
}
.fp-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    background: radial-gradient(circle, #f4d487 0%, #c9a84c 100%);
    border: 2px solid #1a0e08;
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 0 12px rgba(212, 168, 83, 0.5);
    transition: transform 0.1s;
}
.fp-slider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.1); }
.fp-slider::-moz-range-thumb {
    width: 28px;
    height: 28px;
    background: radial-gradient(circle, #f4d487 0%, #c9a84c 100%);
    border: 2px solid #1a0e08;
    border-radius: 50%;
    cursor: grab;
}
.fp-live-metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    background: rgba(5, 3, 2, 0.5);
    border: 1px solid #3a2c14;
    border-radius: 2px;
}
.fp-live-label {
    font-size: 12px;
    color: #a89070;
    letter-spacing: 2px;
    margin-bottom: 6px;
}
.fp-live-value {
    font-size: 28px;
    font-family: 'Courier New', monospace;
    font-weight: 700;
}
.fp-level-badge {
    display: inline-block;
    padding: 6px 16px;
    background: linear-gradient(135deg, #8b1a1a 0%, #c0392b 100%);
    border: 1px solid #d4a853;
    color: #f5e6c8;
    font-size: 14px;
    letter-spacing: 2px;
    border-radius: 2px;
}
.fp-achievements {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
.fp-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: linear-gradient(135deg, rgba(139, 105, 20, 0.3), rgba(212, 168, 83, 0.2));
    border: 1px solid #c9a84c;
    border-radius: 20px;
    font-size: 13px;
    color: #f5e6c8;
    animation: fpBadgeIn 0.5s ease;
}
@keyframes fpBadgeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
}
.fp-progress-wrap {
    margin-top: 6px;
    width: 100%;
    height: 6px;
    background: rgba(5, 3, 2, 0.8);
    border-radius: 3px;
    overflow: hidden;
}
.fp-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #8b6914, #d4a853);
    border-radius: 3px;
    transition: width 0.3s;
}
.fp-hint {
    margin-top: 8px;
    padding: 10px 14px;
    border-radius: 2px;
    font-size: 13px;
    letter-spacing: 1px;
    animation: fpFadeIn 0.3s;
}
.fp-hint.good { background: rgba(46, 204, 113, 0.1); border: 1px solid rgba(46, 204, 113, 0.3); color: #2ecc71; }
.fp-hint.warn { background: rgba(241, 196, 15, 0.1); border: 1px solid rgba(241, 196, 15, 0.3); color: #f1c40f; }
.fp-hint.bad { background: rgba(231, 76, 60, 0.1); border: 1px solid rgba(231, 76, 60, 0.3); color: #e74c3c; }
.fp-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    justify-content: center;
    margin-top: 12px;
    font-size: 12px;
}
.fp-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #a89070;
}
.fp-legend-dot {
    width: 14px;
    height: 4px;
    border-radius: 2px;
}
.fp-row {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    flex-wrap: wrap;
}
.fp-row > * { flex: 1; min-width: 160px; }
.fp-tag {
    display: inline-block;
    padding: 3px 10px;
    background: rgba(212, 168, 83, 0.15);
    border: 1px solid rgba(212, 168, 83, 0.3);
    color: #d4a853;
    font-size: 11px;
    border-radius: 2px;
    margin-right: 6px;
    letter-spacing: 1px;
}
.fp-header-banner {
    text-align: center;
    padding: 28px 20px 20px;
    margin-bottom: 28px;
    position: relative;
    z-index: 1;
}
.fp-header-banner h1 {
    font-size: 30px;
    color: #d4a853;
    letter-spacing: 10px;
    margin-bottom: 10px;
    text-shadow: 0 0 30px rgba(212, 168, 83, 0.3);
    font-weight: 600;
}
.fp-header-banner p {
    color: #8a7555;
    letter-spacing: 4px;
    font-size: 13px;
}
.fp-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #c9a84c, transparent);
    margin: 18px 0;
    border: none;
}
.fp-note-text {
    padding: 14px 18px;
    background: rgba(192, 57, 43, 0.06);
    border-left: 3px solid #c0392b;
    color: #b8a080;
    font-size: 13px;
    line-height: 1.8;
    letter-spacing: 0.5px;
}
`;

export const FP_COLORS = {
    gold: '#d4a853',
    goldLight: '#f4d487',
    vermilion: '#c0392b',
    vermilionLight: '#e74c3c',
    ink: '#1a0e08',
    paper: '#f5e6c8',
    muted: '#a89070',
    ancient: ['#d4a853', '#c9a84c', '#b8922a', '#a87c1a', '#d6a845'],
    modern: ['#5dade2', '#3498db', '#2e86c1', '#2874a6', '#1f618d'],
    series: ['#d4a853', '#e74c3c', '#5dade2', '#2ecc71', '#9b59b6', '#f39c12']
};

export function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(200, rect.width * dpr);
    canvas.height = Math.max(150, (rect.height || 260) * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W: rect.width, H: rect.height || 260 };
}

export class FeaturesPanel {
    constructor(apiBase, containerId) {
        this.API_BASE = apiBase;
        this.container = document.getElementById(containerId);
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = containerId || 'features-panel-root';
            document.body.appendChild(this.container);
        }

        this.sharedData = {
            devicePresets: [],
            motionProfiles: {},
            motionModes: []
        };

        this.devicePanel = null;
        this.eraPanel = null;
        this.viscosityPanel = null;
        this.vrPanel = null;

        this._injectStyles();
        this._buildLayout();
        this._loadBaseData();
    }

    _injectStyles() {
        const id = 'fp-styles-injected';
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = FP_STYLES;
        document.head.appendChild(style);
    }

    _buildLayout() {
        this.container.innerHTML = `
            <div class="fp-container">
                <div class="fp-header-banner">
                    <h1>香 · 衡 · 鉴</h1>
                    <p>— 古代万向平衡机构深度分析系统 —</p>
                </div>

                <div class="fp-tabs" id="fp-tabs">
                    <button class="fp-tab fp-active" data-tab="device">器·衡鉴</button>
                    <button class="fp-tab" data-tab="crossera">世·古今</button>
                    <button class="fp-tab" data-tab="viscosity">质·流变</button>
                    <button class="fp-tab" data-tab="experience">境·亲行</button>
                </div>

                <div class="fp-panel fp-visible" id="fp-panel-device"></div>
                <div class="fp-panel" id="fp-panel-crossera"></div>
                <div class="fp-panel" id="fp-panel-viscosity"></div>
                <div class="fp-panel" id="fp-panel-experience"></div>
            </div>
        `;

        this.container.querySelectorAll('.fp-tab').forEach(btn => {
            btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
        });

        const deviceContainer = this.container.querySelector('#fp-panel-device');
        const eraContainer = this.container.querySelector('#fp-panel-crossera');
        const viscosityContainer = this.container.querySelector('#fp-panel-viscosity');
        const experienceContainer = this.container.querySelector('#fp-panel-experience');

        this.devicePanel = new DeviceComparatorPanel(this.API_BASE, deviceContainer, this.sharedData);
        this.eraPanel = new EraComparatorPanel(this.API_BASE, eraContainer, this.sharedData);
        this.viscosityPanel = new ViscosityAnalyzerPanel(this.API_BASE, viscosityContainer, this.sharedData);
        this.vrPanel = new VrGimbalPanel(this.API_BASE, experienceContainer, this.sharedData);

        this.devicePanel.render();
        this.eraPanel.render();
        this.viscosityPanel.render();
        this.vrPanel.render();
    }

    _switchTab(name) {
        this.container.querySelectorAll('.fp-tab').forEach(t => {
            t.classList.toggle('fp-active', t.dataset.tab === name);
        });
        this.container.querySelectorAll('.fp-panel').forEach(p => {
            p.classList.toggle('fp-visible', p.id === `fp-panel-${name}`);
        });
    }

    async _loadBaseData() {
        try {
            const [presets, profiles, modes] = await Promise.all([
                fetch(`${this.API_BASE}/device-presets`).then(r => r.json()),
                fetch(`${this.API_BASE}/config/motion-profiles`).then(r => r.json()),
                fetch(`${this.API_BASE}/experience/motion-modes`).then(r => r.json()).catch(() => [])
            ]);
            this.sharedData.devicePresets = presets || [];
            this.sharedData.motionProfiles = profiles || {};
            this.sharedData.motionModes = modes || [];
            this.devicePanel._populateSelectors();
            this.viscosityPanel._populateSelectors();
            this.vrPanel._populateSelectors();
        } catch (e) {
            console.error('Load base data failed:', e);
        }
    }
}

window.FeaturesPanel = FeaturesPanel;
