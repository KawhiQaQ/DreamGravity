import type { CreativeCardProps } from './types';

/**
 * 创意内容卡片（故事/诗歌）
 */
export function CreativeCard({ type, content }: CreativeCardProps) {
  const isStory = type === 'story';
  
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-dream-text mb-4 flex items-center gap-2">
        <span>{isStory ? '📖' : '🎭'}</span>
        {isStory ? '梦境故事' : '梦境诗歌'}
      </h3>

      <div
        className={`
          glass-card p-5
          ${isStory 
            ? 'border-dream-neon-orange/20' 
            : 'border-dream-neon-purple/20 text-center'
          }
        `}
      >
        <p
          className={`
            text-dream-text leading-relaxed whitespace-pre-wrap
            ${isStory ? '' : 'text-lg italic'}
          `}
        >
          {content}
        </p>
      </div>
    </div>
  );
}
