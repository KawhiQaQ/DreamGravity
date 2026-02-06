import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import type { EmotionTag, ClarityRating as ClarityRatingType } from '../../../shared/types/dream';
import { EMOTION_TAGS, EmotionTagLabels } from '../../../shared/types/dream';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { API_BASE_URL } from '../utils';
import { validateDreamForm, errorsToFieldMap } from '../utils/validation';

function SegmentedNav() {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: '🏠', label: '首页' },
    { path: '/timeline', icon: '🌌', label: '星河轨迹' },
    { path: '/calendar', icon: '✨', label: '记忆星图' },
  ];
  return (
    <div className="inline-flex items-center p-1 rounded-full glass-card">
      {navItems.map((item) => (
        <Link key={item.path} to={item.path}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            location.pathname === item.path ? 'bg-gradient-to-r from-dream-primary to-dream-secondary text-white shadow-lg' : 'text-dream-text-secondary hover:text-dream-text hover:bg-white/10'
          }`}>
          <span>{item.icon}</span>
          <span className="hidden sm:inline">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}

// 情绪配色 - 始终显示颜色
const emotionOrbs: Record<EmotionTag, { color: string; glow: string; ambient: string }> = {
  happy: { color: '#fbbf24', glow: 'rgba(251,191,36,0.6)', ambient: 'rgba(251,191,36,0.15)' },
  excited: { color: '#f97316', glow: 'rgba(249,115,22,0.6)', ambient: 'rgba(249,115,22,0.15)' },
  peaceful: { color: '#06b6d4', glow: 'rgba(6,182,212,0.6)', ambient: 'rgba(6,182,212,0.15)' },
  hopeful: { color: '#84cc16', glow: 'rgba(132,204,22,0.6)', ambient: 'rgba(132,204,22,0.15)' },
  loving: { color: '#ec4899', glow: 'rgba(236,72,153,0.6)', ambient: 'rgba(236,72,153,0.15)' },
  sad: { color: '#3b82f6', glow: 'rgba(59,130,246,0.6)', ambient: 'rgba(59,130,246,0.15)' },
  anxious: { color: '#a855f7', glow: 'rgba(168,85,247,0.6)', ambient: 'rgba(168,85,247,0.15)' },
  angry: { color: '#ef4444', glow: 'rgba(239,68,68,0.6)', ambient: 'rgba(239,68,68,0.15)' },
  scared: { color: '#6b7280', glow: 'rgba(107,114,128,0.6)', ambient: 'rgba(107,114,128,0.15)' },
  lonely: { color: '#6366f1', glow: 'rgba(99,102,241,0.6)', ambient: 'rgba(99,102,241,0.15)' },
  confused: { color: '#d946ef', glow: 'rgba(217,70,239,0.6)', ambient: 'rgba(217,70,239,0.15)' },
  nostalgic: { color: '#f59e0b', glow: 'rgba(245,158,11,0.6)', ambient: 'rgba(245,158,11,0.15)' },
  curious: { color: '#14b8a6', glow: 'rgba(20,184,166,0.6)', ambient: 'rgba(20,184,166,0.15)' },
  surprised: { color: '#f472b6', glow: 'rgba(244,114,182,0.6)', ambient: 'rgba(244,114,182,0.15)' },
  neutral: { color: '#94a3b8', glow: 'rgba(148,163,184,0.4)', ambient: 'rgba(148,163,184,0.1)' },
};

const clarityLabels: Record<ClarityRatingType, string> = { 1: '朦胧', 2: '模糊', 3: '一般', 4: '清晰', 5: '晶莹' };
const getTodayDate = () => new Date().toISOString().split('T')[0];

// 时间工具函数
const timeToMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const calcDuration = (s: string, e: string) => {
  let sm = timeToMins(s), em = timeToMins(e);
  if (em <= sm) em += 1440;
  const d = em - sm, h = Math.floor(d / 60), m = d % 60;
  return m === 0 ? `${h}小时` : `${h}h${m}m`;
};

// 睡眠滑块组件 - 24小时（18:00-次日17:45，左入睡右醒来）
function SleepSlider({ start, end, onStartChange, onEndChange, disabled }: {
  start: string; end: string; onStartChange: (t: string) => void; onEndChange: (t: string) => void; disabled?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);

  // 时间轴：18:00(0%) -> 次日17:45(100%)，共23.75小时 = 1425分钟
  const timeToPercent = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    let mins = h * 60 + m;
    // 18:00-23:59 映射到前面
    // 00:00-17:45 映射到后面
    if (h >= 18) {
      mins = mins - 18 * 60; // 18:00=0, 24:00=360
    } else {
      mins = mins + 6 * 60; // 00:00=360, 17:45=1425
    }
    return Math.min((mins / 1425) * 100, 100);
  };

  const percentToTime = (pct: number): string => {
    const clampedPct = Math.max(0, Math.min(100, pct));
    let mins = Math.round((clampedPct / 100) * 1425 / 15) * 15; // 15分钟步进
    mins = Math.min(mins, 1425); // 最大17:45
    // 反向映射
    if (mins < 360) {
      mins = mins + 18 * 60; // 0-360 -> 18:00-24:00
    } else {
      mins = mins - 6 * 60; // 360-1425 -> 00:00-17:45
    }
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const startP = timeToPercent(start);
  const endP = timeToPercent(end);

  const handleDrag = useCallback((clientX: number) => {
    if (!trackRef.current || !dragging) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const newTime = percentToTime(pct);
    
    if (dragging === 'start') {
      if (pct < endP) onStartChange(newTime);
    } else {
      if (pct > startP) onEndChange(newTime);
    }
  }, [dragging, startP, endP, onStartChange, onEndChange]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => handleDrag(e.clientX);
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, handleDrag]);

  const handleTrackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const nearStart = Math.abs(pct - startP) < Math.abs(pct - endP);
    if (nearStart) {
      if (pct < endP) {
        setDragging('start');
        onStartChange(percentToTime(pct));
      }
    } else {
      if (pct > startP) {
        setDragging('end');
        onEndChange(percentToTime(pct));
      }
    }
  };

  // 限制滑块视觉位置，不要超出滑动条太多（约滑块半径的距离）
  const clampPosition = (pct: number) => Math.max(3, Math.min(97, pct));
  const startVisual = clampPosition(startP);
  const endVisual = clampPosition(endP);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] text-dream-text-secondary/50 px-0.5">
        <span>18:00</span><span>22:00</span><span>02:00</span><span>06:00</span><span>10:00</span><span>14:00</span><span>18:00</span>
      </div>
      <div ref={trackRef} 
        className={`relative h-8 rounded-full cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        style={{ background: 'linear-gradient(to right, #312e81 0%, #1e1b4b 12%, #0c0a1d 25%, #0c0a1d 40%, #1e1b4b 55%, #4f46e5 70%, #818cf8 85%, #c4b5fd 100%)' }}
        onMouseDown={handleTrackClick}>
        {/* 选中区域 */}
        <div className="absolute top-0 h-full rounded-full pointer-events-none" 
          style={{ 
            left: `${startVisual}%`, 
            width: `${Math.max(0, endVisual - startVisual)}%`, 
            background: 'linear-gradient(to right, rgba(139,92,246,0.5), rgba(6,182,212,0.4))', 
            boxShadow: 'inset 0 0 15px rgba(139,92,246,0.3)' 
          }} />
        {/* 入睡滑块 - 左边月亮 */}
        <div 
          className={`absolute top-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 border-2 border-white/40 cursor-grab ${dragging === 'start' ? 'scale-125 cursor-grabbing z-10' : 'hover:scale-110'}`}
          style={{ left: `${startVisual}%`, transform: 'translate(-50%, -50%)', boxShadow: '0 0 10px rgba(139,92,246,0.6)' }}
          onMouseDown={(e) => { e.stopPropagation(); setDragging('start'); }}>
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] text-dream-text whitespace-nowrap bg-dream-surface/90 px-1.5 py-0.5 rounded pointer-events-none">🌙{start}</div>
        </div>
        {/* 醒来滑块 - 右边太阳 */}
        <div 
          className={`absolute top-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-white/40 cursor-grab ${dragging === 'end' ? 'scale-125 cursor-grabbing z-10' : 'hover:scale-110'}`}
          style={{ left: `${endVisual}%`, transform: 'translate(-50%, -50%)', boxShadow: '0 0 10px rgba(6,182,212,0.6)' }}
          onMouseDown={(e) => { e.stopPropagation(); setDragging('end'); }}>
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] text-dream-text whitespace-nowrap bg-dream-surface/90 px-1.5 py-0.5 rounded pointer-events-none">☀️{end}</div>
        </div>
      </div>
    </div>
  );
}

