import { FP_COLORS, setupCanvas } from './features_panel.js';

export class ViscosityAnalyzerPanel {
    constructor(apiBase, containerEl, sharedData) {
        this.apiBase = apiBase;
        this.container = containerEl;
        this.sharedData = sharedData;
    }

    render() {
        this.container.innerHTML = `
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
        this._bindEvents();
        this._populateSelectors();
    }

    _bindEvents() {
        const run = this.container.querySelector('#fp-visc-run');
        const preset = this.container.querySelector('#fp-visc-preset');
        if (run) run.addEventListener('click', () => this.runScan());
        if (preset) preset.addEventListener('click', () => {
            const inp = this.container.querySelector('#fp-visc-values');
            if (inp) inp.value = '0.001,0.003,0.01,0.03,0.1,0.3,1,3,10,30,100';
        });
    }

    _populateSelectors() {
        const sel = this.container.querySelector('#fp-visc-device');
        if (sel && this.sharedData.devicePresets.length) {
            sel.innerHTML = this.sharedData.devicePresets.map(d =>
                `<option value="${d.code}">${d.name} 【${d.dynasty}】</option>`
            ).join('');
        }
    }

    async runScan(deviceCode, motionProfile, viscosityRange, tempC, fillRatio) {
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
            const res = await fetch(`${this.apiBase}/viscosity-scan`, {
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
            this._renderResult(data);
        } catch (e) {
            result.innerHTML = `<div class="fp-error">演算失败：${e.message}</div>`;
        }
    }

    _renderResult(data) {
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

        this._drawSpillChart(pts, data);
        this._drawTiltChart(pts);
        this._drawDampChart(pts);
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

    _drawSpillChart(pts, data) {
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

    _drawTiltChart(pts) {
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

    _drawDampChart(pts) {
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
}

window.ViscosityAnalyzerPanel = ViscosityAnalyzerPanel;
