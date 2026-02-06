/**
 * 集体潜意识池页面 - 漂流瓶风格重构
 * 瀑布流布局 + 融合底座 + 星云筛选器 + 全息卷轴故事展示
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import type { CollectiveDream, CollectiveDreamsResponse, DreamUniverseStory, DreamUniverseStoriesResponse } from '../../../shared/types';
import { EmotionTagLabels, EMOTION_TAGS, type EmotionTag } from '../../../shared/types';

const MAX_SELECTION = 5;

// 故事氛围类型配置
const STORY_AMBIENCE: Record<string, {
  keywords: string[];
  colors: string[];
  gradient: string;
  particleColor: string;
}> = {
  adventure: {
    keywords: ['冒险', '探索', '旅途', '勇士', '宝藏', '远方', '征途', '英雄'],
    colors: ['#f59e0b', '#d97706', '#b45309'],
    gradient: 'radial-gradient(ellipse at 30% 20%, rgba(245, 158, 11, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(217, 119, 6, 0.1) 0%, transparent 50%)',
    particleColor: '#f59e0b',
  },
  mystery: {
    keywords: ['神秘', '迷雾', '暗影', '秘密', '未知', '深渊', '谜团', '隐藏'],
    colors: ['#6366f1', '#4f46e5', '#4338ca'],
    gradient: 'radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(79, 70, 229, 0.08) 0%, transparent 40%)',
    particleColor: '#6366f1',
  },
  horror: {
    keywords: ['恐惧', '黑暗', '噩梦', '阴森', '诡异', '幽灵', '死亡', '血'],
    colors: ['#1f2937', '#111827', '#030712'],
    gradient: 'radial-gradient(ellipse at 50% 100%, rgba(31, 41, 55, 0.3) 0%, transparent 70%), radial-gradient(ellipse at 0% 0%, rgba(17, 24, 39, 0.2) 0%, transparent 50%)',
    particleColor: '#374151',
  },
  romance: {
    keywords: ['爱', '温柔', '心', '拥抱', '思念', '相遇', '缘分', '浪漫'],
    colors: ['#ec4899', '#db2777', '#be185d'],
    gradient: 'radial-gradient(ellipse at 70% 30%, rgba(236, 72, 153, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 30% 70%, rgba(219, 39, 119, 0.08) 0%, transparent 50%)',
    particleColor: '#ec4899',
  },
  fantasy: {
    keywords: ['龙', '魔法', '精灵', '仙境', '神话', '传说', '奇幻', '魔'],
    colors: ['#8b5cf6', '#7c3aed', '#6d28d9'],
    gradient: 'radial-gradient(ellipse at 40% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)',
    particleColor: '#8b5cf6',
  },
  peaceful: {
    keywords: ['宁静', '平和', '云', '天空', '海', '风', '自然', '花'],
    colors: ['#06b6d4', '#0891b2', '#0e7490'],
    gradient: 'radial-gradient(ellipse at 50% 30%, rgba(6, 182, 212, 0.1) 0%, transparent 60%), radial-gradient(ellipse at 50% 70%, rgba(8, 145, 178, 0.08) 0%, transparent 50%)',
    particleColor: '#06b6d4',
  },
  melancholy: {
    keywords: ['忧伤', '泪', '雨', '离别', '孤独', '回忆', '逝去', '遗憾'],
    colors: ['#3b82f6', '#2563eb', '#1d4ed8'],
    gradient: 'radial-gradient(ellipse at 30% 70%, rgba(59, 130, 246, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(37, 99, 235, 0.08) 0%, transparent 50%)',
    particleColor: '#3b82f6',
  },
};

// 分析故事氛围
const analyzeStoryAmbience = (title: string, content: string) => {
  const text = title + content;
  let maxScore = 0;
  let detectedAmbience = 'fantasy';
  
  for (const [ambience, config] of Object.entries(STORY_AMBIENCE)) {
    let score = 0;
    for (const keyword of config.keywords) {
      if (text.includes(keyword)) {
        score += 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      detectedAmbience = ambience;
    }
  }
  
  return STORY_AMBIENCE[detectedAmbience];
};

// 情绪对应的颜色配置
const EMOTION_COLORS: Record<string, { 
  glow: string; 
  shadow: string; 
  bg: string;
  text: string;
  bgGradient: string;
}> = {
  happy: { glow: 'rgba(251, 191, 36, 0.6)', shadow: 'rgba(251, 191, 36, 0.3)', bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(251, 191, 36, 0.15) 0%, transparent 70%)' },
  excited: { glow: 'rgba(249, 115, 22, 0.6)', shadow: 'rgba(249, 115, 22, 0.3)', bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(249, 115, 22, 0.15) 0%, transparent 70%)' },
  peaceful: { glow: 'rgba(34, 197, 94, 0.6)', shadow: 'rgba(34, 197, 94, 0.3)', bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 70%)' },
  hopeful: { glow: 'rgba(6, 182, 212, 0.6)', shadow: 'rgba(6, 182, 212, 0.3)', bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 70%)' },
  loving: { glow: 'rgba(236, 72, 153, 0.6)', shadow: 'rgba(236, 72, 153, 0.3)', bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(236, 72, 153, 0.15) 0%, transparent 70%)' },
  sad: { glow: 'rgba(59, 130, 246, 0.6)', shadow: 'rgba(59, 130, 246, 0.3)', bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 70%)' },
  anxious: { glow: 'rgba(139, 92, 246, 0.6)', shadow: 'rgba(139, 92, 246, 0.3)', bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.2) 0%, transparent 70%)' },
  angry: { glow: 'rgba(239, 68, 68, 0.6)', shadow: 'rgba(239, 68, 68, 0.3)', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(239, 68, 68, 0.15) 0%, transparent 70%)' },
  scared: { glow: 'rgba(107, 33, 168, 0.6)', shadow: 'rgba(107, 33, 168, 0.4)', bg: 'rgba(107, 33, 168, 0.2)', text: '#a855f7', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(107, 33, 168, 0.2) 0%, transparent 70%)' },
  lonely: { glow: 'rgba(99, 102, 241, 0.6)', shadow: 'rgba(99, 102, 241, 0.3)', bg: 'rgba(99, 102, 241, 0.15)', text: '#6366f1', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.2) 0%, transparent 70%)' },
  confused: { glow: 'rgba(245, 158, 11, 0.6)', shadow: 'rgba(245, 158, 11, 0.3)', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(245, 158, 11, 0.15) 0%, transparent 70%)' },
  nostalgic: { glow: 'rgba(244, 63, 94, 0.6)', shadow: 'rgba(244, 63, 94, 0.3)', bg: 'rgba(244, 63, 94, 0.15)', text: '#f43f5e', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(244, 63, 94, 0.15) 0%, transparent 70%)' },
  curious: { glow: 'rgba(20, 184, 166, 0.6)', shadow: 'rgba(20, 184, 166, 0.3)', bg: 'rgba(20, 184, 166, 0.15)', text: '#14b8a6', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(20, 184, 166, 0.15) 0%, transparent 70%)' },
  surprised: { glow: 'rgba(132, 204, 22, 0.6)', shadow: 'rgba(132, 204, 22, 0.3)', bg: 'rgba(132, 204, 22, 0.15)', text: '#84cc16', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(132, 204, 22, 0.15) 0%, transparent 70%)' },
  neutral: { glow: 'rgba(148, 163, 184, 0.6)', shadow: 'rgba(148, 163, 184, 0.3)', bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', bgGradient: 'radial-gradient(ellipse at 50% 50%, rgba(148, 163, 184, 0.15) 0%, transparent 70%)' },
};

// 全息卷轴故事卡片组件
function HolographicScrollCard({ story, onClick }: { story: DreamUniverseStory; onClick: () => void }) {
  const ambience = useMemo(() => analyzeStoryAmbience(story.title, story.storyContent), [story]);
  const firstChar = story.storyContent.trim().charAt(0);
  
  return (
    <div className="holographic-scroll-card group cursor-pointer" onClick={onClick}>
      {/* 氛围背景层 */}
      <div 
        className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-80 rounded-[32px]"
        style={{ background: ambience.gradient }}
      />
      
      {/* 超椭圆容器 */}
      <div className="crystal-tablet relative z-10 h-full flex flex-col">
        {/* 标题区 */}
        <div className="mb-4 text-center flex-shrink-0">
          <h3 
            className="scroll-title text-lg font-bold"
            style={{
              background: `linear-gradient(135deg, ${ambience.colors[0]}, ${ambience.colors[1]}, ${ambience.colors[2]})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: `drop-shadow(0 0 20px ${ambience.colors[0]}40)`,
            }}
          >
            《{story.title}》
          </h3>
        </div>
        
        {/* 故事内容预览 */}
        <div className="flex-1 overflow-hidden">
          <span className="drop-cap" style={{ color: ambience.colors[0] }}>{firstChar}</span>
          <p className="text-dream-text/90 text-sm leading-relaxed line-clamp-5">
            {story.storyContent.slice(1)}
          </p>
        </div>
        
        {/* 来源标注 */}
        <div className="flex-shrink-0 pt-3 mt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-dream-text-secondary">融合 {story.sourceDreamIds.length} 个梦境</span>
            </div>
            <span className="text-xs text-dream-text-secondary/60">
              {new Date(story.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


// 全息卷轴详情弹窗
function HolographicScrollModal({ story, onClose }: { story: DreamUniverseStory; onClose: () => void }) {
  const ambience = useMemo(() => analyzeStoryAmbience(story.title, story.storyContent), [story]);
  const firstChar = story.storyContent.trim().charAt(0);
  const restContent = story.storyContent.trim().slice(1);
  const paragraphs = restContent.split('\n').filter(p => p.trim());
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md">
        <div className="absolute inset-0 animate-ambient-flow" style={{ background: ambience.gradient, opacity: 0.4 }} />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="ambient-blob"
            style={{
              '--blob-color': ambience.colors[i],
              '--blob-delay': `${i * 5}s`,
              '--blob-x': `${20 + i * 30}%`,
              '--blob-y': `${30 + i * 20}%`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      
      {/* 全息卷轴容器 */}
      <div 
        className="holographic-scroll-modal relative max-w-3xl w-full max-h-[85vh] overflow-hidden animate-scroll-unfold"
        onClick={e => e.stopPropagation()}
      >
        <div className="scroll-edge-top" />
        
        <div className="scroll-content custom-scrollbar overflow-y-auto max-h-[calc(85vh-60px)] px-8 py-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-dream-text-secondary hover:text-white hover:bg-white/10 transition-all z-20"
          >
            ✕
          </button>
          
          {/* 标题区 */}
          <div className="text-center mb-10">
            <div className="inline-block relative">
              <div className="absolute -inset-4 opacity-30 blur-xl" style={{ background: `radial-gradient(circle, ${ambience.colors[0]} 0%, transparent 70%)` }} />
              <h2 
                className="scroll-modal-title relative text-3xl font-bold tracking-wider"
                style={{
                  background: `linear-gradient(135deg, ${ambience.colors[0]}, #fff, ${ambience.colors[1]})`,
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'gradient-shift 4s ease infinite',
                }}
              >
                《{story.title}》
              </h2>
            </div>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/30" />
              <div className="w-2 h-2 rounded-full" style={{ background: ambience.colors[0], boxShadow: `0 0 10px ${ambience.colors[0]}` }} />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/30" />
            </div>
          </div>
          
          {/* 故事正文 */}
          <div className="story-body relative">
            <span className="drop-cap-large" style={{ color: ambience.colors[0], textShadow: `0 0 30px ${ambience.colors[0]}80` }}>{firstChar}</span>
            <div className="story-paragraphs text-dream-text/95 leading-loose text-base">
              {paragraphs.length > 0 ? paragraphs.map((para, i) => <p key={i} className="mb-4">{para}</p>) : <p>{restContent}</p>}
            </div>
          </div>
          
          {/* 来源标注区 */}
          <div className="mt-12 pt-6 border-t border-white/10">
            <div className="flex flex-col items-center gap-4">
              <span className="text-sm text-dream-text-secondary">此传说由 {story.sourceDreamIds.length} 个梦境碎片融合而成</span>
              <span className="text-xs text-dream-text-secondary/50">
                生成于 {new Date(story.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="scroll-edge-bottom" />
      </div>
    </div>
  );
}

export default function CollectivePool() {
  const [dreams, setDreams] = useState<CollectiveDream[]>([]);
  const [stories, setStories] = useState<DreamUniverseStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [selectedDreams, setSelectedDreams] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<DreamUniverseStory | null>(null);
  const [emotionFilter, setEmotionFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'pool' | 'stories'>('pool');
  const [error, setError] = useState<string | null>(null);
  const [viewingStory, setViewingStory] = useState<DreamUniverseStory | null>(null);
  
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadDreams(); }, [page, emotionFilter]);
  useEffect(() => { loadStories(); }, []);

  const loadDreams = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (emotionFilter) params.set('emotion', emotionFilter);
      const result = await apiFetch<CollectiveDreamsResponse>(`/api/collective/dreams?${params}`);
      setDreams(result.dreams);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError('加载梦境失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStories = async () => {
    setStoriesLoading(true);
    try {
      const result = await apiFetch<DreamUniverseStoriesResponse>('/api/collective/universe-stories?limit=20');
      setStories(result.stories);
    } catch (err) {
      console.error('加载故事失败:', err);
    } finally {
      setStoriesLoading(false);
    }
  };

  const toggleDreamSelection = (dreamId: string) => {
    setSelectedDreams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dreamId)) {
        newSet.delete(dreamId);
      } else if (newSet.size < MAX_SELECTION) {
        newSet.add(dreamId);
      }
      return newSet;
    });
  };

  const generateStory = async () => {
    if (selectedDreams.size === 0) return;
    setGenerating(true);
    setError(null);
    try {
      const story = await apiFetch<DreamUniverseStory>('/api/collective/universe-story', {
        method: 'POST',
        body: JSON.stringify({ dreamIds: Array.from(selectedDreams) })
      });
      setGeneratedStory(story);
      setSelectedDreams(new Set());
      loadStories();
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成故事失败');
    } finally {
      setGenerating(false);
    }
  };

  const getEmotionStyle = (emotion: string) => {
    const colors = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;
    return { background: colors.bg, color: colors.text, boxShadow: `0 0 12px ${colors.shadow}` };
  };

  const getCardShadowStyle = (emotion: string, isSelected: boolean) => {
    const colors = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;
    return {
      boxShadow: isSelected 
        ? `0 8px 32px ${colors.glow}, 0 0 60px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.2)`
        : `0 8px 24px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
    };
  };

  const getBackgroundStyle = () => {
    if (!emotionFilter) return {};
    const colors = EMOTION_COLORS[emotionFilter];
    return colors ? { background: colors.bgGradient } : {};
  };


  return (
    <div className="min-h-screen text-dream-text relative overflow-hidden">
      {/* 动态背景层 */}
      <div className="fixed inset-0 transition-all duration-1000 pointer-events-none z-0" style={getBackgroundStyle()} />

      {/* 头部 */}
      <header className="backdrop-blur-xl bg-dream-background/60 border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-dream-accent hover:text-dream-primary transition-colors">← 返回</Link>
              <h1 className="text-xl font-bold gradient-text">🌌 集体潜意识池</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('pool')}
                className={`px-4 py-2 rounded-full text-sm transition-all ${activeTab === 'pool' ? 'bg-white/10 border border-white/20 text-white' : 'text-dream-text-secondary hover:text-white'}`}
              >
                🌙 梦境池
              </button>
              <button
                onClick={() => setActiveTab('stories')}
                className={`px-4 py-2 rounded-full text-sm transition-all ${activeTab === 'stories' ? 'bg-white/10 border border-white/20 text-white' : 'text-dream-text-secondary hover:text-white'}`}
              >
                📖 故事集 ({stories.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-32 relative z-10">
        {error && <div className="mb-4 glass-card p-4 border-red-500/30 text-red-300">{error}</div>}

        {generatedStory && <HolographicScrollModal story={generatedStory} onClose={() => setGeneratedStory(null)} />}
        {viewingStory && <HolographicScrollModal story={viewingStory} onClose={() => setViewingStory(null)} />}

        {activeTab === 'pool' ? (
          <>
            {/* 星云气体筛选器 */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => { setEmotionFilter(''); setPage(1); }}
                  className={`nebula-filter-btn ${!emotionFilter ? 'active' : ''}`}
                  style={!emotionFilter ? { background: 'rgba(139, 92, 246, 0.3)', boxShadow: '0 0 20px rgba(139, 92, 246, 0.4), inset 0 0 20px rgba(139, 92, 246, 0.2)' } : {}}
                >
                  全部
                </button>
                {EMOTION_TAGS.map(tag => {
                  const colors = EMOTION_COLORS[tag] || EMOTION_COLORS.neutral;
                  const isActive = emotionFilter === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => { setEmotionFilter(tag); setPage(1); }}
                      className={`nebula-filter-btn ${isActive ? 'active' : ''}`}
                      style={isActive ? { background: colors.bg, boxShadow: `0 0 20px ${colors.glow}, inset 0 0 20px ${colors.shadow}`, color: colors.text } : {}}
                    >
                      {EmotionTagLabels[tag]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 梦境卡片 - 统一网格布局 */}
            {loading ? (
              <div className="text-center py-12 text-dream-text-secondary">
                <div className="inline-block w-8 h-8 border-2 border-dream-accent border-t-transparent rounded-full animate-spin" />
                <p className="mt-4">正在打捞漂流的梦境...</p>
              </div>
            ) : dreams.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-dream-text-secondary mb-4">集体潜意识池暂无梦境</p>
                <p className="text-sm text-dream-text-secondary/70">在梦境详情页点击"分享到集体潜意识池"来贡献你的梦境</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {dreams.map((dream) => {
                  const isSelected = selectedDreams.has(dream.id);
                  const colors = EMOTION_COLORS[dream.emotionTag] || EMOTION_COLORS.neutral;
                  return (
                    <div
                      key={dream.id}
                      onClick={() => toggleDreamSelection(dream.id)}
                      className={`drift-card cursor-pointer h-[200px] flex flex-col ${isSelected ? 'selected' : ''}`}
                      style={getCardShadowStyle(dream.emotionTag, isSelected)}
                    >
                      <div className="relative z-10 p-5 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3 flex-shrink-0">
                          <span className="px-3 py-1 rounded-full text-xs font-medium" style={getEmotionStyle(dream.emotionTag)}>
                            {EmotionTagLabels[dream.emotionTag as EmotionTag] || dream.emotionTag}
                          </span>
                          <span className="text-xs text-dream-neon-orange opacity-80">{'⭐'.repeat(dream.clarity)}</span>
                        </div>
                        <p className="text-sm text-dream-text leading-relaxed line-clamp-4 flex-1 overflow-hidden">{dream.content}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-dream-text-secondary flex-shrink-0">
                          <span className="flex items-center gap-1"><span className="opacity-60">👁</span> {dream.viewCount}</span>
                          {isSelected && (
                            <span className="flex items-center gap-1 font-medium" style={{ color: colors.text }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: colors.text }} /> 已选择
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ border: `2px solid ${colors.text}`, boxShadow: `inset 0 0 20px ${colors.shadow}` }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="glass-btn-ghost px-4 py-2 disabled:opacity-50 rounded-full">← 上一页</button>
                <span className="px-4 py-2 text-dream-text-secondary">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="glass-btn-ghost px-4 py-2 disabled:opacity-50 rounded-full">下一页 →</button>
              </div>
            )}
          </>
        ) : (
          /* 故事列表 */
          <div>
            {storiesLoading ? (
              <div className="text-center py-12 text-dream-text-secondary">
                <div className="inline-block w-8 h-8 border-2 border-dream-accent border-t-transparent rounded-full animate-spin" />
                <p className="mt-4">正在解码梦境宇宙档案...</p>
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block p-8 rounded-full bg-white/5 mb-4"><span className="text-4xl">📜</span></div>
                <p className="text-dream-text-secondary">暂无梦境宇宙故事</p>
                <p className="text-sm text-dream-text-secondary/70 mt-2">选择多个梦境来生成你的第一个传说</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stories.map(story => (
                  <HolographicScrollCard key={story.id} story={story} onClick={() => setViewingStory(story)} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 融合底座 */}
      {activeTab === 'pool' && (
        <div ref={dockRef} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 fusion-dock">
          <div className="flex items-center gap-4 px-6 py-4">
            {/* 能量托盘 - 槽位 1-5 */}
            <div className="flex items-center gap-2">
              {Array.from({ length: MAX_SELECTION }).map((_, i) => {
                const selectedArray = Array.from(selectedDreams);
                const dreamId = selectedArray[i];
                const dream = dreamId ? dreams.find(d => d.id === dreamId) : null;
                const colors = dream ? EMOTION_COLORS[dream.emotionTag] : null;
                
                return (
                  <div
                    key={i}
                    className={`orb-slot ${dream ? 'filled' : ''}`}
                    onClick={() => dream && toggleDreamSelection(dream.id)}
                    style={dream && colors ? {
                      background: `radial-gradient(circle, ${colors.text} 0%, transparent 70%)`,
                      boxShadow: `0 0 15px ${colors.glow}, 0 0 30px ${colors.shadow}`,
                    } : {}}
                  >
                    {!dream && <span className="text-white/20 text-xs">{i + 1}</span>}
                  </div>
                );
              })}
            </div>
            
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            
            <button
              onClick={generateStory}
              disabled={selectedDreams.size === 0 || generating}
              className={`fusion-core ${selectedDreams.size === MAX_SELECTION ? 'ready' : ''} ${generating ? 'generating' : ''}`}
            >
              <span className="fusion-core-inner">
                {generating ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="fusion-core-icon">✨</span>
                    <span className="fusion-core-text">{selectedDreams.size === 0 ? '选择梦境' : selectedDreams.size === MAX_SELECTION ? '融合！' : `${selectedDreams.size}/${MAX_SELECTION}`}</span>
                  </>
                )}
              </span>
              {selectedDreams.size === MAX_SELECTION && !generating && (
                <>
                  <span className="fusion-core-ring ring-1" />
                  <span className="fusion-core-ring ring-2" />
                  <span className="fusion-core-ring ring-3" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
