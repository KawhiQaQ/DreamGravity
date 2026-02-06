/**
 * 潜意识回响 (Subconscious Echo) 组件
 * 一个充满惊喜感的"记忆盲盒"，随机展示梦境碎片
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import type { DreamFragment } from '../../../../shared/types/echo';

interface SubconsciousEchoProps {
  className?: string;
}

export function SubconsciousEcho({ className = '' }: SubconsciousEchoProps) {
  const navigate = useNavigate();
  const [fragment, setFragment] = useState<DreamFragment | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取随机梦境碎片
  const fetchFragment = useCallback(async (showRefreshAnim = false) => {
    try {
      if (showRefreshAnim) {
        // 先触发淡出动画
        setIsRefreshing(true);
        // 等待淡出完成后再请求新数据
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      const data = await apiFetch<DreamFragment>('/api/dreams/random-fragment');
      setFragment(data);
      if (showRefreshAnim) {
        // 数据更新后，短暂延迟再触发淡入
        await new Promise(resolve => setTimeout(resolve, 50));
        setIsRefreshing(false);
      }
    } catch (err) {
      console.error('Failed to fetch dream fragment:', err);
      if (showRefreshAnim) {
        setIsRefreshing(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFragment();
  }, [fetchFragment]);

  // 点击跳转到梦境详情
  const handleClick = useCallback(() => {
    if (fragment?.dreamId) {
      navigate(`/dreams/${fragment.dreamId}`);
    }
  }, [fragment, navigate]);

  // 刷新按钮点击
  const handleRefresh = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    fetchFragment(true);
  }, [fetchFragment]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-pointer transition-all duration-500 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        background: 'rgba(15, 10, 30, 0.6)',
        backdropFilter: isHovered ? 'blur(24px)' : 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        boxShadow: isHovered 
          ? '0 0 40px rgba(139, 92, 246, 0.2), inset 0 0 60px rgba(99, 102, 241, 0.05)'
          : '0 0 20px rgba(139, 92, 246, 0.1), inset 0 0 30px rgba(99, 102, 241, 0.03)',
      }}
    >
      {/* 液态背景动画 */}
      <LiquidBackground isHovered={isHovered} />
      
      {/* 内容区域 */}
      <div className="relative z-10 h-full flex flex-col p-3">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <GlowingIcon />
            <span className="text-[9px] font-medium tracking-[0.15em] text-purple-300/60 uppercase">
              潜意识回响
            </span>
          </div>
          
          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            className={`p-1 rounded-full transition-all duration-300 hover:bg-white/10 ${isRefreshing ? 'animate-spin' : ''}`}
            title="换一个碎片"
          >
            <svg 
              className="w-3 h-3 text-purple-400/50 hover:text-purple-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        </div>

        {/* 核心内容 */}
        <div className="flex-1 flex items-center justify-center">
          {isLoading ? (
            <LoadingState />
          ) : fragment?.displayMode === 'keywords' ? (
            <KeywordsDisplay 
              keywords={fragment.keywords || []} 
              isHovered={isHovered}
              isRefreshing={isRefreshing}
            />
          ) : (
            <SentenceDisplay 
              sentence={fragment?.sentence || ''} 
              isHovered={isHovered}
              isRefreshing={isRefreshing}
            />
          )}
        </div>

        {/* 底部提示 */}
        <div className={`text-center transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-[8px] text-purple-400/40">点击探索这个梦境</span>
        </div>
      </div>
    </div>
  );
}

// 发光图标组件
function GlowingIcon() {
  return (
    <div className="relative">
      <div 
        className="absolute inset-0 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, transparent 70%)',
          filter: 'blur(4px)',
        }}
      />
      <svg 
        className="relative w-3 h-3 text-purple-400" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477l-3.763 1.105 1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
      </svg>
    </div>
  );
}

// 液态背景组件
function LiquidBackground({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 主要液态烟雾 */}
      <div 
        className="absolute w-[200%] h-[200%] -left-[50%] -top-[50%]"
        style={{
          background: `
            radial-gradient(ellipse 40% 35% at 30% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 35% 40% at 70% 60%, rgba(99, 102, 241, 0.12) 0%, transparent 55%),
            radial-gradient(ellipse 30% 30% at 50% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)
          `,
          animation: isHovered ? 'liquid-flow-fast 4s ease-in-out infinite' : 'liquid-flow 8s ease-in-out infinite',
          opacity: isHovered ? 1 : 0.7,
          transition: 'opacity 0.5s ease',
        }}
      />
      
      {/* 星尘粒子 */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 2%),
            radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.25) 0%, transparent 2%),
            radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.2) 0%, transparent 1.5%),
            radial-gradient(circle at 60% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 1.5%),
            radial-gradient(circle at 90% 40%, rgba(255, 255, 255, 0.15) 0%, transparent 1%)
          `,
          animation: 'twinkle 3s ease-in-out infinite',
        }}
      />

      {/* 漩涡效果 */}
      <div 
        className="absolute w-full h-full"
        style={{
          background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(139, 92, 246, 0.05) 60deg, transparent 120deg, rgba(99, 102, 241, 0.05) 180deg, transparent 240deg, rgba(168, 85, 247, 0.05) 300deg, transparent 360deg)',
          animation: isHovered ? 'slow-rotate 15s linear infinite' : 'slow-rotate 30s linear infinite',
          opacity: isHovered ? 0.8 : 0.4,
          transition: 'opacity 0.5s ease',
        }}
      />
    </div>
  );
}

