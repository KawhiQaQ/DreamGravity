import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { DreamEntry } from '../../../shared/types/dream';
import { API_BASE_URL } from '../utils';

// ============================================
// 类型定义
// ============================================
type ContentTab = 'original' | 'insight' | 'echo';

interface LoadingState {
  analyze: boolean;
  generateImage: boolean;
  generateStory: boolean;
  generatePoem: boolean;
}

// ============================================
// 情绪光点组件 - 与记录梦境页面一致的光点样式
// ============================================
function EmotionPlanet({ emotion }: { emotion: string }) {
  // 情绪配色 - 与记录梦境页面保持一致
  const emotionOrbs: Record<string, { color: string; glow: string }> = {
    happy: { color: '#fbbf24', glow: 'rgba(251,191,36,0.6)' },
    excited: { color: '#f97316', glow: 'rgba(249,115,22,0.6)' },
    peaceful: { color: '#06b6d4', glow: 'rgba(6,182,212,0.6)' },
    hopeful: { color: '#84cc16', glow: 'rgba(132,204,22,0.6)' },
    loving: { color: '#ec4899', glow: 'rgba(236,72,153,0.6)' },
    sad: { color: '#3b82f6', glow: 'rgba(59,130,246,0.6)' },
    anxious: { color: '#a855f7', glow: 'rgba(168,85,247,0.6)' },
    angry: { color: '#ef4444', glow: 'rgba(239,68,68,0.6)' },
    scared: { color: '#6b7280', glow: 'rgba(107,114,128,0.6)' },
    lonely: { color: '#6366f1', glow: 'rgba(99,102,241,0.6)' },
    confused: { color: '#d946ef', glow: 'rgba(217,70,239,0.6)' },
    nostalgic: { color: '#f59e0b', glow: 'rgba(245,158,11,0.6)' },
    curious: { color: '#14b8a6', glow: 'rgba(20,184,166,0.6)' },
    surprised: { color: '#f472b6', glow: 'rgba(244,114,182,0.6)' },
    neutral: { color: '#94a3b8', glow: 'rgba(148,163,184,0.4)' },
  };

  const emotionLabels: Record<string, string> = {
    happy: '愉快',
    excited: '兴奋',
    peaceful: '平静',
    hopeful: '希望',
    loving: '温馨',
    sad: '悲伤',
    anxious: '焦虑',
    angry: '愤怒',
    scared: '恐惧',
    lonely: '孤独',
    confused: '困惑',
    nostalgic: '怀旧',
    curious: '好奇',
    surprised: '惊讶',
    neutral: '平淡',
  };

  const orb = emotionOrbs[emotion] || emotionOrbs.neutral;
  const label = emotionLabels[emotion] || '平淡';

  return (
    <div className="flex items-center gap-3">
      {/* 发光圆形光点 */}
      <div
        className="w-8 h-8 rounded-full transition-all duration-300"
        style={{
          background: orb.color,
          boxShadow: `0 0 20px ${orb.glow}, 0 0 40px ${orb.glow}`,
        }}
      />
      {/* 情绪标签 */}
      <span className="text-sm font-medium text-white/90">{label}</span>
    </div>
  );
}

