import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../../utils';
import type { DreamPattern, PatternType } from '../../../../shared/types/dream';

interface DreamPatternSectionProps {
  dreamId: string;
  patterns?: DreamPattern[];
  hasFollowups: boolean;
  onPatternAnalyzed: () => void;
}

const PatternTypeLabels: Record<PatternType, { label: string; icon: string; color: string }> = {
  stress: { label: '压力相关', icon: '😰', color: 'text-dream-neon-orange bg-dream-neon-orange/10 border-dream-neon-orange/30' },
  recurring_theme: { label: '重复主题', icon: '🔄', color: 'text-dream-neon-blue bg-dream-neon-blue/10 border-dream-neon-blue/30' },
  emotional: { label: '情绪模式', icon: '💭', color: 'text-dream-neon-purple bg-dream-neon-purple/10 border-dream-neon-purple/30' },
  predictive: { label: '预示性', icon: '🔮', color: 'text-dream-neon-cyan bg-dream-neon-cyan/10 border-dream-neon-cyan/30' },
};

export function DreamPatternSection({ dreamId, patterns = [], hasFollowups, onPatternAnalyzed }: DreamPatternSectionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/dreams/${dreamId}/patterns/analyze`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '分析失败');
      }

      onPatternAnalyzed();
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  }, [dreamId, onPatternAnalyzed]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-dream-text flex items-center gap-2">
          <span>🧩</span>
          模式识别
        </h2>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="glass-btn px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              分析中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {patterns.length > 0 ? '重新分析' : '开始分析'}
            </>
          )}
        </button>
      </div>

      {!hasFollowups && patterns.length === 0 && (
        <div className="glass-card p-4 mb-4 border-dream-neon-blue/20">
          <p className="text-sm text-dream-text-secondary flex items-center gap-2">
            <span>💡</span>
            提示：添加后续关联记录后，模式识别将更加准确，特别是对于预示性梦境的识别。
          </p>
        </div>
      )}

      {error && (
        <div className="glass-card p-4 mb-4 border-red-500/30">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {patterns.length === 0 ? (
        <div className="text-center py-8 text-dream-text-secondary">
          <p className="mb-2">暂无模式识别结果</p>
          <p className="text-sm">点击"开始分析"按钮，AI将识别梦境中的模式</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patterns.map((pattern) => {
            const typeInfo = PatternTypeLabels[pattern.patternType] || {
              label: pattern.patternType,
              icon: '📊',
              color: 'text-dream-text-secondary bg-white/5 border-white/10',
            };

            return (
              <div
                key={pattern.id}
                className="glass-card p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{typeInfo.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm px-2 py-0.5 rounded-full border ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className="text-sm text-dream-text-secondary">
                        置信度: {Math.round(pattern.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-dream-text">{pattern.patternDescription}</p>
                    {pattern.stressSource && (
                      <p className="text-sm text-dream-neon-orange mt-2">
                        压力源: {pattern.stressSource}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
