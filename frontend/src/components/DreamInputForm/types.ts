import type { EmotionTag, ClarityRating } from '../../../../shared/types/dream';

/**
 * 梦境表单数据
 */
export interface DreamFormData {
  content: string;
  dreamDate: string;
  sleepStartTime: string;
  sleepEndTime: string;
  emotionTag: EmotionTag;
  clarity: ClarityRating;
  isRecurring: boolean;
}

/**
 * 表单验证错误
 */
export interface FormErrors {
  content?: string;
  dreamDate?: string;
  emotionTag?: string;
  clarity?: string;
}

/**
 * 梦境输入表单组件属性
 */
export interface DreamInputFormProps {
  onSubmit: (data: DreamFormData) => Promise<void>;
  initialData?: Partial<DreamFormData>;
  isLoading?: boolean;
  /** 语音转文字回调，用于将语音内容追加到输入框 */
  onVoiceTranscript?: (transcript: string) => void;
}
