import { useState, useEffect, useRef, useCallback } from 'react';
import { ClarityRating, CLARITY_MIN, CLARITY_MAX } from '../../../../shared/types/dream';
import type { ClarityRangeSliderProps } from './types';

const clarityLabels: Record<ClarityRating, string> = {
  1: '朦胧',
  2: '模糊',
  3: '一般',
  4: '清晰',
  5: '晶莹',
};

/**
 * 清晰度范围滑块组件 - 能量槽样式（与记录梦境页面一致）
 * Requirements: 7.6
 */
export function ClarityRangeSlider({ min, max, onChange }: ClarityRangeSliderProps) {
  const [localMin, setLocalMin] = useState<number>(min || CLARITY_MIN);
  const [localMax, setLocalMax] = useState<number>(max || CLARITY_MAX);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);
  // 保存拖动开始时的值，用于判断是否有变化
  const dragStartRef = useRef<{ min: number; max: number } | null>(null);

  useEffect(() => {
    if (!dragging) {
      setLocalMin(min || CLARITY_MIN);
      setLocalMax(max || CLARITY_MAX);
    }
  }, [min, max, dragging]);

  const minPercent = ((localMin - 1) / 4) * 100;
  const maxPercent = ((localMax - 1) / 4) * 100;
  const minIntensity = (localMin - 1) / 4;
  const maxIntensity = (localMax - 1) / 4;

  const handleMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current || !dragging) return;
    const rect = trackRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const v = Math.round((p / 100) * 4) + 1;
    const clampedV = Math.max(1, Math.min(5, v)) as ClarityRating;

    if (dragging === 'min') {
      const newMin = Math.min(clampedV, localMax);
      setLocalMin(newMin);
    } else {
      const newMax = Math.max(clampedV, localMin);
      setLocalMax(newMax);
    }
  }, [dragging, localMin, localMax]);

  // 拖动结束时才触发 onChange
  const handleDragEnd = useCallback(() => {
    if (!dragging || !dragStartRef.current) return;
    
    const hasChanged = dragStartRef.current.min !== localMin || dragStartRef.current.max !== localMax;
    if (hasChanged) {
      if (localMin === CLARITY_MIN && localMax === CLARITY_MAX) {
        onChange(undefined);
      } else {
        onChange({ min: localMin as ClarityRating, max: localMax as ClarityRating });
      }
    }
    
    setDragging(null);
    dragStartRef.current = null;
  }, [dragging, localMin, localMax, onChange]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => handleMove(e);
    const onUp = () => handleDragEnd();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, handleMove, handleDragEnd]);

  const startDrag = (type: 'min' | 'max', e: React.MouseEvent) => {
    e.stopPropagation();
    dragStartRef.current = { min: localMin, max: localMax };
    setDragging(type);
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    
    // 当两个滑块重叠时，根据点击位置相对于滑块的方向决定拖哪个
    let targetSlider: 'min' | 'max';
    if (localMin === localMax) {
      // 重叠时：点击位置在滑块左边拖min，右边拖max
      targetSlider = pct < minPercent ? 'min' : 'max';
    } else {
      // 不重叠时：哪个近拖哪个
      targetSlider = Math.abs(pct - minPercent) < Math.abs(pct - maxPercent) ? 'min' : 'max';
    }
    
    dragStartRef.current = { min: localMin, max: localMax };
    setDragging(targetSlider);
    
    // 立即更新位置
    const v = Math.round((pct / 100) * 4) + 1;
    const clampedV = Math.max(1, Math.min(5, v));
    if (targetSlider === 'min') {
      setLocalMin(Math.min(clampedV, localMax));
    } else {
      setLocalMax(Math.max(clampedV, localMin));
    }
  };

  const isFiltered = localMin !== CLARITY_MIN || localMax !== CLARITY_MAX;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-dream-text">清晰度</label>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium transition-colors"
            style={{ color: `rgba(255,255,255,${0.4 + localMin * 0.12})` }}
          >
            {clarityLabels[localMin as ClarityRating]}
          </span>
          <span className="text-xs text-gray-500">~</span>
          <span
            className="text-xs font-medium transition-colors"
            style={{ color: `rgba(255,255,255,${0.4 + localMax * 0.12})` }}
          >
            {clarityLabels[localMax as ClarityRating]}
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setLocalMin(CLARITY_MIN);
                setLocalMax(CLARITY_MAX);
                onChange(undefined);
              }}
              className="text-xs text-gray-400 hover:text-purple-300 transition-colors ml-2"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* 能量槽轨道 */}
      <div
        ref={trackRef}
        className="relative h-6 rounded-full cursor-pointer select-none"
        style={{
          background: 'linear-gradient(to right, rgba(40,40,60,0.9), rgba(80,80,100,0.7))',
        }}
        onMouseDown={handleTrackClick}
      >
        {/* 选中区域填充 */}
        <div
          className="absolute inset-y-0 rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
            background: `linear-gradient(to right, rgba(100,100,130,0.7), rgba(180,180,200,0.8) 50%, rgba(240,240,255,${0.7 + maxIntensity * 0.3}))`,
            boxShadow:
              localMax >= 3
                ? `0 0 ${8 + maxIntensity * 15}px rgba(255,255,255,${0.3 + maxIntensity * 0.4})`
                : 'none',
            transition: dragging ? 'none' : 'all 0.15s ease-out',
          }}
        />

        {/* 刻度点 */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          {[1, 2, 3, 4, 5].map((l) => (
            <div
              key={l}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background:
                  l >= localMin && l <= localMax
                    ? `rgba(255,255,255,${0.5 + l * 0.1})`
                    : 'rgba(255,255,255,0.15)',
                boxShadow:
                  l >= localMin && l <= localMax && l >= 3
                    ? `0 0 ${l * 2}px rgba(255,255,255,0.5)`
                    : 'none',
                transition: dragging ? 'none' : 'all 0.15s ease-out',
              }}
            />
          ))}
        </div>

        {/* 最小值滑块 */}
        <div
          className="absolute top-1/2 w-4 h-4 rounded-full cursor-grab active:cursor-grabbing"
          style={{
            left: `${minPercent}%`,
            transform: `translate(-50%, -50%) scale(${dragging === 'min' ? 1.25 : 1})`,
            background: `radial-gradient(circle, rgba(255,255,255,${0.6 + minIntensity * 0.4}) 0%, rgba(200,200,220,0.8) 100%)`,
            boxShadow: `0 0 ${6 + minIntensity * 12}px rgba(255,255,255,${0.5 + minIntensity * 0.4})`,
            border: '2px solid rgba(255,255,255,0.5)',
            zIndex: dragging === 'min' ? 10 : 1,
            transition: dragging ? 'transform 0.1s ease-out' : 'all 0.15s ease-out',
            pointerEvents: localMin === localMax ? 'none' : 'auto',
          }}
          onMouseDown={(e) => startDrag('min', e)}
        />

        {/* 最大值滑块 */}
        <div
          className="absolute top-1/2 w-4 h-4 rounded-full cursor-grab active:cursor-grabbing"
          style={{
            left: `${maxPercent}%`,
            transform: `translate(-50%, -50%) scale(${dragging === 'max' ? 1.25 : 1})`,
            background: `radial-gradient(circle, rgba(255,255,255,${0.6 + maxIntensity * 0.4}) 0%, rgba(200,200,220,0.8) 100%)`,
            boxShadow: `0 0 ${6 + maxIntensity * 12}px rgba(255,255,255,${0.5 + maxIntensity * 0.4})`,
            border: '2px solid rgba(255,255,255,0.5)',
            zIndex: dragging === 'max' ? 10 : 2,
            transition: dragging ? 'transform 0.1s ease-out' : 'all 0.15s ease-out',
            pointerEvents: localMin === localMax ? 'none' : 'auto',
          }}
          onMouseDown={(e) => startDrag('max', e)}
        />
      </div>

      {/* 描述文字 */}
      <p
        className="text-[11px] text-center text-dream-text-secondary/60 transition-all"
        style={{ filter: `blur(${(1 - maxIntensity) * 0.5}px)` }}
      >
        {localMin === localMax
          ? localMin === 1
            ? '梦境如雾中花，难以捕捉'
            : localMin === 2
            ? '隐约可见轮廓，细节模糊'
            : localMin === 3
            ? '能回忆主要情节'
            : localMin === 4
            ? '画面清晰，记忆深刻'
            : '如同亲历，历历在目'
          : `筛选清晰度 ${localMin} ~ ${localMax} 的梦境`}
      </p>
    </div>
  );
}
