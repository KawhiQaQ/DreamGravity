import { useState, useCallback } from 'react';
import type { EmotionTag, ClarityRating as ClarityRatingType } from '../../../../shared/types/dream';
import type { DreamFormData, FormErrors, DreamInputFormProps } from './types';
import { EmotionSelector } from './EmotionSelector';
import { ClarityRating } from './ClarityRating';
import { validateDreamForm as validateForm, errorsToFieldMap } from '../../utils/validation';

/**
 * 获取当前日期的 ISO 字符串（仅日期部分）
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 获取默认睡眠开始时间 (22:00)
 */
function getDefaultSleepStartTime(): string {
  return '22:00';
}

/**
 * 获取默认睡眠结束时间 (07:00)
 */
function getDefaultSleepEndTime(): string {
  return '07:00';
}

/**
 * 验证表单数据（使用通用验证工具）
 */
export function validateDreamForm(data: DreamFormData): FormErrors {
  const result = validateForm({
    content: data.content,
    dreamDate: data.dreamDate,
    sleepStartTime: data.sleepStartTime,
    sleepEndTime: data.sleepEndTime,
    emotionTag: data.emotionTag,
    clarity: data.clarity,
    isRecurring: data.isRecurring,
  });
  
  return errorsToFieldMap(result.errors) as FormErrors;
}

interface ExtendedDreamInputFormProps extends DreamInputFormProps {
  onVoiceClick?: () => void;
  showVoiceButton?: boolean;
}

/**
 * 梦境输入表单组件
 */
