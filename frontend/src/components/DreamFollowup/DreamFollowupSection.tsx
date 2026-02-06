import { useState, useCallback } from 'react';
import { AddFollowupModal } from './AddFollowupModal';
import { API_BASE_URL } from '../../utils';
import type { DreamFollowup } from '../../../../shared/types/dream';

interface DreamFollowupSectionProps {
  dreamId: string;
  followups?: DreamFollowup[];
  onFollowupAdded: () => void;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DreamFollowupSection({ dreamId, followups = [], onFollowupAdded }: DreamFollowupSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFollowup = useCallback(async (data: { content: string; cameTrue: boolean; followupDate: string }) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dreams/${dreamId}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '添加失败');
      }

      onFollowupAdded();
    } finally {
      setIsLoading(false);
    }
  }, [dreamId, onFollowupAdded]);

  const handleDeleteFollowup = useCallback(async (followupId: string) => {
    if (!confirm('确定要删除这条关联记录吗？')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/followups/${followupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      onFollowupAdded();
    } catch (error) {
      console.error('Delete followup failed:', error);
    }
  }, [onFollowupAdded]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-dream-text flex items-center gap-2">
          <span>🔗</span>
          后续关联
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="glass-btn px-4 py-2 text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加关联
        </button>
      </div>

      {followups.length === 0 ? (
        <div className="text-center py-8 text-dream-text-secondary">
          <p className="mb-2">暂无后续关联记录</p>
          <p className="text-sm">记录这个梦境与现实的关联，例如：这个梦境后来成真了吗？</p>
        </div>
      ) : (
        <div className="space-y-3">
          {followups.map((followup) => (
            <div
              key={followup.id}
              className={`glass-card p-4 ${
                followup.cameTrue
                  ? 'border-dream-neon-cyan/30'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm px-2 py-0.5 rounded-full border ${
                      followup.cameTrue
                        ? 'bg-dream-neon-cyan/10 text-dream-neon-cyan border-dream-neon-cyan/30'
                        : 'bg-white/5 text-dream-text-secondary border-white/10'
                    }`}>
                      {followup.cameTrue ? '✓ 已成真' : '○ 未成真'}
                    </span>
                    <span className="text-sm text-dream-text-secondary">
                      {formatDate(followup.followupDate)}
                    </span>
                  </div>
                  <p className="text-dream-text">{followup.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteFollowup(followup.id)}
                  className="text-dream-text-secondary hover:text-red-400 transition-colors p-1"
                  title="删除"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddFollowupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddFollowup}
        isLoading={isLoading}
      />
    </div>
  );
}
