import type { SymbolCardProps } from './types';

/**
 * 元素类型图标映射
 */
const typeIcons: Record<string, string> = {
  person: '👤',
  object: '📦',
  scene: '🏞️',
  action: '⚡',
};

/**
 * 元素类型中文映射
 */
const typeLabels: Record<string, string> = {
  person: '人物',
  object: '物品',
  scene: '场景',
  action: '动作',
};

/**
 * 元素类型颜色映射
 */
const typeColors: Record<string, string> = {
  person: 'border-dream-neon-purple/30 bg-dream-neon-purple/10 text-dream-neon-purple',
  object: 'border-dream-neon-cyan/30 bg-dream-neon-cyan/10 text-dream-neon-cyan',
  scene: 'border-dream-neon-blue/30 bg-dream-neon-blue/10 text-dream-neon-blue',
  action: 'border-dream-neon-orange/30 bg-dream-neon-orange/10 text-dream-neon-orange',
};

/**
 * 象征意义解析卡片
 */
export function SymbolCard({ analysis }: SymbolCardProps) {
  if (!analysis || !analysis.elements || analysis.elements.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-dream-text mb-4 flex items-center gap-2">
          <span>🔮</span>
          象征意义解读
        </h3>
        <p className="text-dream-text-secondary">暂无解析结果</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-dream-text mb-4 flex items-center gap-2">
        <span>🔮</span>
        象征意义解读
        {analysis.fallback && (
          <span className="text-xs text-dream-neon-orange bg-dream-neon-orange/10 px-2 py-1 rounded-full border border-dream-neon-orange/30">
            基础分析
          </span>
        )}
      </h3>
      
      <div className="space-y-4">
        {analysis.elements.map((element, index) => (
          <div
            key={index}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{typeIcons[element.type] || '💭'}</span>
              <span className="font-medium text-dream-text">{element.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColors[element.type] || 'border-white/20 bg-white/5 text-dream-text-secondary'}`}>
                {typeLabels[element.type] || element.type}
              </span>
            </div>
            <p className="text-dream-text-secondary text-sm leading-relaxed">
              {element.meaning}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
