import { FP_COLORS, setupCanvas } from './features_panel.js';

export class VrGimbalPanel {
    constructor(apiBase, containerEl, sharedData) {
        this.apiBase = apiBase;
        this.container = containerEl;
        this.sharedData = sharedData;

        this.experienceState = {
            running: false,
            token: null,
            rafId: null,
            tickTimer: null,
            timeTimer: null,
            intensity: 0.3,
            lastFrame: null,
            history: { balance: [], tilt: [], spill: [], intensity: [], times: [] },
            badges: null,
            spillEvents: 0,
            startedAt: null
        };
    }

    render() {
        this.container.innerHTML = `
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
        this._bindEvents();
        this._populateSelectors();
    }

    _bindEvents() {
        const start = this.container.querySelector('#fp-exp-start');
        const stop = this.container.querySelector('#fp-exp-stop');
        const intensity = this.container.querySelector('#fp-exp-intensity');
        if (start) start.addEventListener('click', () => this.startExperience());
        if (stop) stop.addEventListener('click', () => this.endExperience(false));
        if (intensity) {
            intensity.addEventListener('input', (e) => {
                this.experienceState.intensity = parseInt(e.target.value) / 100;
                const lbl = this.container.querySelector('#fp-exp-intensity-label');
                if (lbl) lbl.textContent = `晃动强度：${e.target.value}%`;
            });
        }
    }

    _populateSelectors() {
        const dSel = this.container.querySelector('#fp-exp-device');
        const mSel = this.container.querySelector('#fp-exp-mode');
        if (dSel && this.sharedData.devicePresets.length) {
            dSel.innerHTML = this.sharedData.devicePresets.map(d =>
                `<option value="${d.code}">${d.name} 【${d.dynasty}】</option>`
            ).join('');
        }
        if (mSel && this.sharedData.motionModes.length) {
            mSel.innerHTML = this.sharedData.motionModes.map(m =>
                `<option value="${m.key}">${m.display_name} — ${m.scene}</option>`
            ).join('');
        }
    }

    async startExperience(deviceCode, motionMode, userName) {
        const device = this.container.querySelector('#fp-exp-device').value;
        const mode = this.container.querySelector('#fp-exp-mode').value;
        const name = this.container.querySelector('#fp-exp-name').value.trim();

        if (!device) { this._hint('请先择取装置', 'bad'); return; }
        if (!mode) { this._hint('请选择场景模式', 'bad'); return; }

        const btn = this.container.querySelector('#fp-exp-start');
        if (btn) { btn.disabled = true; btn.textContent = '正在开启...'; }

        try {
            const res = await fetch(`${this.apiBase}/experience/start`, {
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
                this._hint('✦ ' + data.historical_context, 'good');
            }

            this.experienceState.tickTimer = setInterval(() => this.tickExperience(), 100);
            this.experienceState.timeTimer = setInterval(() => this._updateTimer(), 250);
            this._rafLoop();

        } catch (e) {
            this._hint('开启失败：' + e.message, 'bad');
            const btn = this.container.querySelector('#fp-exp-start');
            if (btn) { btn.disabled = false; btn.textContent = '◈ 启程 · 执炉入景 ◈'; }
        }
    }

    _hint(msg, type) {
        const el = this.container.querySelector('#fp-exp-hint');
        if (!el) return;
        el.className = 'fp-hint ' + (type || 'good');
        el.innerHTML = msg;
    }

    _updateTimer() {
        if (!this.experienceState.running || !this.experienceState.startedAt) return;
        const el = this.container.querySelector('#fp-exp-time');
        if (!el) return;
        const secs = Math.floor((Date.now() - this.experienceState.startedAt) / 1000);
        const mm = String(Math.floor(secs / 60)).padStart(2, '0');
        const ss = String(secs % 60).padStart(2, '0');
        el.textContent = `${mm}:${ss}`;
    }

    async tickExperience(intensity, rotationX, rotationY, rotationZ) {
        if (!this.experienceState.running || !this.experienceState.token) return;
        try {
            const res = await fetch(`${this.apiBase}/experience/tick`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_token: this.experienceState.token,
                    user_intensity: this.experienceState.intensity,
                    time_step_ms: 100
                })
            });
            if (res.status === 410) {
                this.endExperience(true);
                return;
            }
            if (!res.ok) return;
            const frame = await res.json();
            this._updateFrame(frame);
        } catch (e) { /* silent */ }
    }

    _updateFrame(f) {
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
            this._hint('⚠ 香灰洒落！请减缓强度或减小旋转幅度', 'bad');
        } else if (f.hint_text) {
            const h = f.hint_text;
            if (h.indexOf('✦') >= 0) this._hint(h, 'good');
            else if (h.indexOf('接近') >= 0) this._hint(h, 'warn');
            else this._hint(h, 'good');
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
        this._drawLiveChart();
        this.experienceState.rafId = requestAnimationFrame(() => this._rafLoop());
    }

    _drawLiveChart() {
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

    async endExperience(expired) {
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

        if (!this.experienceState.token) { this._renderEndFallback(); return; }

        try {
            const res = await fetch(`${this.apiBase}/experience/end`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_token: this.experienceState.token })
            });
            if (!res.ok) { this._renderEndFallback(); return; }
            const data = await res.json();
            this._renderEndResult(data);
        } catch (e) {
            this._renderEndFallback();
        }
    }

    _renderEndFallback() {
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
        this._renderEndResult(data);
    }

    _arrAvg(arr) { if (!arr || !arr.length) return 0; return arr.reduce((s, v) => s + v, 0) / arr.length; }

    _renderEndResult(data) {
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

        this._drawEndChart(cData);

        const restart = this.container.querySelector('#fp-exp-restart');
        if (restart) restart.addEventListener('click', () => {
            const s = this.container.querySelector('#fp-exp-setup');
            const e = this.container.querySelector('#fp-exp-end');
            const startBtn = this.container.querySelector('#fp-exp-start');
            if (s) s.style.display = 'block';
            if (e) e.style.display = 'none';
            if (startBtn) { startBtn.disabled = false; startBtn.textContent = '◈ 启程 · 执炉入景 ◈'; }
            this.experienceState = { running: false, token: null, rafId: null, tickTimer: null, timeTimer: null, intensity: 0.3, lastFrame: null, history: { balance: [], tilt: [], spill: [], intensity: [], times: [] }, badges: null, spillEvents: 0, startedAt: null };
            const slider = this.container.querySelector('#fp-exp-intensity');
            const lbl = this.container.querySelector('#fp-exp-intensity-label');
            if (slider) slider.value = 30;
            if (lbl) lbl.textContent = '晃动强度：30%';
            const badgesEl = this.container.querySelector('#fp-exp-badges');
            if (badgesEl) badgesEl.innerHTML = '<span style="color:#66553a;font-size:12px;">尚待解锁...</span>';
        });
    }

    _drawEndChart(cData) {
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

window.VrGimbalPanel = VrGimbalPanel;
