import { useState, useCallback } from 'react';
import type { AnalysisCardsProps, LoadingState, ErrorState } from './types';
import { SymbolCard } from './SymbolCard';
import { EmotionCard } from './EmotionCard';
import { CreativeCard } from './CreativeCard';
import { API_BASE_URL } from '../../utils';

/**
 * 操作按钮组件
 */
interface ActionButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  icon: string;
  label: string;
  loadingLabel: string;
  neonColor?: string;
}

function ActionButton({
  onClick,
  isLoading,
  disabled,
  icon,
  label,
  loadingLabel,
  neonColor = 'dream-primary',
}: ActionButtonProps) {
  const colorClasses: Record<string, string> = {
    'dream-primary': 'hover:border-dream-primary/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]',
    'dream-neon-purple': 'hover:border-dream-neon-purple/50 hover:shadow-[0_0_20px_rgba(191,0,255,0.3)]',
    'dream-neon-cyan': 'hover:border-dream-neon-cyan/50 hover:shadow-[0_0_20px_rgba(0,255,212,0.3)]',
    'dream-neon-orange': 'hover:border-dream-neon-orange/50 hover:shadow-[0_0_20px_rgba(255,107,53,0.3)]',
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`
        flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all
        ${isLoading || disabled
          ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
          : `glass-btn-ghost ${colorClasses[neonColor] || colorClasses['dream-primary']}`
        }
      `}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          <span className="hidden sm:inline">{loadingLabel}</span>
          <span className="sm:hidden">...</span>
        </>
      ) : (
        <>
          <span>{icon}</span>
          <span className="truncate">{label}</span>
        </>
      )}
    </button>
  );
}

/**
 * 错误提示组件
 */
function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 glass-card border-red-500/30">
      <span className="text-red-400">⚠️</span>
      <span className="text-red-400 flex-1">{message}</span>
      <button
        onClick={onRetry}
        className="text-sm text-red-400 hover:text-red-300 underline"
      >
        重试
      </button>
    </div>
  );
}

/**
 * 解析卡片容器组件
 */
