import { EmotionTag, EMOTION_TAGS, EmotionTagLabels } from '../../../../shared/types/dream';

interface EmotionSelectorProps {
  value: EmotionTag;
  onChange: (emotion: EmotionTag) => void;
  error?: string;
}

const emotionIcons: Record<EmotionTag, string> = {
  happy: '😊',
  excited: '🤩',
  peaceful: '😌',
  hopeful: '🌟',
  loving: '🥰',
  sad: '😢',
  anxious: '😰',
  angry: '😠',
  scared: '😱',
  lonely: '😔',
  confused: '😵',
  nostalgic: '🥹',
  curious: '🤔',
  surprised: '😲',
  neutral: '😐',
};

// 情绪对应的主题色
const emotionThemeColors: Record<EmotionTag, { bg: string; border: string; glow: string }> = {
  happy: { bg: 'rgba(250, 204, 21, 0.2)', border: 'rgba(250, 204, 21, 0.6)', glow: 'rgba(250, 204, 21, 0.4)' },
  excited: { bg: 'rgba(255, 107, 53, 0.2)', border: 'rgba(255, 107, 53, 0.6)', glow: 'rgba(255, 107, 53, 0.4)' },
  peaceful: { bg: 'rgba(0, 212, 255, 0.2)', border: 'rgba(0, 212, 255, 0.6)', glow: 'rgba(0, 212, 255, 0.4)' },
  hopeful: { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.6)', glow: 'rgba(251, 191, 36, 0.4)' },
  loving: { bg: 'rgba(244, 114, 182, 0.2)', border: 'rgba(244, 114, 182, 0.6)', glow: 'rgba(244, 114, 182, 0.4)' },
  sad: { bg: 'rgba(96, 165, 250, 0.2)', border: 'rgba(96, 165, 250, 0.6)', glow: 'rgba(96, 165, 250, 0.4)' },
  anxious: { bg: 'rgba(167, 139, 250, 0.2)', border: 'rgba(167, 139, 250, 0.6)', glow: 'rgba(167, 139, 250, 0.4)' },
  angry: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.6)', glow: 'rgba(239, 68, 68, 0.4)' },
  scared: { bg: 'rgba(156, 163, 175, 0.2)', border: 'rgba(156, 163, 175, 0.6)', glow: 'rgba(156, 163, 175, 0.4)' },
  lonely: { bg: 'rgba(129, 140, 248, 0.2)', border: 'rgba(129, 140, 248, 0.6)', glow: 'rgba(129, 140, 248, 0.4)' },
  confused: { bg: 'rgba(191, 0, 255, 0.2)', border: 'rgba(191, 0, 255, 0.6)', glow: 'rgba(191, 0, 255, 0.4)' },
  nostalgic: { bg: 'rgba(253, 186, 116, 0.2)', border: 'rgba(253, 186, 116, 0.6)', glow: 'rgba(253, 186, 116, 0.4)' },
  curious: { bg: 'rgba(0, 255, 212, 0.2)', border: 'rgba(0, 255, 212, 0.6)', glow: 'rgba(0, 255, 212, 0.4)' },
  surprised: { bg: 'rgba(232, 121, 249, 0.2)', border: 'rgba(232, 121, 249, 0.6)', glow: 'rgba(232, 121, 249, 0.4)' },
  neutral: { bg: 'rgba(148, 163, 184, 0.2)', border: 'rgba(148, 163, 184, 0.6)', glow: 'rgba(148, 163, 184, 0.4)' },
};

export function EmotionSelector({ value, onChange, error }: EmotionSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-dream-text">
        情绪标签 <span className="text-dream-neon-pink">*</span>
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {EMOTION_TAGS.map((emotion) => {
          const isSelected = value === emotion;
          const colors = emotionThemeColors[emotion];
          
          return (
            <button
              key={emotion}
              type="button"
              onClick={() => onChange(emotion)}
              className={`
                relative flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl
                transition-all duration-300 overflow-hidden
                ${isSelected 
                  ? 'scale-105' 
                  : 'hover:scale-102 hover:bg-white/10'
                }
              `}
              style={isSelected ? {
                background: colors.bg,
                border: `1.5px solid ${colors.border}`,
                boxShadow: `0 0 20px ${colors.glow}`,
              } : {
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1.5px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span className={`text-xl transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}>
                {emotionIcons[emotion]}
              </span>
              <span className={`text-xs font-medium transition-colors duration-300 ${
                isSelected ? 'text-white' : 'text-dream-text-secondary'
              }`}>
                {EmotionTagLabels[emotion]}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
