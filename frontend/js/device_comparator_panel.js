import { FP_COLORS, setupCanvas } from './features_panel.js';

export class DeviceComparatorPanel {
    constructor(apiBase, containerEl, sharedData) {
        this.apiBase = apiBase;
        this.container = containerEl;
        this.sharedData = sharedData;
    }

    render() {
        this.container.innerHTML = `
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
        this._bindEvents();
        this._populateSelectors();
    }

    _bindEvents() {
        const btn = this.container.querySelector('#fp-device-run');
        if (btn) {
            btn.addEventListener('click', () => this.runComparison());
        }
    }

    _populateSelectors() {
        const checks = this.container.querySelector('#fp-device-checks');
        if (checks && this.sharedData.devicePresets.length) {
            checks.innerHTML = this.sharedData.devicePresets.map(d => `
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
        if (motionSel && Object.keys(this.sharedData.motionProfiles).length) {
            motionSel.innerHTML = Object.entries(this.sharedData.motionProfiles).map(([k, v]) =>
                `<option value="${k}">${v.name || k} · ${v.TypicalUsage || ''}</option>`
            ).join('');
        }
    }

    async runComparison() {
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
            const res = await fetch(`${this.apiBase}/device-comparison`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_codes: codes, motion_profile: motion, duration_sec: duration })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            this._renderResult(data);
        } catch (e) {
            result.innerHTML = `<div class="fp-error">演算失败：${e.message}</div>`;
        }
    }

    _renderResult(data) {
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

        this._drawBarChart(metrics);
        this._drawRankChart(metrics);
        this._drawTimeSeries(metrics, 'tilt', 'TiltTimeSeries', '倾角 (°)');
        this._drawTimeSeries(metrics, 'bal', 'BalanceTimeSeries', '平衡分');
    }

    _drawBarChart(metrics) {
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

    _drawRankChart(metrics) {
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

    _drawTimeSeries(metrics, suffix, dataKey, yLabel) {
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
}

window.DeviceComparatorPanel = DeviceComparatorPanel;
