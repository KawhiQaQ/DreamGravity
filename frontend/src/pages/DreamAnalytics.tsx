import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { SubconsciousEcho } from '../components/SubconsciousEcho';
import type { DreamStatistics, DreamReport, ThemeStatistics, CommonThemeComparison } from '../../../shared/types/api';

type ViewTab = 'overview' | 'report';

const SEMANTIC_COLORS = {
  nature: { solid: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' },
  sky: { solid: '#0EA5E9', glow: 'rgba(14, 165, 233, 0.6)' },
  urban: { solid: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.6)' },
  nightmare: { solid: '#F43F5E', glow: 'rgba(244, 63, 94, 0.6)' },
  emotion: { solid: '#FBBF24', glow: 'rgba(251, 191, 36, 0.6)' },
  mystery: { solid: '#A855F7', glow: 'rgba(168, 85, 247, 0.6)' },
};

const EMOTION_COLORS: Record<string, string> = {
  '快乐': '#10B981', '平静': '#0EA5E9', '兴奋': '#FBBF24', '焦虑': '#F43F5E',
  '恐惧': '#EF4444', '悲伤': '#6366F1', '困惑': '#8B5CF6', '愤怒': '#DC2626',
};

function getSemanticColor(theme: string): typeof SEMANTIC_COLORS.nature {
  const keywords = {
    nature: ['动物', '水', '海', '山', '树', '森林'], sky: ['飞行', '天空', '云', '飞'],
    urban: ['城市', '建筑', '房子', '学校', '工作'], nightmare: ['追逐', '逃跑', '噩梦', '怪物'],
    emotion: ['爱', '家人', '朋友', '恋人'],
  };
  for (const [key, words] of Object.entries(keywords)) {
    if (words.some(w => theme.includes(w))) return SEMANTIC_COLORS[key as keyof typeof SEMANTIC_COLORS];
  }
  return SEMANTIC_COLORS.mystery;
}

// 胶囊切换器
function SegmentedControl({ activeTab, onTabChange }: { activeTab: ViewTab; onTabChange: (tab: ViewTab) => void }) {
  return (
    <div className="inline-flex p-1 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
      {[{ id: 'overview' as ViewTab, label: '星图', icon: '🌌' }, { id: 'report' as ViewTab, label: '报告', icon: '📊' }].map((tab) => (
        <button key={tab.id} onClick={() => onTabChange(tab.id)}
          className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white' : 'text-gray-400 hover:text-white'}`}>
          <span className="flex items-center gap-1.5"><span>{tab.icon}</span><span>{tab.label}</span></span>
        </button>
      ))}
    </div>
  );
}

// ============ 简化版星云气泡 ============
function NebulaOrb({ theme, percentage, size, position, delay }: { 
  theme: string; percentage: number; size: number; 
  position: { x: number; y: number }; delay: number;
}) {
  const color = getSemanticColor(theme);
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="absolute cursor-pointer"
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`, 
        transform: 'translate(-50%, -50%)',
        animation: `nebula-drift ${8 + delay}s ease-in-out infinite`,
        animationDelay: `-${delay * 2}s`, // 负延迟让动画从中间状态开始
        zIndex: isHovered ? 30 : 10 + Math.floor(percentage),
      }}
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 外层扩散光晕 */}
      <div 
        className="absolute rounded-full transition-all duration-500"
        style={{
          width: size * 1.8,
          height: size * 1.8,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${color.glow} 0%, transparent 70%)`,
          opacity: isHovered ? 0.9 : 0.4,
          filter: `blur(${size / 4}px)`,
        }}
      />
      {/* 中层能量环 */}
      <div 
        className="absolute rounded-full transition-all duration-300"
        style={{
          width: size * 1.3,
          height: size * 1.3,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          border: `1px solid ${color.solid}40`,
          boxShadow: isHovered ? `0 0 20px ${color.glow}, inset 0 0 15px ${color.solid}20` : 'none',
        }}
      />
      {/* 核心球体 */}
      <div 
        className="relative rounded-full transition-all duration-300"
        style={{ 
          width: size, 
          height: size,
          background: `
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.5) 0%, transparent 30%),
            radial-gradient(circle at 70% 70%, ${color.solid}30 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, ${color.solid}50 0%, ${color.solid}20 50%, transparent 80%)
          `,
          boxShadow: `0 0 ${isHovered ? 40 : 20}px ${color.glow}, inset 0 0 ${size / 3}px ${color.solid}30`,
          border: `1px solid ${color.solid}50`,
          transform: isHovered ? 'scale(1.15)' : 'scale(1)',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/90 font-light text-center px-1 drop-shadow-lg"
            style={{ fontSize: Math.max(10, size / 6), letterSpacing: '0.1em', textShadow: `0 0 10px ${color.solid}` }}>
            {theme}
          </span>
        </div>
      </div>
      {/* 悬浮信息 */}
      {isHovered && (
        <div 
          className="absolute left-1/2 -bottom-8 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-white/10 whitespace-nowrap"
          style={{ transform: 'translateX(-50%)', animation: 'opacity-fade 0.2s ease-out' }}
        >
          <span className="text-[11px] text-white font-medium">{percentage.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}

// ============ 动态星云背景 ============
function NebulaBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-[150%] h-[150%] -left-[25%] -top-[25%]"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 30% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 50% 60% at 70% 60%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 40%)
          `,
          animation: 'nebula-pulse 12s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// ============ 星云舞台 ============
function NebulaStage({ themes }: { themes: Array<{ theme: string; percentage: number }> }) {
  const sorted = useMemo(() => [...themes].sort((a, b) => b.percentage - a.percentage), [themes]);
  
  const orbPositions = useMemo(() => {
    const positions: Array<{ x: number; y: number }> = [];
    const centerX = 50, centerY = 50;
    sorted.forEach((_, i) => {
      if (i === 0) {
        positions.push({ x: centerX, y: centerY });
      } else {
        const angle = ((i - 1) / (sorted.length - 1)) * Math.PI * 2 - Math.PI / 2;
        const radius = 25 + (i / sorted.length) * 15;
        positions.push({ x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius });
      }
    });
    return positions;
  }, [sorted]);

  return (
    <div className="relative w-full h-full">
      <NebulaBackground />
      {sorted.slice(0, 8).map((item, i) => (
        <NebulaOrb key={item.theme} theme={item.theme} percentage={item.percentage}
          size={Math.max(55, 40 + item.percentage * 2.2)} position={orbPositions[i] || { x: 50, y: 50 }}
          delay={i * 0.6}
        />
      ))}
    </div>
  );
}


// ============ 玻璃折射面板 ============
function GlassRefractionPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: 50, y: 50 });
  }, []);

  return (
    <div ref={panelRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      className={`relative backdrop-blur-xl rounded-2xl border border-white/[0.08] ${className}`}
      style={{ background: 'transparent', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 30px rgba(139, 92, 246, 0.05)' }}>
      {/* 动态高光层 - 玻璃折射效果 */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-2xl"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.08) 0%, transparent 50%)`,
          opacity: mousePos.x !== 50 || mousePos.y !== 50 ? 1 : 0,
        }}
      />
      {/* 边缘高光 */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
      />
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  );
}

// ============ 文本涌现组件 - 模糊渐显 ============
function BlurFadeText({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? 'blur(0px)' : 'blur(8px)',
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
      }}>
      {children}
    </div>
  );
}

