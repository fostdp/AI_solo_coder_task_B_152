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

const FP_COLORS = {
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

function setupCanvas(canvas) {
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

        this.devicePresets = [];
        this.motionProfiles = {};
        this.motionModes = [];

        this.experienceState = {
            running: false,
            token: null,
            rafId: null,
            tickTimer: null,
            intensity: 0.3,
            lastFrame: null,
            history: { balance: [], tilt: [], spill: [], intensity: [] }
        };

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

                <div class="fp-panel fp-visible" id="fp-panel-device">
                    ${this._renderDevicePanel()}
                </div>

                <div class="fp-panel" id="fp-panel-crossera">
                    ${this._renderCrossEraPanel()}
                </div>

                <div class="fp-panel" id="fp-panel-viscosity">
                    ${this._renderViscosityPanel()}
                </div>

                <div class="fp-panel" id="fp-panel-experience">
                    ${this._renderExperiencePanel()}
                </div>
            </div>
        `;

        this.container.querySelectorAll('.fp-tab').forEach(btn => {
            btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
        });

        this._bindDeviceEvents();
        this._bindCrossEraEvents();
        this._bindViscosityEvents();
        this._bindExperienceEvents();
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
            this.devicePresets = presets || [];
            this.motionProfiles = profiles || {};
            this.motionModes = modes || [];
            this._populateDeviceSelectors();
            this._populateViscositySelectors();
            this._populateExperienceSelectors();
        } catch (e) {
            console.error('Load base data failed:', e);
        }
    }

    _renderDevicePanel() {
        return `
            <div class="fp-card">
                <div class="fp-section-title">装置对比 · 衡鉴</div>
                <p style="color:#8a7555;font-size:13px;margin-bottom:16px;line-height:1.8;">
                    遴选 2–6 架历代常平装置，置于同一运动工况下，量化平衡表现之差异。
                </p>

                <div class="fp-row" style="margin-bottom:18px;">
                    <div style="flex:2;min-width:320px;">
                        <label class="fp-label">① 选取装置（可多选）</label>
                        <div class="fp-checkbox-group" id="fp-device-checks">
                            <span style="color:#66553a;font-size:12px;">加载中...</span>
                        </div>
                    </div>
                </div>

                <div class="fp-row" style="margin-bottom:20px;">
                    <div>
                        <label class="fp-label">② 运动模式</label>
                        <select class="fp-select" id="fp-device-motion">
                            <option value="">加载中...</option>
                        </select>
                    </div>
                    <div>
                        <label class="fp-label">仿真时长 (秒)</label>
                        <input class="fp-input" type="number" id="fp-device-duration" value="10" min="5" max="120">
                    </div>
                    <div style="flex:0;min-width:auto;">
                        <button class="fp-btn fp-btn-gold" id="fp-device-run">◈ 启鉴 ◈</button>
                    </div>
                </div>
            </div>

            <div id="fp-device-result"></div>
        `;
    }

    _populateDeviceSelectors() {
        const checks = this.container.querySelector('#fp-device-checks');
        if (checks) {
            checks.innerHTML = this.devicePresets.map(d => `
                <label class="fp-checkbox" data-code="${d.code}">
                    <input type="checkbox" value="${d.code}">
                    <span class="fp-check-mark"></span>
                    <span>${d.name}</span>
                    <span style="color:#66553a;font-size:11px;">【${d.dynasty}】</span>
                </label>
            `).join('');
            checks.querySelectorAll('.fp-checkbox').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    const input = el.querySelector('input');
                    input.checked = !input.checked;
                    el.classList.toggle('fp-checked', input.checked);
                });
            });
        }

        const motionSel = this.container.querySelector('#fp-device-motion');
        if (motionSel && Object.keys(this.motionProfiles).length) {
            motionSel.innerHTML = Object.entries(this.motionProfiles).map(([k, v]) =>
                `<option value="${k}">${v.name || k} · ${v.TypicalUsage || ''}</option>`
            ).join('');
        }
    }

    _bindDeviceEvents() {
        const btn = this.container.querySelector('#fp-device-run');
        if (btn) {
            btn.addEventListener('click', () => this._runDeviceComparison());
        }
    }

    async _runDeviceComparison() {
        const result = this.container.querySelector('#fp-device-result');
        const codes = [...this.container.querySelectorAll('#fp-device-checks input:checked')].map(i => i.value);
        const motion = this.container.querySelector('#fp-device-motion').value;
        const duration = parseFloat(this.container.querySelector('#fp-device-duration').value) || 10;

        if (codes.length < 2 || codes.length > 6) {
            result.innerHTML = `<div class="fp-error">请选取 2 至 6 架装置进行对比</div>`;
            return;
        }
        if (!motion) {
            result.innerHTML = `<div class="fp-error">请选择运动模式</div>`;
            return;
        }

        result.innerHTML = `<div class="fp-loading">鉴衡演算中，请稍候...</div>`;

        try {
            const res = await fetch(`${this.API_BASE}/device-comparison`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_codes: codes, motion_profile: motion, duration_sec: duration })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            this._renderDeviceResult(data);
        } catch (e) {
            result.innerHTML = `<div class="fp-error">演算失败：${e.message}</div>`;
        }
    }

    _renderDeviceResult(data) {
        const wrap = this.container.querySelector('#fp-device-result');
        const metrics = data.device_metrics || [];
        const summary = data.ranking_summary || {};

        wrap.innerHTML = `
            <div class="fp-card">
                <div class="fp-section-title">鉴衡结果总览</div>
                <div class="fp-grid-3" style="margin-bottom:18px;">
                    <div class="fp-stat-row" style="flex-direction:column;padding:14px;border:1px solid #3a2c14;background:rgba(5,3,2,0.5);border-radius:2px;">
                        <span class="fp-stat-label">最优装置</span>
                        <span class="fp-stat-value gold" style="font-size:20px;margin-top:4px;">${summary.best_balance || '—'}</span>
                        <span class="fp-stat-label" style="margin-top:10px;">平均平衡分</span>
                        <span class="fp-stat-value green">${((summary.best_balance_score || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div class="fp-stat-row" style="flex-direction:column;padding:14px;border:1px solid #3a2c14;background:rgba(5,3,2,0.5);border-radius:2px;">
                        <span class="fp-stat-label">最大倾角</span>
                        <span class="fp-stat-value red" style="font-size:20px;margin-top:4px;">${summary.worst_max_tilt_deg ? summary.worst_max_tilt_deg.toFixed(2) + '°' : '—'}</span>
                        <span class="fp-stat-label" style="margin-top:10px;">见于</span>
                        <span class="fp-stat-value">${summary.worst_tilt || '—'}</span>
                    </div>
                    <div class="fp-stat-row" style="flex-direction:column;padding:14px;border:1px solid #3a2c14;background:rgba(5,3,2,0.5);border-radius:2px;">
                        <span class="fp-stat-label">品鉴</span>
                        <span class="fp-stat-value gold" style="font-size:15px;margin-top:4px;line-height:1.5;">${summary.champion_category || '—'}</span>
                    </div>
                </div>
                ${(summary.notes || []).map(n => `<div class="fp-note-text" style="margin-bottom:8px;">✦ ${n}</div>`).join('')}
            </div>

            <div class="fp-grid-2">
                <div class="fp-card">
                    <div class="fp-chart-title">❖ 综合指标对比柱状图 ❖</div>
                    <div class="fp-canvas-wrap"><canvas id="fp-dev-bar" height="280"></canvas></div>
                </div>
                <div class="fp-card">
                    <div class="fp-chart-title">❖ 平衡评分排名 ❖</div>
                    <div class="fp-canvas-wrap"><canvas id="fp-dev-rank" height="280"></canvas></div>
                </div>
            </div>

            <div class="fp-card">
                <div class="fp-chart-title">❖ 炉体倾角时间序列 ❖</div>
                <div class="fp-canvas-wrap">
                    <canvas id="fp-dev-tilt" height="240"></canvas>
                    <div class="fp-legend" id="fp-dev-tilt-legend"></div>
                </div>
            </div>

            <div class="fp-card">
                <div class="fp-chart-title">❖ 平衡分时间序列 ❖</div>
                <div class="fp-canvas-wrap">
                    <canvas id="fp-dev-bal" height="240"></canvas>
                    <div class="fp-legend" id="fp-dev-bal-legend"></div>
                </div>
            </div>

            <div class="fp-card">
                <div class="fp-section-title">指标详情</div>
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <thead>
                        <tr style="border-bottom:1px solid #3a2c14;color:#c9a84c;">
                            <th style="padding:10px 8px;text-align:left;">排名</th>
                            <th style="padding:10px 8px;text-align:left;">装置</th>
                            <th style="padding:10px 8px;text-align:left;">朝代</th>
                            <th style="padding:10px 8px;">环数</th>
                            <th style="padding:10px 8px;">平均倾角</th>
                            <th style="padding:10px 8px;">最大倾角</th>
                            <th style="padding:10px 8px;">平衡分</th>
                            <th style="padding:10px 8px;">稳定时长</th>
                            <th style="padding:10px 8px;">洒香风险</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${metrics.map(m => `
                            <tr style="border-bottom:1px dashed rgba(212,168,83,0.15);">
                                <td style="padding:10px 8px;color:${m.OverallRank === 1 ? '#d4a853' : '#a89070'};font-weight:${m.OverallRank === 1 ? 700 : 400};">
                                    ${m.OverallRank === 1 ? '❖ ' : ''}第${m.OverallRank}名
                                </td>
                                <td style="padding:10px 8px;color:#f5e6c8;">${m.DeviceName}</td>
                                <td style="padding:10px 8px;color:#a89070;">${m.Dynasty}</td>
                                <td style="padding:10px 8px;text-align:center;color:#a89070;">${m.RingsCount}</td>
                                <td style="padding:10px 8px;text-align:center;font-family:monospace;">${m.AvgTiltDeg.toFixed(2)}°</td>
                                <td style="padding:10px 8px;text-align:center;font-family:monospace;color:${m.MaxTiltDeg > 10 ? '#e74c3c' : m.MaxTiltDeg > 5 ? '#f1c40f' : '#2ecc71'}">${m.MaxTiltDeg.toFixed(2)}°</td>
                                <td style="padding:10px 8px;text-align:center;font-family:monospace;color:${m.AvgBalanceScore > 0.7 ? '#2ecc71' : m.AvgBalanceScore > 0.4 ? '#f1c40f' : '#e74c3c'}">${(m.AvgBalanceScore * 100).toFixed(1)}%</td>
                                <td style="padding:10px 8px;text-align:center;font-family:monospace;">${m.SettleTimeMs.toFixed(0)}ms</td>
                                <td style="padding:10px 8px;text-align:center;font-family:monospace;color:${m.SpillRiskAvg > 0.3 ? '#e74c3c' : '#2ecc71'}">${(m.SpillRiskAvg * 100).toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this._drawDeviceBarChart(metrics);
        this._drawDeviceRankChart(metrics);
        this._drawDeviceTimeSeries(metrics, 'tilt', 'TiltTimeSeries', '倾角 (°)');
        this._drawDeviceTimeSeries(metrics, 'bal', 'BalanceTimeSeries', '平衡分');
    }

    _drawDeviceBarChart(metrics) {
        const canvas = this.container.querySelector('#fp-dev-bar');
        if (!canvas) return;
        const { ctx, W, H } = setupCanvas(canvas);
        const padL = 80, padR = 16, padT = 20, padB = 70;
        const cw = W - padL - padR, ch = H - padT - padB;
        ctx.clearRect(0, 0, W, H);

        const categories = [
            { key: 'AvgTiltDeg', label: '平均倾角', lowerBetter: true, max: 25, unit: '°' },
            { key: 'AvgBalanceScore', label: '平衡分', lowerBetter: false, max: 1, unit: '' },
            { key: 'SpillRiskAvg', label: '洒香风险', lowerBetter: true, max: 1, unit: '' },
            { key: 'SettleTimeMs', label: '稳定时长', lowerBetter: true, max: 500, unit: 'ms' }
        ];

        const groupW = cw / categories.length;
        const barW = Math.min(28, (groupW - 16) / metrics.length);

        categories.forEach((cat, ci) => {
            metrics.forEach((m, mi) => {
                let v = m[cat.key];
                const color = FP_COLORS.series[mi % FP_COLORS.series.length];
                let normalized;
                if (cat.lowerBetter) {
                    normalized = Math.min(1, Math.max(0, v / cat.max));
                } else {
                    normalized = Math.min(1, Math.max(0, v / cat.max));
                }
                const barH = normalized * ch * (cat.lowerBetter ? (1 - normalized * 0.3) : 1);
                const barH_ = cat.lowerBetter ? ch * (1 - normalized) : ch * normalized;
                const x = padL + ci * groupW + 8 + mi * (barW + 3);
                const y = padT + ch - barH_;
                const fill = ctx.createLinearGradient(x, padT + ch, x, y);
                fill.addColorStop(0, color);
                fill.addColorStop(1, color + '55');
                ctx.fillStyle = fill;
                ctx.fillRect(x, y, barW, barH_);
                ctx.strokeStyle = color;
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, barW, barH_);
            });
            ctx.fillStyle = '#a89070';
            ctx.font = '11px inherit';
            ctx.textAlign = 'center';
            ctx.fillText(cat.label, padL + ci * groupW + groupW / 2, H - padB + 22);
        });

        ctx.fillStyle = FP_COLORS.muted;
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        [0, 0.25, 0.5, 0.75, 1].forEach((r, i) => {
            const y = padT + ch - r * ch;
            ctx.strokeStyle = 'rgba(90,68,32,0.4)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(W - padR, y);
            ctx.stroke();
        });
    }

    _drawDeviceRankChart(metrics) {
        const canvas = this.container.querySelector('#fp-dev-rank');
        if (!canvas) return;
        const { ctx, W, H } = setupCanvas(canvas);
        const padL = 30, padR = 70, padT = 20, padB = 20;
        const cw = W - padL - padR, ch = H - padT - padB;
        ctx.clearRect(0, 0, W, H);

        const sorted = [...metrics].sort((a, b) => b.AvgBalanceScore - a.AvgBalanceScore);
        const rowH = Math.min(50, ch / sorted.length - 8);

        sorted.forEach((m, i) => {
            const y = padT + i * (rowH + 8);
            const score = m.AvgBalanceScore;
            const bw = score * cw;
            const g = ctx.createLinearGradient(padL, 0, padL + bw, 0);
            g.addColorStop(0, '#8b6914');
            g.addColorStop(1, i === 0 ? '#f4d487' : '#d4a853');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.roundRect(padL, y, bw, rowH, [0, 4, 4, 0]);
            ctx.fill();

            ctx.fillStyle = '#f5e6c8';
            ctx.font = '12px inherit';
            ctx.textAlign = 'left';
            ctx.fillText(m.DeviceName, padL + 10, y + rowH / 2 + 4);

            ctx.fillStyle = i === 0 ? '#f4d487' : '#d4a853';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${(score * 100).toFixed(1)}%`, padL + bw + 10, y + rowH / 2 + 4);

            if (i === 0) {
                ctx.fillStyle = '#c0392b';
                ctx.font = '16px inherit';
                ctx.fillText('❖', padL - 22, y + rowH / 2 + 5);
            }
        });
    }

    _drawDeviceTimeSeries(metrics, suffix, dataKey, yLabel) {
        const canvas = this.container.querySelector(`#fp-dev-${suffix}`);
        const legendId = `#fp-dev-${suffix}-legend`;
        if (!canvas) return;
        const { ctx, W, H } = setupCanvas(canvas);
        const padL = 48, padR = 16, padT = 16, padB = 28;
        const cw = W - padL - padR, ch = H - padT - padB;
        ctx.clearRect(0, 0, W, H);

        let yMin = Infinity, yMax = -Infinity;
        metrics.forEach(m => {
            const s = m[dataKey] || [];
            s.forEach(v => { if (v < yMin) yMin = v; if (v > yMax) yMax = v; });
        });
        if (!isFinite(yMin)) { yMin = 0; yMax = 1; }
        if (yMin === yMax) { yMax = yMin + 1; }
        const pad_ = (yMax - yMin) * 0.1;
        yMin -= pad_; yMax += pad_;

        [0, 0.25, 0.5, 0.75, 1].forEach(r => {
            const y = padT + r * ch;
            ctx.strokeStyle = 'rgba(90,68,32,0.4)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(W - padR, y);
            ctx.stroke();
            const v = yMax - r * (yMax - yMin);
            ctx.fillStyle = '#a89070';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(v.toFixed(dataKey === 'BalanceTimeSeries' ? 2 : 1), padL - 6, y + 3);
        });

        const legendHTML = [];
        metrics.forEach((m, mi) => {
            const series = m[dataKey] || [];
            const color = FP_COLORS.series[mi % FP_COLORS.series.length];
            legendHTML.push(`<div class="fp-legend-item"><span class="fp-legend-dot" style="background:${color}"></span>${m.DeviceName}</div>`);
            if (series.length < 2) return;

            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            series.forEach((v, i) => {
                const x = padL + (cw / (series.length - 1)) * i;
                const y = padT + ch - ((v - yMin) / (yMax - yMin)) * ch;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();

            const lastV = series[series.length - 1];
            const lx = padL + cw;
            const ly = padT + ch - ((lastV - yMin) / (yMax - yMin)) * ch;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(lx, ly, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        const legend = this.container.querySelector(legendId);
        if (legend) legend.innerHTML = legendHTML.join('');

        ctx.fillStyle = '#8a7555';
        ctx.font = '10px inherit';
        ctx.textAlign = 'center';
        ctx.fillText(yLabel + ' →', padL - 30, padT + ch / 2);
    }

    _renderCrossEraPanel() {
        return `
            <div class="fp-card">
                <div class="fp-section-title">跨世对比 · 古今</div>
                <p style="color:#8a7555;font-size:13px;margin-bottom:18px;line-height:1.8;">
                    常平之理，始于华夏春秋，达于今世航天。跨越两千六百年，鉴同一物理原理在不同文明阶段之极致表达。
                </p>
                <div class="fp-row" style="margin-bottom:16px;">
                    <div>
                        <label class="fp-label">运动模式</label>
                        <select class="fp-select" id="fp-cross-motion">
                            <option value="walking">闲庭漫步</option>
                            <option value="horse_riding">策马扬鞭</option>
                            <option value="car_ride">车马行旅</option>
                            <option value="sedan_chair">抬轿而行</option>
                            <option value="running">疾步奔走</option>
                        </select>
                    </div>
                    <div style="flex:0;min-width:auto;">
                        <button class="fp-btn fp-btn-gold" id="fp-cross-run">◈ 启鉴 · 穿越千年 ◈</button>
                    </div>
                </div>
            </div>
            <div id="fp-cross-result"></div>
        `;
    }

    _bindCrossEraEvents() {
        const btn = this.container.querySelector('#fp-cross-run');
        if (btn) btn.addEventListener('click', () => this._runCrossEra());
    }

    async _runCrossEra() {
        const motion = this.container.querySelector('#fp-cross-motion').value;
        const result = this.container.querySelector('#fp-cross-result');
        result.innerHTML = `<div class="fp-loading">穿越时空演算中...</div>`;

        try {
            const res = await fetch(`${this.API_BASE}/cross-era-comparison`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motion_profile: motion, include_historical_context: true })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            this._renderCrossEraResult(data);
        } catch (e) {
            result.innerHTML = `<div class="fp-error">演算失败：${e.message}</div>`;
        }
    }

    _renderCrossEraResult(data) {
        const wrap = this.container.querySelector('#fp-cross-result');
        const dims = data.dimensions || [];
        const aSum = data.ancient_summary || {};
        const mSum = data.modern_summary || {};
        const oScore = data.overall_score || {};

        wrap.innerHTML = `
            <div class="fp-card">
                <div style="text-align:center;padding:14px 0 20px;border-bottom:1px solid rgba(212,168,83,0.15);">
                    <div style="color:#d4a853;font-size:18px;letter-spacing:4px;margin-bottom:8px;">${data.title || '跨时代万向平衡机制对比'}</div>
                    <div style="color:#8a7555;font-size:12px;letter-spacing:2px;max-width:800px;margin:0 auto;line-height:1.8;">${data.historical_intro || ''}</div>
                </div>
            </div>

            <div class="fp-grid-2" style="margin-bottom:20px;">
                <div class="fp-score-card ancient">
                    <div class="fp-score-era">公元前550年 — 公元1279年</div>
                    <div style="color:#c9a84c;font-size:16px;letter-spacing:4px;margin:8px 0;">古 代 中 华</div>
                    <div class="fp-score-num">${((oScore.ancient_china || 0) * 100).toFixed(1)}</div>
                    <div class="fp-stat-row"><span class="fp-stat-label">核心理念</span><span class="fp-stat-value gold" style="font-size:12px;">${aSum.philosophy || ''}</span></div>
                    <div class="fp-stat-row"><span class="fp-stat-label">技术里程碑</span><span class="fp-stat-value" style="font-size:12px;">${aSum.tech_milestone || ''}</span></div>
                </div>
                <div class="fp-score-card modern">
                    <div class="fp-score-era">20 — 21 世纪</div>
                    <div style="color:#5dade2;font-size:16px;letter-spacing:4px;margin:8px 0;">现 代 工 业</div>
                    <div class="fp-score-num">${((oScore.modern || 0) * 100).toFixed(1)}</div>
                    <div class="fp-stat-row"><span class="fp-stat-label">核心理念</span><span class="fp-stat-value" style="color:#5dade2;font-size:12px;">${mSum.philosophy || ''}</span></div>
                    <div class="fp-stat-row"><span class="fp-stat-label">技术里程碑</span><span class="fp-stat-value" style="font-size:12px;">${mSum.tech_milestone || ''}</span></div>
                </div>
            </div>

            <div class="fp-card">
                <div class="fp-chart-title">❖ 八维性能雷达图 ❖</div>
                <div class="fp-canvas-wrap"><canvas id="fp-cross-radar" height="420"></canvas></div>
                <div class="fp-legend">
                    <div class="fp-legend-item"><span class="fp-legend-dot" style="background:#d4a853"></span>古代中华 · 均值</div>
                    <div class="fp-legend-item"><span class="fp-legend-dot" style="background:#5dade2"></span>现代工业 · 均值</div>
                </div>
            </div>

            <div class="fp-card">
                <div class="fp-section-title">八维详解</div>
                ${dims.map(d => this._renderDimensionRow(d)).join('')}
            </div>

            <div class="fp-card">
                <div class="fp-section-title">哲思录</div>
                <div class="fp-note-text" style="font-size:14px;line-height:2;padding:20px 24px;">
                    ${data.philosophy_note || ''}
                </div>
            </div>
        `;

        this._drawRadarChart(dims);
    }

    _renderDimensionRow(d) {
        const ancient = d.ancient_best || {};
        const modern = d.modern_best || {};
        const imp = d.improvement_ratio || 1;
        const impDb = d.improvement_log_db || 0;

        return `
            <div style="padding:14px 0;border-bottom:1px dashed rgba(212,168,83,0.15);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <div style="color:#d4a853;font-size:15px;letter-spacing:2px;">❖ ${d.dimension_label}</div>
                    <div>
                        ${d.lower_is_better ? '<span class="fp-tag">越低越优</span>' : '<span class="fp-tag">越高越优</span>'}
                        ${imp > 1.1 ? `<span class="fp-tag" style="background:rgba(93,173,226,0.15);border-color:rgba(93,173,226,0.3);color:#5dade2;">现代领先 ${imp.toFixed(1)}x / ${impDb.toFixed(1)}dB</span>` : ''}
                    </div>
                </div>
                <div class="fp-grid-2" style="gap:16px;">
                    <div style="padding:12px;background:rgba(212,168,83,0.05);border-left:2px solid #c9a84c;">
                        <div style="color:#a89070;font-size:12px;margin-bottom:4px;">古代最优</div>
                        <div style="color:#d4a853;font-size:14px;font-weight:600;">${ancient.DeviceName || '—'}</div>
                        <div style="color:#f5e6c8;font-family:monospace;font-size:16px;margin-top:4px;">
                            ${this._formatDimValue(d.dimension_key, ancient.Value)}
                        </div>
                    </div>
                    <div style="padding:12px;background:rgba(93,173,226,0.05);border-left:2px solid #5dade2;">
                        <div style="color:#85929e;font-size:12px;margin-bottom:4px;">现代最优</div>
                        <div style="color:#5dade2;font-size:14px;font-weight:600;">${modern.DeviceName || '—'}</div>
                        <div style="color:#f5e6c8;font-family:monospace;font-size:16px;margin-top:4px;">
                            ${this._formatDimValue(d.dimension_key, modern.Value)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _formatDimValue(key, v) {
        if (v == null) return '—';
        const map = {
            precision_angle_deg: v.toFixed(4) + '°',
            response_time_ms: v.toFixed(1) + ' ms',
            disturbance_rejection_db: v.toFixed(2) + ' dB',
            power_consumption_w: v.toFixed(3) + ' W',
            mtbf_hours: (v / 1000).toFixed(1) + ' kHr',
            manufacture_complexity: v.toFixed(1) + ' / 10',
            aesthetic_value: v.toFixed(1) + ' / 10',
            cultural_significance: v.toFixed(1) + ' / 10'
        };
        return map[key] ?? v.toFixed(2);
    }

    _drawRadarChart(dims) {
        const canvas = this.container.querySelector('#fp-cross-radar');
        if (!canvas || dims.length === 0) return;
        const { ctx, W, H } = setupCanvas(canvas);
        const cx = W / 2, cy = H / 2;
        const r = Math.min(cx, cy) - 60;
        ctx.clearRect(0, 0, W, H);

        const N = dims.length;
        const levels = 5;

        for (let lv = levels; lv >= 1; lv--) {
            const ratio = lv / levels;
            const alpha = 0.05 + lv * 0.03;
            ctx.beginPath();
            for (let i = 0; i <= N; i++) {
                const a = (Math.PI * 2 * i) / N - Math.PI / 2;
                const rr = r * ratio;
                const x = cx + rr * Math.cos(a);
                const y = cy + rr * Math.sin(a);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = `rgba(212,168,83,${alpha})`;
            ctx.fill();
            ctx.strokeStyle = 'rgba(201,168,76,0.3)';
            ctx.lineWidth = 0.6;
            ctx.stroke();
        }

        for (let i = 0; i < N; i++) {
            const a = (Math.PI * 2 * i) / N - Math.PI / 2;
            ctx.strokeStyle = 'rgba(201,168,76,0.4)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
            ctx.stroke();

            const lx = cx + (r + 34) * Math.cos(a);
            const ly = cy + (r + 34) * Math.sin(a);
            ctx.fillStyle = '#c9a84c';
            ctx.font = 'bold 13px inherit';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dims[i].dimension_label, lx, ly);
        }

        const ancientScores = dims.map(d => {
            const pts = (d.points || []).filter(p => p.EraTag === 'ancient_china');
            if (!pts.length) return 0;
            return pts.reduce((s, p) => s + (p.NormalizedScore || 0), 0) / pts.length;
        });
        const modernScores = dims.map(d => {
            const pts = (d.points || []).filter(p => p.EraTag !== 'ancient_china');
            if (!pts.length) return 0;
            return pts.reduce((s, p) => s + (p.NormalizedScore || 0), 0) / pts.length;
        });

        this._drawRadarPolygon(ctx, cx, cy, r, N, ancientScores, '#d4a853', 'rgba(212,168,83,0.25)');
        this._drawRadarPolygon(ctx, cx, cy, r, N, modernScores, '#5dade2', 'rgba(93,173,226,0.25)');

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        [0.25, 0.5, 0.75, 1].forEach(rv => {
            ctx.fillStyle = '#66553a';
            ctx.font = '9px monospace';
            ctx.fillText((rv * 100).toFixed(0), cx + 6, cy - r * rv);
        });
    }

    _drawRadarPolygon(ctx, cx, cy, r, N, scores, stroke, fill) {
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
            const idx = i % N;
            const a = (Math.PI * 2 * idx) / N - Math.PI / 2;
            const rr = r * Math.max(0, Math.min(1, scores[idx] || 0));
            const x = cx + rr * Math.cos(a);
            const y = cy + rr * Math.sin(a);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();

        for (let i = 0; i < N; i++) {
            const a = (Math.PI * 2 * i) / N - Math.PI / 2;
            const rr = r * Math.max(0, Math.min(1, scores[i] || 0));
            const x = cx + rr * Math.cos(a);
            const y = cy + rr * Math.sin(a);
            ctx.fillStyle = stroke;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#1a0e08';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    _renderViscosityPanel() {
        return `
            <div class="fp-card">
                <div class="fp-section-title">粘度扫描 · 流变</div>
                <p style="color:#8a7555;font-size:13px;margin-bottom:16px;line-height:1.8;">
                    香料之性，粘稠为要。粘则难洒，稀则易溢。以对数之尺，量流变之理，察粘度与洒香概率之关联。
                </p>
                <div class="fp-row" style="margin-bottom:16px;">
                    <div>
                        <label class="fp-label">装置</label>
                        <select class="fp-select" id="fp-visc-device"><option value="">加载中...</option></select>
                    </div>
                    <div>
                        <label class="fp-label">运动模式</label>
                        <select class="fp-select" id="fp-visc-motion">
                            <option value="walking">闲庭漫步</option>
                            <option value="horse_riding">策马扬鞭</option>
                            <option value="car_ride">车马行旅</option>
                            <option value="sedan_chair">抬轿而行</option>
                            <option value="running">疾步奔走</option>
                        </select>
                    </div>
                </div>
                <div style="margin-bottom:16px;">
                    <label class="fp-label">自定义粘度数组 (Pa·s，逗号分隔，对数范围建议 0.001 至 100)</label>
                    <input class="fp-input" type="text" id="fp-visc-values"
                        value="0.001,0.005,0.01,0.05,0.1,0.5,1,5,10,50,100"
                        placeholder="例如: 0.001, 0.01, 0.1, 1, 10, 100">
                </div>
                <div class="fp-row" style="align-items:center;">
                    <button class="fp-btn fp-btn-gold" id="fp-visc-run" style="flex:0;">◈ 启鉴 · 探流变 ◈</button>
                    <button class="fp-btn" id="fp-visc-preset" style="flex:0;background:linear-gradient(135deg,#3a2c14,#5a4420);">常用预设</button>
                    <div style="color:#66553a;font-size:12px;flex:1;">
                        建议点数：8 – 20。跨度越大，曲线越完整。
                    </div>
                </div>
            </div>
            <div id="fp-visc-result"></div>
        `;
    }

    _populateViscositySelectors() {
        const sel = this.container.querySelector('#fp-visc-device');
        if (sel && this.devicePresets.length) {
            sel.innerHTML = this.devicePresets.map(d =>
                `<option value="${d.code}">${d.name} 【${d.dynasty}】</option>`
            ).join('');
        }
    }

    _bindViscosityEvents() {
        const run = this.container.querySelector('#fp-visc-run');
        const preset = this.container.querySelector('#fp-visc-preset');
        if (run) run.addEventListener('click', () => this._runViscosityScan());
        if (preset) preset.addEventListener('click', () => {
            const inp = this.container.querySelector('#fp-visc-values');
            if (inp) inp.value = '0.001,0.003,0.01,0.03,0.1,0.3,1,3,10,30,100';
        });
    }

    async _runViscosityScan() {
        const result = this.container.querySelector('#fp-visc-result');
        const device = this.container.querySelector('#fp-visc-device').value;
        const motion = this.container.querySelector('#fp-visc-motion').value;
        const raw = this.container.querySelector('#fp-visc-values').value || '';
        const viscs = raw.split(/[,，\s]+/).map(s => parseFloat(s.trim())).filter(v => !isNaN(v) && v > 0);

        if (!device) { result.innerHTML = `<div class="fp-error">请选择装置</div>`; return; }
        if (!motion) { result.innerHTML = `<div class="fp-error">请选择运动模式</div>`; return; }
        if (viscs.length < 3) { result.innerHTML = `<div class="fp-error">请输入至少 3 个有效的粘度值</div>`; return; }

        viscs.sort((a, b) => a - b);
        result.innerHTML = `<div class="fp-loading">探流变演算中，请稍候...</div>`;

        try {
            const res = await fetch(`${this.API_BASE}/viscosity-scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_code: device,
                    motion_profile: motion,
                    viscosity_range_pas: viscs
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            this._renderViscosityResult(data);
        } catch (e) {
            result.innerHTML = `<div class="fp-error">演算失败：${e.message}</div>`;
        }
    }

    _renderViscosityResult(data) {
        const wrap = this.container.querySelector('#fp-visc-result');
        const pts = data.scan_points || [];

        wrap.innerHTML = `
            <div class="fp-card">
                <div class="fp-section-title">流变之鉴</div>
                <div class="fp-grid-3" style="margin-bottom:18px;">
                    <div style="padding:14px;border:1px solid #3a2c14;background:rgba(5,3,2,0.5);border-radius:2px;text-align:center;">
                        <div class="fp-live-label">最优粘度</div>
                        <div style="color:#2ecc71;font-size:26px;font-family:monospace;font-weight:700;margin-top:4px;">
                            ${data.optimal_viscosity_pas ? data.optimal_viscosity_pas.toFixed(3) : '—'}
                            <span style="font-size:13px;color:#a89070;">Pa·s</span>
                        </div>
                        <div class="fp-live-label" style="margin-top:8px;">最低洒香概率</div>
                    </div>
                    <div style="padding:14px;border:1px solid #3a2c14;background:rgba(5,3,2,0.5);border-radius:2px;text-align:center;">
                        <div class="fp-live-label">临界安全粘度</div>
                        <div style="color:#d4a853;font-size:26px;font-family:monospace;font-weight:700;margin-top:4px;">
                            ${data.critical_viscosity_pas ? data.critical_viscosity_pas.toFixed(2) : '未达'}
                            <span style="font-size:13px;color:#a89070;">Pa·s</span>
                        </div>
                        <div class="fp-live-label" style="margin-top:8px;">洒香风险 &lt; 5%</div>
                    </div>
                    <div style="padding:14px;border:1px solid #3a2c14;background:rgba(5,3,2,0.5);border-radius:2px;text-align:center;">
                        <div class="fp-live-label">拟合相关性 R²</div>
                        <div style="color:#5dade2;font-size:26px;font-family:monospace;font-weight:700;margin-top:4px;">
                            ${data.correlation_r2 ? data.correlation_r2.toFixed(4) : '—'}
                        </div>
                        <div class="fp-live-label" style="margin-top:8px;">${data.device_name || ''}</div>
                    </div>
                </div>
                <div class="fp-note-text" style="margin-bottom:14px;">✦ ${data.fit_equation || ''}</div>
                <div class="fp-note-text">✦ ${data.recommendation || ''}</div>
            </div>

            <div class="fp-card">
                <div class="fp-chart-title">❖ 洒香概率 · 粘度 对数坐标曲线 ❖</div>
                <div class="fp-canvas-wrap"><canvas id="fp-visc-chart-spill" height="300"></canvas></div>
                <div class="fp-legend">
                    <div class="fp-legend-item"><span class="fp-legend-dot" style="background:#e74c3c;height:3px;"></span>洒香概率</div>
                    <div class="fp-legend-item"><span class="fp-legend-dot" style="background:#2ecc71;height:3px;"></span>平衡效率</div>
                </div>
            </div>

            <div class="fp-grid-2">
                <div class="fp-card">
                    <div class="fp-chart-title">❖ 平均 / 最大倾角 (°) ❖</div>
                    <div class="fp-canvas-wrap"><canvas id="fp-visc-chart-tilt" height="240"></canvas></div>
                </div>
                <div class="fp-card">
                    <div class="fp-chart-title">❖ 阻尼比 · 共振因子 ❖</div>
                    <div class="fp-canvas-wrap"><canvas id="fp-visc-chart-damp" height="240"></canvas></div>
                </div>
            </div>

            <div class="fp-card">
                <div class="fp-section-title">扫描点详情</div>
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                    <thead>
                        <tr style="border-bottom:1px solid #3a2c14;color:#c9a84c;">
                            <th style="padding:8px 6px;">粘度 (Pa·s)</th>
                            <th style="padding:8px 6px;">洒香概率</th>
                            <th style="padding:8px 6px;">平均倾角</th>
                            <th style="padding:8px 6px;">最大倾角</th>
                            <th style="padding:8px 6px;">阻尼比</th>
                            <th style="padding:8px 6px;">共振因子</th>
                            <th style="padding:8px 6px;">斯托克斯衰减</th>
                            <th style="padding:8px 6px;">平衡效率</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pts.map(p => `
                            <tr style="border-bottom:1px dashed rgba(212,168,83,0.12);">
                                <td style="padding:8px 6px;text-align:center;font-family:monospace;color:#d4a853;">${p.viscosity_pas.toExponential(2)}</td>
                                <td style="padding:8px 6px;text-align:center;font-family:monospace;color:${p.spill_probability > 0.3 ? '#e74c3c' : p.spill_probability > 0.1 ? '#f1c40f' : '#2ecc71'}">${(p.spill_probability * 100).toFixed(1)}%</td>
                                <td style="padding:8px 6px;text-align:center;font-family:monospace;">${p.avg_tilt_deg.toFixed(2)}°</td>
                                <td style="padding:8px 6px;text-align:center;font-family:monospace;">${p.max_tilt_deg.toFixed(2)}°</td>
                                <td style="padding:8px 6px;text-align:center;font-family:monospace;">${p.damping_ratio.toFixed(3)}</td>
                                <td style="padding:8px 6px;text-align:center;font-family:monospace;">${p.resonance_factor.toFixed(2)}</td>
                                <td style="padding:8px 6px;text-align:center;font-family:monospace;">${p.stokes_attenuation_db.toFixed(2)}dB</td>
                                <td style="padding:8px 6px;text-align:center;font-family:monospace;color:#2ecc71;">${(p.balance_efficiency * 100).toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this._drawViscositySpillChart(pts, data);
        this._drawViscosityTiltChart(pts);
        this._drawViscosityDampChart(pts);
    }

    _logScale(v, vMin, vMax) {
        const lv = Math.log10(Math.max(v, 1e-15));
        const lMin = Math.log10(Math.max(vMin, 1e-15));
        const lMax = Math.log10(Math.max(vMax, 1e-15));
        return (lv - lMin) / Math.max(lMax - lMin, 1e-9);
    }

    _niceLogTicks(vMin, vMax) {
        const ticks = [];
        const lMin = Math.floor(Math.log10(Math.max(vMin, 1e-15)));
        const lMax = Math.ceil(Math.log10(Math.max(vMax, 1e-15)));
        for (let e = lMin; e <= lMax; e++) {
            [1, 2, 5].forEach(m => {
                const v = m * Math.pow(10, e);
                if (v >= vMin * 0.95 && v <= vMax * 1.05) ticks.push(v);
            });
        }
        return ticks;
    }

    _drawViscositySpillChart(pts, data) {
        const canvas = this.container.querySelector('#fp-visc-chart-spill');
        if (!canvas || !pts.length) return;
        const { ctx, W, H } = setupCanvas(canvas);
        const padL = 58, padR = 58, padT = 20, padB = 56;
        const cw = W - padL - padR, ch = H - padT - padB;
        ctx.clearRect(0, 0, W, H);

        const xs = pts.map(p => p.viscosity_pas);
        const ys1 = pts.map(p => p.spill_probability);
        const ys2 = pts.map(p => p.balance_efficiency);
        const xMin = xs[0], xMax = xs[xs.length - 1];

        ctx.strokeStyle = 'rgba(90,68,32,0.35)';
        ctx.lineWidth = 0.5;
        [0, 0.25, 0.5, 0.75, 1].forEach(r => {
            const y = padT + r * ch;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(W - padR, y);
            ctx.stroke();
            ctx.fillStyle = '#8a7555';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(((1 - r) * 100).toFixed(0) + '%', padL - 6, y + 3);
            ctx.textAlign = 'left';
            ctx.fillText(((1 - r) * 100).toFixed(0) + '%', W - padR + 6, y + 3);
        });

        const xTicks = this._niceLogTicks(xMin, xMax);
        xTicks.forEach(v => {
            const r = this._logScale(v, xMin, xMax);
            const x = padL + r * cw;
            ctx.strokeStyle = 'rgba(90,68,32,0.25)';
            ctx.beginPath();
            ctx.moveTo(x, padT);
            ctx.lineTo(x, padT + ch);
            ctx.stroke();
            ctx.fillStyle = '#a89070';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(v < 0.01 || v >= 1000 ? v.toExponential(0) : v.toString(), x, H - padB + 18);
        });

        ctx.save();
        ctx.fillStyle = '#c9a84c';
        ctx.font = 'bold 12px inherit';
        ctx.textAlign = 'center';
        ctx.fillText('粘度 μ (Pa·s, 对数刻度)', padL + cw / 2, H - 6);
        ctx.restore();

        ctx.save();
        ctx.translate(12, padT + ch / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#e74c3c';
        ctx.font = '11px inherit';
        ctx.textAlign = 'center';
        ctx.fillText('洒香概率 →', 0, 0);
        ctx.restore();

        this._drawLogCurve(ctx, xs, ys1, xMin, xMax, 0, 1, padL, padT, cw, ch, '#e74c3c', true);
        this._drawLogCurve(ctx, xs, ys2, xMin, xMax, 0, 1, padL, padT, cw, ch, '#2ecc71', true);

        if (data.optimal_viscosity_pas) {
            const r = this._logScale(data.optimal_viscosity_pas, xMin, xMax);
            const x = padL + r * cw;
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(x, padT);
            ctx.lineTo(x, padT + ch);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#2ecc71';
            ctx.font = 'bold 11px inherit';
            ctx.textAlign = 'center';
            ctx.fillText('最优', x, padT + ch + 34);
        }
        if (data.critical_viscosity_pas) {
            const r = this._logScale(data.critical_viscosity_pas, xMin, xMax);
            const x = padL + r * cw;
            ctx.strokeStyle = '#d4a853';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(x, padT);
            ctx.lineTo(x, padT + ch);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#d4a853';
            ctx.font = 'bold 11px inherit';
            ctx.textAlign = 'center';
            ctx.fillText('临界', x, padT + ch + 34);
        }
    }

    _drawLogCurve(ctx, xs, ys, xMin, xMax, yMin, yMax, padL, padT, cw, ch, color, markers) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        xs.forEach((x, i) => {
            const rx = this._logScale(x, xMin, xMax);
            const px = padL + rx * cw;
            const py = padT + ch - ((ys[i] - yMin) / (yMax - yMin)) * ch;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();
        if (markers) {
            xs.forEach((x, i) => {
                const rx = this._logScale(x, xMin, xMax);
                const px = padL + rx * cw;
                const py = padT + ch - ((ys[i] - yMin) / (yMax - yMin)) * ch;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#1a0e08';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        }
    }

    _drawViscosityTiltChart(pts) {
        const canvas = this.container.querySelector('#fp-visc-chart-tilt');
        if (!canvas || !pts.length) return;
        const { ctx, W, H } = setupCanvas(canvas);
        const padL = 50, padR = 16, padT = 16, padB = 40;
        const cw = W - padL - padR, ch = H - padT - padB;
        ctx.clearRect(0, 0, W, H);
        const xs = pts.map(p => p.viscosity_pas);
        const ys1 = pts.map(p => p.avg_tilt_deg);
        const ys2 = pts.map(p => p.max_tilt_deg);
        const xMin = xs[0], xMax = xs[xs.length - 1];
        const yMax = Math.max(...ys2) * 1.1;

        [0, 0.25, 0.5, 0.75, 1].forEach(r => {
            const y = padT + r * ch;
            ctx.strokeStyle = 'rgba(90,68,32,0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(W - padR, y);
            ctx.stroke();
            const v = (1 - r) * yMax;
            ctx.fillStyle = '#8a7555';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(v.toFixed(1) + '°', padL - 6, y + 3);
        });

        this._drawLogCurve(ctx, xs, ys1, xMin, xMax, 0, yMax, padL, padT, cw, ch, '#5dade2', true);
        this._drawLogCurve(ctx, xs, ys2, xMin, xMax, 0, yMax, padL, padT, cw, ch, '#e67e22', true);

        const legend = [['#5dade2', '平均倾角'], ['#e67e22', '最大倾角']];
        let lx = padL + 6;
        legend.forEach(([c, n]) => {
            ctx.fillStyle = c;
            ctx.fillRect(lx, H - 14, 14, 3);
            ctx.fillStyle = '#a89070';
            ctx.font = '11px inherit';
            ctx.fillText(n, lx + 20, H - 8);
            lx += 90;
        });
    }

    _drawViscosityDampChart(pts) {
        const canvas = this.container.querySelector('#fp-visc-chart-damp');
        if (!canvas || !pts.length) return;
        const { ctx, W, H } = setupCanvas(canvas);
        const padL = 50, padR = 16, padT = 16, padB = 40;
        const cw = W - padL - padR, ch = H - padT - padB;
        ctx.clearRect(0, 0, W, H);
        const xs = pts.map(p => p.viscosity_pas);
        const ys1 = pts.map(p => p.damping_ratio);
        const ys2 = pts.map(p => p.resonance_factor);
        const xMin = xs[0], xMax = xs[xs.length - 1];
        const yMax = Math.max(...ys1, ...ys2) * 1.15 || 1;

        [0, 0.25, 0.5, 0.75, 1].forEach(r => {
            const y = padT + r * ch;
            ctx.strokeStyle = 'rgba(90,68,32,0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(W - padR, y);
            ctx.stroke();
            const v = (1 - r) * yMax;
            ctx.fillStyle = '#8a7555';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(v.toFixed(2), padL - 6, y + 3);
        });

        this._drawLogCurve(ctx, xs, ys1, xMin, xMax, 0, yMax, padL, padT, cw, ch, '#9b59b6', true);
        this._drawLogCurve(ctx, xs, ys2, xMin, xMax, 0, yMax, padL, padT, cw, ch, '#f39c12', true);

        const legend = [['#9b59b6', '阻尼比 ζ'], ['#f39c12', '共振因子 Q']];
        let lx = padL + 6;
        legend.forEach(([c, n]) => {
            ctx.fillStyle = c;
            ctx.fillRect(lx, H - 14, 14, 3);
            ctx.fillStyle = '#a89070';
            ctx.font = '11px inherit';
            ctx.fillText(n, lx + 20, H - 8);
            lx += 100;
        });
    }

    _renderExperiencePanel() {
        return `
            <div class="fp-card" id="fp-exp-setup">
                <div class="fp-section-title">虚拟体验 · 亲行</div>
                <p style="color:#8a7555;font-size:13px;margin-bottom:18px;line-height:1.8;">
                    持炉在手，身临古人之境。以君之晃动摇摆，测常平之真意。拖动滑块控制晃动强度，体验千年平衡之妙。
                </p>
                <div class="fp-row" style="margin-bottom:18px;">
                    <div>
                        <label class="fp-label">择取装置</label>
                        <select class="fp-select" id="fp-exp-device"><option value="">加载中...</option></select>
                    </div>
                    <div>
                        <label class="fp-label">场景模式</label>
                        <select class="fp-select" id="fp-exp-mode"><option value="">加载中...</option></select>
                    </div>
                </div>
                <div style="margin-bottom:10px;">
                    <label class="fp-label">雅号 (选填)</label>
                    <input class="fp-input" type="text" id="fp-exp-name" placeholder="尊姓大名，载入成就册..." maxlength="20">
                </div>
                <div style="text-align:center;margin-top:20px;">
                    <button class="fp-btn fp-btn-gold" id="fp-exp-start" style="padding:14px 60px;font-size:16px;">◈ 启程 · 执炉入景 ◈</button>
                </div>
            </div>

            <div id="fp-exp-running" style="display:none;">
                <div class="fp-card">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
                        <div>
                            <div style="color:#8a7555;font-size:12px;letter-spacing:2px;">当前执炉</div>
                            <div style="color:#d4a853;font-size:18px;font-weight:600;" id="fp-exp-dev-name">—</div>
                        </div>
                        <div>
                            <div style="color:#8a7555;font-size:12px;letter-spacing:2px;">场景</div>
                            <div style="color:#f5e6c8;font-size:16px;" id="fp-exp-mode-name">—</div>
                        </div>
                        <div>
                            <div style="color:#8a7555;font-size:12px;letter-spacing:2px;">历时</div>
                            <div style="color:#5dade2;font-size:24px;font-family:monospace;font-weight:700;" id="fp-exp-time">00:00</div>
                        </div>
                        <button class="fp-btn" id="fp-exp-stop" style="flex:0;min-width:auto;background:linear-gradient(135deg,#8b1a1a,#c0392b);">◈ 结束体验 ◈</button>
                    </div>
                    <div class="fp-note-text" id="fp-exp-hint" style="margin-bottom:16px;">✦ 准备启程，请调整晃动强度开始体验...</div>

                    <div class="fp-slider-wrap">
                        <div style="display:flex;justify-content:space-between;font-size:12px;color:#8a7555;margin-bottom:6px;">
                            <span>🌿 静如止水</span>
                            <span style="color:#c9a84c;font-weight:600;" id="fp-exp-intensity-label">晃动强度：30%</span>
                            <span>🔥 风雨兼程</span>
                        </div>
                        <input type="range" class="fp-slider" id="fp-exp-intensity" min="0" max="100" value="30">
                        <div style="display:flex;justify-content:space-between;font-size:11px;color:#66553a;margin-top:6px;">
                            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                        </div>
                    </div>
                </div>

                <div class="fp-grid-3" style="margin-bottom:20px;">
                    <div class="fp-card" style="padding:18px;margin-bottom:0;">
                        <div style="display:flex;flex-direction:column;align-items:center;">
                            <div class="fp-live-label">平衡评分</div>
                            <div class="fp-live-value" id="fp-exp-balance" style="color:#2ecc71;">—</div>
                            <div class="fp-progress-wrap" style="width:100%;height:8px;margin-top:8px;">
                                <div class="fp-progress-fill" id="fp-exp-bal-bar" style="width:0%;background:linear-gradient(90deg,#27ae60,#2ecc71);"></div>
                            </div>
                        </div>
                    </div>
                    <div class="fp-card" style="padding:18px;margin-bottom:0;">
                        <div style="display:flex;flex-direction:column;align-items:center;">
                            <div class="fp-live-label">炉体倾角</div>
                            <div class="fp-live-value" id="fp-exp-tilt" style="color:#f1c40f;">—</div>
                            <div class="fp-progress-wrap" style="width:100%;height:8px;margin-top:8px;">
                                <div class="fp-progress-fill" id="fp-exp-tilt-bar" style="width:0%;background:linear-gradient(90deg,#f1c40f,#e67e22);"></div>
                            </div>
                        </div>
                    </div>
                    <div class="fp-card" style="padding:18px;margin-bottom:0;">
                        <div style="display:flex;flex-direction:column;align-items:center;">
                            <div class="fp-live-label">洒香风险</div>
                            <div class="fp-live-value" id="fp-exp-spill" style="color:#e74c3c;">—</div>
                            <div class="fp-progress-wrap" style="width:100%;height:8px;margin-top:8px;">
                                <div class="fp-progress-fill" id="fp-exp-spill-bar" style="width:0%;background:linear-gradient(90deg,#c0392b,#e74c3c);"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="fp-grid-2" style="margin-bottom:20px;">
                    <div class="fp-card" style="padding:18px;margin-bottom:0;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <div class="fp-live-label">修为等级</div>
                                <div style="margin-top:8px;"><span class="fp-level-badge" id="fp-exp-level">入门 · 初入宫廷</span></div>
                            </div>
                            <div style="width:55%;">
                                <div style="font-size:11px;color:#8a7555;text-align:right;margin-bottom:4px;" id="fp-exp-lvprog">进度 0%</div>
                                <div class="fp-progress-wrap" style="height:10px;">
                                    <div class="fp-progress-fill" id="fp-exp-lv-bar" style="width:0%;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="fp-card" style="padding:18px;margin-bottom:0;">
                        <div class="fp-live-label">实时成就</div>
                        <div class="fp-achievements" id="fp-exp-badges" style="margin-top:10px;min-height:40px;">
                            <span style="color:#66553a;font-size:12px;">尚待解锁...</span>
                        </div>
                    </div>
                </div>

                <div class="fp-card">
                    <div class="fp-chart-title">❖ 实时轨迹 · 炉姿变幻 ❖</div>
                    <div class="fp-canvas-wrap"><canvas id="fp-exp-live" height="220"></canvas></div>
                    <div class="fp-legend">
                        <div class="fp-legend-item"><span class="fp-legend-dot" style="background:#2ecc71;"></span>平衡分</div>
                        <div class="fp-legend-item"><span class="fp-legend-dot" style="background:#f1c40f;"></span>倾角°</div>
                        <div class="fp-legend-item"><span class="fp-legend-dot" style="background:#e74c3c;"></span>洒香风险</div>
                    </div>
                </div>
            </div>

            <div id="fp-exp-end" style="display:none;"></div>
        `;
    }

    _populateExperienceSelectors() {
        const dSel = this.container.querySelector('#fp-exp-device');
        const mSel = this.container.querySelector('#fp-exp-mode');
        if (dSel && this.devicePresets.length) {
            dSel.innerHTML = this.devicePresets.map(d =>
                `<option value="${d.code}">${d.name} 【${d.dynasty}】</option>`
            ).join('');
        }
        if (mSel && this.motionModes.length) {
            mSel.innerHTML = this.motionModes.map(m =>
                `<option value="${m.key}">${m.display_name} — ${m.scene}</option>`
            ).join('');
        }
    }

    _bindExperienceEvents() {
        const start = this.container.querySelector('#fp-exp-start');
        const stop = this.container.querySelector('#fp-exp-stop');
        const intensity = this.container.querySelector('#fp-exp-intensity');
        if (start) start.addEventListener('click', () => this._startExperience());
        if (stop) stop.addEventListener('click', () => this._endExperience(false));
        if (intensity) {
            intensity.addEventListener('input', (e) => {
                this.experienceState.intensity = parseInt(e.target.value) / 100;
                const lbl = this.container.querySelector('#fp-exp-intensity-label');
                if (lbl) lbl.textContent = `晃动强度：${e.target.value}%`;
            });
        }
    }

    async _startExperience() {
        const device = this.container.querySelector('#fp-exp-device').value;
        const mode = this.container.querySelector('#fp-exp-mode').value;
        const name = this.container.querySelector('#fp-exp-name').value.trim();

        if (!device) { this._expHint('请先择取装置', 'bad'); return; }
        if (!mode) { this._expHint('请选择场景模式', 'bad'); return; }

        const btn = this.container.querySelector('#fp-exp-start');
        if (btn) { btn.disabled = true; btn.textContent = '正在开启...'; }

        try {
            const res = await fetch(`${this.API_BASE}/experience/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_code: device, motion_mode: mode, user_name: name || undefined })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '开启失败');

            this.experienceState.running = true;
            this.experienceState.token = data.session_token;
            this.experienceState.startedAt = Date.now();
            this.experienceState.history = { balance: [], tilt: [], spill: [], intensity: [], times: [] };
            this.experienceState.badges = new Set();
            this.experienceState.spillEvents = 0;

            const setup = this.container.querySelector('#fp-exp-setup');
            const running = this.container.querySelector('#fp-exp-running');
            const end = this.container.querySelector('#fp-exp-end');
            if (setup) setup.style.display = 'none';
            if (running) running.style.display = 'block';
            if (end) end.style.display = 'none';

            const dName = this.container.querySelector('#fp-exp-dev-name');
            const mName = this.container.querySelector('#fp-exp-mode-name');
            if (dName) dName.textContent = data.device_name || device;
            if (mName) mName.textContent = (data.mode_info && data.mode_info.display_name) || mode;

            if (data.historical_context) {
                this._expHint('✦ ' + data.historical_context, 'good');
            }

            this.experienceState.tickTimer = setInterval(() => this._tickExperience(), 100);
            this.experienceState.timeTimer = setInterval(() => this._updateExpTimer(), 250);
            this._rafLoop();

        } catch (e) {
            this._expHint('开启失败：' + e.message, 'bad');
            const btn = this.container.querySelector('#fp-exp-start');
            if (btn) { btn.disabled = false; btn.textContent = '◈ 启程 · 执炉入景 ◈'; }
        }
    }

    _expHint(msg, type) {
        const el = this.container.querySelector('#fp-exp-hint');
        if (!el) return;
        el.className = 'fp-hint ' + (type || 'good');
        el.innerHTML = msg;
    }

    _updateExpTimer() {
        if (!this.experienceState.running || !this.experienceState.startedAt) return;
        const el = this.container.querySelector('#fp-exp-time');
        if (!el) return;
        const secs = Math.floor((Date.now() - this.experienceState.startedAt) / 1000);
        const mm = String(Math.floor(secs / 60)).padStart(2, '0');
        const ss = String(secs % 60).padStart(2, '0');
        el.textContent = `${mm}:${ss}`;
    }

    async _tickExperience() {
        if (!this.experienceState.running || !this.experienceState.token) return;
        try {
            const res = await fetch(`${this.API_BASE}/experience/tick`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_token: this.experienceState.token,
                    user_intensity: this.experienceState.intensity,
                    time_step_ms: 100
                })
            });
            if (res.status === 410) {
                this._endExperience(true);
                return;
            }
            if (!res.ok) return;
            const frame = await res.json();
            this._updateExpFrame(frame);
        } catch (e) { /* silent */ }
    }

    _updateExpFrame(f) {
        this.experienceState.lastFrame = f;
        const t = f.time_sec || 0;
        this.experienceState.history.times.push(t);
        this.experienceState.history.balance.push(f.balance_score || 0);
        this.experienceState.history.tilt.push(f.body_tilt_deg || 0);
        this.experienceState.history.spill.push(f.spill_risk || 0);
        this.experienceState.history.intensity.push(f.user_intensity || 0);

        const bal = (f.balance_score || 0);
        const tilt = (f.body_tilt_deg || 0);
        const spill = (f.spill_risk || 0);

        const balEl = this.container.querySelector('#fp-exp-balance');
        const balBar = this.container.querySelector('#fp-exp-bal-bar');
        if (balEl) balEl.textContent = (bal * 100).toFixed(1) + '%';
        if (balBar) balBar.style.width = (bal * 100) + '%';

        const tiltEl = this.container.querySelector('#fp-exp-tilt');
        const tiltBar = this.container.querySelector('#fp-exp-tilt-bar');
        if (tiltEl) tiltEl.textContent = tilt.toFixed(2) + '°';
        if (tiltBar) tiltBar.style.width = Math.min(100, tilt * 4) + '%';

        const spillEl = this.container.querySelector('#fp-exp-spill');
        const spillBar = this.container.querySelector('#fp-exp-spill-bar');
        if (spillEl) spillEl.textContent = (spill * 100).toFixed(1) + '%';
        if (spillBar) spillBar.style.width = (spill * 100) + '%';

        const lvEl = this.container.querySelector('#fp-exp-level');
        const lvBar = this.container.querySelector('#fp-exp-lv-bar');
        const lvProg = this.container.querySelector('#fp-exp-lvprog');
        if (lvEl) lvEl.textContent = f.level || '入门';
        if (lvBar) lvBar.style.width = ((f.level_progress || 0) * 100).toFixed(0) + '%';
        if (lvProg) lvProg.textContent = `进度 ${((f.level_progress || 0) * 100).toFixed(0)}%`;

        if (f.is_spill_event) {
            this.experienceState.spillEvents++;
            this._expHint('⚠ 香灰洒落！请减缓强度或减小旋转幅度', 'bad');
        } else if (f.hint_text) {
            const h = f.hint_text;
            if (h.indexOf('✦') >= 0) this._expHint(h, 'good');
            else if (h.indexOf('接近') >= 0) this._expHint(h, 'warn');
            else this._expHint(h, 'good');
        }

        if (f.is_spill_event && !this.experienceState.badges.has('spill1')) {
            this._addBadge('💧 初洒香灰');
            this.experienceState.badges.add('spill1');
        }
        const dur = (Date.now() - this.experienceState.startedAt) / 1000;
        if (dur >= 30 && !this.experienceState.badges.has('dur30')) {
            this._addBadge('⏱ 半炷香');
            this.experienceState.badges.add('dur30');
        }
        if (dur >= 60 && !this.experienceState.badges.has('dur60')) {
            this._addBadge('🕯 一炷香');
            this.experienceState.badges.add('dur60');
        }
        if (bal >= 0.9 && dur >= 10 && !this.experienceState.badges.has('bal90')) {
            this._addBadge('🎯 稳如泰山');
            this.experienceState.badges.add('bal90');
        }
        if (this.experienceState.intensity >= 0.85 && bal >= 0.6 && !this.experienceState.badges.has('storm')) {
            this._addBadge('🌪 狂风不倾');
            this.experienceState.badges.add('storm');
        }
    }

    _addBadge(text) {
        const el = this.container.querySelector('#fp-exp-badges');
        if (!el) return;
        if ([...el.querySelectorAll('.fp-badge')].length === 0) el.innerHTML = '';
        const badge = document.createElement('span');
        badge.className = 'fp-badge';
        badge.textContent = text;
        el.appendChild(badge);
    }

    _rafLoop() {
        if (!this.experienceState.running) return;
        this._drawExpLiveChart();
        this.experienceState.rafId = requestAnimationFrame(() => this._rafLoop());
    }

    _drawExpLiveChart() {
        const canvas = this.container.querySelector('#fp-exp-live');
        if (!canvas) return;
        const { ctx, W, H } = setupCanvas(canvas);
        const padL = 46, padR = 16, padT = 14, padB = 22;
        const cw = W - padL - padR, ch = H - padT - padB;
        ctx.clearRect(0, 0, W, H);

        [0, 0.25, 0.5, 0.75, 1].forEach(r => {
            const y = padT + r * ch;
            ctx.strokeStyle = 'rgba(90,68,32,0.35)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(W - padR, y);
            ctx.stroke();
            ctx.fillStyle = '#8a7555';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(((1 - r) * 100).toFixed(0), padL - 5, y + 3);
        });

        const h = this.experienceState.history;
        const maxPts = 180;
        const series = [
            { arr: h.balance, color: '#2ecc71', yMax: 1 },
            { arr: h.tilt.map(v => Math.min(1, v / 30)), color: '#f1c40f', yMax: 30 },
            { arr: h.spill, color: '#e74c3c', yMax: 1 }
        ];

        series.forEach(s => {
            if (s.arr.length < 2) return;
            const slice = s.arr.slice(-maxPts);
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 1.6;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            slice.forEach((v, i) => {
                const norm = s.color === '#f1c40f' ? Math.min(1, v / 30) : v;
                const x = padL + (cw / Math.max(slice.length - 1, 1)) * i;
                const y = padT + ch - norm * ch;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();
        });
    }

    async _endExperience(expired) {
        if (!this.experienceState.running) return;
        this.experienceState.running = false;

        if (this.experienceState.rafId) cancelAnimationFrame(this.experienceState.rafId);
        if (this.experienceState.tickTimer) clearInterval(this.experienceState.tickTimer);
        if (this.experienceState.timeTimer) clearInterval(this.experienceState.timeTimer);

        const running = this.container.querySelector('#fp-exp-running');
        if (running) running.style.display = 'none';
        const endWrap = this.container.querySelector('#fp-exp-end');
        if (endWrap) endWrap.innerHTML = `<div class="fp-loading">${expired ? '会话已结束，整理体验记录...' : '收炉成册，编纂体验录...'}</div>`;
        if (endWrap) endWrap.style.display = 'block';

        if (!this.experienceState.token) { this._renderExpEndFallback(); return; }

        try {
            const res = await fetch(`${this.API_BASE}/experience/end`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_token: this.experienceState.token })
            });
            if (!res.ok) { this._renderExpEndFallback(); return; }
            const data = await res.json();
            this._renderExpEndResult(data);
        } catch (e) {
            this._renderExpEndFallback();
        }
    }

    _renderExpEndFallback() {
        const data = {
            duration_sec: (Date.now() - (this.experienceState.startedAt || Date.now())) / 1000,
            spill_events: this.experienceState.spillEvents || 0,
            avg_balance_score: this._arrAvg(this.experienceState.history.balance),
            achievement_tags: [...(this.experienceState.badges || [])],
            summary_chart_data: {
                time_sec: this.experienceState.history.times,
                balance_score: this.experienceState.history.balance,
                body_tilt_deg: this.experienceState.history.tilt,
                spill_risk: this.experienceState.history.spill,
                user_intensity: this.experienceState.history.intensity
            },
            final_level: (this.experienceState.lastFrame && this.experienceState.lastFrame.level) || '—',
            historical_insight: '执炉在手，心静则平。愿君常记此刻之专注。',
            longest_streak_sec: 0,
            max_intensity: Math.max(...this.experienceState.history.intensity, 0)
        };
        this._renderExpEndResult(data);
    }

    _arrAvg(arr) { if (!arr || !arr.length) return 0; return arr.reduce((s, v) => s + v, 0) / arr.length; }

    _renderExpEndResult(data) {
        const setup = this.container.querySelector('#fp-exp-setup');
        const endWrap = this.container.querySelector('#fp-exp-end');
        if (setup) setup.style.display = 'none';
        if (!endWrap) return;

        const dur = data.duration_sec || 0;
        const tags = data.achievement_tags || [];
        const cData = data.summary_chart_data || {};

        endWrap.innerHTML = `
            <div class="fp-card">
                <div style="text-align:center;padding:10px 0 20px;">
                    <div style="color:#d4a853;font-size:22px;letter-spacing:6px;margin-bottom:10px;">❖ 体 验 录 ❖</div>
                    <div style="color:#8a7555;font-size:12px;letter-spacing:2px;">历时 ${Math.floor(dur / 60)} 分 ${Math.floor(dur % 60)} 秒 · 圆满收炉</div>
                </div>
                <div class="fp-grid-4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:18px;">
                    <div style="padding:14px;border:1px solid #3a2c14;background:rgba(5,3,2,0.5);border-radius:2px;text-align:center;">
                        <div class="fp-live-label">平均平衡分</div>
                        <div style="color:#2ecc71;font-size:28px;font-family:monospace;font-weight:700;margin-top:4px;">${((data.avg_balance_score || 0) * 100).toFixed(1)}%</div>
                    </div>
                    <div style="padding:14px;border:1px solid #3a2c14;background:rgba(5,3,2,0.5);border-radius:2px;text-align:center;">
                        <div class="fp-live-label">最终等级</div>
                        <div style="color:#d4a853;font-size:16px;font-weight:600;margin-top:10px;">${data.final_level || '—'}</div>
                    </div>
                    <div style="padding:14px;border:1px solid #3a2c14;background:rgba(5,3,2,0.5);border-radius:2px;text-align:center;">
                        <div class="fp-live-label">洒香事件</div>
                        <div style="color:${data.spill_events > 0 ? '#e74c3c' : '#2ecc71'};font-size:28px;font-family:monospace;font-weight:700;margin-top:4px;">${data.spill_events || 0}</div>
                    </div>
                    <div style="padding:14px;border:1px solid #3a2c14;background:rgba(5,3,2,0.5);border-radius:2px;text-align:center;">
                        <div class="fp-live-label">最长平稳</div>
                        <div style="color:#5dade2;font-size:28px;font-family:monospace;font-weight:700;margin-top:4px;">${(data.longest_streak_sec || 0).toFixed(0)}<span style="font-size:13px;color:#8a7555;">s</span></div>
                    </div>
                </div>
                <div style="margin-bottom:12px;">
                    <div class="fp-live-label" style="margin-bottom:8px;">✦ 成就册 ✦</div>
                    <div class="fp-achievements">
                        ${tags.length ? tags.map(t => `<span class="fp-badge">${t}</span>`).join('') : '<span style="color:#66553a;">继续努力，解锁更多成就</span>'}
                    </div>
                </div>
            </div>

            <div class="fp-card">
                <div class="fp-chart-title">❖ 体验全程轨迹录 ❖</div>
                <div class="fp-canvas-wrap"><canvas id="fp-exp-end-chart" height="280"></canvas></div>
                <div class="fp-legend">
                    <div class="fp-legend-item"><span class="fp-legend-dot" style="background:#2ecc71;"></span>平衡分</div>
                    <div class="fp-legend-item"><span class="fp-legend-dot" style="background:#f1c40f;"></span>倾角° / 30</div>
                    <div class="fp-legend-item"><span class="fp-legend-dot" style="background:#e74c3c;"></span>洒香风险</div>
                    <div class="fp-legend-item"><span class="fp-legend-dot" style="background:#9b59b6;"></span>晃动强度</div>
                </div>
            </div>

            <div class="fp-card">
                <div class="fp-section-title">史鉴 · 后记</div>
                <div class="fp-note-text" style="font-size:14px;line-height:2;padding:18px 22px;">
                    ${data.historical_insight || '古人云：「心静则炉平，意躁则香倾」。愿君得此理于日常。'}
                </div>
                <div style="text-align:center;margin-top:20px;">
                    <button class="fp-btn fp-btn-gold" id="fp-exp-restart" style="padding:12px 44px;">◈ 再次启程 ◈</button>
                </div>
            </div>
        `;

        this._drawExpEndChart(cData);

        const restart = this.container.querySelector('#fp-exp-restart');
        if (restart) restart.addEventListener('click', () => {
            const s = this.container.querySelector('#fp-exp-setup');
            const e = this.container.querySelector('#fp-exp-end');
            const startBtn = this.container.querySelector('#fp-exp-start');
            if (s) s.style.display = 'block';
            if (e) e.style.display = 'none';
            if (startBtn) { startBtn.disabled = false; startBtn.textContent = '◈ 启程 · 执炉入景 ◈'; }
            this.experienceState = { running: false, token: null, rafId: null, tickTimer: null, intensity: 0.3, lastFrame: null, history: { balance: [], tilt: [], spill: [], intensity: [], times: [] } };
            const slider = this.container.querySelector('#fp-exp-intensity');
            const lbl = this.container.querySelector('#fp-exp-intensity-label');
            if (slider) slider.value = 30;
            if (lbl) lbl.textContent = '晃动强度：30%';
            const badgesEl = this.container.querySelector('#fp-exp-badges');
            if (badgesEl) badgesEl.innerHTML = '<span style="color:#66553a;font-size:12px;">尚待解锁...</span>';
        });
    }

    _drawExpEndChart(cData) {
        const canvas = this.container.querySelector('#fp-exp-end-chart');
        if (!canvas) return;
        const { ctx, W, H } = setupCanvas(canvas);
        const padL = 46, padR = 16, padT = 14, padB = 32;
        const cw = W - padL - padR, ch = H - padT - padB;
        ctx.clearRect(0, 0, W, H);

        const times = cData.time_sec || [];
        if (times.length < 2) return;
        const tMax = times[times.length - 1] || 1;

        [0, 0.25, 0.5, 0.75, 1].forEach(r => {
            const y = padT + r * ch;
            ctx.strokeStyle = 'rgba(90,68,32,0.35)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(W - padR, y);
            ctx.stroke();
            ctx.fillStyle = '#8a7555';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(((1 - r) * 100).toFixed(0), padL - 5, y + 3);
        });

        const n = 6;
        for (let i = 0; i <= n; i++) {
            const r = i / n;
            const x = padL + r * cw;
            ctx.strokeStyle = 'rgba(90,68,32,0.2)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x, padT);
            ctx.lineTo(x, padT + ch);
            ctx.stroke();
            ctx.fillStyle = '#8a7555';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText((tMax * r).toFixed(1) + 's', x, H - padB + 16);
        }

        const series = [
            { arr: cData.balance_score || [], color: '#2ecc71' },
            { arr: (cData.body_tilt_deg || []).map(v => Math.min(1, v / 30)), color: '#f1c40f' },
            { arr: cData.spill_risk || [], color: '#e74c3c' },
            { arr: cData.user_intensity || [], color: '#9b59b6' }
        ];

        series.forEach(s => {
            if (s.arr.length < 2) return;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.color === '#9b59b6' ? 1 : 1.8;
            ctx.lineJoin = 'round';
            if (s.color === '#9b59b6') ctx.globalAlpha = 0.6;
            ctx.beginPath();
            s.arr.forEach((v, i) => {
                const tR = times[i] != null ? times[i] / tMax : i / (s.arr.length - 1);
                const x = padL + tR * cw;
                const y = padT + ch - Math.max(0, Math.min(1, v)) * ch;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();
            ctx.globalAlpha = 1;
        });
    }
}

window.FeaturesPanel = FeaturesPanel;