export function AnalysisCards({ dream, onDreamUpdate }: AnalysisCardsProps) {
  const [loading, setLoading] = useState<LoadingState>({
    analyze: false,
    generateImage: false,
    generateStory: false,
    generatePoem: false,
  });

  const [errors, setErrors] = useState<ErrorState>({
    analyze: null,
    generateImage: null,
    generateStory: null,
    generatePoem: null,
  });

  const clearError = useCallback((key: keyof ErrorState) => {
    setErrors((prev) => ({ ...prev, [key]: null }));
  }, []);

  const handleAnalyze = useCallback(async () => {
    clearError('analyze');
    setLoading((prev) => ({ ...prev, analyze: true }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dreams/${dream.id}/analyze`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '解析失败');
      }

      const dreamResponse = await fetch(
        `${API_BASE_URL}/api/dreams/${dream.id}`
      );
      if (dreamResponse.ok) {
        const updatedDream = await dreamResponse.json();
        onDreamUpdate(updatedDream);
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        analyze: err instanceof Error ? err.message : '解析失败，请重试',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, analyze: false }));
    }
  }, [dream.id, onDreamUpdate, clearError]);

  const handleGenerateImage = useCallback(async () => {
    clearError('generateImage');
    setLoading((prev) => ({ ...prev, generateImage: true }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dreams/${dream.id}/generate-image`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '图片生成失败');
      }

      const dreamResponse = await fetch(
        `${API_BASE_URL}/api/dreams/${dream.id}`
      );
      if (dreamResponse.ok) {
        const updatedDream = await dreamResponse.json();
        onDreamUpdate(updatedDream);
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        generateImage: err instanceof Error ? err.message : '图片生成失败，请重试',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, generateImage: false }));
    }
  }, [dream.id, onDreamUpdate, clearError]);

  const handleGenerateCreative = useCallback(
    async (format: 'story' | 'poem') => {
      const errorKey = format === 'story' ? 'generateStory' : 'generatePoem';
      clearError(errorKey);
      setLoading((prev) => ({ ...prev, [errorKey]: true }));

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/dreams/${dream.id}/generate-creative`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ format }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '生成失败');
        }

        const dreamResponse = await fetch(
          `${API_BASE_URL}/api/dreams/${dream.id}`
        );
        if (dreamResponse.ok) {
          const updatedDream = await dreamResponse.json();
          onDreamUpdate(updatedDream);
        }
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          [errorKey]: err instanceof Error ? err.message : '生成失败，请重试',
        }));
      } finally {
        setLoading((prev) => ({ ...prev, [errorKey]: false }));
      }
    },
    [dream.id, onDreamUpdate, clearError]
  );

  const hasAnalysis = !!dream.analysis;
  const hasImage = !!dream.imageUrl;
  const hasStory = !!dream.analysis?.generatedStory;
  const hasPoem = !!dream.analysis?.generatedPoem;

  return (
    <div className="space-y-6">
      {/* 操作按钮区 */}
      <div className="glass-card p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-dream-text mb-4 flex items-center gap-2">
          <span className="text-dream-neon-blue">✨</span>
          AI 功能
        </h2>
        
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
          <ActionButton
            onClick={handleAnalyze}
            isLoading={loading.analyze}
            icon="🔮"
            label={hasAnalysis ? '重新解析' : '开始解析'}
            loadingLabel="解析中..."
            neonColor="dream-neon-purple"
          />

          <ActionButton
            onClick={handleGenerateImage}
            isLoading={loading.generateImage}
            icon="🎨"
            label={hasImage ? '重新生成图片' : '生成图片'}
            loadingLabel="生成中..."
            neonColor="dream-neon-cyan"
          />

          <ActionButton
            onClick={() => handleGenerateCreative('story')}
            isLoading={loading.generateStory}
            disabled={!hasAnalysis}
            icon="📖"
            label={hasStory ? '重新生成故事' : '生成故事'}
            loadingLabel="创作中..."
            neonColor="dream-neon-orange"
          />

          <ActionButton
            onClick={() => handleGenerateCreative('poem')}
            isLoading={loading.generatePoem}
            disabled={!hasAnalysis}
            icon="🎭"
            label={hasPoem ? '重新生成诗歌' : '生成诗歌'}
            loadingLabel="创作中..."
            neonColor="dream-primary"
          />
        </div>

        {/* 错误提示 */}
        <div className="mt-4 space-y-2">
          {errors.analyze && (
            <ErrorMessage message={errors.analyze} onRetry={handleAnalyze} />
          )}
          {errors.generateImage && (
            <ErrorMessage
              message={errors.generateImage}
              onRetry={handleGenerateImage}
            />
          )}
          {errors.generateStory && (
            <ErrorMessage
              message={errors.generateStory}
              onRetry={() => handleGenerateCreative('story')}
            />
          )}
          {errors.generatePoem && (
            <ErrorMessage
              message={errors.generatePoem}
              onRetry={() => handleGenerateCreative('poem')}
            />
          )}
        </div>

        {!hasAnalysis && (
          <p className="mt-3 text-sm text-dream-text-secondary">
            💡 点击"开始解析"让 AI 分析你的梦境，解锁更多功能
          </p>
        )}
      </div>

      {/* 解析结果卡片 */}
      {hasAnalysis && dream.analysis && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SymbolCard analysis={dream.analysis.symbolAnalysis} />
            <EmotionCard analysis={dream.analysis.emotionAnalysis} />
          </div>

          {/* 创意内容 */}
          {hasStory && (
            <CreativeCard type="story" content={dream.analysis.generatedStory!} />
          )}
          {hasPoem && (
            <CreativeCard type="poem" content={dream.analysis.generatedPoem!} />
          )}
        </>
      )}
    </div>
  );
}