// 加载状态
function LoadingState() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-purple-400/50 animate-pulse" />
      <div className="w-2 h-2 rounded-full bg-purple-400/50 animate-pulse" style={{ animationDelay: '0.2s' }} />
      <div className="w-2 h-2 rounded-full bg-purple-400/50 animate-pulse" style={{ animationDelay: '0.4s' }} />
    </div>
  );
}

// 关键词展示模式
function KeywordsDisplay({ keywords, isHovered, isRefreshing }: { keywords: string[]; isHovered: boolean; isRefreshing: boolean }) {
  return (
    <div 
      className={`flex flex-wrap justify-center gap-2 transition-all duration-500 ${isRefreshing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      style={{
        filter: isHovered ? 'blur(0px)' : 'blur(2px)',
      }}
    >
      {keywords.map((keyword, index) => (
        <span
          key={index}
          className="px-2 py-1 rounded-lg text-[10px] font-light transition-all duration-300"
          style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            color: 'rgba(255, 255, 255, 0.85)',
            textShadow: isHovered ? '0 0 10px rgba(168, 85, 247, 0.8)' : '0 0 5px rgba(168, 85, 247, 0.4)',
            boxShadow: isHovered ? '0 0 15px rgba(139, 92, 246, 0.3)' : 'none',
            animationDelay: `${index * 0.1}s`,
          }}
        >
          {keyword}
        </span>
      ))}
    </div>
  );
}

// 短句展示模式
function SentenceDisplay({ sentence, isHovered, isRefreshing }: { sentence: string; isHovered: boolean; isRefreshing: boolean }) {
  return (
    <p
      className={`text-center text-[11px] font-light leading-relaxed px-2 transition-all duration-500 ${isRefreshing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      style={{
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: '"ZCOOL XiaoWei", serif',
        filter: isHovered ? 'blur(0px)' : 'blur(1.5px)',
        textShadow: isHovered 
          ? '0 0 15px rgba(168, 85, 247, 0.8), 0 0 30px rgba(139, 92, 246, 0.4)' 
          : '0 0 8px rgba(168, 85, 247, 0.4)',
        letterSpacing: '0.05em',
      }}
    >
      {sentence}
    </p>
  );
}

export default SubconsciousEcho;
