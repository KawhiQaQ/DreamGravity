/**
 * 梦境元素图谱页面
 * 使用"呼吸宇宙"组件展示梦境元素之间的关联
 * 
 * 三大核心机制：
 * 1. 语义聚合（Nebula Clustering）- 星云团聚合 + 语义变焦
 * 2. 时间切片（Time-Slicing）- 时间轴滑块
 * 3. 重力透镜（Focus Gravity）- 聚焦模式
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { BreathingUniverse } from '../components/BreathingUniverse';
import type { DreamElementGraph as GraphData, DreamElementNode, DreamElementType, ConstellationCard } from '../../../shared/types/api';

// 元素类型配置
const TYPE_CONFIG: Record<DreamElementType, { label: string; color: string; icon: string }> = {
  person: { label: '人物', color: '#8b5cf6', icon: '👤' },
  place: { label: '地点', color: '#06b6d4', icon: '📍' },
  object: { label: '物品', color: '#f59e0b', icon: '📦' },
  action: { label: '动作', color: '#10b981', icon: '⚡' },
};

export default function DreamElementGraph() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<DreamElementNode | null>(null);
  const [savedCards, setSavedCards] = useState<ConstellationCard[]>([]);
  const [showCardLibrary, setShowCardLibrary] = useState(false);
  const [viewingCard, setViewingCard] = useState<ConstellationCard | null>(null);
  const [generating, setGenerating] = useState(false);

  // 加载数据
  useEffect(() => {
    loadData();
    loadSavedCards();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await apiFetch<GraphData>('/api/element-graph');
      setGraphData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadSavedCards() {
    try {
      const cards = await apiFetch<ConstellationCard[]>('/api/element-graph/cards');
      setSavedCards(cards);
    } catch (err) {
      console.error('Failed to load saved cards:', err);
    }
  }

  // 转换梦境日期为Map
  const dreamDates = useMemo(() => {
    const map = new Map<string, Date>();
    if (graphData?.dreamDates) {
      Object.entries(graphData.dreamDates).forEach(([id, dateStr]) => {
        map.set(id, new Date(dateStr));
      });
    }
    return map;
  }, [graphData]);

  // 计算选中节点的关联数
  const selectedNodeLinkCount = useMemo(() => {
    if (!selectedNode || !graphData) return 0;
    return graphData.links.filter(l => 
      l.source === selectedNode.id || l.target === selectedNode.id
    ).length;
  }, [selectedNode, graphData]);

  // 处理节点选择
  const handleNodeSelect = useCallback((node: DreamElementNode | null) => {
    setSelectedNode(node);
  }, []);

  // 删除星座卡片
  async function deleteCard(id: string) {
    try {
      await apiFetch(`/api/element-graph/cards/${id}`, { method: 'DELETE' });
      setSavedCards(prev => prev.filter(c => c.id !== id));
      if (viewingCard?.id === id) setViewingCard(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  }

  // 生成星座图
  async function generateConstellation() {
    if (!graphData || graphData.nodes.length === 0) {
      setError('没有足够的元素数据来生成星座图');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // 获取 top 元素（按出现次数排序，取前 8 个）
      const topElements = graphData.nodes
        .slice(0, 8)
        .map(node => ({
          name: node.name,
          type: node.type,
          count: node.count,
        }));

      // 调用 AI 生成星座名称和描述
      const { name, description, prophecy } = await apiFetch<{ name: string; description: string; prophecy: string }>(
        '/api/element-graph/constellation',
        {
          method: 'POST',
          body: JSON.stringify({ elements: topElements }),
        }
      );

      // 构建星座节点（基于 top 元素在画布上的位置）
      const centerX = 150;
      const centerY = 150;
      const radius = 100;
      const nodes = topElements.map((el, i) => {
        const angle = (i / topElements.length) * Math.PI * 2 - Math.PI / 2;
        const r = radius * (0.5 + (el.count / topElements[0].count) * 0.5);
        return {
          name: el.name,
          type: el.type,
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
          size: Math.max(3, Math.min(8, el.count)),
        };
      });

      // 构建星座连线（连接相邻节点形成星座图案）
      const links = nodes.map((node, i) => {
        const nextNode = nodes[(i + 1) % nodes.length];
        return {
          source: node.name,
          x1: node.x,
          y1: node.y,
          x2: nextNode.x,
          y2: nextNode.y,
        };
      });

      // 添加一些交叉连线增加星座感
      if (nodes.length >= 4) {
        for (let i = 0; i < Math.min(3, Math.floor(nodes.length / 2)); i++) {
          const from = nodes[i];
          const to = nodes[i + Math.floor(nodes.length / 2)];
          links.push({
            source: from.name,
            x1: from.x,
            y1: from.y,
            x2: to.x,
            y2: to.y,
          });
        }
      }

      // 保存星座卡片
      const cardData = {
        name,
        description,
        prophecy,
        nodes,
        links,
        totalDreams: graphData.totalDreams,
        totalElements: graphData.totalElements,
        topElements,
      };

      const savedCard = await apiFetch<ConstellationCard>('/api/element-graph/cards', {
        method: 'POST',
        body: JSON.stringify(cardData),
      });

      // 更新本地状态并显示新卡片
      setSavedCards(prev => [savedCard, ...prev]);
      setViewingCard(savedCard);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成星座图失败');
    } finally {
      setGenerating(false);
    }
  }

  // 下载星座卡片
  async function downloadCard() {
    if (!viewingCard) return;
    try {
      const response = await apiFetch<{ imageUrl: string; filename: string }>('/api/exports/constellation', {
        method: 'POST',
        body: JSON.stringify(viewingCard),
      });
      const link = document.createElement('a');
      link.href = response.imageUrl;
      link.download = `${viewingCard.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('下载失败:', err);
      setError('下载失败，请重试');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-dream-neon-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-dream-text">加载图谱数据...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-dream-text flex flex-col">
      {/* 头部 */}
      <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-dream-neon-cyan hover:text-dream-neon-blue transition-colors flex items-center gap-2">
            <span>←</span> 返回首页
          </Link>
          <h1 className="text-lg font-semibold gradient-text">
            🌌 呼吸宇宙 · 梦境元素图谱
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={generateConstellation}
              disabled={generating || !graphData || graphData.nodes.length === 0}
              className="text-sm px-3 py-1 rounded-full glass-btn flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <span className="w-3 h-3 border-2 border-dream-neon-purple border-t-transparent rounded-full animate-spin" />
                  生成中...
                </>
              ) : (
                <>✨ 生成星座图</>
              )}
            </button>
            <button
              onClick={() => setShowCardLibrary(true)}
              className="text-sm px-3 py-1 rounded-full glass-btn-ghost flex items-center gap-1"
            >
              🌌 梦境银河系 ({savedCards.length})
            </button>
            <span className="text-sm text-dream-text-secondary">
              {graphData?.totalElements || 0} 元素 · {graphData?.links.length || 0} 关联
            </span>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-4 glass-card border-red-500/30 p-4 text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-sm underline">关闭</button>
        </div>
      )}

      {/* 主内容区 */}
      <main className="flex-1 relative">
        {graphData && (
          <BreathingUniverse
            nodes={graphData.nodes}
            links={graphData.links}
            dreamDates={dreamDates}
            onNodeSelect={handleNodeSelect}
            className="w-full h-[calc(100vh-60px)]"
          />
        )}

        {/* 选中节点详情 */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 w-80 glass-card p-4 z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${TYPE_CONFIG[selectedNode.type].color}30` }}
                >
                  {TYPE_CONFIG[selectedNode.type].icon}
                </span>
                <div>
                  <h4 className="font-semibold text-lg">{selectedNode.name}</h4>
                  <p className="text-sm text-dream-text-secondary">{TYPE_CONFIG[selectedNode.type].label}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-dream-text-secondary hover:text-dream-text transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-xl font-bold" style={{ color: TYPE_CONFIG[selectedNode.type].color }}>
                  {selectedNode.count}
                </div>
                <div className="text-xs text-dream-text-secondary">出现次数</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-dream-neon-cyan">
                  {selectedNodeLinkCount}
                </div>
                <div className="text-xs text-dream-text-secondary">关联元素</div>
              </div>
            </div>
            <div className="text-xs text-dream-text-secondary">
              出现在 {selectedNode.dreamIds.length} 个梦境中
            </div>
          </div>
        )}
      </main>

      {/* 卡片库弹窗 - 梦境银河系 */}
      {showCardLibrary && (
        <div className="fixed inset-0 flex items-center justify-center z-30 p-4">
          {/* 全息投影背景 */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.95) 70%, rgba(0, 0, 0, 0.98) 100%)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setShowCardLibrary(false)}
          />
          
          {/* 流光边框容器 */}
          <div 
            className="relative max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(88, 28, 135, 0.2) 50%, rgba(15, 23, 42, 0.4) 100%)',
              border: '1px solid transparent',
              backgroundClip: 'padding-box',
            }}
          >
            {/* 流光边框动画 */}
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), rgba(6, 182, 212, 0.5), transparent)',
                backgroundSize: '200% 100%',
                animation: 'flowingBorder 3s linear infinite',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                padding: '1px',
              }}
            />
            
            <div className="relative p-6 backdrop-blur-xl">
              {/* 标题区 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🌌</span>
                  <div>
                    <h2 
                      className="text-2xl font-bold"
                      style={{
                        fontFamily: '"Noto Serif SC", "Source Han Serif CN", serif',
                        background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #7dd3fc 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 0 30px rgba(139, 92, 246, 0.5)',
                      }}
                    >
                      梦境银河系
                    </h2>
                    <p className="text-xs text-dream-text-secondary mt-0.5">Dream Galaxy · {savedCards.length} 张星图</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCardLibrary(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-dream-text-secondary hover:text-white transition-all flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* 卡片网格 */}
              <div className="flex-1 overflow-y-auto max-h-[calc(90vh-120px)] pr-2 custom-scrollbar">
                {savedCards.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4 opacity-50">✨</div>
                    <p className="text-dream-text-secondary">银河系中尚无星图</p>
                    <p className="text-sm text-dream-text-secondary/60 mt-2">生成你的第一张梦境星座卡片</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedCards.map((card, cardIndex) => (
                      <div
                        key={card.id}
                        className="group relative cursor-pointer"
                        onClick={() => setViewingCard(card)}
                        style={{
                          animation: `cardFadeIn 0.5s ease-out ${cardIndex * 0.1}s both`,
                        }}
                      >
                        {/* 塔罗牌样式卡片 */}
                        <div 
                          className="relative rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1"
                          style={{
                            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          {/* 删除按钮 */}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              deleteCard(card.id);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 hover:bg-red-500/60 text-white/50 hover:text-white text-xs opacity-0 group-hover:opacity-100 transition-all z-10 flex items-center justify-center"
                          >
                            ✕
                          </button>

                          {/* 星座图区域 */}
                          <div className="relative p-4 pb-2">
                            <svg 
                              width="100%" 
                              height="140" 
                              viewBox="50 50 200 200"
                              preserveAspectRatio="xMidYMid meet"
                              className="overflow-visible"
                            >
                              {/* 星尘背景 */}
                              {Array.from({ length: 30 }).map((_, i) => {
                                const seed = i * 137.5 + cardIndex * 50;
                                return (
                                  <circle
                                    key={`dust-${i}`}
                                    cx={50 + (seed * 7) % 200}
                                    cy={50 + (seed * 11) % 200}
                                    r={((seed * 3) % 10) / 10 + 0.5}
                                    fill="white"
                                    opacity={((seed * 5) % 20) / 100 + 0.05}
                                    style={{
                                      animation: `twinkle ${2 + (seed % 3)}s ease-in-out infinite`,
                                      animationDelay: `${(seed % 2)}s`,
                                    }}
                                  />
                                );
                              })}
                              
                              {/* 星座连线 - 发光效果 */}
                              {card.links.map((link, i) => (
                                <g key={`link-${i}`}>
                                  {/* 光晕 */}
                                  <line
                                    x1={link.x1}
                                    y1={link.y1}
                                    x2={link.x2}
                                    y2={link.y2}
                                    stroke="url(#cardLineGlow)"
                                    strokeWidth="8"
                                    strokeOpacity="0.3"
                                    strokeLinecap="round"
                                  />
                                  {/* 主线 */}
                                  <line
                                    x1={link.x1}
                                    y1={link.y1}
                                    x2={link.x2}
                                    y2={link.y2}
                                    stroke="url(#cardLineGradient)"
                                    strokeWidth="3"
                                    strokeOpacity="0.8"
                                    strokeLinecap="round"
                                  />
                                </g>
                              ))}
                              
                              {/* 星星节点 */}
                              {card.nodes.map((node, i) => {
                                const nodeColor = TYPE_CONFIG[node.type].color;
                                return (
                                  <g key={`node-${i}`}>
                                    {/* 主星 */}
                                    <circle
                                      cx={node.x}
                                      cy={node.y}
                                      r={node.size * 2}
                                      fill={nodeColor}
                                      style={{ 
                                        filter: `drop-shadow(0 0 ${node.size * 4}px ${nodeColor})`,
                                      }}
                                    />
                                    {/* 中心亮点 */}
                                    <circle
                                      cx={node.x}
                                      cy={node.y}
                                      r={node.size * 0.7}
                                      fill="white"
                                      opacity="0.9"
                                    />
                                  </g>
                                );
                              })}
                              
                              {/* 渐变定义 */}
                              <defs>
                                <linearGradient id="cardLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#a78bfa" />
                                  <stop offset="100%" stopColor="#7dd3fc" />
                                </linearGradient>
                                <linearGradient id="cardLineGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#8b5cf6" />
                                  <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>

                          {/* 卡片信息区 */}
                          <div className="px-4 pb-4 text-center">
                            {/* 星座名称 - 衬线体 */}
                            <h3 
                              className="text-xl mb-1"
                              style={{
                                fontFamily: '"Noto Serif SC", "Source Han Serif CN", "STSong", serif',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #e9d5ff 0%, #c4b5fd 50%, #a5f3fc 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '0.1em',
                              }}
                            >
                              {card.name}
                            </h3>

                            {/* 统计信息 */}
                            <div className="flex justify-center gap-3 text-xs text-dream-text-secondary/70 mb-2">
                              <span>🌙 {card.totalDreams}</span>
                              <span>✨ {card.totalElements}</span>
                            </div>

                            {/* 日期 */}
                            <div className="text-xs text-dream-text-secondary/40">
                              {new Date(card.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 查看卡片详情 - 塔罗牌风格 */}
      {viewingCard && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-40 p-6"
          onClick={() => setViewingCard(null)}
        >
          {/* 全息背景 */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(30, 58, 138, 0.5) 0%, rgba(15, 23, 42, 0.95) 60%, rgba(0, 0, 0, 0.98) 100%)',
              backdropFilter: 'blur(12px)',
            }}
          />
          
          <div 
            className="relative"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: 'calc(100vh - 48px)' }}
          >
            {/* 塔罗牌卡片 */}
            <div 
              className="relative rounded-2xl overflow-hidden"
              style={{
                width: '320px',
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                boxShadow: '0 0 60px rgba(139, 92, 246, 0.2), 0 0 100px rgba(6, 182, 212, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setViewingCard(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/30 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-all flex items-center justify-center text-sm backdrop-blur-sm"
              >
                ✕
              </button>

              {/* 星座图区域 - 缩小高度 */}
              <div className="relative px-4 pt-4 pb-2">
                <svg
                  width="100%"
                  height="160"
                  viewBox="0 0 300 300"
                  preserveAspectRatio="xMidYMid meet"
                  className="mx-auto"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))' }}
                >
                  {/* 星尘背景 */}
                  {Array.from({ length: 40 }).map((_, i) => {
                    const seed = i * 137.5;
                    return (
                      <circle
                        key={`bg-star-${i}`}
                        cx={(seed * 7) % 300}
                        cy={(seed * 11) % 300}
                        r={((seed * 3) % 15) / 10 + 0.3}
                        fill="white"
                        opacity={((seed * 5) % 30) / 100 + 0.1}
                        style={{
                          animation: `twinkle ${2 + (seed % 3)}s ease-in-out infinite`,
                          animationDelay: `${(seed % 2)}s`,
                        }}
                      />
                    );
                  })}

                  {/* 星座连线 */}
                  {viewingCard.links.map((link, i) => (
                    <g key={`link-${i}`}>
                      <line
                        x1={link.x1}
                        y1={link.y1}
                        x2={link.x2}
                        y2={link.y2}
                        stroke="url(#detailLineGlow)"
                        strokeWidth="6"
                        strokeOpacity="0.3"
                        strokeLinecap="round"
                      />
                      <line
                        x1={link.x1}
                        y1={link.y1}
                        x2={link.x2}
                        y2={link.y2}
                        stroke="url(#detailLineGradient)"
                        strokeWidth="2"
                        strokeOpacity="0.9"
                        strokeLinecap="round"
                      />
                    </g>
                  ))}
                  
                  <defs>
                    <linearGradient id="detailLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#7dd3fc" />
                    </linearGradient>
                    <linearGradient id="detailLineGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>

                  {/* 星星节点 */}
                  {viewingCard.nodes.map((node, i) => {
                    const nodeColor = TYPE_CONFIG[node.type].color;
                    return (
                      <g key={`node-${i}`}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={node.size * 1.5}
                          fill={nodeColor}
                          style={{ filter: `drop-shadow(0 0 ${node.size * 4}px ${nodeColor})` }}
                        />
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={node.size * 0.5}
                          fill="white"
                          opacity="0.9"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>              {/* 卡片信息区 - 更紧凑 */}
              <div className="px-5 pb-4">
                {/* 星座名称 */}
                <div className="text-center mb-2">
                  <h2 
                    className="text-2xl mb-1"
                    style={{
                      fontFamily: '"Noto Serif SC", "Source Han Serif CN", "STSong", serif',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #f5d0fe 0%, #c4b5fd 40%, #a5f3fc 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '0.15em',
                    }}
                  >
                    {viewingCard.name}
                  </h2>
                  <p className="text-xs text-dream-text-secondary/70 leading-relaxed">
                    {viewingCard.description}
                  </p>
                </div>

                {/* 预言 */}
                {viewingCard.prophecy && (
                  <div 
                    className="mb-3 p-2.5 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                    }}
                  >
                    <div className="text-xs text-dream-neon-cyan/80 mb-0.5">🔮 预言</div>
                    <p 
                      className="text-xs leading-relaxed"
                      style={{
                        fontFamily: '"Noto Serif SC", serif',
                        fontStyle: 'italic',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      "{viewingCard.prophecy}"
                    </p>
                  </div>
                )}

                {/* 元素标签 */}
                <div className="flex flex-wrap gap-1 justify-center mb-3">
                  {viewingCard.topElements.slice(0, 5).map((el, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: `${TYPE_CONFIG[el.type].color}15`,
                        color: TYPE_CONFIG[el.type].color,
                        border: `1px solid ${TYPE_CONFIG[el.type].color}30`,
                      }}
                    >
                      {el.name}
                    </span>
                  ))}
                </div>

                {/* 统计 + 日期 一行显示 */}
                <div className="flex items-center justify-center gap-4 text-xs text-dream-text-secondary/60 mb-3">
                  <span>🌙 {viewingCard.totalDreams} 梦境</span>
                  <span>✨ {viewingCard.totalElements} 元素</span>
                  <span>{new Date(viewingCard.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>

                {/* 下载按钮 */}
                <button
                  onClick={downloadCard}
                  className="w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all hover:brightness-110"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  📥 下载星图
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 银河系弹窗动画样式 */}
      <style>{`
        @keyframes flowingBorder {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        
        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.6; }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
