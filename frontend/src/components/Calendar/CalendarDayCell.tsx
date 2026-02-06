import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { CalendarDayCellProps } from './types';
import type { EmotionTag, DreamPreview } from '../../../../shared/types/dream';
import { EmotionTagLabels } from '../../../../shared/types/dream';
import { formatSleepTime } from '../../utils/formatSleepTime';

// 情绪对应的烟雾颜色
const emotionSmokeColors: Record<EmotionTag, string> = {
  happy: 'rgba(251, 191, 36, 0.25)',
  excited: 'rgba(251, 146, 60, 0.25)',
  peaceful: 'rgba(52, 211, 153, 0.2)',
  hopeful: 'rgba(250, 204, 21, 0.25)',
  loving: 'rgba(244, 114, 182, 0.25)',
  sad: 'rgba(96, 165, 250, 0.25)',
  anxious: 'rgba(167, 139, 250, 0.25)',
  angry: 'rgba(248, 113, 113, 0.25)',
  scared: 'rgba(192, 132, 252, 0.3)',
  lonely: 'rgba(129, 140, 248, 0.25)',
  confused: 'rgba(196, 181, 253, 0.25)',
  nostalgic: 'rgba(45, 212, 191, 0.2)',
  curious: 'rgba(34, 211, 238, 0.25)',
  surprised: 'rgba(163, 230, 53, 0.2)',
  neutral: 'rgba(148, 163, 184, 0.2)',
};

const emotionIcons: Record<EmotionTag, string> = {
  happy: '😊', excited: '🤩', peaceful: '😌', hopeful: '🌟', loving: '🥰',
  sad: '😢', anxious: '😰', angry: '😠', scared: '😱', lonely: '😔',
  confused: '😵', nostalgic: '🥹', curious: '🤔', surprised: '😲', neutral: '😐',
};

function getContentPreview(content: string, maxLength: number = 40): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

function getPrimarySmokeColor(dreams: DreamPreview[]): string {
  if (dreams.length === 0) return 'transparent';
  return emotionSmokeColors[dreams[0].emotionTag];
}

