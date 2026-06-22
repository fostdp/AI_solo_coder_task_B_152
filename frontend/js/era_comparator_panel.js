import { FP_COLORS, setupCanvas } from './features_panel.js';

export class EraComparatorPanel {
    constructor(apiBase, containerEl, sharedData) {
        this.apiBase = apiBase;
        this.container = containerEl;
        this.sharedData = sharedData;
    }

    render() {
        this.container.innerHTML = `
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
        this._bindEvents();
    }

    _bindEvents() {
        const btn = this.container.querySelector('#fp-cross-run');
        if (btn) btn.addEventListener('click', () => this.runComparison());
    }

    async runComparison(ancientCodes, modernCodes, motionProfile) {
        const motion = this.container.querySelector('#fp-cross-motion').value;
        const result = this.container.querySelector('#fp-cross-result');
        result.innerHTML = `<div class="fp-loading">穿越时空演算中...</div>`;

        try {
            const res = await fetch(`${this.apiBase}/cross-era-comparison`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motion_profile: motion, include_historical_context: true })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            this._renderResult(data);
        } catch (e) {
            result.innerHTML = `<div class="fp-error">演算失败：${e.message}</div>`;
        }
    }

    _renderResult(data) {
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
}

window.EraComparatorPanel = EraComparatorPanel;
