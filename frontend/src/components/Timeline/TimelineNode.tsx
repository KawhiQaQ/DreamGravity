import { useState } from 'react';
import { EmotionTag } from '../../../../shared/types/dream';
import type { TimelineNodeProps } from './types';
import { formatSleepTime } from '../../utils/formatSleepTime';

// 情绪对应的氛围光颜色
const emotionAmbientColors: Record<EmotionTag, string> = {
  happy: 'rgba(251, 191, 36, 0.4)',      // 温暖金黄
  excited: 'rgba(251, 146, 60, 0.4)',    // 活力橙
  peaceful: 'rgba(52, 211, 153, 0.35)',  // 宁静绿
  hopeful: 'rgba(250, 204, 21, 0.4)',    // 希望黄
  loving: 'rgba(244, 114, 182, 0.4)',    // 温柔粉
  sad: 'rgba(96, 165, 250, 0.4)',        // 忧郁蓝
  anxious: 'rgba(167, 139, 250, 0.4)',   // 焦虑紫
  angry: 'rgba(248, 113, 113, 0.4)',     // 愤怒红
  scared: 'rgba(192, 132, 252, 0.45)',   // 恐惧紫红
  lonely: 'rgba(129, 140, 248, 0.4)',    // 孤独靛蓝
  confused: 'rgba(196, 181, 253, 0.4)',  // 迷惑淡紫
  nostalgic: 'rgba(45, 212, 191, 0.35)', // 怀旧青
  curious: 'rgba(34, 211, 238, 0.4)',    // 好奇青蓝
  surprised: 'rgba(163, 230, 53, 0.35)', // 惊讶黄绿
  neutral: 'rgba(148, 163, 184, 0.3)',   // 中性灰
};

// 情绪对应的光晕 CSS 类
const emotionGlowClass: Record<EmotionTag, string> = {
  happy: 'shadow-[inset_-20px_0_40px_-20px_rgba(251,191,36,0.4)]',
  excited: 'shadow-[inset_-20px_0_40px_-20px_rgba(251,146,60,0.4)]',
  peaceful: 'shadow-[inset_-20px_0_40px_-20px_rgba(52,211,153,0.35)]',
  hopeful: 'shadow-[inset_-20px_0_40px_-20px_rgba(250,204,21,0.4)]',
  loving: 'shadow-[inset_-20px_0_40px_-20px_rgba(244,114,182,0.4)]',
  sad: 'shadow-[inset_-20px_0_40px_-20px_rgba(96,165,250,0.4)]',
  anxious: 'shadow-[inset_-20px_0_40px_-20px_rgba(167,139,250,0.4)]',
  angry: 'shadow-[inset_-20px_0_40px_-20px_rgba(248,113,113,0.4)]',
  scared: 'shadow-[inset_-20px_0_40px_-20px_rgba(192,132,252,0.45)]',
  lonely: 'shadow-[inset_-20px_0_40px_-20px_rgba(129,140,248,0.4)]',
  confused: 'shadow-[inset_-20px_0_40px_-20px_rgba(196,181,253,0.4)]',
  nostalgic: 'shadow-[inset_-20px_0_40px_-20px_rgba(45,212,191,0.35)]',
  curious: 'shadow-[inset_-20px_0_40px_-20px_rgba(34,211,238,0.4)]',
  surprised: 'shadow-[inset_-20px_0_40px_-20px_rgba(163,230,53,0.35)]',
  neutral: 'shadow-[inset_-20px_0_40px_-20px_rgba(148,163,184,0.3)]',
};

/**
 * 格式化日期显示
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
  });
}

function formatYear(date: Date): string {
  return new Date(date).getFullYear().toString();
}

/**
 * 获取梦境内容预览
 */
function getContentPreview(content: string, maxLength: number = 80): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

/**
 * 星河轨迹节点组件 - 漂浮的记忆碎片
 */