// ============ 流体雷达图 ============
function FluidRadar({ data, color = '#22D3EE' }: { data: Array<{ name: string; value: number }>; color?: string }) {
  const points = useMemo(() => {
    const centerX = 100, centerY = 100, maxRadius = 75;
    return data.map((item, i) => {
      const angle = (i / data.length) * Math.PI * 2 - Math.PI / 2;
      const radius = (item.value / 100) * maxRadius;
      return {
        x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius,
        labelX: centerX + Math.cos(angle) * (maxRadius + 18), labelY: centerY + Math.sin(angle) * (maxRadius + 18),
        name: item.name, value: item.value,
      };
    });
  }, [data]);

  const pathD = points.length > 0 ? `M ${points[0].x} ${points[0].y} ${points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')} Z` : '';

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <radialGradient id="radar-mesh" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="50%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </radialGradient>
        <filter id="radar-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[20, 40, 60, 80].map((r) => (
        <circle key={r} cx="100" cy="100" r={r * 0.75 + 15} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      ))}
      {data.map((_, i) => {
        const angle = (i / data.length) * Math.PI * 2 - Math.PI / 2;
        return <line key={i} x1="100" y1="100" x2={100 + Math.cos(angle) * 75} y2={100 + Math.sin(angle) * 75} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />;
      })}
      {pathD && <path d={pathD} fill="url(#radar-mesh)" stroke={color} strokeWidth="2" filter="url(#radar-glow)" style={{ filter: `drop-shadow(0 0 8px ${color})` }} />}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
          <text x={p.labelX} y={p.labelY} textAnchor="middle" dominantBaseline="middle" className="fill-white/50 text-[8px]">{p.name}</text>
        </g>
      ))}
    </svg>
  );
}

