import { Routes, Route, Link } from 'react-router-dom';
import { RecordDream, DreamDetail, TimelineView, CalendarView, DreamAnalytics, DreamElementGraph, CollectivePool, WeeklyReport, DreamUniverse } from './pages';
import { useEffect, useRef, useState } from 'react';

// 线型图标组件
const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ThemeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const GraphIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <circle cx="19" cy="5" r="2" />
    <circle cx="5" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <line x1="12" y1="9" x2="12" y2="5" />
    <line x1="14.5" y1="13.5" x2="17.5" y2="17" />
    <line x1="9.5" y1="13.5" x2="6.5" y2="17" />
    <line x1="6.5" y1="6.5" x2="9.5" y2="9.5" />
    <line x1="17.5" y1="6.5" x2="14.5" y2="9.5" />
  </svg>
);

const PoolIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const ReportIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

const PenIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);

const ArrowRightIcon = ({ className = '' }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`inline-block ml-2 transition-all duration-300 ${className}`}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12,5 19,12 12,19" />
  </svg>
);

// Bento Grid 卡片配置
const bentoCards = [
  {
    id: 'record',
    to: '/record',
    title: '记录梦境',
    desc: '捕捉今夜的星辰碎片',
    icon: PenIcon,
    gridArea: 'record',
    size: 'large',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    shadowColor: 'rgba(139, 92, 246, 0.3)',
    breatheDelay: 0,
    parallaxFactor: 1.2,
  },
  {
    id: 'timeline',
    to: '/timeline',
    title: '星河轨迹',
    desc: '时间线浏览',
    icon: ClockIcon,
    gridArea: 'timeline',
    size: 'medium',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    shadowColor: 'rgba(99, 102, 241, 0.25)',
    breatheDelay: 0.5,
    parallaxFactor: 0.9,
  },
  {
    id: 'calendar',
    to: '/calendar',
    title: '记忆星图',
    desc: '日历视图',
    icon: CalendarIcon,
    gridArea: 'calendar',
    size: 'medium',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    shadowColor: 'rgba(168, 85, 247, 0.25)',
    breatheDelay: 1.2,
    parallaxFactor: 1.0,
  },
  {
    id: 'analytics',
    to: '/analytics',
    title: '主题分析',
    desc: '探索核心主题',
    icon: ThemeIcon,
    gridArea: 'analytics',
    size: 'small',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    shadowColor: 'rgba(168, 85, 247, 0.25)',
    breatheDelay: 0.8,
    parallaxFactor: 0.7,
  },
  {
    id: 'graph',
    to: '/element-graph',
    title: '元素图谱',
    desc: '可视化关联',
    icon: GraphIcon,
    gridArea: 'graph',
    size: 'small',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    shadowColor: 'rgba(6, 182, 212, 0.25)',
    breatheDelay: 1.5,
    parallaxFactor: 0.8,
  },
  {
    id: 'collective',
    to: '/collective',
    title: '潜意识池',
    desc: '共同符号',
    icon: PoolIcon,
    gridArea: 'collective',
    size: 'small',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    shadowColor: 'rgba(59, 130, 246, 0.25)',
    breatheDelay: 2.0,
    parallaxFactor: 0.6,
  },
  {
    id: 'report',
    to: '/weekly-report',
    title: '梦境周报',
    desc: '数据洞察',
    icon: ReportIcon,
    gridArea: 'report',
    size: 'small',
    glowColor: 'rgba(251, 146, 60, 0.4)',
    shadowColor: 'rgba(251, 146, 60, 0.25)',
    breatheDelay: 1.8,
    parallaxFactor: 0.75,
  },
];

// 漂浮卡片组件
interface BentoCardProps {
  card: typeof bentoCards[0];
  mousePosition: { x: number; y: number };
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function BentoCard({ card, mousePosition, containerRef }: BentoCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current || !cardRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // 鼠标相对于容器中心的偏移
    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;
    const mouseOffsetX = mousePosition.x - containerCenterX;
    const mouseOffsetY = mousePosition.y - containerCenterY;
    
    // 视差效果：根据卡片位置和鼠标位置计算偏移
    const factor = card.parallaxFactor * 0.02;
    setParallaxOffset({
      x: mouseOffsetX * factor,
      y: mouseOffsetY * factor,
    });
  }, [mousePosition, card.parallaxFactor, containerRef]);

  const isLarge = card.size === 'large';
  const isMedium = card.size === 'medium';

  return (
    <Link
      ref={cardRef}
      to={card.to}
      className="bento-card group"
      style={{
        gridArea: card.gridArea,
        '--glow-color': card.glowColor,
        '--shadow-color': card.shadowColor,
        '--breathe-delay': `${card.breatheDelay}s`,
        transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
      } as React.CSSProperties}
    >
      {/* 光源边缘效果 - 左上亮，右下暗 */}
      <div className="bento-card-rim-top" />
      <div className="bento-card-rim-left" />
      <div className="bento-card-rim-bottom" />
      <div className="bento-card-rim-right" />
      
      <div className={`relative z-10 h-full flex ${isLarge ? 'flex-col items-center justify-center text-center p-8' : isMedium ? 'flex-col items-start justify-between p-5' : 'items-center gap-3 p-4'}`}>
        <div className={`bento-icon ${isLarge ? 'mb-4' : ''}`} style={{ '--icon-glow': card.glowColor } as React.CSSProperties}>
          <card.icon />
        </div>
        <div className={isLarge ? '' : isMedium ? 'mt-auto' : 'flex-1 min-w-0'}>
          <h3 className={`font-semibold text-white/95 ${isLarge ? 'text-2xl mb-2' : isMedium ? 'text-base mb-1' : 'text-sm'}`}>
            {card.title}
          </h3>
          <p className={`text-white/50 ${isLarge ? 'text-sm' : 'text-xs'} ${!isLarge && !isMedium ? 'truncate' : ''}`}>
            {card.desc}
          </p>
        </div>
        {isLarge && (
          <div className="mt-4 flex items-center group/link text-white/60 group-hover:text-white/80 transition-colors">
            <span className="text-sm">开始记录</span>
            <ArrowRightIcon className="group-hover/link:translate-x-1" />
          </div>
        )}
      </div>
    </Link>
  );
}

function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      {/* Logo 和标题 */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-block mb-3 float-animation">
          <span className="text-5xl sm:text-6xl pulse-glow" style={{ color: 'rgba(167, 139, 250, 0.9)' }}>🌙</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 stardust-title">
          DreamGravity
        </h1>
        <p className="text-xs sm:text-sm text-gray-400/80 font-light tracking-[0.15em] sm:tracking-[0.2em] uppercase">
          记录梦境，让每个梦都有引力
        </p>
      </div>

      {/* Bento Grid 布局 */}
      <div 
        ref={containerRef}
        className="bento-grid w-full max-w-3xl"
      >
        {bentoCards.map((card) => (
          <BentoCard 
            key={card.id} 
            card={card} 
            mousePosition={mousePosition}
            containerRef={containerRef}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/record" element={<RecordDream />} />
      <Route path="/timeline" element={<TimelineView />} />
      <Route path="/calendar" element={<CalendarView />} />
      <Route path="/analytics" element={<DreamAnalytics />} />
      <Route path="/element-graph" element={<DreamElementGraph />} />
      <Route path="/collective" element={<CollectivePool />} />
      <Route path="/weekly-report" element={<WeeklyReport />} />
      <Route path="/dream-universe" element={<DreamUniverse />} />
      <Route path="/dreams/:id" element={<DreamDetail />} />
    </Routes>
  );
}

export default App;