export function CalendarDayCell({
  date, isCurrentMonth, isToday, dreams,
  onDreamHover, onDreamClick, onDreamDelete,
  selectionMode = false, selectedIds = [], onSelectionChange,
}: CalendarDayCellProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const cellRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDreams = dreams.length > 0;
  const smokeColor = getPrimarySmokeColor(dreams);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (showPreview && cellRef.current && dreams.length >= 1) {
      const rect = cellRef.current.getBoundingClientRect();
      const previewWidth = 280;
      const previewHeight = dreams.length > 1 ? 300 : 200;
      let left = rect.right + 8;
      let top = rect.top;
      if (left + previewWidth > window.innerWidth - 20) left = rect.left - previewWidth - 8;
      if (top + previewHeight > window.innerHeight - 20) top = window.innerHeight - previewHeight - 20;
      if (top < 20) top = 20;
      setPreviewPosition({ top, left });
    }
  }, [showPreview, dreams.length]);

  useEffect(() => () => clearHideTimeout(), []);

  const handleShowPreview = () => {
    clearHideTimeout();
    if (dreams.length >= 1) {
      setShowPreview(true);
      onDreamHover(dreams[0]);
    }
  };

  const handleHidePreview = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowPreview(false);
      onDreamHover(null);
    }, 200);
  };

  const handleCellClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasDreams) return;
    setShowPreview(false);
    if (dreams.length === 1) onDreamClick(dreams[0].id);
    else setShowPopup(true);
  };

  const handleDreamItemClick = (e: React.MouseEvent, dreamId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPopup(false);
    onDreamClick(dreamId);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDreamDelete(id);
    setDeleteConfirmId(null);
    setShowPreview(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  const handlePopupClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPopup(false);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    onSelectionChange?.(id, e.target.checked);
  };

  const sortedDreams = [...dreams].sort((a, b) => {
    const timeA = a.sleepStartTime || '99:99';
    const timeB = b.sleepStartTime || '99:99';
    return timeA.localeCompare(timeB);
  });

  // 预览弹窗
  const previewContent = showPreview && sortedDreams.length >= 1 && !showPopup && (
    <div 
      className="fixed z-[100] w-72 p-4 rounded-2xl"
      style={{ 
        top: previewPosition.top, 
        left: previewPosition.left,
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={clearHideTimeout}
      onMouseLeave={() => { setShowPreview(false); onDreamHover(null); }}
    >
      {sortedDreams.length === 1 ? (
        <div onClick={(e) => { e.stopPropagation(); onDreamClick(sortedDreams[0].id); }} className="cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{emotionIcons[sortedDreams[0].emotionTag]}</span>
              <span className="text-sm text-gray-300">{EmotionTagLabels[sortedDreams[0].emotionTag]}</span>
            </div>
            <button onClick={(e) => handleDeleteClick(e, sortedDreams[0].id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          {deleteConfirmId === sortedDreams[0].id ? (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-300">确定删除？</span>
              <div className="flex gap-2">
                <button onClick={handleCancelDelete} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 rounded-lg">取消</button>
                <button onClick={(e) => handleConfirmDelete(e, sortedDreams[0].id)} className="px-3 py-1.5 text-xs bg-red-500/60 text-white rounded-lg">删除</button>
              </div>
            </div>
          ) : (
            <>
              {(sortedDreams[0].sleepStartTime || sortedDreams[0].sleepEndTime) && (
                <p className="text-xs text-gray-500 mb-2">✦ {formatSleepTime(sortedDreams[0].sleepStartTime, sortedDreams[0].sleepEndTime)}</p>
              )}
              <p className="text-sm text-gray-200 font-light leading-relaxed mb-3">{getContentPreview(sortedDreams[0].content, 80)}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>清晰度 {'✦'.repeat(sortedDreams[0].clarity)}{'✧'.repeat(5 - sortedDreams[0].clarity)}</span>
                {sortedDreams[0].isRecurring && <span className="text-purple-400/80">↻</span>}
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-3">
            <span className="text-sm font-light text-gray-200">
              {date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} · {sortedDreams.length} 个梦境
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sortedDreams.slice(0, 4).map((dream) => (
              <div key={dream.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                onClick={(e) => { e.stopPropagation(); onDreamClick(dream.id); }}>
                <span className="text-lg">{emotionIcons[dream.emotionTag]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">{getContentPreview(dream.content, 30)}</p>
                  <span className="text-xs text-gray-500">{EmotionTagLabels[dream.emotionTag]}</span>
                </div>
              </div>
            ))}
          </div>
          {sortedDreams.length > 4 && <p className="text-xs text-gray-500 mt-2 text-center">还有 {sortedDreams.length - 4} 个梦境</p>}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        ref={cellRef}
        className={`
          relative rounded-xl transition-all duration-300 h-full
          ${hasDreams ? 'cursor-pointer constellation-crystal' : ''}
          ${showPreview && hasDreams ? 'constellation-crystal-hover' : ''}
        `}
        style={hasDreams ? {
          background: `radial-gradient(ellipse at 50% 80%, ${smokeColor} 0%, rgba(255,255,255,0.04) 60%, transparent 100%)`,
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: showPreview ? `0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${smokeColor}` : '0 4px 16px rgba(0,0,0,0.1)',
          transform: showPreview ? 'translateY(-3px)' : 'translateY(0)',
        } : {
          // 陨石坑效果 - 凹陷的静默空间
          background: 'rgba(0, 0, 0, 0.15)',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 0 4px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(0, 0, 0, 0.2)',
        }}
        onMouseEnter={handleShowPreview}
        onMouseLeave={handleHidePreview}
        onClick={handleCellClick}
      >
        {/* 日期数字 */}
        <div className={`
          p-2 font-light text-sm
          ${isToday 
            ? 'today-glow-ring' 
            : isCurrentMonth 
              ? hasDreams ? 'text-white' : 'text-gray-400/70' 
              : 'text-gray-600/40'
          }
        `}>
          {isToday ? (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full relative">
              <span className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
              <span className="absolute inset-[-2px] rounded-full border border-white/40" />
              <span className="relative text-white font-medium">{date.getDate()}</span>
            </span>
          ) : (
            date.getDate()
          )}
        </div>

        {/* 有梦境时显示数量指示 */}
        {hasDreams && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {dreams.length <= 3 ? (
              dreams.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40" />
              ))
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="text-[10px] text-white/50 ml-0.5">+{dreams.length - 2}</span>
              </>
            )}
          </div>
        )}

        {/* 悬停时显示摘要 */}
        {showPreview && hasDreams && sortedDreams[0] && (
          <div className="absolute inset-x-2 bottom-6 text-[10px] text-white/70 font-light line-clamp-2 leading-relaxed">
            {getContentPreview(sortedDreams[0].content, 30)}
          </div>
        )}
      </div>

      {previewContent && createPortal(previewContent, document.body)}

      {/* 多梦境弹窗 */}
      {showPopup && sortedDreams.length > 0 && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={handlePopupClose}>
          <div className="max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto rounded-2xl p-5"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light text-gray-200">{date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} 的梦境</h3>
              <button onClick={handlePopupClose} className="text-gray-500 hover:text-gray-300 p-1 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {sortedDreams.map((dream) => (
                <div key={dream.id} className="relative p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all border border-white/5"
                  onClick={(e) => handleDreamItemClick(e, dream.id)}>
                  {deleteConfirmId === dream.id ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">确定删除？</span>
                      <div className="flex gap-2">
                        <button onClick={handleCancelDelete} className="px-3 py-1.5 text-xs text-gray-400 bg-white/5 rounded-lg">取消</button>
                        <button onClick={(e) => handleConfirmDelete(e, dream.id)} className="px-3 py-1.5 text-xs bg-red-500/60 text-white rounded-lg">删除</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {selectionMode && (
                        <input type="checkbox" checked={selectedIds.includes(dream.id)} onChange={(e) => handleCheckboxChange(e, dream.id)}
                          onClick={(e) => e.stopPropagation()} className="absolute top-4 left-4 w-4 h-4 accent-purple-500" />
                      )}
                      <div className={selectionMode ? 'pl-6' : ''}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{emotionIcons[dream.emotionTag]}</span>
                            <span className="text-sm text-gray-400">{EmotionTagLabels[dream.emotionTag]}</span>
                          </div>
                          {!selectionMode && (
                            <button onClick={(e) => handleDeleteClick(e, dream.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {(dream.sleepStartTime || dream.sleepEndTime) && <p className="text-xs text-gray-500 mb-1">✦ {formatSleepTime(dream.sleepStartTime, dream.sleepEndTime)}</p>}
                        <p className="text-sm text-gray-300 font-light">{getContentPreview(dream.content)}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{'✦'.repeat(dream.clarity)}{'✧'.repeat(5 - dream.clarity)}</span>
                          {dream.isRecurring && <span className="text-purple-400/80">↻</span>}
                          {dream.hasAnalysis && <span className="text-cyan-400/80">已解析</span>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
