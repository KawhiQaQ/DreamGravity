import { useState, useCallback } from 'react';
import { VoiceRecorder } from '../VoiceRecorder';

interface AddFollowupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string; cameTrue: boolean; followupDate: string }) => Promise<void>;
  isLoading: boolean;
}

export function AddFollowupModal({ isOpen, onClose, onSubmit, isLoading }: AddFollowupModalProps) {
  const [content, setContent] = useState('');
  const [cameTrue, setCameTrue] = useState(false);
  const [followupDate, setFollowupDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  const handleVoiceTranscript = useCallback((text: string) => {
    setContent((prev) => prev + text);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('请输入关联内容');
      return;
    }

    try {
      await onSubmit({ content: content.trim(), cameTrue, followupDate });
      setContent('');
      setCameTrue(false);
      setFollowupDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dream-text">添加后续关联</h2>
          <button
            onClick={onClose}
            className="text-dream-text-secondary hover:text-dream-text transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-dream-text-secondary text-sm mb-4">
          记录这个梦境与现实的关联，例如：这个梦境后来成真了吗？
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 语音输入 */}
          <div>
            <VoiceRecorder
              onTranscript={handleVoiceTranscript}
              onError={(err) => console.error(err)}
              disabled={isLoading}
            />
          </div>

          {/* 关联内容 */}
          <div>
            <label className="block text-sm font-medium text-dream-text mb-2">
              关联描述
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="描述这个梦境与现实的关联..."
              className="glass-input resize-none"
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* 关联日期 */}
          <div>
            <label className="block text-sm font-medium text-dream-text mb-2">
              关联日期
            </label>
            <input
              type="date"
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              className="glass-input"
              disabled={isLoading}
            />
          </div>

          {/* 是否成真 */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={cameTrue}
                onChange={(e) => setCameTrue(e.target.checked)}
                className="sr-only peer"
                disabled={isLoading}
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-dream-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dream-neon-cyan"></div>
            </label>
            <span className="text-dream-text">这个梦境成真了</span>
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {/* 按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 glass-btn-ghost py-2"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 glass-btn py-2 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '添加中...' : '添加关联'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
