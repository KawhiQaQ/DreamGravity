/**
 * 梦境宇宙 - 星际长廊
 * Cover Flow 卡片流展示所有 IP 角色
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import type { WeeklyReportWithIP, WeeksListResponse } from '../../../shared/types';

// 扩展角色类型，包含周信息
interface UniverseCharacter {
  id: string;
  reportId: string; // 周报ID，用于重新生成图片
  name: string;
  title?: string | null;
  catchphrase?: string | null;
  personality?: string | null;
  abilities?: string | null;
  appearance?: string | null;
  backstory?: string | null;
  modelUrl?: string | null;
  weekStart: string;
  weekEnd: string;
  needsImageRegeneration?: boolean; // 是否需要重新生成图片
}

// Cover Flow 卡片组件
function CoverFlowCard({ 
  character, 
  index, 
  currentIndex,
  onClick,
  onRegenerateImage,
  isRegenerating
}: { 
  character: UniverseCharacter;
  index: number;
  currentIndex: number;
  onClick: () => void;
  onRegenerateImage: (reportId: string) => void;
  isRegenerating: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const offset = index - currentIndex;
  const isActive = offset === 0;
  const isVisible = Math.abs(offset) <= 3;
  
  if (!isVisible) return null;

  // 计算 3D 变换
  const translateX = offset * 280; // 卡片间距
  const translateZ = isActive ? 100 : -Math.abs(offset) * 80; // Z轴深度
  const rotateY = offset * -25; // Y轴旋转角度
  const scale = isActive ? 1.1 : Math.max(0.6, 1 - Math.abs(offset) * 0.15);
  const opacity = isActive ? 1 : Math.max(0.3, 1 - Math.abs(offset) * 0.25);
  
  // 是否显示默认图标（没有图片或图片加载失败）
  const showDefaultIcon = !character.modelUrl || imageError;
  const blur = isActive ? 0 : Math.min(5, Math.abs(offset) * 2);

  return (
    <div
      className="absolute left-1/2 cursor-pointer transition-all duration-500 ease-out"
      style={{
        top: '38%',
        transform: `
          translateX(calc(-50% + ${translateX}px)) 
          translateY(-50%) 
          translateZ(${translateZ}px) 
          rotateY(${rotateY}deg) 
          scale(${scale})
        `,
        opacity,
        filter: `blur(${blur}px)`,
        zIndex: 100 - Math.abs(offset),
      }}
      onClick={onClick}
    >
      {/* 卡片主体 */}
      <div 
        className={`
          relative w-64 h-80 rounded-2xl overflow-hidden
          ${isActive ? 'shadow-2xl' : 'shadow-lg'}
          transition-shadow duration-500
        `}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.9), rgba(20, 20, 40, 0.95))',
          border: isActive ? '2px solid rgba(191, 0, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isActive 
            ? '0 25px 50px -12px rgba(191, 0, 255, 0.4), 0 0 60px rgba(191, 0, 255, 0.2)' 
            : '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* 角色图片区域 */}
        <div className="h-48 flex items-center justify-center p-4 relative overflow-hidden">
          {/* 背景光晕 */}
          <div 
            className="absolute inset-0 opacity-50"
            style={{
              background: 'radial-gradient(circle at center, rgba(191, 0, 255, 0.3), transparent 70%)',
            }}
          />
          
          {showDefaultIcon ? (
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className="text-6xl">🌟</span>
              {isActive && character.needsImageRegeneration && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegenerateImage(character.reportId);
                  }}
                  disabled={isRegenerating}
                  className="px-3 py-1.5 text-xs rounded-lg bg-dream-neon-purple/30 hover:bg-dream-neon-purple/50 text-white transition-all disabled:opacity-50"
                >
                  {isRegenerating ? '生成中...' : '✨ 生成图片'}
                </button>
              )}
            </div>
          ) : (
            <img 
              src={character.modelUrl!} 
              alt={character.name}
              className="relative z-10 max-w-full max-h-full object-contain drop-shadow-lg"
              style={{ 
                imageRendering: 'pixelated',
                filter: isActive ? 'drop-shadow(0 0 20px rgba(191, 0, 255, 0.5))' : 'none'
              }}
              onError={() => setImageError(true)}
            />
          )}
        </div>
        
        {/* 角色信息 */}
        <div className="p-4 text-center">
          <h3 
            className="text-lg font-bold mb-1 bg-clip-text text-transparent"
            style={{
              backgroundImage: isActive 
                ? 'linear-gradient(135deg, #bf00ff, #00d4ff)' 
                : 'linear-gradient(135deg, #a78bfa, #818cf8)',
            }}
          >
            {character.name}
          </h3>
          {character.title && (
            <p className="text-sm text-dream-neon-purple/70 mb-2">「{character.title}」</p>
          )}
          <p className="text-xs text-dream-text-secondary">
            {formatWeekRange(character.weekStart, character.weekEnd)}
          </p>
        </div>

        {/* 选中态光效 */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div 
              className="absolute inset-0 animate-pulse"
              style={{
                background: 'linear-gradient(135deg, rgba(191, 0, 255, 0.1), transparent, rgba(0, 212, 255, 0.1))',
              }}
            />
          </div>
        )}
      </div>

      {/* 镜面反射 */}
      <div 
        className="absolute top-full left-0 w-full h-40 overflow-hidden pointer-events-none"
        style={{
          transform: 'scaleY(-1)',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 60%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 60%)',
        }}
      >
        <div 
          className="w-64 h-80 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.5), rgba(20, 20, 40, 0.5))',
            opacity: 0.4,
            filter: 'blur(2px)',
          }}
        >
          <div className="h-48 flex items-center justify-center p-4">
            {character.modelUrl ? (
              <img 
                src={character.modelUrl} 
                alt=""
                className="max-w-full max-h-full object-contain opacity-50"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <span className="text-6xl opacity-50">🌟</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 格式化周范围
function formatWeekRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
}


// 星系连线 SVG 组件
function ConstellationLines({ 
  characters, 
  currentIndex 
}: { 
  characters: UniverseCharacter[];
  currentIndex: number;
}) {
  if (characters.length < 2) return null;

  // 生成连线点位置（简化版，实际可以根据卡片位置计算）
  const points = characters.map((_, i) => {
    const offset = i - currentIndex;
    const x = 50 + offset * 15; // 百分比位置
    const y = 50 + Math.sin(i * 0.8) * 10; // 添加一些波动
    return { x, y, visible: Math.abs(offset) <= 4 };
  });

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.3 }}
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(191, 0, 255, 0.5)" />
          <stop offset="50%" stopColor="rgba(0, 212, 255, 0.5)" />
          <stop offset="100%" stopColor="rgba(191, 0, 255, 0.5)" />
        </linearGradient>
      </defs>
      
      {/* 连线 */}
      {points.map((point, i) => {
        if (i === 0 || !point.visible || !points[i - 1].visible) return null;
        const prev = points[i - 1];
        return (
          <line
            key={i}
            x1={`${prev.x}%`}
            y1={`${prev.y}%`}
            x2={`${point.x}%`}
            y2={`${point.y}%`}
            stroke="url(#lineGradient)"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
        );
      })}
      
      {/* 节点星星 */}
      {points.map((point, i) => {
        if (!point.visible) return null;
        const isActive = i === currentIndex;
        return (
          <circle
            key={`star-${i}`}
            cx={`${point.x}%`}
            cy={`${point.y}%`}
            r={isActive ? 4 : 2}
            fill={isActive ? '#bf00ff' : 'rgba(167, 139, 250, 0.6)'}
            className={isActive ? 'animate-pulse' : ''}
          />
        );
      })}
    </svg>
  );
}

