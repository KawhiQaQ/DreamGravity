/**
 * 呼吸宇宙 - 梦境元素图谱核心组件
 * 
 * 三大核心机制：
 * 1. 语义聚合（Nebula Clustering）- 星云团聚合 + 语义变焦
 * 2. 时间切片（Time-Slicing）- 时间轴滑块
 * 3. 重力透镜（Focus Gravity）- 聚焦模式
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import type { DreamElementNode, DreamElementLink } from '../../../../shared/types/api';
import type { Nebula, UniverseNode, ViewLevel, TimeSlice, UniverseState } from './types';
import { NebulaNode } from './NebulaNode';
import { StarNode } from './StarNode';
import { TimeSlider } from './TimeSlider';
import { ViewLevelIndicator } from './ViewLevelIndicator';
import {
  createNebulae,
  expandNebula,
  applyGravityLens,
  generateTimeSliceOptions
} from './utils';
import { SEMANTIC_CATEGORIES } from './types';

interface BreathingUniverseProps {
  nodes: DreamElementNode[];
  links: DreamElementLink[];
  dreamDates: Map<string, Date>;
  onNodeSelect?: (node: DreamElementNode | null) => void;
  className?: string;
}

export function BreathingUniverse({
  nodes,
  links,
  dreamDates,
  onNodeSelect,
  className = ''
}: BreathingUniverseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // 尺寸状态 - 初始为0，等待实际测量
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);
  
  // 宇宙状态
  const [state, setState] = useState<UniverseState>(() => ({
    viewLevel: 'galaxy',
    zoomScale: 1,
    focusedNodeId: null,
    expandedNebulaIds: new Set(),
    timeSlice: generateTimeSliceOptions()[1], // 默认30天
    showAllTime: false
  }));
  
  // 交互状态
  const [hoveredNebulaId, setHoveredNebulaId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showLinks, setShowLinks] = useState(false);
  const [newNodeIds, setNewNodeIds] = useState<Set<string>>(new Set()); // 跟踪新展开的节点
  
  // D3 zoom 引用
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  
  // 力导向模拟引用
  const simulationRef = useRef<d3.Simulation<UniverseNode, undefined> | null>(null);
  const [simulatedNodes, setSimulatedNodes] = useState<UniverseNode[]>([]);
  
  // 先按时间过滤原始节点
  const timeFilteredOriginalNodes = useMemo(() => {
    if (state.showAllTime) return nodes;
    return nodes.filter(node => 
      node.dreamIds.some(dreamId => {
        const date = dreamDates.get(dreamId);
        if (!date) return false;
        return date >= state.timeSlice.startDate && date <= state.timeSlice.endDate;
      })
    );
  }, [nodes, dreamDates, state.timeSlice, state.showAllTime]);
  
  // 基于过滤后的节点计算星云（没有节点的星云自动消失）
  const nebulae = useMemo(() => {
    if (timeFilteredOriginalNodes.length === 0) return [];
    return createNebulae(timeFilteredOriginalNodes, dimensions.width, dimensions.height);
  }, [timeFilteredOriginalNodes, dimensions]);
  
  // 计算展开的节点（初始位置）
  const expandedNodesInitial = useMemo(() => {
    const result: UniverseNode[] = [];
    
    nebulae.forEach(nebula => {
      if (state.expandedNebulaIds.has(nebula.id)) {
        const expanded = expandNebula(nebula, dimensions.width, dimensions.height);
        result.push(...expanded);
      }
    });
    
    return result;
  }, [nebulae, state.expandedNebulaIds, dimensions]);
  
  // 应用重力透镜
  const displayNodes = useMemo(() => {
    // 使用模拟后的位置，如果有的话
    const nodesWithPositions = simulatedNodes.length > 0 ? simulatedNodes : expandedNodesInitial;
    return applyGravityLens(nodesWithPositions, links, state.focusedNodeId);
  }, [simulatedNodes, expandedNodesInitial, links, state.focusedNodeId]);
  
  // 过滤显示的连线
  const displayLinks = useMemo(() => {
    const nodeIds = new Set(displayNodes.map(n => n.id));
    return links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
  }, [links, displayNodes]);
  
  // 用于力导向的连线（基于初始节点，避免循环依赖）
  const simulationLinks = useMemo(() => {
    const nodeIds = new Set(expandedNodesInitial.map(n => n.id));
    return links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
  }, [links, expandedNodesInitial]);
  
  // 力导向模拟 - 避免节点重叠
  useEffect(() => {
    if (expandedNodesInitial.length === 0) {
      setSimulatedNodes([]);
      setShowLinks(false);
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      return;
    }
    
    // 隐藏连线，等节点稳定后再显示
    setShowLinks(false);
    
    // 深拷贝节点用于模拟
    const simNodes = expandedNodesInitial.map(n => ({ ...n }));
    
    // 创建力导向模拟
    const simulation = d3.forceSimulation<UniverseNode>(simNodes)
      .force('charge', d3.forceManyBody().strength(-80))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide<UniverseNode>().radius(d => Math.sqrt(d.count) * 5 + 25))
      .force('link', d3.forceLink(simulationLinks.map(l => ({
        source: simNodes.findIndex(n => n.id === l.source),
        target: simNodes.findIndex(n => n.id === l.target)
      })).filter(l => l.source >= 0 && l.target >= 0))
        .distance(80)
        .strength(0.3)
      )
      .alphaDecay(0.05)
      .on('tick', () => {
        setSimulatedNodes([...simNodes]);
      });
    
    simulationRef.current = simulation;
    
    // 快速收敛
    for (let i = 0; i < 100; i++) simulation.tick();
    setSimulatedNodes([...simNodes]);
    
    // 延迟显示连线，等节点淡入完成
    const linkTimer = setTimeout(() => setShowLinks(true), 400);
    
    return () => {
      simulation.stop();
      simulationRef.current = null;
      clearTimeout(linkTimer);
    };
  }, [expandedNodesInitial, simulationLinks, dimensions]);

  // 监听容器尺寸
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
        // 首次获取到有效尺寸后标记为就绪
        setIsReady(true);
      }
    });
    
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // 组件卸载时清理所有资源
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      if (zoomRef.current && svgRef.current) {
        d3.select(svgRef.current).on('.zoom', null);
        zoomRef.current = null;
      }
    };
  }, []);
  
  // 初始化D3缩放
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        setState(prev => {
          // 根据缩放级别自动切换视图层级
          let newLevel: ViewLevel = prev.viewLevel;
          if (event.transform.k < 0.6) {
            newLevel = 'galaxy';
          } else if (event.transform.k < 1.5) {
            newLevel = 'nebula';
          } else {
            newLevel = 'star';
          }
          
          return {
            ...prev,
            zoomScale: event.transform.k,
            viewLevel: newLevel
          };
        });
        
        // 应用变换
        svg.select('.universe-content')
          .attr('transform', event.transform.toString());
      });
    
    svg.call(zoom);
    zoomRef.current = zoom;
    
    return () => {
      svg.on('.zoom', null);
    };
  }, []);
  
  // 处理星云点击 - 多选模式：可同时展开多个星云
  const handleNebulaClick = useCallback((nebula: Nebula) => {
    // 记录新展开星云的节点ID
    const isExpanding = !state.expandedNebulaIds.has(nebula.id);
    if (isExpanding) {
      const newIds = new Set(nebula.nodes.map(n => n.id));
      setNewNodeIds(newIds);
      // 一段时间后清除"新节点"标记
      setTimeout(() => setNewNodeIds(new Set()), 600);
    }
    
    setState(prev => {
      const newExpanded = new Set(prev.expandedNebulaIds);
      
      if (newExpanded.has(nebula.id)) {
        // 点击已展开的星云 -> 收起
        newExpanded.delete(nebula.id);
      } else {
        // 点击未展开的星云 -> 展开（添加到已展开列表）
        newExpanded.add(nebula.id);
      }
      
      return {
        ...prev,
        expandedNebulaIds: newExpanded,
        viewLevel: newExpanded.size > 0 ? 'nebula' : 'galaxy',
        focusedNodeId: null
      };
    });
  }, [state.expandedNebulaIds]);
  
  // 处理节点点击 - 聚焦
  const handleNodeClick = useCallback((node: UniverseNode) => {
    setState(prev => ({
      ...prev,
      focusedNodeId: prev.focusedNodeId === node.id ? null : node.id,
      viewLevel: 'star'
    }));
    
    // 通知外部
    const originalNode = nodes.find(n => n.id === node.id);
    onNodeSelect?.(originalNode || null);
  }, [nodes, onNodeSelect]);
  
  // 缩放控制
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 1.3);
  }, []);
  
  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 0.7);
  }, []);
  
  const handleReset = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, d3.zoomIdentity);
    
    setState(prev => ({
      ...prev,
      expandedNebulaIds: new Set(),
      focusedNodeId: null,
      viewLevel: 'galaxy'
    }));
  }, []);
  
  // 时间切片变更
  const handleTimeSliceChange = useCallback((slice: TimeSlice) => {
    setState(prev => ({ ...prev, timeSlice: slice, showAllTime: false }));
  }, []);
  
  const handleToggleAllTime = useCallback(() => {
    setState(prev => ({ ...prev, showAllTime: !prev.showAllTime }));
  }, []);
  
  // 获取节点位置（用于连线）
  const getNodePosition = useCallback((nodeId: string) => {
    const node = displayNodes.find(n => n.id === nodeId);
    return node ? { x: node.x || 0, y: node.y || 0 } : null;
  }, [displayNodes]);
  
  // 空状态
  if (nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center text-dream-text-secondary">
          <div className="text-6xl mb-4">🌙</div>
          <p className="text-lg mb-2">暂无足够的元素数据</p>
          <p className="text-sm">记录更多梦境后，这里将展示元素关系图谱</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* 主画布 */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      >
        {/* 背景星空 */}
        <defs>
          <radialGradient id="universe-bg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#universe-bg)" />
        
        {/* 随机背景星星 */}
        {Array.from({ length: 100 }).map((_, i) => {
          const seed = i * 137.5;
          return (
            <circle
              key={`bg-star-${i}`}
              cx={(seed * 7) % dimensions.width}
              cy={(seed * 11) % dimensions.height}
              r={((seed * 3) % 20) / 10 + 0.3}
              fill="white"
              opacity={((seed * 5) % 40) / 100 + 0.1}
              style={{
                animation: `twinkle ${3 + (seed % 4)}s ease-in-out infinite`,
                animationDelay: `${(seed % 3)}s`
              }}
            />
          );
        })}
        
        {/* 可变换内容组 */}
        <g className="universe-content">
          {/* 连线层 - 只在展开且节点稳定后显示 */}
          {state.expandedNebulaIds.size > 0 && (
            <g 
              className="links-layer"
              style={{
                opacity: showLinks ? 1 : 0,
                transition: 'opacity 0.5s ease-in'
              }}
            >
              {displayLinks.map((link, i) => {
                const source = getNodePosition(link.source);
                const target = getNodePosition(link.target);
                if (!source || !target) return null;
                
                const sourceNode = displayNodes.find(n => n.id === link.source);
                const targetNode = displayNodes.find(n => n.id === link.target);
                const linkOpacity = Math.min(
                  sourceNode?.opacity || 0.1,
                  targetNode?.opacity || 0.1
                ) * 0.5;
                
                return (
                  <line
                    key={`link-${i}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="#6b7280"
                    strokeWidth={Math.sqrt(link.weight) * 1.5}
                    strokeOpacity={linkOpacity}
                  />
                );
              })}
            </g>
          )}
          
          {/* 星云层 - 未展开的星云（展开时变透明但不隐藏） */}
          <g className="nebulae-layer">
            {isReady && nebulae
              .filter(n => !state.expandedNebulaIds.has(n.id))
              .map((nebula, index) => {
                const hasExpanded = state.expandedNebulaIds.size > 0;
                const isDimmedByHover = hoveredNebulaId !== null && hoveredNebulaId !== nebula.id;
                
                return (
                  <NebulaNode
                    key={nebula.id}
                    nebula={nebula}
                    index={index}
                    isHovered={!hasExpanded && hoveredNebulaId === nebula.id}
                    isDimmed={isDimmedByHover || hasExpanded}
                    onClick={() => handleNebulaClick(nebula)}
                    onMouseEnter={() => !hasExpanded && setHoveredNebulaId(nebula.id)}
                    onMouseLeave={() => setHoveredNebulaId(null)}
                  />
                );
              })}
          </g>
          
          {/* 星星层 - 展开的节点 */}
          <g className="stars-layer">
            {displayNodes.map(node => (
              <StarNode
                key={node.id}
                node={node}
                isHovered={hoveredNodeId === node.id}
                isFocused={state.focusedNodeId === node.id}
                isNew={newNodeIds.has(node.id)}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              />
            ))}
          </g>
        </g>
      </svg>
      
      {/* 左侧控制面板 */}
      <div className="absolute top-4 left-4 w-56 space-y-4">
        {/* 视图层级指示器 */}
        <ViewLevelIndicator
          level={state.viewLevel}
          zoomScale={state.zoomScale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
        />
        
        {/* 时间切片控制 */}
        <TimeSlider
          currentSlice={state.timeSlice}
          showAllTime={state.showAllTime}
          onSliceChange={handleTimeSliceChange}
          onToggleAllTime={handleToggleAllTime}
        />
      </div>
      
      {/* 右侧图例 */}
      <div className="absolute top-4 right-4 glass-card p-3 rounded-xl">
        <div className="text-xs font-medium text-dream-text-secondary mb-2">语义星云</div>
        <div className="space-y-1.5">
          {Object.entries(SEMANTIC_CATEGORIES)
            .filter(([key]) => nebulae.some(n => n.category === key))
            .slice(0, 6)
            .map(([key, config]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span>{config.icon}</span>
                <span className="text-dream-text-secondary">{config.label}</span>
                <div
                  className="w-2 h-2 rounded-full ml-auto"
                  style={{ backgroundColor: config.color }}
                />
              </div>
            ))}
        </div>
      </div>
      
      {/* CSS 动画 */}
      <style>{`
        @keyframes nebula-breathe {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
        
        @keyframes rotate-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default BreathingUniverse;
