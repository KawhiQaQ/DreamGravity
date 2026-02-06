import { EMOTION_TAGS, CLARITY_MIN, CLARITY_MAX } from '../../../shared/types/dream';
import type { EmotionTag } from '../../../shared/types/dream';

/**
 * 验证错误类型
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * 检查字符串是否为空白（空字符串、纯空格、纯制表符等）
 */
export function isBlankString(value: string): boolean {
  return !value || value.trim().length === 0;
}

/**
 * 验证梦境内容
 * - 不能为空白
 */
export function validateDreamContent(content: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (isBlankString(content)) {
    errors.push({
      field: 'content',
      message: '请输入梦境内容',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证梦境日期
 * - 不能为空
 * - 不能是未来日期
 */
export function validateDreamDate(dateString: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!dateString) {
    errors.push({
      field: 'dreamDate',
      message: '请选择梦境日期',
    });
    return { valid: false, errors };
  }

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (isNaN(date.getTime())) {
    errors.push({
      field: 'dreamDate',
      message: '日期格式无效',
    });
  } else if (date > today) {
    errors.push({
      field: 'dreamDate',
      message: '梦境日期不能是未来日期',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证情绪标签
 * - 必须是有效的情绪标签值
 */
export function validateEmotionTag(emotionTag: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!EMOTION_TAGS.includes(emotionTag as EmotionTag)) {
    errors.push({
      field: 'emotionTag',
      message: '请选择有效的情绪标签',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证清晰度评分
 * - 必须在 1-5 范围内
 */
export function validateClarity(clarity: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof clarity !== 'number' || !Number.isInteger(clarity)) {
    errors.push({
      field: 'clarity',
      message: '清晰度必须是整数',
    });
  } else if (clarity < CLARITY_MIN || clarity > CLARITY_MAX) {
    errors.push({
      field: 'clarity',
      message: `清晰度必须在 ${CLARITY_MIN}-${CLARITY_MAX} 之间`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 梦境表单数据接口
 */
export interface DreamFormInput {
  content: string;
  dreamDate: string;
  sleepStartTime?: string;
  sleepEndTime?: string;
  emotionTag: string;
  clarity: number;
  isRecurring: boolean;
}

/**
 * 验证完整的梦境表单
 */
export function validateDreamForm(data: DreamFormInput): ValidationResult {
  const allErrors: ValidationError[] = [];

  // 验证内容
  const contentResult = validateDreamContent(data.content);
  allErrors.push(...contentResult.errors);

  // 验证日期
  const dateResult = validateDreamDate(data.dreamDate);
  allErrors.push(...dateResult.errors);

  // 验证情绪标签
  const emotionResult = validateEmotionTag(data.emotionTag);
  allErrors.push(...emotionResult.errors);

  // 验证清晰度
  const clarityResult = validateClarity(data.clarity);
  allErrors.push(...clarityResult.errors);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * 将验证错误数组转换为字段映射
 */
export function errorsToFieldMap(errors: ValidationError[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const error of errors) {
    if (!map[error.field]) {
      map[error.field] = error.message;
    }
  }
  return map;
}