export function DreamInputForm({ 
  onSubmit, 
  initialData, 
  isLoading = false,
  onVoiceClick,
  showVoiceButton = false,
}: ExtendedDreamInputFormProps) {
  const [formData, setFormData] = useState<DreamFormData>({
    content: initialData?.content ?? '',
    dreamDate: initialData?.dreamDate ?? getTodayDate(),
    sleepStartTime: initialData?.sleepStartTime ?? getDefaultSleepStartTime(),
    sleepEndTime: initialData?.sleepEndTime ?? getDefaultSleepEndTime(),
    emotionTag: initialData?.emotionTag ?? 'neutral',
    clarity: initialData?.clarity ?? 3,
    isRecurring: initialData?.isRecurring ?? false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, content: e.target.value }));
    if (errors.content) {
      setErrors((prev) => ({ ...prev, content: undefined }));
    }
  }, [errors.content]);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, dreamDate: e.target.value }));
    if (errors.dreamDate) {
      setErrors((prev) => ({ ...prev, dreamDate: undefined }));
    }
  }, [errors.dreamDate]);

  const handleSleepStartTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, sleepStartTime: e.target.value }));
  }, []);

  const handleSleepEndTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, sleepEndTime: e.target.value }));
  }, []);

  const handleEmotionChange = useCallback((emotion: EmotionTag) => {
    setFormData((prev) => ({ ...prev, emotionTag: emotion }));
  }, []);

  const handleClarityChange = useCallback((clarity: ClarityRatingType) => {
    setFormData((prev) => ({ ...prev, clarity }));
  }, []);

  const handleRecurringChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, isRecurring: e.target.checked }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateDreamForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '提交失败，请重试');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 梦境内容输入 - 大毛玻璃容器 */}
      <div className="space-y-2">
        <label htmlFor="dream-content" className="block text-sm font-medium text-dream-text">
          梦境内容 <span className="text-dream-neon-pink">*</span>
        </label>
        <div className="relative">
          <textarea
            id="dream-content"
            value={formData.content}
            onChange={handleContentChange}
            placeholder="闭上眼睛，回忆你的梦境..."
            rows={7}
            className={`
              w-full px-5 py-4 rounded-2xl resize-none
              bg-white/[0.06] backdrop-blur-sm
              border transition-all duration-300
              text-dream-text placeholder-dream-text-secondary/40
              focus:outline-none focus:bg-white/[0.08]
              ${errors.content 
                ? 'border-red-400/60 focus:border-red-400' 
                : 'border-white/10 focus:border-dream-primary/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.15)]'
              }
            `}
            disabled={isLoading}
          />
          
          {/* 语音输入悬浮按钮 */}
          {showVoiceButton && (
            <button
              type="button"
              onClick={onVoiceClick}
              className="
                absolute bottom-3 right-3
                w-11 h-11 rounded-full
                flex items-center justify-center
                bg-gradient-to-br from-dream-primary/80 to-dream-secondary/80
                border border-white/20
                text-white text-lg
                shadow-lg shadow-dream-primary/25
                hover:shadow-xl hover:shadow-dream-primary/30
                hover:scale-105
                transition-all duration-300
                group
              "
              title="语音输入"
            >
              <span className="group-hover:scale-110 transition-transform">🎤</span>
              {/* 脉冲光环 */}
              <span className="absolute inset-0 rounded-full bg-dream-primary/30 animate-ping opacity-0 group-hover:opacity-75" />
            </button>
          )}
        </div>
        {errors.content && <p className="text-red-400 text-sm">{errors.content}</p>}
      </div>

      {/* 日期时间选择 - 毛玻璃风格 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="dream-date" className="block text-sm font-medium text-dream-text">
            梦境日期 <span className="text-dream-neon-pink">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              id="dream-date"
              value={formData.dreamDate}
              onChange={handleDateChange}
              max={getTodayDate()}
              className={`
                w-full px-4 py-3 rounded-xl
                bg-white/[0.06] backdrop-blur-sm
                border transition-all duration-300
                text-dream-text
                focus:outline-none focus:bg-white/[0.08]
                ${errors.dreamDate 
                  ? 'border-red-400/60 focus:border-red-400' 
                  : 'border-white/10 focus:border-dream-neon-cyan/50 focus:shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                }
              `}
              disabled={isLoading}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dream-text-secondary pointer-events-none">📅</span>
          </div>
          {errors.dreamDate && <p className="text-red-400 text-sm">{errors.dreamDate}</p>}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-dream-text">
            睡眠时间
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="sleep-start-time" className="block text-xs text-dream-text-secondary">
                入睡时间
              </label>
              <div className="relative">
                <input
                  type="time"
                  id="sleep-start-time"
                  value={formData.sleepStartTime}
                  onChange={handleSleepStartTimeChange}
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-white/[0.06] backdrop-blur-sm
                    border border-white/10
                    text-dream-text
                    focus:outline-none focus:bg-white/[0.08]
                    focus:border-dream-neon-purple/50 focus:shadow-[0_0_15px_rgba(191,0,255,0.15)]
                    transition-all duration-300
                  "
                  disabled={isLoading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dream-text-secondary pointer-events-none">🌙</span>
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="sleep-end-time" className="block text-xs text-dream-text-secondary">
                醒来时间
              </label>
              <div className="relative">
                <input
                  type="time"
                  id="sleep-end-time"
                  value={formData.sleepEndTime}
                  onChange={handleSleepEndTimeChange}
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-white/[0.06] backdrop-blur-sm
                    border border-white/10
                    text-dream-text
                    focus:outline-none focus:bg-white/[0.08]
                    focus:border-dream-neon-orange/50 focus:shadow-[0_0_15px_rgba(255,107,53,0.15)]
                    transition-all duration-300
                  "
                  disabled={isLoading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dream-text-secondary pointer-events-none">☀️</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 情绪标签选择 */}
      <EmotionSelector
        value={formData.emotionTag}
        onChange={handleEmotionChange}
        error={errors.emotionTag}
      />

      {/* 清晰度评分 */}
      <ClarityRating
        value={formData.clarity}
        onChange={handleClarityChange}
        error={errors.clarity}
      />

      {/* 重复梦境复选框 */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="checkbox"
            id="is-recurring"
            checked={formData.isRecurring}
            onChange={handleRecurringChange}
            className="
              w-5 h-5 rounded-md appearance-none cursor-pointer
              bg-white/[0.06] border border-white/20
              checked:bg-gradient-to-br checked:from-dream-primary checked:to-dream-secondary
              checked:border-dream-primary/50
              focus:outline-none focus:ring-2 focus:ring-dream-primary/30
              transition-all duration-300
            "
            disabled={isLoading}
          />
          {formData.isRecurring && (
            <span className="absolute inset-0 flex items-center justify-center text-white text-xs pointer-events-none">✓</span>
          )}
        </div>
        <label htmlFor="is-recurring" className="text-sm text-dream-text cursor-pointer">
          这是重复出现的梦境
        </label>
      </div>

      {/* 提交错误提示 */}
      {submitError && (
        <div className="glass-card p-3 border-red-500/50 text-red-400 text-sm">
          {submitError}
        </div>
      )}

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={isLoading}
        className={`
          w-full py-3.5 px-6 rounded-xl font-medium text-white
          transition-all duration-300
          ${isLoading
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-dream-primary to-dream-secondary hover:shadow-lg hover:shadow-dream-primary/30 hover:-translate-y-0.5'
          }
        `}
      >
        {isLoading ? '保存中...' : '✨ 保存梦境'}
      </button>
    </form>
  );
}

export type { DreamFormData, FormErrors, DreamInputFormProps };
