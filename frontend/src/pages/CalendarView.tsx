import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar } from '../components/Calendar';
import { FilterPanel } from '../components/Timeline';
import type { DreamPreview } from '../../../shared/types/dream';
import type { DreamFilters, DreamListResponse } from '../../../shared/types/api';
import { API_BASE_URL } from '../utils';

export function CalendarView() {
  const navigate = useNavigate();
  const [dreams, setDreams] = useState<DreamPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DreamFilters>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[] } | null>(null);

  const fetchDreams = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '500');

      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);
      
      if (filters.dateRange) {
        params.set('startDate', filters.dateRange.start);
        params.set('endDate', filters.dateRange.end);
      } else {
        params.set('startDate', startDate.toISOString().split('T')[0]);
        params.set('endDate', endDate.toISOString().split('T')[0]);
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
  }, [currentMonth, filters]);

  useEffect(() => {
    fetchDreams();
  }, [fetchDreams]);

  const handleDateClick = (_date: Date, dateDreams: DreamPreview[]) => {
    if (dateDreams.length === 1) {
      navigate(`/dreams/${dateDreams[0].id}`);
    }
  };

  const handleDreamClick = (id: string) => {
    navigate(`/dreams/${id}`);
  };

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
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
    setDeleteConfirm({ ids });
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
      {/* 顶部区域 */}
      <div className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3">
        <div className="max-w-6xl mx-auto">
          {/* 页面头部 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold stardust-title mb-0.5">记忆星图</h1>
              <p className="text-xs sm:text-sm text-gray-400/70 tracking-wide">Memory Constellation · 追踪梦的星轨</p>
            </div>
            {/* 悬浮导航底座 */}
            <div className="flex items-center gap-3 flex-wrap">
              <nav 
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Link to="/" className="relative px-3 py-1 text-sm font-light text-gray-400 hover:text-gray-200 rounded-lg transition-all hover:bg-white/5">
                  首页
                </Link>
                <button
                  onClick={toggleSelectionMode}
                  className={`relative px-3 py-1 text-sm font-light rounded-lg transition-all ${
                    selectionMode ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  {selectionMode ? '取消选择' : '批量管理'}
                  {selectionMode && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
                      style={{ boxShadow: '0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.4)' }} />
                  )}
                </button>
                <Link to="/timeline" className="relative px-3 py-1 text-sm font-light text-gray-400 hover:text-gray-200 rounded-lg transition-all hover:bg-white/5">
                  星河轨迹
                </Link>
              </nav>
              
              <FilterPanel filters={filters} onFiltersChange={setFilters} />
              
              {/* 极光渐变主按钮 */}
              <Link to="/record" className="aurora-btn px-4 py-1.5 text-sm font-medium text-white rounded-xl">
                记录梦境
              </Link>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-3 p-3 rounded-xl border border-red-500/20" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <p className="text-red-400 text-sm">{error}</p>
              <button onClick={fetchDreams} className="mt-1 text-sm text-red-400 hover:text-red-300 underline">重试</button>
            </div>
          )}
        </div>
      </div>

      {/* 日历内容区域 - 填充剩余空间 */}
      <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4">
        <div className="max-w-6xl mx-auto h-full">
          <Calendar
            dreams={dreams}
            currentMonth={currentMonth}
            filters={filters}
            onDateClick={handleDateClick}
            onMonthChange={handleMonthChange}
            onDreamHover={() => {}}
            onDreamClick={handleDreamClick}
            onDreamDelete={handleDeleteDream}
            onBatchDelete={handleBatchDelete}
            isLoading={isLoading}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </div>
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
