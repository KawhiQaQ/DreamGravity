/**
 * Request Validation Middleware
 * Validates dream creation and update requests
 */
import { Request, Response, NextFunction } from 'express';
import { EMOTION_TAGS, CLARITY_MIN, CLARITY_MAX } from '../../../shared/types/dream';
import type { EmotionTag, ClarityRating } from '../../../shared/types/dream';

/**
 * Validation error details
 */
interface ValidationErrors {
  [field: string]: string;
}

/**
 * Check if a string is blank (empty or whitespace only)
 */
function isBlank(value: unknown): boolean {
  if (typeof value !== 'string') return true;
  return value.trim().length === 0;
}

/**
 * Check if value is a valid emotion tag
 */
function isValidEmotionTag(value: unknown): value is EmotionTag {
  return typeof value === 'string' && EMOTION_TAGS.includes(value as EmotionTag);
}

/**
 * Check if value is a valid clarity rating (1-5)
 */
function isValidClarity(value: unknown): value is ClarityRating {
  if (typeof value !== 'number') return false;
  return Number.isInteger(value) && value >= CLARITY_MIN && value <= CLARITY_MAX;
}

/**
 * Check if value is a valid date string
 */
function isValidDateString(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Middleware to validate dream creation request
 * Validates: content (non-blank), emotionTag (enum), clarity (1-5), dreamDate (valid date)
 */
export function validateCreateDream(req: Request, res: Response, next: NextFunction): void {
  const errors: ValidationErrors = {};
  const { content, emotionTag, clarity, dreamDate, isRecurring } = req.body;

  // Validate content - required and non-blank
  if (content === undefined || content === null) {
    errors.content = 'Content is required';
  } else if (isBlank(content)) {
    errors.content = 'Content cannot be blank or whitespace only';
  }

  // Validate emotionTag - required and must be valid enum
  if (emotionTag === undefined || emotionTag === null) {
    errors.emotionTag = 'Emotion tag is required';
  } else if (!isValidEmotionTag(emotionTag)) {
    errors.emotionTag = `Emotion tag must be one of: ${EMOTION_TAGS.join(', ')}`;
  }

  // Validate clarity - required and must be 1-5
  if (clarity === undefined || clarity === null) {
    errors.clarity = 'Clarity rating is required';
  } else if (!isValidClarity(clarity)) {
    errors.clarity = `Clarity must be an integer between ${CLARITY_MIN} and ${CLARITY_MAX}`;
  }

  // Validate dreamDate - required and must be valid date
  if (dreamDate === undefined || dreamDate === null) {
    errors.dreamDate = 'Dream date is required';
  } else if (!isValidDateString(dreamDate)) {
    errors.dreamDate = 'Dream date must be a valid date string';
  }

  // Validate isRecurring - must be boolean if provided
  if (isRecurring !== undefined && typeof isRecurring !== 'boolean') {
    errors.isRecurring = 'isRecurring must be a boolean';
  }

  // Return validation errors if any
  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      error: 'validation_error',
      message: 'Request validation failed',
      details: errors,
    });
    return;
  }

  next();
}

/**
 * Middleware to validate dream update request
 * All fields are optional, but if provided must be valid
 */
export function validateUpdateDream(req: Request, res: Response, next: NextFunction): void {
  const errors: ValidationErrors = {};
  const { content, emotionTag, clarity, dreamDate, isRecurring } = req.body;

  // Validate content - if provided, must not be blank
  if (content !== undefined && content !== null) {
    if (isBlank(content)) {
      errors.content = 'Content cannot be blank or whitespace only';
    }
  }

  // Validate emotionTag - if provided, must be valid enum
  if (emotionTag !== undefined && emotionTag !== null) {
    if (!isValidEmotionTag(emotionTag)) {
      errors.emotionTag = `Emotion tag must be one of: ${EMOTION_TAGS.join(', ')}`;
    }
  }

  // Validate clarity - if provided, must be 1-5
  if (clarity !== undefined && clarity !== null) {
    if (!isValidClarity(clarity)) {
      errors.clarity = `Clarity must be an integer between ${CLARITY_MIN} and ${CLARITY_MAX}`;
    }
  }

  // Validate dreamDate - if provided, must be valid date
  if (dreamDate !== undefined && dreamDate !== null) {
    if (!isValidDateString(dreamDate)) {
      errors.dreamDate = 'Dream date must be a valid date string';
    }
  }

  // Validate isRecurring - if provided, must be boolean
  if (isRecurring !== undefined && typeof isRecurring !== 'boolean') {
    errors.isRecurring = 'isRecurring must be a boolean';
  }

  // Return validation errors if any
  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      error: 'validation_error',
      message: 'Request validation failed',
      details: errors,
    });
    return;
  }

  next();
}
