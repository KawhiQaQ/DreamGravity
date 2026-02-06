/**
 * 梦境周报 - 周报生成页面
 * 专注于周报生成功能，已生成的周报跳转到星际长廊查看
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import type { WeeklyReportWithIP, WeekInfo, WeeksListResponse } from '../../../shared/types';

export default function WeeklyReportPage() {
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [reports, setReports] = useState<WeeklyReportWithIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingWeek, setGeneratingWeek] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeeks();
  }, []);

  const loadWeeks = async () => {
    setLoading(true);
    try {
      const result = await apiFetch<WeeksListResponse>('/api/weekly-reports/weeks');
      setWeeks(result.weeks);
      
      // 加载已生成周报的详情
      const generatedWeeks = result.weeks.filter(w => w.status === 'generated' && w.report);
      const reportsWithIP = await Promise.all(
        generatedWeeks.map(w => apiFetch<WeeklyReportWithIP>(`/api/weekly-reports/${w.report!.id}`))
      );
      setReports(reportsWithIP);
    } catch (err) {
      console.error('加载周列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (week: WeekInfo) => {
    setGeneratingWeek(`${week.weekStart}-${week.weekEnd}`);
    setError(null);
    try {
      // 1. 先生成周报
      const report = await apiFetch<WeeklyReportWithIP>('/api/weekly-reports/generate', {
        method: 'POST',
        body: JSON.stringify({ weekStart: week.weekStart, weekEnd: week.weekEnd })
      });
      
      // 2. 自动生成 IP 角色图片和设定
      try {
        await apiFetch(`/api/weekly-reports/${report.id}/generate-model`, {
          method: 'POST'
        });
      } catch (imgErr) {
        console.error('IP图片生成失败:', imgErr);
        // 图片生成失败不阻止跳转，用户可以稍后重试
      }
      
      // 生成成功后跳转到星际长廊
      navigate('/dream-universe');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成周报失败');
      setGeneratingWeek(null);
    }
  };

  const formatWeekRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
  };

  // 统计数据
  const generatedCount = reports.filter(r => r.ipCharacter).length;
  const pendingWeeks = weeks.filter(w => w.status === 'pending');
  const incompleteWeeks = weeks.filter(w => w.status === 'incomplete');

  return (
    <div className="min-h-screen text-dream-text">
      {/* 生成中的全屏遮罩 */}
      {generatingWeek && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-dream-neon-purple mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-2">周报生成中...</h3>
            <p className="text-dream-text-secondary mb-2">正在分析梦境数据，生成专属 IP 角色</p>
            <p className="text-sm text-dream-text-secondary/70">通常需要 20-40 秒</p>
          </div>
        </div>
      )}

      {/* 头部 */}
      <header className="glass-card rounded-none border-x-0 border-t-0 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-dream-neon-cyan hover:text-dream-neon-blue transition-colors">
                ← 返回
              </Link>
              <h1 className="text-xl font-bold gradient-text">📅 梦境周报</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 星际长廊入口 - 如果有已生成的角色 */}
        {generatedCount > 0 && (
          <Link
            to="/dream-universe"
            className="block mb-8 p-6 rounded-2xl transition-all group"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.15))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🌌</span>
                <div>
                  <h2 className="text-xl font-bold text-white group-hover:text-dream-neon-cyan transition-colors">
                    进入星际长廊
                  </h2>
                  <p className="text-dream-text-secondary">
                    查看你的 {generatedCount} 个梦境 IP 角色
                  </p>
                </div>
              </div>
              <svg className="w-6 h-6 text-dream-text-secondary group-hover:text-dream-neon-cyan group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )}

        {error && (
          <div className="mb-6 p-4 glass-card border-red-500/50 text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-dream-text-secondary">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-dream-neon-purple mx-auto mb-4" />
            加载中...
          </div>
        ) : (
          <div className="space-y-8">
            {/* 可生成的周报 */}
            {pendingWeeks.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-dream-neon-orange" />
                  可生成周报
                  <span className="text-sm font-normal text-dream-text-secondary">
                    （{pendingWeeks.length} 周）
                  </span>
                </h2>
                <div className="grid gap-4">
                  {pendingWeeks.map(week => {
                    const isGenerating = generatingWeek === `${week.weekStart}-${week.weekEnd}`;
                    return (
                      <div
                        key={`${week.weekStart}-${week.weekEnd}`}
                        className="p-5 rounded-xl glass-card border-dream-neon-orange/30 hover:border-dream-neon-orange/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg font-semibold text-dream-neon-orange">
                                {formatWeekRange(week.weekStart, week.weekEnd)}
                              </span>
                              <span className="px-2 py-0.5 text-xs rounded-full bg-dream-neon-cyan/20 text-dream-neon-cyan">
                                ✓ 7天完整
                              </span>
                            </div>
                            <p className="text-sm text-dream-text-secondary">
                              {week.dreamCount} 个梦境记录，可以生成专属 IP 角色
                            </p>
                          </div>
                          <button
                            onClick={() => generateReport(week)}
                            disabled={isGenerating}
                            className="px-5 py-2.5 bg-gradient-to-r from-dream-neon-orange to-amber-500 text-white rounded-xl disabled:opacity-50 hover:shadow-lg hover:scale-105 transition-all font-medium"
                          >
                            {isGenerating ? '生成中...' : '✨ 生成周报'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 不完整的周 */}
            {incompleteWeeks.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-dream-text-secondary/50" />
                  待补充记录
                  <span className="text-sm font-normal text-dream-text-secondary">
                    （{incompleteWeeks.length} 周）
                  </span>
                </h2>
                <div className="grid gap-3">
                  {incompleteWeeks.map(week => (
                    <div
                      key={`${week.weekStart}-${week.weekEnd}`}
                      className="p-4 rounded-xl glass-card opacity-70 border-dashed"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium text-dream-text-secondary">
                              {formatWeekRange(week.weekStart, week.weekEnd)}
                            </span>
                            <span className="text-xs text-dream-text-secondary/70">
                              {week.daysWithDreams}/7 天
                            </span>
                          </div>
                          <p className="text-xs text-dream-text-secondary/70">
                            缺少: {week.missingDays.join(', ')}
                          </p>
                        </div>
                        <span className="text-sm text-dream-text-secondary">
                          {week.dreamCount} 个梦境
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-dream-text-secondary/60 text-center">
                  💡 每天至少记录一个梦境，即可生成该周的周报
                </p>
              </section>
            )}

            {/* 空状态 */}
            {pendingWeeks.length === 0 && incompleteWeeks.length === 0 && generatedCount === 0 && (
              <div className="text-center py-16">
                <span className="text-6xl mb-4 block">🌙</span>
                <h3 className="text-xl font-semibold text-white mb-2">开始记录你的梦境</h3>
                <p className="text-dream-text-secondary mb-6">
                  连续记录一周的梦境后，即可生成专属的梦境 IP 角色
                </p>
                <Link
                  to="/record"
                  className="inline-block px-6 py-3 glass-btn rounded-xl"
                >
                  ✨ 记录今天的梦境
                </Link>
              </div>
            )}

            {/* 只有已生成的周报，没有待生成的 */}
            {pendingWeeks.length === 0 && incompleteWeeks.length === 0 && generatedCount > 0 && (
              <div className="text-center py-12">
                <span className="text-5xl mb-4 block">✅</span>
                <h3 className="text-lg font-semibold text-white mb-2">所有周报已生成</h3>
                <p className="text-dream-text-secondary mb-4">
                  继续记录梦境，下周可以生成新的周报
                </p>
                <Link
                  to="/record"
                  className="inline-block px-5 py-2 glass-btn-ghost rounded-xl text-sm"
                >
                  记录今天的梦境
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
