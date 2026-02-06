import { EmotionTag, EMOTION_TAGS, EmotionTagLabels } from '../../../../shared/types/dream';
import type { EmotionMultiSelectProps } from './types';

// 情绪配色 - 与记录梦境页面保持一致的光点样式
const emotionOrbs: Record<EmotionTag, { color: string; glow: string }> = {
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

/**
 * 情绪多选器组件 - 光点样式（与记录梦境页面一致）
 * Requirements: 7.5
 */
export function EmotionMultiSelect({ selected, onChange }: EmotionMultiSelectProps) {
  const handleToggle = (emotion: EmotionTag) => {
    if (selected.includes(emotion)) {
      onChange(selected.filter((e) => e !== emotion));
    } else {
      onChange([...selected, emotion]);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === EMOTION_TAGS.length) {
      onChange([]);
    } else {
      onChange([...EMOTION_TAGS]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-dream-text">情绪色彩</label>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs text-gray-400 hover:text-purple-300 transition-colors"
        >
          {selected.length === EMOTION_TAGS.length ? '取消全选' : '全选'}
        </button>
      </div>
      <div className="grid grid-cols-5 gap-0.5">
        {EMOTION_TAGS.map((emotion) => {
          const isSelected = selected.includes(emotion);
          const orb = emotionOrbs[emotion];
          
          return (
            <button
              key={emotion}
              type="button"
              title={EmotionTagLabels[emotion]}
              onClick={() => handleToggle(emotion)}
              className={`group flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all ${
                isSelected ? 'bg-white/10 scale-105' : 'hover:bg-white/5'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full transition-all"
                style={{
                  background: orb.color,
                  opacity: isSelected ? 1 : 0.5,
                  boxShadow: isSelected ? `0 0 10px ${orb.glow}` : 'none',
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                }}
              />
              <span
                className={`text-[8px] transition-all ${
                  isSelected ? 'text-white' : 'text-dream-text-secondary/40'
                }`}
              >
                {EmotionTagLabels[emotion]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