export function TimelineNode({
  dream,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDelete,
  isHovered,
  selectionMode = false,
  isSelected = false,
  onSelect,
  isLast = false,
}: TimelineNodeProps & { isLast?: boolean }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(e.target.checked);
  };

  const sleepTimeStr = formatSleepTime(dream.sleepStartTime, dream.sleepEndTime);
  const ambientColor = emotionAmbientColors[dream.emotionTag];

  return (
    <div
      className={`relative flex items-start gap-5 cursor-pointer group ${isLast ? '' : 'pb-8'}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 选择框 */}
      {selectionMode && (
        <div className="absolute -left-8 top-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded bg-white/5 border border-white/20 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
          />
        </div>
      )}

      {/* 发光星球节点 */}
      <div className="relative flex-shrink-0 z-10">
        <div
          className={`
            w-5 h-5 rounded-full transition-all duration-500
            ${isHovered 
              ? 'scale-150 bg-gradient-to-br from-purple-400 via-cyan-400 to-purple-500' 
              : 'bg-gradient-to-br from-purple-500/80 to-cyan-500/80 star-breathe'
            }
          `}
          style={{
            boxShadow: isHovered 
              ? `0 0 20px ${ambientColor}, 0 0 40px ${ambientColor}, 0 0 60px rgba(139, 92, 246, 0.3)`
              : `0 0 10px rgba(139, 92, 246, 0.4), 0 0 20px rgba(139, 92, 246, 0.2)`
          }}
        />
        {/* 星球光晕 */}
        <div 
          className={`absolute inset-0 rounded-full blur-md transition-opacity duration-500 ${isHovered ? 'opacity-80' : 'opacity-40'}`}
          style={{ background: `radial-gradient(circle, ${ambientColor} 0%, transparent 70%)` }}
        />
      </div>

      {/* 漂浮的毛玻璃梦境卡片 */}
      <div className={`flex-1 ${isLast ? '' : 'mb-2'}`}>
        <div
          className={`
            relative overflow-hidden rounded-2xl transition-all duration-500
            ${emotionGlowClass[dream.emotionTag]}
            ${isHovered 
              ? 'transform -translate-y-1 scale-[1.01]' 
              : ''
            }
          `}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid transparent',
            borderImage: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, transparent 100%) 1',
            boxShadow: isHovered 
              ? `0 20px 60px rgba(0,0,0,0.3), 0 0 40px ${ambientColor}`
              : '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          {/* 渐变边框效果 */}
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, transparent 100%)',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'xor',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />

          {/* 情绪氛围光 - 右侧边缘，降低层级 */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none transition-opacity duration-500 z-0"
            style={{
              background: `linear-gradient(to left, ${ambientColor} 0%, transparent 100%)`,
              opacity: isHovered ? 0.8 : 0.5,
            }}
          />

          <div className="relative p-5">
            {/* 删除按钮 - 提高层级和可见性 */}
            {!selectionMode && (
              <button
                onClick={handleDeleteClick}
                className={`
                  absolute top-3 right-3 p-2 rounded-xl z-20
                  bg-black/30 backdrop-blur-sm
                  text-gray-300 hover:text-red-400 hover:bg-red-500/20
                  transition-all duration-300 border border-white/10
                  ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}
                title="删除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* 删除确认弹窗 */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-2xl flex items-center justify-center z-20">
                <div className="text-center p-4">
                  <p className="text-gray-200 mb-4 text-sm">确定删除这颗记忆星尘？</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleCancelDelete}
                      className="px-4 py-2 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="px-4 py-2 text-sm bg-red-500/60 hover:bg-red-500/80 text-white rounded-xl transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 日期 - 放大、半透明白色 */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-light text-white/80 tracking-wide">{formatDate(dream.dreamDate)}</span>
              <span className="text-sm text-gray-500">{formatYear(dream.dreamDate)}</span>
              {sleepTimeStr && (
                <span className="text-xs text-gray-500/70 ml-2">✦ {sleepTimeStr}</span>
              )}
            </div>

            {/* 梦境摘要 - 纤细字体、增加行高 */}
            <p className="text-gray-300/90 text-sm font-light leading-relaxed tracking-wide mb-4" style={{ lineHeight: '1.8' }}>
              {isHovered ? getContentPreview(dream.content, 150) : getContentPreview(dream.content, 80)}
            </p>

            {/* 详细信息 - 悬停时显示 */}
            <div className={`overflow-hidden transition-all duration-500 ${isHovered ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              {/* 图片预览 */}
              {dream.imageUrl && (
                <div className="mb-4">
                  <img 
                    src={dream.imageUrl} 
                    alt="梦境图片" 
                    className="w-full max-h-48 object-contain rounded-xl bg-black/20"
                  />
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-400/80 pt-3 border-t border-white/5">
                <span>清晰度 {'✦'.repeat(dream.clarity)}{'✧'.repeat(5 - dream.clarity)}</span>
                {dream.isRecurring && <span className="text-purple-400/80">↻ 重复梦境</span>}
              </div>
            </div>

            {/* 霓虹标签 - 发光边框 */}
            <div className="flex items-center gap-3 mt-3">
              {dream.hasAnalysis && (
                <span 
                  className="text-xs px-3 py-1 rounded-full border transition-all duration-300"
                  style={{
                    borderColor: 'rgba(168, 85, 247, 0.5)',
                    color: 'rgba(192, 132, 252, 0.9)',
                    textShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
                    boxShadow: isHovered ? '0 0 15px rgba(168, 85, 247, 0.3)' : 'none',
                  }}
                >
                  已解析
                </span>
              )}
              {dream.hasImage && (
                <span 
                  className="text-xs px-3 py-1 rounded-full border transition-all duration-300"
                  style={{
                    borderColor: 'rgba(34, 211, 238, 0.5)',
                    color: 'rgba(103, 232, 249, 0.9)',
                    textShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
                    boxShadow: isHovered ? '0 0 15px rgba(34, 211, 238, 0.3)' : 'none',
                  }}
                >
                  有图片
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