// 角色详情面板
function CharacterDetailPanel({ 
  character,
  onViewDetail,
  currentIndex,
  totalCount,
  onPrev,
  onNext
}: { 
  character: UniverseCharacter | null;
  onViewDetail: () => void;
  currentIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!character) return null;

  return (
    <div 
      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20"
    >
      <div 
        className="glass-card p-5 backdrop-blur-xl"
        style={{
          background: 'rgba(20, 20, 40, 0.9)',
          border: '1px solid rgba(191, 0, 255, 0.3)',
        }}
      >
        {/* 角色口头禅 */}
        {character.catchphrase && (
          <blockquote className="text-center text-base text-dream-text/90 italic mb-3">
            "{character.catchphrase}"
          </blockquote>
        )}
        
        {/* 角色属性网格 */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {character.personality && (
            <div>
              <h4 className="text-xs font-semibold text-dream-neon-purple uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-dream-neon-purple" />
                性格
              </h4>
              <p className="text-sm text-dream-text/80 line-clamp-2">{character.personality}</p>
            </div>
          )}
          {character.abilities && (
            <div>
              <h4 className="text-xs font-semibold text-dream-neon-cyan uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-dream-neon-cyan" />
                能力
              </h4>
              <p className="text-sm text-dream-text/80 line-clamp-2">{character.abilities}</p>
            </div>
          )}
        </div>
        
        {/* 查看详情按钮 + 导航指示器 */}
        <div className="flex items-center gap-3">
          {/* 左箭头 */}
          <button
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-full glass-btn-ghost disabled:opacity-30 transition-opacity flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-dream-neon-purple/50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* 查看详情按钮 */}
          <button
            onClick={onViewDetail}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all
              bg-gradient-to-r from-dream-neon-purple/20 to-dream-neon-cyan/20
              hover:from-dream-neon-purple/30 hover:to-dream-neon-cyan/30
              border border-dream-neon-purple/30 hover:border-dream-neon-purple/50
              text-white focus:outline-none"
          >
            查看完整档案 →
          </button>
          
          {/* 右箭头 */}
          <button
            onClick={onNext}
            disabled={currentIndex === totalCount - 1}
            className="p-2 rounded-full glass-btn-ghost disabled:opacity-30 transition-opacity flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-dream-neon-purple/50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* 指示点 */}
        {totalCount > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: totalCount }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex 
                    ? 'bg-dream-neon-purple w-5' 
                    : 'bg-white/30 w-1.5'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 角色完整档案弹窗
function CharacterModal({ 
  character, 
  onClose 
}: { 
  character: UniverseCharacter;
  onClose: () => void;
}) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* 弹窗内容 */}
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.95), rgba(20, 20, 40, 0.98))',
          border: '1px solid rgba(191, 0, 255, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(191, 0, 255, 0.3), 0 0 80px rgba(191, 0, 255, 0.15)',
        }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full glass-btn-ghost z-10 hover:bg-white/10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* 滚动内容 */}
        <div className="overflow-y-auto max-h-[85vh] custom-scrollbar">
          {/* 头部：图片 + 名称 */}
          <div className="relative p-8 pb-4 text-center">
            {/* 背景光晕 */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: 'radial-gradient(circle at center top, rgba(191, 0, 255, 0.4), transparent 60%)',
              }}
            />
            
            {/* 角色图片 */}
            <div className="relative z-10 w-40 h-40 mx-auto mb-4 flex items-center justify-center">
              {character.modelUrl ? (
                <img 
                  src={character.modelUrl} 
                  alt={character.name}
                  className="max-w-full max-h-full object-contain drop-shadow-lg"
                  style={{ 
                    imageRendering: 'pixelated',
                    filter: 'drop-shadow(0 0 30px rgba(191, 0, 255, 0.4))'
                  }}
                />
              ) : (
                <span className="text-7xl">🌟</span>
              )}
            </div>
            
            {/* 名称和称号 */}
            <h2 
              className="text-2xl font-bold mb-1 bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #bf00ff, #00d4ff)',
              }}
            >
              {character.name}
            </h2>
            {character.title && (
              <p className="text-dream-neon-purple/80">「{character.title}」</p>
            )}
            <p className="text-xs text-dream-text-secondary mt-2">
              {formatWeekRange(character.weekStart, character.weekEnd)}
            </p>
          </div>
          
          {/* 口头禅 */}
          {character.catchphrase && (
            <div className="px-8 pb-4">
              <blockquote className="text-center text-lg text-dream-text/90 italic py-4 border-y border-white/10">
                "{character.catchphrase}"
              </blockquote>
            </div>
          )}
          
          {/* 详细信息 */}
          <div className="px-8 pb-8 space-y-5">
            {character.personality && (
              <div>
                <h4 className="text-sm font-semibold text-dream-neon-purple uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-dream-neon-purple" />
                  性格特质
                </h4>
                <p className="text-dream-text/85 leading-relaxed pl-4">{character.personality}</p>
              </div>
            )}
            
            {character.abilities && (
              <div>
                <h4 className="text-sm font-semibold text-dream-neon-cyan uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-dream-neon-cyan" />
                  特殊能力
                </h4>
                <p className="text-dream-text/85 leading-relaxed pl-4">{character.abilities}</p>
              </div>
            )}
            
            {character.appearance && (
              <div>
                <h4 className="text-sm font-semibold text-dream-neon-pink uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-dream-neon-pink" />
                  外观描述
                </h4>
                <p className="text-dream-text/85 leading-relaxed pl-4">{character.appearance}</p>
              </div>
            )}
            
            {character.backstory && (
              <div>
                <h4 className="text-sm font-semibold text-dream-neon-orange uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-dream-neon-orange" />
                  背景故事
                </h4>
                <p className="text-dream-text/85 leading-relaxed pl-4">{character.backstory}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// 主页面组件
export default function DreamUniversePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [characters, setCharacters] = useState<UniverseCharacter[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 重新生成图片
  const regenerateImage = async (reportId: string) => {
    setRegenerating(true);
    try {
      await apiFetch(`/api/weekly-reports/${reportId}/generate-model`, {
        method: 'POST',
        body: JSON.stringify({ forceRegenerate: true })
      });
      // 重新加载数据
      await loadData();
    } catch (err) {
      console.error('重新生成图片失败:', err);
      alert('重新生成图片失败，请稍后重试');
    } finally {
      setRegenerating(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await apiFetch<WeeksListResponse>('/api/weekly-reports/weeks');
      
      // 加载已生成周报的详情
      const generatedWeeks = result.weeks.filter(w => w.status === 'generated' && w.report);
      const reportsWithIP = await Promise.all(
        generatedWeeks.map(w => apiFetch<WeeklyReportWithIP>(`/api/weekly-reports/${w.report!.id}`))
      );
      
      // 检查图片URL是否需要重新生成（非本地路径的图片可能已过期）
      const needsRegeneration = (url: string | null | undefined): boolean => {
        if (!url) return true; // 没有图片需要生成
        if (url.startsWith('/api/images/')) return false; // 本地图片不需要重新生成
        return true; // 远程URL可能已过期
      };
      
      // 提取角色数据 - 优先使用 ipCharacter，否则使用周报基本信息
      const chars: UniverseCharacter[] = [];
      
      for (const r of reportsWithIP) {
        // 如果有完整的 IP 角色数据
        if (r.ipCharacter) {
          const modelUrl = r.ipCharacter.modelUrl || r.modelUrl;
          chars.push({
            id: r.ipCharacter.id,
            reportId: r.id,
            name: r.ipCharacter.name,
            title: r.ipCharacter.title,
            catchphrase: r.ipCharacter.catchphrase,
            personality: r.ipCharacter.personality,
            abilities: r.ipCharacter.abilities,
            appearance: r.ipCharacter.appearance,
            backstory: r.ipCharacter.backstory,
            modelUrl: modelUrl,
            weekStart: r.weekStart,
            weekEnd: r.weekEnd,
            needsImageRegeneration: needsRegeneration(modelUrl),
          });
        } else if (r.totemName) {
          // 如果只有周报但还没有 IP 角色，使用周报中的基本信息
          chars.push({
            id: r.id,
            reportId: r.id,
            name: r.totemName,
            title: null,
            catchphrase: null,
            personality: null,
            abilities: null,
            appearance: r.totemDescription,
            backstory: null,
            modelUrl: r.modelUrl,
            weekStart: r.weekStart,
            weekEnd: r.weekEnd,
            needsImageRegeneration: needsRegeneration(r.modelUrl),
          });
        }
      }
      
      setCharacters(chars);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 滚轮切换
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    setCurrentIndex(prev => Math.max(0, Math.min(characters.length - 1, prev + delta)));
  }, [characters.length]);

  // 键盘切换
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setCurrentIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowRight') {
      setCurrentIndex(prev => Math.min(characters.length - 1, prev + 1));
    }
  }, [characters.length]);

  // 触摸/鼠标拖拽
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setDragOffset(0);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // 根据拖拽距离决定切换方向
    if (Math.abs(dragOffset) > 50) {
      const direction = dragOffset > 0 ? -1 : 1;
      setCurrentIndex(prev => Math.max(0, Math.min(characters.length - 1, prev + direction)));
    }
    setDragOffset(0);
  };

  // 绑定事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleWheel, handleKeyDown]);

  // 打开详情弹窗
  const handleViewDetail = () => {
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-dream-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dream-neon-purple mx-auto mb-4" />
          <p className="text-dream-text-secondary">加载星际长廊...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-dream-background overflow-hidden">
      {/* 重新生成图片的遮罩 */}
      {regenerating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-dream-neon-purple mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-2">正在生成 IP 角色图片...</h3>
            <p className="text-dream-text-secondary">这可能需要 20-40 秒</p>
          </div>
        </div>
      )}
      
      {/* 深空背景 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 星云效果 */}
        <div 
          className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5), transparent)' }}
        />
        <div 
          className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.5), transparent)' }}
        />
        
        {/* 镜面地板效果 */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1/3"
          style={{
            background: 'linear-gradient(to top, rgba(10, 10, 26, 0.95), transparent)',
          }}
        />
        <div 
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(191, 0, 255, 0.3), rgba(0, 212, 255, 0.3), transparent)',
          }}
        />
      </div>

      {/* 头部导航 */}
      <header className="absolute top-0 left-0 right-0 z-30 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link 
            to="/weekly-report"
            className="flex items-center gap-2 text-dream-text-secondary hover:text-dream-neon-cyan transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回周报
          </Link>
          
          <h1 
            className="text-2xl font-bold bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #bf00ff, #00d4ff)',
            }}
          >
            🌌 星际长廊
          </h1>
          
          <div className="text-sm text-dream-text-secondary">
            {characters.length > 0 && `${currentIndex + 1} / ${characters.length}`}
          </div>
        </div>
      </header>

      {/* 星系连线 */}
      <ConstellationLines characters={characters} currentIndex={currentIndex} />

      {/* Cover Flow 容器 */}
      <div 
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ 
          perspective: '1200px',
          perspectiveOrigin: '50% 40%',
        }}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
      >
        {characters.length === 0 ? (
          <div className="text-center">
            <span className="text-8xl mb-6 block">✨</span>
            <h2 className="text-2xl font-bold text-white mb-2">星际长廊空空如也</h2>
            <p className="text-dream-text-secondary mb-6">生成周报并创建 IP 角色后，角色会出现在这里</p>
            <Link 
              to="/weekly-report"
              className="inline-block px-6 py-3 glass-btn rounded-xl"
            >
              前往生成周报
            </Link>
          </div>
        ) : (
          <div 
            className="relative w-full h-full"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {characters.map((char, index) => (
              <CoverFlowCard
                key={char.id}
                character={char}
                index={index}
                currentIndex={currentIndex}
                onClick={() => setCurrentIndex(index)}
                onRegenerateImage={regenerateImage}
                isRegenerating={regenerating}
              />
            ))}
          </div>
        )}
      </div>

      {/* 角色详情面板 */}
      {characters.length > 0 && (
        <CharacterDetailPanel 
          character={characters[currentIndex]} 
          onViewDetail={handleViewDetail}
          currentIndex={currentIndex}
          totalCount={characters.length}
          onPrev={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          onNext={() => setCurrentIndex(prev => Math.min(characters.length - 1, prev + 1))}
        />
      )}

      {/* 角色完整档案弹窗 */}
      {showModal && characters[currentIndex] && (
        <CharacterModal 
          character={characters[currentIndex]} 
          onClose={() => setShowModal(false)}
        />
      )}

      {/* 操作提示 */}
      <div className="absolute bottom-4 right-4 text-xs text-dream-text-secondary/50 z-10">
        滚轮 / 方向键 / 拖拽切换
      </div>
    </div>
  );
}
