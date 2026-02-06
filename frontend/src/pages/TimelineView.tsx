import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ConstellationMap } from '../components/ConstellationMap';
import { FilterPanel } from '../components/Timeline';
import type { DreamPreview } from '../../../shared/types/dream';
import type { DreamFilters, DreamListResponse } from '../../../shared/types/api';
import { API_BASE_URL } from '../utils';

export function TimelineView() {
  const navigate = useNavigate();
  const [dreams, setDreams] = useState<DreamPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DreamFilters>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'single' | 'batch'; ids: string[] } | null>(null);

  const fetchDreams = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '100');

      if (filters.dateRange) {
        params.set('startDate', filters.dateRange.start);
        params.set('endDate', filters.dateRange.end);
      }
      if (filters.emotions && filters.emotions.length > 0) {
        filters.emotions.forEach((e) => params.append('emotions', e));
      }
      if (filters.clarityMin) {
        params.set('clarityMin', String(filters.clarityMin));
      }
      if (filters.clarityMax) {
        params.set('clarityMax', String(filters.clarityMax));
      }

      const response = await fetch(`${API_BASE_URL}/api/dreams?${params}`);
      
      if (!response.ok) {
        throw new Error('获取梦境列表失败');
      }

      const result: DreamListResponse = await response.json();
      setDreams(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDreams();
  }, [fetchDreams]);

  const handleDreamClick = (id: string) => {
    navigate(`/dreams/${id}`);
  };

  const handleDeleteDream = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dreams/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDreams(dreams.filter(d => d.id !== id));
        setSelectedIds(selectedIds.filter(i => i !== id));
      }
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleBatchDelete = async (ids: string[]) => {
    setDeleteConfirm({ type: 'batch', ids });
  };

  const confirmBatchDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/dreams/batch-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: deleteConfirm.ids }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setDreams(dreams.filter(d => !result.deleted.includes(d.id)));
        setSelectedIds([]);
        setSelectionMode(false);
      }
    } catch (err) {
      console.error('批量删除失败:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedIds([]);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between gap-4 border-b border-white/5"
        style={{ background: 'rgba(10, 10, 20, 0.8)' }}>
        {/* 左侧：标题和导航 */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold stardust-title">仿生星图</h1>
          </div>
          <nav 
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Link to="/" className="px-3 py-1 text-sm font-light text-gray-400 hover:text-gray-200 rounded-lg transition-all hover:bg-white/5">
              首页
            </Link>
            <button
              onClick={toggleSelectionMode}
              className={`px-3 py-1 text-sm font-light rounded-lg transition-all ${
                selectionMode ? 'text-white bg-white/10' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {selectionMode ? '取消选择' : '批量管理'}
            </button>
            <Link to="/calendar" className="px-3 py-1 text-sm font-light text-gray-400 hover:text-gray-200 rounded-lg transition-all hover:bg-white/5">
              日历
            </Link>
          </nav>
          {/* 筛选和记录梦境 */}
          <FilterPanel filters={filters} onFiltersChange={setFilters} />
          <Link to="/record" className="aurora-btn px-4 py-2 text-sm font-medium text-white rounded-lg">
            记录梦境
          </Link>
          {/* 搜索框 */}
          <div className="relative w-56">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索梦境..."
              className="w-full px-4 py-2 pl-9 rounded-lg text-white placeholder-gray-500 text-sm"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchKeyword && (
              <button onClick={() => setSearchKeyword('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex-shrink-0 mx-4 mt-2 p-3 rounded-xl border border-red-500/20" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
          <p className="text-red-400 text-sm">{error} <button onClick={fetchDreams} className="ml-2 underline">重试</button></p>
        </div>
      )}

      {/* 星座图画布 - 填满剩余空间 */}
      <div 
        className="flex-1 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(30, 20, 50, 0.8) 0%, rgba(10, 10, 20, 0.95) 100%)',
        }}
      >
        <ConstellationMap
          dreams={dreams}
          filters={filters}
          searchKeyword={searchKeyword}
          onDreamClick={handleDreamClick}
          onDreamDelete={handleDeleteDream}
          onBatchDelete={handleBatchDelete}
          isLoading={isLoading}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {/* 批量删除确认弹窗 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="max-w-sm w-full mx-4 p-6 rounded-2xl"
            style={{
              background: 'rgba(20, 20, 35, 0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
            <h3 className="text-lg font-light text-gray-200 mb-4">确认删除</h3>
            <p className="text-gray-400 text-sm mb-6">确定要删除选中的 {deleteConfirm.ids.length} 颗记忆星尘吗？此操作不可撤销。</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/5 transition-colors">
                取消
              </button>
              <button onClick={confirmBatchDelete} className="px-4 py-2 text-sm bg-red-500/60 hover:bg-red-500/80 text-white rounded-xl transition-colors">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
