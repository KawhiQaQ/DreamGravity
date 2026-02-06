import type { EmotionCardProps } from './types';

/**
 * 情绪强度条
 */
function IntensityBar({ intensity }: { intensity: number }) {
  const percentage = Math.min(100, Math.max(0, intensity * 10));
  
  const getGradient = () => {
    if (intensity <= 3) return 'from-dream-neon-cyan to-green-400';
    if (intensity <= 6) return 'from-dream-neon-orange to-yellow-400';
    return 'from-dream-neon-pink to-red-400';
  };

  const getGlow = () => {
    if (intensity <= 3) return 'shadow-[0_0_10px_rgba(0,255,212,0.4)]';
    if (intensity <= 6) return 'shadow-[0_0_10px_rgba(255,107,53,0.4)]';
    return 'shadow-[0_0_10px_rgba(255,0,170,0.4)]';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getGradient()} ${getGlow()} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-dream-text-secondary w-10">{intensity}/10</span>
    </div>
  );
}

/**
 * 情绪分析卡片
 */
export function EmotionCard({ analysis }: EmotionCardProps) {
  if (!analysis) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-dream-text mb-4 flex items-center gap-2">
          <span>💭</span>
          情绪分析
        </h3>
        <p className="text-dream-text-secondary">暂无解析结果</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-dream-text mb-4 flex items-center gap-2">
        <span>💭</span>
        情绪分析
      </h3>

      <div className="space-y-5">
        {/* 主要情绪 */}
        <div>
          <div className="text-sm text-dream-text-secondary mb-1">主要情绪</div>
          <div className="text-xl font-medium gradient-text">
            {analysis.primaryEmotion}
          </div>
        </div>

        {/* 情绪强度 */}
        <div>
          <div className="text-sm text-dream-text-secondary mb-2">情绪强度</div>
          <IntensityBar intensity={analysis.emotionIntensity} />
        </div>

        {/* 潜在压力 */}
        {analysis.potentialStress && analysis.potentialStress.length > 0 && (
          <div>
            <div className="text-sm text-dream-text-secondary mb-2">潜在压力来源</div>
            <div className="flex flex-wrap gap-2">
              {analysis.potentialStress.map((stress, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-dream-neon-orange/10 text-dream-neon-orange rounded-full text-sm border border-dream-neon-orange/30"
                >
                  {stress}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 心理洞察 */}
        {analysis.psychologicalInsight && (
          <div>
            <div className="text-sm text-dream-text-secondary mb-2">心理洞察</div>
            <p className="text-dream-text leading-relaxed glass-card p-4">
              {analysis.psychologicalInsight}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