// 清晰度能量槽组件
function ClaritySlider({ value, onChange, disabled }: { value: ClarityRatingType; onChange: (v: ClarityRatingType) => void; disabled?: boolean; }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const percent = ((value - 1) / 4) * 100;
  const intensity = (value - 1) / 4; // 0~1

  const handleMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const v = Math.round((p / 100) * 4) + 1;
    onChange(Math.max(1, Math.min(5, v)) as ClarityRatingType);
  }, [onChange]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => handleMove(e);
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, handleMove]);

  return (
    <div className="space-y-2">
      <div ref={trackRef} className={`relative h-6 rounded-full cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        style={{ background: 'linear-gradient(to right, rgba(40,40,60,0.9), rgba(80,80,100,0.7))' }}
        onMouseDown={(e) => { e.preventDefault(); setDragging(true); handleMove(e); }}>
        {/* 填充 */}
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
          style={{ width: `${percent}%`, background: `linear-gradient(to right, rgba(100,100,130,0.7), rgba(180,180,200,0.8) 50%, rgba(240,240,255,${0.7 + intensity * 0.3}))`, boxShadow: value >= 3 ? `0 0 ${8 + intensity * 15}px rgba(255,255,255,${0.3 + intensity * 0.4})` : 'none' }} />
        {/* 刻度 */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          {[1,2,3,4,5].map(l => <div key={l} className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: l <= value ? `rgba(255,255,255,${0.5 + l * 0.1})` : 'rgba(255,255,255,0.15)', boxShadow: l <= value && l >= 3 ? `0 0 ${l*2}px rgba(255,255,255,0.5)` : 'none' }} />)}
        </div>
        {/* 滑块 */}
        <div className={`absolute top-1/2 w-4 h-4 rounded-full transition-all ${dragging ? 'scale-125' : 'hover:scale-110'}`}
          style={{ left: `${percent}%`, transform: 'translate(-50%, -50%)', background: `radial-gradient(circle, rgba(255,255,255,${0.6 + intensity * 0.4}) 0%, rgba(200,200,220,0.8) 100%)`, boxShadow: `0 0 ${6 + intensity * 12}px rgba(255,255,255,${0.5 + intensity * 0.4})`, border: '2px solid rgba(255,255,255,0.5)' }} />
      </div>
      <p className="text-[11px] text-center text-dream-text-secondary/60" style={{ filter: `blur(${(1 - intensity) * 0.5}px)` }}>
        {value === 1 && '梦境如雾中花，难以捕捉'}
        {value === 2 && '隐约可见轮廓，细节模糊'}
        {value === 3 && '能回忆主要情节'}
        {value === 4 && '画面清晰，记忆深刻'}
        {value === 5 && '如同亲历，历历在目'}
      </p>
    </div>
  );
}

interface FormData {
  content: string; dreamDate: string; sleepStartTime: string; sleepEndTime: string;
  emotionTag: EmotionTag; clarity: ClarityRatingType; isRecurring: boolean;
}

export function RecordDream() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [ambientColor, setAmbientColor] = useState('rgba(139,92,246,0.12)');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    content: '', dreamDate: getTodayDate(), sleepStartTime: '22:00', sleepEndTime: '07:00',
    emotionTag: 'neutral', clarity: 3, isRecurring: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const result = validateDreamForm(formData);
    const validationErrors = errorsToFieldMap(result.errors);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/dreams`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, sleepStartTime: formData.sleepStartTime || undefined, sleepEndTime: formData.sleepEndTime || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).message || '保存失败');
      navigate(`/dreams/${(await res.json()).id}`);
    } catch (err) { setSubmitError(err instanceof Error ? err.message : '提交失败'); }
    finally { setIsLoading(false); }
  };

  const handleVoice = useCallback((text: string) => setFormData(p => ({ ...p, content: p.content + text })), []);

  return (
    <div className="h-screen overflow-hidden relative">
      {/* 氛围光 */}
      <div className="fixed inset-0 pointer-events-none transition-all duration-700 z-0" style={{ background: `radial-gradient(ellipse at 75% 25%, ${ambientColor} 0%, transparent 55%)` }} />
      
      <div className="relative z-10 h-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* 头部 - 紧凑 */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold gradient-text">记录梦境</h1>
            <p className="text-xs text-dream-text-secondary">让每个梦都有引力</p>
          </div>
          <SegmentedNav />
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0">
          {/* 左右布局 - 填满剩余高度 */}
          <div className="h-full flex flex-col lg:flex-row gap-4">
            
            {/* 左侧书写区 - 消融在星空里 */}
            <div className="flex-[3] min-w-0 min-h-0">
              <div className="h-full relative flex flex-col">
                {/* 极简渐变背景 - 从左侧微弱磨砂到透明 */}
                <div 
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background: 'linear-gradient(to right, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 30%, transparent 70%)',
                    backdropFilter: 'blur(2px)',
                  }}
                />
                
                {/* 语音按钮 - 左上角脉冲能量球 */}
                <div className="relative z-20 flex items-start gap-4 mb-4 pt-4 pl-4">
                  <button 
                    type="button" 
                    onClick={() => setShowVoice(!showVoice)} 
                    disabled={isLoading}
                    className="group relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 hover:scale-110"
                    style={{
                      background: `radial-gradient(circle, ${emotionOrbs[formData.emotionTag].color}15 0%, transparent 70%)`,
                      boxShadow: `0 0 8px ${emotionOrbs[formData.emotionTag].color}25`,
                    }}
                  >
                    <div 
                      className="absolute inset-1 rounded-full opacity-30"
                      style={{ 
                        background: emotionOrbs[formData.emotionTag].color,
                        animation: 'pulse-glow 3s ease-in-out infinite',
                      }}
                    />
                    <span className="text-lg relative z-10">🎤</span>
                  </button>
                  
                  {/* 大标题 - 仪式感引导 */}
                  <div className="flex-1">
                    <h2 
                      className="text-3xl sm:text-4xl lg:text-5xl tracking-wide font-bold"
                      style={{
                        fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", cursive',
                        color: 'rgba(220,210,255,0.85)',
                        textShadow: '0 0 30px rgba(139,92,246,0.4), 0 0 60px rgba(139,92,246,0.2)',
                        letterSpacing: '0.12em',
                        fontWeight: 700,
                      }}
                    >
                      捕捉梦境碎片
                    </h2>
                    <p 
                      className="text-sm sm:text-base mt-2 tracking-widest"
                      style={{
                        fontFamily: '"ZCOOL XiaoWei", serif',
                        color: 'rgba(180,170,200,0.45)',
                        letterSpacing: '0.25em',
                      }}
                    >
                      昨夜，星河入梦...
                    </p>
                  </div>
                </div>

                {/* 语音录制浮层 */}
                {showVoice && (
                  <div className="absolute top-20 left-4 z-30">
                    <VoiceRecorder onTranscript={handleVoice} onError={console.error} disabled={isLoading} onClose={() => setShowVoice(false)} floating />
                  </div>
                )}

                {/* 文本输入区 - 悬浮在星空中 */}
                <div className="flex-1 relative px-4 pb-4">
                  {/* 发光光标容器 */}
                  <div className="relative h-full">
                    {/* 占位符 - 诗意化 */}
                    {!formData.content && (
                      <div 
                        className="absolute top-0 left-0 pointer-events-none select-none text-xl sm:text-2xl font-serif italic tracking-wider"
                        style={{
                          color: 'rgba(255,255,255,0.15)',
                          textShadow: '0 0 20px rgba(139,92,246,0.1)',
                        }}
                      >
                        昨晚，我梦见了……
                      </div>
                    )}
                    
                    <textarea
                      value={formData.content}
                      onChange={(e) => { 
                        setFormData(p => ({ ...p, content: e.target.value })); 
                        if (errors.content) setErrors(p => ({ ...p, content: '' }));
                      }}
                      placeholder=""
                      disabled={isLoading}
                      className="w-full h-full bg-transparent resize-none text-lg sm:text-xl leading-relaxed text-dream-text focus:outline-none tracking-wide dream-textarea"
                      style={{ 
                        caretColor: emotionOrbs[formData.emotionTag].color,
                        fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif',
                        fontWeight: 400,
                      }}
                    />
                  </div>
                </div>
              </div>
              {errors.content && <p className="mt-1 text-red-400 text-xs">{errors.content}</p>}
            </div>

            {/* 右侧参数面板 */}
            <div className="flex-[2] min-w-0 lg:max-w-sm min-h-0">
              <div className="h-full glass-card p-4 flex flex-col gap-3 overflow-y-auto" style={{ boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 50px ${ambientColor}` }}>
                
                {/* 日期 */}
                <div>
                  <label className="block text-xs font-medium text-dream-text mb-1.5">梦境日期</label>
                  <input type="date" value={formData.dreamDate} max={getTodayDate()} disabled={isLoading}
                    onChange={(e) => setFormData(p => ({ ...p, dreamDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-dream-text text-sm focus:outline-none focus:border-dream-primary/50 transition-all" />
                </div>

                {/* 睡眠时间滑块 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-dream-text">睡眠时间</label>
                    <span className="text-xs text-dream-neon-cyan font-medium">{calcDuration(formData.sleepStartTime, formData.sleepEndTime)}</span>
                  </div>
                  <SleepSlider start={formData.sleepStartTime} end={formData.sleepEndTime}
                    onStartChange={(t) => setFormData(p => ({ ...p, sleepStartTime: t }))}
                    onEndChange={(t) => setFormData(p => ({ ...p, sleepEndTime: t }))} disabled={isLoading} />
                </div>

                {/* 情绪光点 */}
                <div>
                  <label className="block text-xs font-medium text-dream-text mb-2">情绪色彩</label>
                  <div className="grid grid-cols-5 gap-0.5">
                    {EMOTION_TAGS.map((em) => {
                      const sel = formData.emotionTag === em;
                      const orb = emotionOrbs[em];
                      return (
                        <button key={em} type="button" title={EmotionTagLabels[em]}
                          onClick={() => { setFormData(p => ({ ...p, emotionTag: em })); setAmbientColor(orb.ambient); }}
                          className={`group flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all ${sel ? 'bg-white/10 scale-105' : 'hover:bg-white/5'}`}>
                          <div className="w-5 h-5 rounded-full transition-all"
                            style={{ background: orb.color, opacity: sel ? 1 : 0.5, boxShadow: sel ? `0 0 10px ${orb.glow}` : 'none', transform: sel ? 'scale(1.1)' : 'scale(1)' }} />
                          <span className={`text-[8px] transition-all ${sel ? 'text-white' : 'text-dream-text-secondary/40'}`}>{EmotionTagLabels[em]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 清晰度能量槽 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-dream-text">清晰度</label>
                    <span className="text-xs font-medium" style={{ color: `rgba(255,255,255,${0.4 + formData.clarity * 0.12})` }}>{clarityLabels[formData.clarity]}</span>
                  </div>
                  <ClaritySlider value={formData.clarity} onChange={(v) => setFormData(p => ({ ...p, clarity: v }))} disabled={isLoading} />
                </div>

                {/* 重复梦境 */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" checked={formData.isRecurring} disabled={isLoading}
                      onChange={(e) => setFormData(p => ({ ...p, isRecurring: e.target.checked }))}
                      className="w-4 h-4 rounded appearance-none cursor-pointer bg-white/[0.06] border border-white/20 checked:bg-gradient-to-br checked:from-dream-primary checked:to-dream-secondary transition-all" />
                    {formData.isRecurring && <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] pointer-events-none">✓</span>}
                  </div>
                  <span className="text-xs text-dream-text">重复出现的梦境</span>
                </label>

                <div className="flex-1" />

                {submitError && <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{submitError}</div>}

                {/* 封存按钮 */}
                <button type="submit" disabled={isLoading}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'aurora-btn hover:-translate-y-0.5'}`}>
                  {isLoading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>封存中...</span> : '✨ 封存梦境'}
                </button>
                <p className="text-center text-[10px] text-dream-text-secondary/40">点击封存，让这个梦永远属于你</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