// ============================================
// 清晰度能量条组件
// ============================================
function ClarityBar({ clarity }: { clarity: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((level) => (
        <div
          key={level}
          className={`w-6 h-2 rounded-full transition-all duration-300 ${
            level <= clarity ? 'bg-gradient-to-r from-cyan-400 to-purple-500' : 'bg-white/10'
          }`}
          style={{
            boxShadow: level <= clarity
              ? '0 0 8px rgba(0, 212, 255, 0.6), 0 0 16px rgba(139, 92, 246, 0.4)'
              : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// 胶囊切换器组件
// ============================================
function SegmentedControl({
  activeTab,
  onTabChange,
  hasAnalysis,
}: {
  activeTab: ContentTab;
  onTabChange: (tab: ContentTab) => void;
  hasAnalysis: boolean;
}) {
  const tabs: { id: ContentTab; label: string; icon: string }[] = [
    { id: 'original', label: '原梦', icon: '📝' },
    { id: 'insight', label: '解析', icon: '🔮' },
    { id: 'echo', label: '回响', icon: '✨' },
  ];

  return (
    <div className="flex justify-center mb-6">
      <div className="inline-flex p-1 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled = (tab.id === 'insight' || tab.id === 'echo') && !hasAnalysis;
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={`
                relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                ${isActive
                  ? 'bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white shadow-lg'
                  : isDisabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }
              `}
              style={{ boxShadow: isActive ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none' }}
            >
              <span className="flex items-center gap-2">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// 磨砂玻璃操作按钮
// ============================================
function ActionIconButton({
  icon,
  label,
  onClick,
  isLoading,
  isActive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isLoading?: boolean;
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`group relative p-3 rounded-xl backdrop-blur-xl transition-all duration-300
        ${isActive
          ? 'bg-green-500/20 border border-green-500/50'
          : 'bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30'
        }`}
      title={label}
    >
      {isLoading ? (
        <div className="w-5 h-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <span className="text-lg">{icon}</span>
      )}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-black/80 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {label}
      </span>
    </button>
  );
}


// ============================================
// 视图 A：原梦 (Original) - 纯粹阅读器
// 衬线体、1.8倍行距、极简设计
// ============================================
function OriginalView({ content }: { content: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      setNeedsScroll(contentRef.current.scrollHeight > contentRef.current.clientHeight);
    }
  }, [content]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      {/* 极简阅读容器 */}
      <div
        ref={contentRef}
        className={`
          w-full max-w-2xl mx-auto
          ${needsScroll ? 'overflow-y-auto custom-scrollbar pr-4' : 'overflow-hidden'}
        `}
        style={{ maxHeight: '100%' }}
      >
        {/* 装饰性引号 */}
        <div className="text-6xl text-purple-500/20 font-serif leading-none mb-4 select-none">"</div>
        
        {/* 梦境文本 - 衬线体、1.8倍行距 */}
        <p
          className="text-xl text-gray-100 whitespace-pre-wrap font-serif"
          style={{
            lineHeight: '1.8',
            fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", Georgia, serif',
            textAlign: 'justify',
          }}
        >
          {content}
        </p>
        
        {/* 结束引号 */}
        <div className="text-6xl text-purple-500/20 font-serif leading-none mt-4 text-right select-none">"</div>
      </div>
    </div>
  );
}

// ============================================
// 视图 B：解析 (Insight) - Bento Grid 便当盒布局
// ============================================
function InsightView({
  analysis,
  onShowDetail,
}: {
  analysis: DreamEntry['analysis'];
  onShowDetail: (content: string, title: string) => void;
}) {
  const [symbolIndex, setSymbolIndex] = useState(0);

  if (!analysis) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p>暂无解析内容，请先进行 AI 解析</p>
      </div>
    );
  }

  const symbols = analysis.symbolAnalysis?.elements || [];
  const typeIcons: Record<string, string> = {
    person: '👤',
    object: '🔮',
    scene: '🌌',
    action: '⚡',
  };

  // 情绪强度百分比
  const emotionIntensity = analysis.emotionAnalysis?.emotionIntensity || 5;

  return (
    <div className="h-full grid grid-cols-3 grid-rows-2 gap-4">
      {/* 左上块 (2x2): 象征卡片 - 可横向滑动 */}
      <div className="col-span-2 row-span-1 rounded-2xl bg-white/5 border border-white/10 p-4 overflow-hidden relative">
        {/* 装饰性标题 */}
        <span className="absolute top-3 left-4 text-[10px] font-medium tracking-[0.2em] uppercase text-purple-400/60">
          SYMBOLISM
        </span>
        
        {symbols.length > 1 && (
          <div className="absolute top-3 right-4 flex gap-1">
            {symbols.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSymbolIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === symbolIndex ? 'bg-purple-400 w-3' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        )}

        {/* 象征卡片滑动区 */}
        <div className="h-full pt-6 overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out h-full"
            style={{ transform: `translateX(-${symbolIndex * 100}%)` }}
          >
            {symbols.map((element, index) => (
              <div
                key={index}
                className="min-w-full h-full flex flex-col justify-center px-2"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{typeIcons[element.type] || '✦'}</span>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{element.name}</h4>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                      {element.type}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
                  {element.meaning}
                </p>
              </div>
            ))}
          </div>

          {/* 左右切换按钮 */}
          {symbols.length > 1 && (
            <>
              <button
                onClick={() => setSymbolIndex((prev) => Math.max(0, prev - 1))}
                className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 backdrop-blur transition-opacity ${
                  symbolIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setSymbolIndex((prev) => Math.min(symbols.length - 1, prev + 1))}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 backdrop-blur transition-opacity ${
                  symbolIndex === symbols.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 右上块 (1x1): 情绪雷达 */}
      <div className="col-span-1 row-span-1 rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col items-center justify-center relative">
        {/* 装饰性标题 */}
        <span className="absolute top-3 left-4 text-[10px] font-medium tracking-[0.2em] uppercase text-cyan-400/60">
          EMOTION
        </span>
        
        {/* 圆形情绪仪表 */}
        <div className="relative w-20 h-20 mt-2">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="url(#emotionGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${emotionIntensity * 25.13} 251.3`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="emotionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00D4FF" />
                <stop offset="100%" stopColor="#BF00FF" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{emotionIntensity}</span>
          </div>
        </div>

        <p className="text-xs text-white/80 mt-2 font-medium">
          {analysis.emotionAnalysis?.primaryEmotion || '未知'}
        </p>
      </div>

      {/* 下方长条块 (3x1): 心理洞察 */}
      <div
        className="col-span-3 row-span-1 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-purple-500/20 p-5 flex flex-col justify-center cursor-pointer hover:border-purple-500/40 transition-all group relative"
        onClick={() =>
          onShowDetail(
            analysis.emotionAnalysis?.psychologicalInsight || '',
            '心理洞察'
          )
        }
      >
        {/* 装饰性标题 */}
        <span className="absolute top-4 left-5 text-[10px] font-medium tracking-[0.2em] uppercase text-purple-400/60">
          PSYCHOLOGY
        </span>
        <span className="absolute top-4 right-5 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
          点击展开 →
        </span>
        
        {/* 核心结论 - 高亮显示 */}
        <p className="text-lg font-semibold text-white leading-relaxed line-clamp-2 mt-4">
          {analysis.emotionAnalysis?.psychologicalInsight || '暂无心理洞察'}
        </p>

        {/* 压力源标签 */}
        {analysis.emotionAnalysis?.potentialStress && analysis.emotionAnalysis.potentialStress.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {analysis.emotionAnalysis.potentialStress.slice(0, 3).map((stress, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30"
              >
                {stress}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================
// 视图 C：回响 (Echo) - 艺术再创作
// 明信片式诗歌 + 故事摘要，翻阅感
// ============================================
function EchoView({
  analysis,
}: {
  analysis: DreamEntry['analysis'];
}) {
  const [flipped, setFlipped] = useState(false);

  if (!analysis) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p>暂无创意内容</p>
      </div>
    );
  }

  const hasPoem = !!analysis.generatedPoem;
  const hasStory = !!analysis.generatedStory;

  if (!hasPoem && !hasStory) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <span className="text-5xl mb-4 block">✨</span>
          <p>暂无创意内容</p>
          <p className="text-sm mt-2">请先生成诗歌或故事</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* 翻页提示 */}
      {hasPoem && hasStory && (
        <div className="flex justify-center">
          <button
            onClick={() => setFlipped(!flipped)}
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <span>{flipped ? '🎭 查看诗歌' : '📖 查看故事'}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${flipped ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* 翻页容器 */}
      <div className="flex-1 relative perspective-1000">
        <div
          className={`
            absolute inset-0 transition-all duration-700 transform-style-3d
            ${flipped ? 'rotate-x-180' : ''}
          `}
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
          }}
        >
          {/* 正面：诗歌 */}
          <div
            className="absolute inset-0 backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {hasPoem ? (
              <PoemCard poem={analysis.generatedPoem || ''} />
            ) : (
              <StoryCard story={analysis.generatedStory || ''} />
            )}
          </div>

          {/* 背面：故事 */}
          <div
            className="absolute inset-0 backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateX(180deg)',
            }}
          >
            {hasStory ? (
              <StoryCard story={analysis.generatedStory || ''} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>暂无故事内容</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 诗歌卡片 - 可滚动
function PoemCard({ poem }: { poem: string }) {
  return (
    <div
      className="h-full rounded-2xl overflow-hidden relative"
      style={{
        background: `
          linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")
        `,
      }}
    >
      {/* 装饰性标题 */}
      <span className="absolute top-4 left-6 text-[10px] font-medium tracking-[0.2em] uppercase text-purple-400/60 z-10">
        POEM
      </span>

      {/* 诗歌内容区 - 可滚动 */}
      <div className="h-full overflow-y-auto custom-scrollbar p-8 pt-12">
        <div className="flex justify-center">
          <p
            className="text-lg leading-[2.2] text-gray-100 whitespace-pre-wrap text-center max-w-md"
            style={{
              fontFamily: '"ZCOOL XiaoWei", "Ma Shan Zheng", serif',
            }}
          >
            {poem}
          </p>
        </div>
      </div>

      {/* 明信片边框装饰 */}
      <div className="absolute inset-4 border border-white/10 rounded-xl pointer-events-none" />
    </div>
  );
}

// 故事卡片 - 可滚动
function StoryCard({ story }: { story: string }) {
  return (
    <div className="h-full rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-orange-500/20 overflow-hidden relative">
      {/* 装饰性标题 */}
      <span className="absolute top-4 left-6 text-[10px] font-medium tracking-[0.2em] uppercase text-orange-400/60 z-10">
        STORY
      </span>

      {/* 故事内容区 - 可滚动 */}
      <div className="h-full overflow-y-auto custom-scrollbar p-6 pt-12">
        <p
          className="text-base leading-[1.9] text-gray-200 whitespace-pre-wrap"
          style={{
            fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", Georgia, serif',
          }}
        >
          {story}
        </p>
      </div>
    </div>
  );
}

// ============================================
// 悬浮能量球组件 - 单个发光玻璃球
// ============================================
function FloatingOrb({
  icon,
  label,
  onClick,
  isLoading,
  glowColor,
  delay,
  isVisible,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  isLoading?: boolean;
  glowColor: string;
  delay: number;
  isVisible: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative group">
      {/* Tooltip - 左侧浮现 */}
      <div
        className={`
          absolute right-full mr-3 top-1/2 -translate-y-1/2
          px-3 py-1.5 rounded-lg
          bg-black/80 backdrop-blur-xl border border-white/10
          text-xs text-white whitespace-nowrap
          transition-all duration-300
          ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}
        `}
      >
        {label}
        {/* 小三角 */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
          <div className="border-8 border-transparent border-l-black/80" />
        </div>
      </div>

      {/* 发光玻璃球 */}
      <button
        onClick={onClick}
        disabled={isLoading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative w-12 h-12 rounded-full
          backdrop-blur-xl
          transition-all duration-500 ease-out
          hover:scale-110 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
        `}
        style={{
          transitionDelay: isVisible ? `${delay}ms` : '0ms',
          background: `
            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 40%),
            linear-gradient(135deg, ${glowColor}40 0%, ${glowColor}20 50%, ${glowColor}10 100%)
          `,
          boxShadow: isHovered
            ? `0 0 30px ${glowColor}80, 0 0 60px ${glowColor}40, inset 0 0 20px ${glowColor}30`
            : `0 0 20px ${glowColor}50, 0 0 40px ${glowColor}20, inset 0 0 15px ${glowColor}20`,
          border: `1px solid ${glowColor}50`,
        }}
      >
        {/* 内部光晕效果 */}
        <div
          className="absolute inset-1 rounded-full opacity-60"
          style={{
            background: `radial-gradient(circle at 40% 40%, ${glowColor}30 0%, transparent 60%)`,
          }}
        />

        {/* 图标或加载动画 */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isLoading ? (
            <div
              className="w-5 h-5 rounded-full border-2 border-t-white animate-spin"
              style={{ borderColor: `${glowColor}40`, borderTopColor: 'white' }}
            />
          ) : (
            <span
              className="text-lg drop-shadow-lg transition-transform duration-300"
              style={{
                filter: `drop-shadow(0 0 8px ${glowColor})`,
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {icon}
            </span>
          )}
        </div>

        {/* 悬浮时的外圈光环 */}
        <div
          className={`
            absolute -inset-1 rounded-full
            transition-all duration-300
            ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
          `}
          style={{
            background: `radial-gradient(circle, transparent 40%, ${glowColor}20 70%, transparent 100%)`,
          }}
        />
      </button>
    </div>
  );
}

// ============================================
// FAB 工具箱组件 - 悬浮能量球版本
// ============================================
function AIToolbox({
  loading,
  hasAnalysis,
  hasPoem,
  hasStory,
  onAnalyze,
  onGenerateImage,
  onGeneratePoem,
  onGenerateStory,
}: {
  loading: LoadingState;
  hasAnalysis: boolean;
  hasPoem: boolean;
  hasStory: boolean;
  onAnalyze: () => void;
  onGenerateImage: () => void;
  onGeneratePoem: () => void;
  onGenerateStory: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const tools = [
    {
      icon: '🔮',
      label: hasAnalysis ? '重新解析' : 'AI 解析',
      onClick: onAnalyze,
      isLoading: loading.analyze,
      glowColor: '#a855f7', // 紫色
      show: true,
    },
    {
      icon: '🎨',
      label: '重绘图像',
      onClick: onGenerateImage,
      isLoading: loading.generateImage,
      glowColor: '#00d4ff', // 青色
      show: true,
    },
    {
      icon: '🎭',
      label: hasPoem ? '重写诗歌' : '生成诗歌',
      onClick: onGeneratePoem,
      isLoading: loading.generatePoem,
      glowColor: '#ec4899', // 粉色
      show: hasAnalysis,
    },
    {
      icon: '📖',
      label: hasStory ? '重写故事' : '生成故事',
      onClick: onGenerateStory,
      isLoading: loading.generateStory,
      glowColor: '#f59e0b', // 琥珀色
      show: hasAnalysis,
    },
  ].filter((t) => t.show);

  return (
    <div
      className="absolute top-6 right-6 z-40"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* 透明的悬停区域，连接主按钮和能量球 */}
      <div
        className={`
          absolute top-0 right-0 w-16
          transition-all duration-300
          ${isOpen ? 'h-72' : 'h-11'}
        `}
        style={{ pointerEvents: 'auto' }}
      />

      {/* 主按钮 - 星星触发器 */}
      <button
        className={`
          relative w-11 h-11 rounded-full
          backdrop-blur-xl
          transition-all duration-500 ease-out
          ${isOpen 
            ? 'scale-110' 
            : 'hover:scale-105'
          }
        `}
        style={{
          background: isOpen
            ? `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%),
               linear-gradient(135deg, rgba(139,92,246,0.4) 0%, rgba(236,72,153,0.3) 100%)`
            : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 50%),
               linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)`,
          boxShadow: isOpen
            ? '0 0 30px rgba(139,92,246,0.6), 0 0 60px rgba(236,72,153,0.3), inset 0 0 20px rgba(255,255,255,0.2)'
            : '0 0 15px rgba(255,255,255,0.2), inset 0 0 10px rgba(255,255,255,0.1)',
          border: isOpen
            ? '1px solid rgba(139,92,246,0.5)'
            : '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <svg
          className={`w-5 h-5 text-white mx-auto transition-all duration-500 ${isOpen ? 'rotate-180 scale-110' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{
            filter: isOpen ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' : 'none',
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
      </button>

      {/* 悬浮能量球 - 竖向排列 */}
      <div
        className={`
          absolute top-14 right-0
          flex flex-col gap-3
          transition-all duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        {tools.map((tool, index) => (
          <FloatingOrb
            key={index}
            icon={tool.icon}
            label={tool.label}
            onClick={tool.onClick}
            isLoading={tool.isLoading}
            glowColor={tool.glowColor}
            delay={index * 60}
            isVisible={isOpen}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// 详情弹窗组件
// ============================================
function DetailModal({
  isOpen,
  onClose,
  title,
  content,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* 弹窗内容 */}
      <div
        className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl bg-[#1a1a2e]/95 border border-white/20 shadow-2xl overflow-hidden animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <p
            className="text-lg leading-relaxed text-gray-200 whitespace-pre-wrap"
            style={{
              fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", Georgia, serif',
              lineHeight: '1.8',
            }}
          >
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}


// ============================================
// 主组件
// ============================================
export function DreamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dream, setDream] = useState<DreamEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentTab>('original');
  const [isShared, setIsShared] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 详情弹窗状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });

  const [loading, setLoading] = useState<LoadingState>({
    analyze: false,
    generateImage: false,
    generateStory: false,
    generatePoem: false,
  });

  // 打开详情弹窗
  const handleShowDetail = useCallback((content: string, title: string) => {
    setModalContent({ title, content });
    setModalOpen(true);
  }, []);

  // 切换标签页（带动画）
  const handleTabChange = useCallback((tab: ContentTab) => {
    if (tab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
    }, 150);
  }, [activeTab]);

  // 加载梦境详情
  const loadDream = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/dreams/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('梦境记录不存在');
        throw new Error('加载失败');
      }
      const data = await response.json();
      setDream(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDream();
  }, [loadDream]);

  // 检查是否已分享
  useEffect(() => {
    if (id) {
      fetch(`${API_BASE_URL}/api/collective/check/${id}`)
        .then((res) => res.json())
        .then((data) => setIsShared(data.isShared))
        .catch(() => {});
    }
  }, [id]);

  // 分享/取消分享
  const handleToggleShare = useCallback(async () => {
    if (!dream) return;
    try {
      if (isShared) {
        const response = await fetch(`${API_BASE_URL}/api/collective/unshare/${dream.id}`, { method: 'DELETE' });
        if (response.ok) setIsShared(false);
      } else {
        const response = await fetch(`${API_BASE_URL}/api/collective/share/${dream.id}`, { method: 'POST' });
        if (response.ok) setIsShared(true);
      }
    } catch (err) {
      console.error('分享操作失败:', err);
    }
  }, [dream, isShared]);

  // 导出 PDF
  const handleExportPdf = useCallback(async () => {
    if (!dream) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/exports/dream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dream),
      });
      if (!response.ok) throw new Error('导出失败');

      const data = await response.json();
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}${data.pdfUrl}`;
      link.download = `梦境_${new Date(dream.dreamDate).toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('导出PDF失败:', err);
    }
  }, [dream]);

  // AI 解析
  const handleAnalyze = useCallback(async () => {
    if (!dream) return;
    setLoading((prev) => ({ ...prev, analyze: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/dreams/${dream.id}/analyze`, { method: 'POST' });
      if (!response.ok) throw new Error('解析失败');

      const dreamResponse = await fetch(`${API_BASE_URL}/api/dreams/${dream.id}`);
      if (dreamResponse.ok) {
        const updatedDream = await dreamResponse.json();
        setDream(updatedDream);
        handleTabChange('insight');
      }
    } catch (err) {
      console.error('解析失败:', err);
    } finally {
      setLoading((prev) => ({ ...prev, analyze: false }));
    }
  }, [dream, handleTabChange]);

  // 生成图片
  const handleGenerateImage = useCallback(async () => {
    if (!dream) return;
    setLoading((prev) => ({ ...prev, generateImage: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/dreams/${dream.id}/generate-image`, { method: 'POST' });
      if (!response.ok) throw new Error('图片生成失败');

      const dreamResponse = await fetch(`${API_BASE_URL}/api/dreams/${dream.id}`);
      if (dreamResponse.ok) {
        const updatedDream = await dreamResponse.json();
        setDream(updatedDream);
      }
    } catch (err) {
      console.error('图片生成失败:', err);
    } finally {
      setLoading((prev) => ({ ...prev, generateImage: false }));
    }
  }, [dream]);

  // 生成创意内容
  const handleGenerateCreative = useCallback(async (format: 'story' | 'poem') => {
    if (!dream) return;
    const loadingKey = format === 'story' ? 'generateStory' : 'generatePoem';
    setLoading((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/dreams/${dream.id}/generate-creative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
      if (!response.ok) throw new Error('生成失败');

      const dreamResponse = await fetch(`${API_BASE_URL}/api/dreams/${dream.id}`);
      if (dreamResponse.ok) {
        const updatedDream = await dreamResponse.json();
        setDream(updatedDream);
        handleTabChange('echo');
      }
    } catch (err) {
      console.error('生成创意内容失败:', err);
    } finally {
      setLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  }, [dream, handleTabChange]);

  // 格式化日期
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !dream) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || '梦境不存在'}</p>
          <button onClick={() => navigate('/')} className="glass-btn px-4 py-2">返回首页</button>
        </div>
      </div>
    );
  }

  const hasAnalysis = !!dream.analysis;


  return (
    <div className="h-screen w-screen overflow-hidden flex">
      {/* 详情弹窗 */}
      <DetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalContent.title}
        content={modalContent.content}
      />

      {/* ============================================
          左侧：视觉与元数据区
          ============================================ */}
      <div className="w-[40%] h-full relative flex-shrink-0">
        {/* 沉浸式背景图 */}
        <div className="absolute inset-0">
          {dream.imageUrl ? (
            <>
              <img src={dream.imageUrl} alt="梦境可视化" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0a1a]/80" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-cyan-900/30 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl mb-4 block opacity-50">🌙</span>
                <p className="text-gray-500 text-sm">暂无梦境图像</p>
                <button
                  onClick={handleGenerateImage}
                  disabled={loading.generateImage}
                  className="mt-4 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-gray-300 hover:bg-white/20 transition-all"
                >
                  {loading.generateImage ? '生成中...' : '🎨 生成图像'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 返回按钮 */}
        <Link
          to="/"
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 backdrop-blur-xl border border-white/10 text-gray-300 hover:text-white hover:bg-black/50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">返回首页</span>
        </Link>

        {/* 悬浮元数据 */}
        <div className="absolute bottom-24 left-6 z-20 space-y-4">
          <div className="text-4xl font-bold text-white tracking-wider drop-shadow-lg">
            {formatDate(dream.dreamDate)}
          </div>
          <div className="flex items-center gap-6">
            <EmotionPlanet emotion={dream.emotionTag} />
            <ClarityBar clarity={dream.clarity} />
          </div>
        </div>

        {/* 操作栏 */}
        <div className="absolute bottom-6 left-6 right-6 z-20">
          <div className="flex items-center gap-3">
            <ActionIconButton
              icon="🌌"
              label={isShared ? '已分享（点击取消）' : '分享到潜意识池'}
              onClick={handleToggleShare}
              isActive={isShared}
            />
            <ActionIconButton icon="📄" label="导出 PDF" onClick={handleExportPdf} />
            {dream.imageUrl && (
              <ActionIconButton
                icon="🎨"
                label="重新生成图像"
                onClick={handleGenerateImage}
                isLoading={loading.generateImage}
              />
            )}
            {!hasAnalysis && (
              <ActionIconButton
                icon="🔮"
                label="AI 解析"
                onClick={handleAnalyze}
                isLoading={loading.analyze}
              />
            )}
          </div>
        </div>
      </div>

      {/* ============================================
          右侧：内容交互区
          ============================================ */}
      <div className="flex-1 h-full flex flex-col p-8 overflow-hidden relative">
        {/* AI 工具箱 - 右上角 */}
        <AIToolbox
          loading={loading}
          hasAnalysis={hasAnalysis}
          hasPoem={!!dream.analysis?.generatedPoem}
          hasStory={!!dream.analysis?.generatedStory}
          onAnalyze={handleAnalyze}
          onGenerateImage={handleGenerateImage}
          onGeneratePoem={() => handleGenerateCreative('poem')}
          onGenerateStory={() => handleGenerateCreative('story')}
        />

        {/* 胶囊切换器 */}
        <SegmentedControl activeTab={activeTab} onTabChange={handleTabChange} hasAnalysis={hasAnalysis} />

        {/* 内容区域 - 带淡入淡出动画 */}
        <div className="flex-1 overflow-hidden">
          <div
            className={`h-full glass-card p-6 overflow-hidden transition-opacity duration-150 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {activeTab === 'original' && <OriginalView content={dream.content} />}
            {activeTab === 'insight' && (
              <InsightView analysis={dream.analysis} onShowDetail={handleShowDetail} />
            )}
            {activeTab === 'echo' && (
              <EchoView analysis={dream.analysis} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
