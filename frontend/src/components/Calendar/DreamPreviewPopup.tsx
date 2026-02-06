import { EmotionTag, EmotionTagLabels } from '../../../../shared/types/dream';
import type { DreamPreview } from '../../../../shared/types/dream';
import { formatSleepTime } from '../../utils/formatSleepTime';

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

interface DreamPreviewPopupProps {
  dream: DreamPreview | null;
  visible: boolean;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getContentPreview(content: string, maxLength: number = 80): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

export function DreamPreviewPopup({ dream, visible }: DreamPreviewPopupProps) {
  if (!dream || !visible) return null;

  const sleepTimeStr = formatSleepTime(dream.sleepStartTime, dream.sleepEndTime);

  return (
    <div
      className={`
        fixed z-50 w-72 p-4 bg-dream-surface rounded-lg shadow-xl border border-dream-accent/30
        transition-all duration-200
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
      `}
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* 日期和情绪 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{formatDate(dream.dreamDate)}</span>
        <div className="flex items-center gap-2">
          <span className="text-lg">{emotionIcons[dream.emotionTag]}</span>
          <span className="text-sm text-dream-text">{EmotionTagLabels[dream.emotionTag]}</span>
        </div>
      </div>

      {/* 睡眠时间 */}
      {sleepTimeStr && (
        <p className="text-xs text-gray-500 mb-2">🌙 {sleepTimeStr}</p>
      )}

      {/* 梦境内容预览 */}
      <p className="text-dream-text text-sm mb-3 leading-relaxed">{getContentPreview(dream.content)}</p>

      {/* 元数据 */}
      <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-dream-surface pt-3">
        <span>清晰度: {'★'.repeat(dream.clarity)}{'☆'.repeat(5 - dream.clarity)}</span>
        {dream.isRecurring && <span className="text-dream-accent">🔄 重复梦境</span>}
      </div>

      {/* 状态标签 */}
      <div className="flex items-center gap-2 mt-2">
        {dream.hasAnalysis && (
          <span className="text-xs px-2 py-0.5 bg-dream-primary/20 text-dream-primary rounded">已解析</span>
        )}
        {dream.hasImage && (
          <span className="text-xs px-2 py-0.5 bg-dream-secondary/20 text-dream-secondary rounded">有图片</span>
        )}
      </div>

      {/* 提示 */}
      <p className="text-xs text-gray-500 mt-3 text-center">点击查看详情</p>
    </div>
  );
}
