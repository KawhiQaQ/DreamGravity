import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  RecordingStatus, 
  VoiceRecorderProps, 
  SpeechRecognitionInstance,
  SpeechRecognitionConstructor,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent
} from './types';

/**
 * 检查浏览器是否支持 Web Speech API
 */
function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && 
    (window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined);
}

/**
 * 获取 SpeechRecognition 构造函数
 */
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

interface ExtendedVoiceRecorderProps extends VoiceRecorderProps {
  onClose?: () => void;
  floating?: boolean;
}

/**
 * 语音录制组件 - 圆形脉冲发光悬浮按钮
 */
export function VoiceRecorder({ 
  onTranscript, 
  onError, 
  disabled = false,
  onClose,
  floating = false,
}: ExtendedVoiceRecorderProps) {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      const error = '您的浏览器不支持语音识别功能';
      setErrorMessage(error);
      setStatus('error');
      onError?.(error);
      return;
    }

    setErrorMessage(null);
    setStatus('recording');

    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;

    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMsg = '语音识别失败';
      
      switch (event.error) {
        case 'no-speech':
          errorMsg = '未检测到语音，请重试';
          break;
        case 'audio-capture':
          errorMsg = '无法访问麦克风，请检查权限设置';
          break;
        case 'not-allowed':
          errorMsg = '麦克风权限被拒绝，请在浏览器设置中允许访问';
          break;
        case 'network':
          errorMsg = '网络错误，请检查网络连接';
          break;
        case 'aborted':
          return;
        default:
          errorMsg = `语音识别错误: ${event.error}`;
      }

      setErrorMessage(errorMsg);
      setStatus('error');
      onError?.(errorMsg);
    };

    recognition.onend = () => {
      if (status === 'recording') {
        setStatus('idle');
      }
    };

    try {
      recognition.start();
    } catch (error) {
      const errorMsg = '启动语音识别失败，请重试';
      setErrorMessage(errorMsg);
      setStatus('error');
      onError?.(errorMsg);
    }
  }, [onTranscript, onError, status]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setStatus('idle');
  }, []);

  const handleClick = useCallback(() => {
    if (status === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  }, [status, startRecording, stopRecording]);

  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    setStatus('idle');
  }, []);

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-dream-text-secondary text-sm glass-card p-3">
        <span className="text-xl">🎤</span>
        <span>您的浏览器不支持语音输入</span>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-dream-text-secondary hover:text-white">✕</button>
        )}
      </div>
    );
  }

  // 悬浮模式 - 展开的录制面板
  if (floating) {
    return (
      <div className="glass-card p-4 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-dream-text">语音输入</span>
          {onClose && (
            <button 
              onClick={onClose} 
              className="text-dream-text-secondary hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* 圆形录制按钮 */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || status === 'processing'}
            className={`
              relative w-16 h-16 rounded-full
              flex items-center justify-center
              transition-all duration-300
              ${status === 'recording'
                ? 'bg-gradient-to-br from-dream-neon-pink to-red-500 shadow-[0_0_30px_rgba(255,0,170,0.5)]'
                : 'bg-gradient-to-br from-dream-primary to-dream-secondary shadow-lg hover:shadow-xl hover:scale-105'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-label={status === 'recording' ? '停止录制' : '开始语音输入'}
          >
            {/* 脉冲动画 */}
            {status === 'recording' && (
              <>
                <span className="absolute inset-0 rounded-full bg-dream-neon-pink/50 animate-ping" />
                <span className="absolute inset-[-4px] rounded-full border-2 border-dream-neon-pink/30 animate-pulse" />
              </>
            )}
            
            {/* 图标 */}
            <span className="relative text-2xl text-white">
              {status === 'recording' ? '⏹' : '🎤'}
            </span>
          </button>
          
          {/* 状态文字 */}
          <span className={`text-sm ${status === 'recording' ? 'text-dream-neon-pink' : 'text-dream-text-secondary'}`}>
            {status === 'recording' ? '正在录制...' : '点击开始'}
          </span>
          
          {/* 声波动画 */}
          {status === 'recording' && (
            <div className="flex items-center gap-1 h-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-dream-neon-pink rounded-full"
                  style={{
                    animation: `soundwave 0.5s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                    height: '100%',
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* 错误提示 */}
        {status === 'error' && errorMessage && (
          <div className="mt-3 text-center">
            <p className="text-sm text-red-400 mb-2">{errorMessage}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="text-sm text-dream-neon-cyan hover:underline"
            >
              重试
            </button>
          </div>
        )}
        
        <style>{`
          @keyframes soundwave {
            0%, 100% { transform: scaleY(0.3); }
            50% { transform: scaleY(1); }
          }
        `}</style>
      </div>
    );
  }

  // 默认模式 - 内联按钮
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || status === 'processing'}
        className={`
          flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
          font-medium transition-all duration-300
          ${status === 'recording'
            ? 'bg-dream-neon-pink/20 border border-dream-neon-pink/50 text-dream-neon-pink shadow-[0_0_20px_rgba(255,0,170,0.3)]'
            : status === 'error'
            ? 'bg-dream-neon-orange/20 border border-dream-neon-orange/50 text-dream-neon-orange'
            : 'glass-btn-ghost hover:border-dream-neon-blue/50 hover:shadow-[0_0_15px_rgba(0,212,255,0.2)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-label={status === 'recording' ? '停止录制' : '开始语音输入'}
      >
        {status === 'recording' ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dream-neon-pink opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-dream-neon-pink"></span>
            </span>
            <span>停止录制</span>
          </>
        ) : (
          <>
            <span className="text-xl">🎤</span>
            <span>语音输入</span>
          </>
        )}
      </button>

      {status === 'recording' && (
        <span className="text-sm text-dream-neon-pink animate-pulse">
          正在录制...
        </span>
      )}

      {status === 'error' && errorMessage && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-red-400">{errorMessage}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="text-sm text-dream-neon-blue hover:text-dream-neon-cyan underline transition-colors"
          >
            重试
          </button>
        </div>
      )}
    </div>
  );
}