// ============ 情绪光谱 ============
function EmotionSpectrum({ emotions }: { emotions: Array<{ emotion: string; label: string; percentage: number }> }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[9px] font-medium tracking-[0.2em] text-purple-400/50 uppercase">Emotions</h4>
      <div className="h-1.5 rounded-full overflow-hidden bg-white/5 flex">
        {emotions.slice(0, 5).map((item) => {
          const color = EMOTION_COLORS[item.label] || '#8B5CF6';
          return <div key={item.emotion} className="h-full transition-all duration-500"
            style={{ width: `${item.percentage}%`, background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 10px ${color}60` }}
            title={`${item.label} ${item.percentage}%`} />;
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {emotions.slice(0, 4).map((item) => (
          <div key={item.emotion} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: EMOTION_COLORS[item.label] || '#8B5CF6', boxShadow: `0 0 6px ${EMOTION_COLORS[item.label] || '#8B5CF6'}` }} />
            <span className="text-[9px] text-white/40">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ 人物列表 ============
function CharacterList({ characters }: { characters: Array<{ character: string; count: number }> }) {
  const colors = ['#8B5CF6', '#06B6D4', '#F59E0B', '#EC4899', '#10B981'];
  return (
    <div className="h-full flex flex-col">
      <h4 className="text-[9px] font-medium tracking-[0.2em] text-cyan-400/50 uppercase mb-2">Characters</h4>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
        {characters.slice(0, 5).map((char, i) => {
          const color = colors[i % 5];
          return (
            <div key={char.character} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-light"
                style={{ background: `${color}15`, border: `1px solid ${color}30`, boxShadow: `0 0 10px ${color}20` }}>{char.character[0]}</div>
              <span className="flex-1 text-[10px] text-white/70 truncate">{char.character}</span>
              <span className="text-[9px] text-white/30">{char.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ============ 星图概览视图 ============
function OverviewView({ statistics }: { 
  statistics: DreamStatistics | null;
}) {
  const [radarMode, setRadarMode] = useState<'emotion' | 'theme'>('emotion');
  const emotionRadarData = useMemo(() => statistics?.emotionDistribution?.slice(0, 6).map((e) => ({ name: e.label, value: e.percentage })) || [], [statistics]);
  const themeRadarData = useMemo(() => statistics?.themes?.slice(0, 6).map((t: ThemeStatistics) => ({ name: t.theme, value: t.percentage })) || [], [statistics]);
  const themeDistribution = useMemo(() => statistics?.themes?.map((t: ThemeStatistics) => ({ theme: t.theme, percentage: t.percentage })) || [], [statistics]);

  if (!statistics) return <div className="h-full w-full flex items-center justify-center text-gray-400"><div className="text-5xl mb-4">🌙</div></div>;

  return (
    <div className="h-full w-full overflow-hidden grid grid-cols-[16%_1fr_20%] gap-4 p-4">
      <div className="flex flex-col gap-3 overflow-hidden">
        <GlassRefractionPanel className="p-4 space-y-3 flex-shrink-0">
          <div className="text-center">
            <p className="text-4xl font-medium text-white tracking-tight">{statistics.totalDreams}</p>
            <p className="text-[8px] tracking-[0.2em] text-white/30 uppercase mt-1">Dreams</p>
          </div>
          <div className="text-center pt-3 border-t border-white/5">
            <p className="text-2xl font-medium gradient-text">{statistics.averageClarity.toFixed(1)}</p>
            <p className="text-[8px] tracking-[0.2em] text-white/30 uppercase mt-1">Clarity</p>
          </div>
          <div className="text-center pt-3 border-t border-white/5">
            <p className="text-xl font-medium text-cyan-400">{statistics.recurringDreams || 0}</p>
            <p className="text-[8px] tracking-[0.2em] text-white/30 uppercase mt-1">Recurring</p>
          </div>
        </GlassRefractionPanel>
        <GlassRefractionPanel className="p-3 flex-1 min-h-0 flex flex-col">
          <div className="flex justify-center gap-2 mb-2 flex-shrink-0">
            {(['emotion', 'theme'] as const).map((m) => (
              <button key={m} onClick={() => setRadarMode(m)}
                className={`px-3 py-1 text-[9px] rounded-full transition-all ${radarMode === m ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-white/30 border border-transparent hover:text-white/50'}`}>
                {m === 'emotion' ? '情绪' : '主题'}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0">
            <FluidRadar data={radarMode === 'emotion' ? emotionRadarData : themeRadarData} color={radarMode === 'emotion' ? '#22D3EE' : '#A855F7'} />
          </div>
        </GlassRefractionPanel>
      </div>
      <GlassRefractionPanel className="relative">
        <span className="absolute top-3 left-4 text-[9px] font-medium tracking-[0.2em] text-purple-400/40 uppercase z-20">Nebula</span>
        <div className="absolute inset-0">
          <NebulaStage themes={themeDistribution} />
        </div>
      </GlassRefractionPanel>
      <div className="flex flex-col gap-3 overflow-hidden">
        <GlassRefractionPanel className="p-3 flex-shrink-0"><EmotionSpectrum emotions={statistics.emotionDistribution || []} /></GlassRefractionPanel>
        <GlassRefractionPanel className="p-3 flex-1 min-h-0"><CharacterList characters={statistics.characters || []} /></GlassRefractionPanel>
        <SubconsciousEcho className="flex-shrink-0 h-[120px]" />
      </div>
    </div>
  );
}

// ============ 主题卡片 ============
function ThemeCard({ item, isExpanded, onToggle, index }: { item: CommonThemeComparison; isExpanded: boolean; onToggle: () => void; index: number }) {
  const color = getSemanticColor(item.theme);
  return (
    <BlurFadeText delay={100 + index * 80}>
      <div onClick={onToggle} className="p-4 rounded-xl cursor-pointer transition-all duration-300" style={{
        background: isExpanded ? `linear-gradient(135deg, ${color.solid}12, rgba(255,255,255,0.03))` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isExpanded ? color.solid + '35' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isExpanded ? `0 0 30px ${color.glow}` : 'none',
      }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full" style={{ background: color.solid, boxShadow: `0 0 12px ${color.glow}` }} />
          <span className="text-base font-light text-white/90 flex-1">{item.theme}</span>
          <span className="text-sm text-white/50">{item.userPercentage}%</span>
          <svg className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex gap-3 mb-2">
          <div className="flex-1">
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${item.userPercentage}%`, background: color.solid, boxShadow: `0 0 10px ${color.glow}` }} /></div>
            <p className="text-[10px] text-white/30 mt-1">你的梦境</p>
          </div>
          <div className="flex-1">
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-white/25" style={{ width: `${item.averagePercentage}%` }} /></div>
            <p className="text-[10px] text-white/30 mt-1">平均水平</p>
          </div>
        </div>
        {isExpanded && <p className="text-sm text-white/65 leading-[1.7] mt-3 animate-fadeIn">{item.description}</p>}
      </div>
    </BlurFadeText>
  );
}

// ============ 报告视图 ============
function ReportView({ report, reportHistory, isGenerating, onGenerateReport, onSelectReport, onDeleteReport }: {
  report: DreamReport | null; reportHistory: DreamReport[]; isGenerating: boolean;
  onGenerateReport: () => void; onSelectReport: (r: DreamReport) => void; onDeleteReport: (id: string) => void;
}) {
  const [expandedTheme, setExpandedTheme] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  if (!report) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <BlurFadeText delay={100}>
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-light text-white mb-2">暂无分析报告</h3>
            <p className="text-xs text-white/40 mb-4">点击下方按钮生成你的专属梦境分析报告</p>
            <button onClick={onGenerateReport} disabled={isGenerating} className="px-5 py-2 rounded-xl glass-btn text-xs disabled:opacity-50">
              {isGenerating ? '生成中...' : '生成报告'}
            </button>
          </div>
        </BlurFadeText>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden flex">
      {/* 历史侧边栏 */}
      <div className={`h-full flex-shrink-0 transition-all duration-300 ${showHistory ? 'w-48' : 'w-0'} overflow-hidden`}>
        <div className="h-full w-48 bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col">
          <div className="p-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] font-medium text-white">历史报告</span>
            <button onClick={() => setShowHistory(false)} className="p-1 rounded hover:bg-white/10">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
            {reportHistory.map((r) => (
              <div key={r.id} onClick={() => onSelectReport(r)} className={`p-2 rounded cursor-pointer transition-all ${report.id === r.id ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white">{new Date(r.generatedAt).toLocaleDateString('zh-CN')}</span>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteReport(r.id); }} className="p-0.5 rounded hover:bg-red-500/20">
                    <svg className="w-2.5 h-2.5 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="flex-1 h-full overflow-hidden grid grid-cols-[28%_1fr_28%] gap-4 p-4">
        {/* 左栏 */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="relative backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5 flex-shrink-0"
            style={{ background: 'transparent', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 30px rgba(139, 92, 246, 0.05)' }}>
            <div className="absolute inset-0 opacity-30 rounded-2xl" style={{ background: `radial-gradient(ellipse at 30% 30%, rgba(139, 92, 246, 0.25) 0%, transparent 60%)` }} />
            <BlurFadeText delay={100} className="relative z-10 text-center py-2">
              <p className="text-[10px] tracking-[0.3em] text-purple-300/60 uppercase mb-3">Dream Report</p>
              <h2 className="text-2xl font-extralight stardust-title mb-2">梦境分析</h2>
              <p className="text-sm text-white/50 font-light">{new Date(report.generatedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-xs text-white/30 mt-1">共 {report.statistics.totalDreams} 条梦境记录</p>
            </BlurFadeText>
          </div>
          <div className="relative backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5 flex-1 min-h-0 overflow-hidden"
            style={{ background: 'transparent', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 30px rgba(139, 92, 246, 0.05)' }}>
            <p className="text-[10px] tracking-[0.25em] text-purple-400/60 uppercase mb-4">Core Insight</p>
            <div className="absolute inset-0 top-12 p-5 pt-0 overflow-y-auto custom-scrollbar">
              <BlurFadeText delay={200}>
                <p className="text-base text-white/85 leading-[1.9] font-light text-justify" style={{ fontFamily: '"ZCOOL XiaoWei", serif' }}>
                  "{report.insights}"
                </p>
              </BlurFadeText>
            </div>
          </div>
        </div>
        {/* 中栏 */}
        <div className="relative backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5 min-h-0 overflow-hidden"
          style={{ background: 'transparent', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 30px rgba(139, 92, 246, 0.05)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] tracking-[0.25em] text-emerald-400/60 uppercase">Theme Insights</p>
            <div className="flex gap-2">
              <button onClick={() => setShowHistory(!showHistory)} className="px-3 py-1 rounded-lg text-xs text-white/50 bg-white/5 hover:bg-white/10 transition-colors">历史 ({reportHistory.length})</button>
              <button onClick={onGenerateReport} disabled={isGenerating} className="px-3 py-1 rounded-lg text-xs text-white bg-purple-500/40 hover:bg-purple-500/60 disabled:opacity-50 transition-colors">{isGenerating ? '生成中...' : '新报告'}</button>
            </div>
          </div>
          <div className="absolute inset-0 top-16 p-5 pt-0 overflow-y-auto custom-scrollbar">
            {report.themeComparison?.map((item, i) => (
              <div key={i} className="mb-3">
                <ThemeCard item={item} index={i} isExpanded={expandedTheme === i} onToggle={() => setExpandedTheme(expandedTheme === i ? null : i)} />
              </div>
            ))}
          </div>
        </div>

        {/* 右栏 */}
        <div className="relative backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5 min-h-0 overflow-hidden"
          style={{ background: 'transparent', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 30px rgba(139, 92, 246, 0.05)' }}>
          <div className="absolute inset-0 opacity-20 rounded-2xl overflow-hidden pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="none">
              <defs><radialGradient id="blobGrad2"><stop offset="0%" stopColor="rgba(251,191,36,0.3)" /><stop offset="100%" stopColor="transparent" /></radialGradient></defs>
              <ellipse cx="100" cy="100" rx="80" ry="70" fill="url(#blobGrad2)" style={{ animation: 'blob-morph 8s ease-in-out infinite' }} />
            </svg>
          </div>
          <p className="text-[10px] tracking-[0.25em] text-amber-400/60 uppercase mb-4 relative z-10">AI Recommendations</p>
          <div className="absolute inset-0 top-12 p-5 pt-0 overflow-y-auto custom-scrollbar z-10">
            <BlurFadeText delay={300}>
              <p className="text-base text-white/80 leading-[1.9] font-light text-justify" style={{ fontFamily: '"ZCOOL XiaoWei", serif' }}>
                {report.recommendations}
              </p>
            </BlurFadeText>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============ 主组件 ============
export default function DreamAnalytics() {
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [statistics, setStatistics] = useState<DreamStatistics | null>(null);
  const [report, setReport] = useState<DreamReport | null>(null);
  const [reportHistory, setReportHistory] = useState<DreamReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, reportsRes] = await Promise.all([
          apiFetch<DreamStatistics>('/api/statistics'),
          apiFetch<DreamReport[]>('/api/statistics/reports'),
        ]);
        setStatistics(statsRes);
        setReportHistory(reportsRes);
        if (reportsRes.length > 0) setReport(reportsRes[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerateReport = useCallback(async () => {
    try {
      setIsGenerating(true);
      const newReport = await apiFetch<DreamReport>('/api/statistics/report', { method: 'POST' });
      setReport(newReport);
      setReportHistory((prev) => [newReport, ...prev]);
      setActiveTab('report');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleSelectReport = useCallback((r: DreamReport) => setReport(r), []);
  const handleDeleteReport = useCallback(async (id: string) => {
    try {
      await apiFetch(`/api/statistics/reports/${id}`, { method: 'DELETE' });
      setReportHistory((prev) => prev.filter((r) => r.id !== id));
      if (report?.id === id) setReport(reportHistory.find((r) => r.id !== id) || null);
    } catch (err) { console.error('删除失败', err); }
  }, [report, reportHistory]);

  if (loading) {
    return (
      <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-transparent">
        <BlurFadeText delay={0}>
          <div className="text-center"><div className="text-5xl mb-4 animate-pulse">🌙</div><p className="text-sm text-white/40">加载梦境数据...</p></div>
        </BlurFadeText>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-transparent">
        <BlurFadeText delay={0}>
          <div className="text-center"><div className="text-5xl mb-4">⚠️</div><p className="text-sm text-red-400">{error}</p>
            <Link to="/" className="mt-4 inline-block text-xs text-purple-400 hover:text-purple-300">返回首页</Link>
          </div>
        </BlurFadeText>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-transparent">
      <header className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-white/5">
        <Link to="/" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-xs">返回</span>
        </Link>
        <h1 className="text-sm font-medium stardust-title">梦境分析</h1>
        <SegmentedControl activeTab={activeTab} onTabChange={setActiveTab} />
      </header>
      <main className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'overview' 
          ? <OverviewView statistics={statistics} />
          : <ReportView report={report} reportHistory={reportHistory} isGenerating={isGenerating} onGenerateReport={handleGenerateReport} onSelectReport={handleSelectReport} onDeleteReport={handleDeleteReport} />
        }
      </main>
    </div>
  );
}
