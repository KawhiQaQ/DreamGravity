/**
 * Dream Element Graph Service
 * 提取梦境元素并生成关系图谱数据
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import { getAIService } from './ai';
import type {
  DreamElementGraph,
  DreamElementNode,
  DreamElementLink,
  DreamElementType,
  ConstellationCard,
  ConstellationNode,
  ConstellationLink,
} from '../../../shared/types/api';

interface DreamRow {
  id: string;
  content: string;
  dream_date: string;
}

interface AnalysisRow {
  dream_id: string;
  symbol_analysis: string;
}

interface ExtractedElement {
  name: string;
  type: DreamElementType;
}

// 元素类型关键词映射
const TYPE_KEYWORDS: Record<DreamElementType, string[]> = {
  person: ['人', '朋友', '家人', '同事', '陌生人', '老师', '学生', '父', '母', '兄', '弟', '姐', '妹', '爷', '奶', '孩子', '男', '女'],
  place: ['家', '学校', '公司', '医院', '商场', '公园', '海边', '山', '森林', '城市', '街道', '房间', '办公室', '教室', '车站', '机场'],
  object: ['车', '手机', '电脑', '书', '钥匙', '门', '窗', '水', '火', '钱', '食物', '衣服', '镜子', '刀', '花', '树', '动物'],
  action: ['跑', '飞', '追', '逃', '跳', '游泳', '开车', '说话', '哭', '笑', '打', '吃', '喝', '睡', '醒', '找', '丢', '坠落'],
};

// 每个梦境最多提取的元素数量
const MAX_ELEMENTS_PER_DREAM = 3;

/**
 * 从文本中提取元素（基于关键词）
 */
function extractElementsFromText(text: string, maxCount: number = MAX_ELEMENTS_PER_DREAM): ExtractedElement[] {
  const elements: ExtractedElement[] = [];
  const seen = new Set<string>();

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS) as [DreamElementType, string[]][]) {
    for (const keyword of keywords) {
      if (elements.length >= maxCount) break;
      if (text.includes(keyword) && !seen.has(keyword)) {
        seen.add(keyword);
        elements.push({ name: keyword, type });
      }
    }
    if (elements.length >= maxCount) break;
  }

  return elements;
}

/**
 * 从已有分析中提取元素（限制数量）
 */
function extractElementsFromAnalysis(symbolAnalysis: string): ExtractedElement[] {
  try {
    const analysis = JSON.parse(symbolAnalysis);
    if (!analysis.elements || !Array.isArray(analysis.elements)) {
      return [];
    }

    // 限制从分析中提取的元素数量
    return analysis.elements.slice(0, MAX_ELEMENTS_PER_DREAM).map((el: { name: string; type: string }) => ({
      name: el.name,
      type: mapElementType(el.type),
    }));
  } catch {
    return [];
  }
}

/**
 * 映射元素类型
 */
function mapElementType(type: string): DreamElementType {
  const mapping: Record<string, DreamElementType> = {
    person: 'person',
    object: 'object',
    scene: 'place',
    action: 'action',
    place: 'place',
    location: 'place',
  };
  return mapping[type] || 'object';
}

/**
 * 获取所有梦境数据
 */
function getAllDreams(): { dreams: DreamRow[]; analyses: AnalysisRow[] } {
  const db = getDatabase();

  const dreamsStmt = db.prepare('SELECT id, content, dream_date FROM dreams');
  const dreams = dreamsStmt.all() as DreamRow[];

  const analysesStmt = db.prepare('SELECT dream_id, symbol_analysis FROM dream_analyses');
  const analyses = analysesStmt.all() as AnalysisRow[];

  return { dreams, analyses };
}

/**
 * 生成梦境元素图谱
 */
export function getDreamElementGraph(): DreamElementGraph {
  const { dreams, analyses } = getAllDreams();

  // 创建分析映射
  const analysisMap = new Map<string, string>();
  analyses.forEach(a => analysisMap.set(a.dream_id, a.symbol_analysis));

  // 提取每个梦境的元素（每个梦境最多 MAX_ELEMENTS_PER_DREAM 个）
  const dreamElements = new Map<string, ExtractedElement[]>();

  for (const dream of dreams) {
    let elements: ExtractedElement[] = [];

    // 优先从已有分析中提取
    const analysis = analysisMap.get(dream.id);
    if (analysis) {
      elements = extractElementsFromAnalysis(analysis);
    }

    // 如果分析中元素不足，从内容中补充提取
    if (elements.length < MAX_ELEMENTS_PER_DREAM) {
      const remaining = MAX_ELEMENTS_PER_DREAM - elements.length;
      const textElements = extractElementsFromText(dream.content, remaining);
      for (const el of textElements) {
        if (!elements.some(e => e.name === el.name)) {
          elements.push(el);
          if (elements.length >= MAX_ELEMENTS_PER_DREAM) break;
        }
      }
    }

    if (elements.length > 0) {
      dreamElements.set(dream.id, elements);
    }
  }

  // 构建节点
  const nodeMap = new Map<string, DreamElementNode>();

  for (const [dreamId, elements] of dreamElements) {
    for (const el of elements) {
      const nodeId = `${el.type}-${el.name}`;
      if (nodeMap.has(nodeId)) {
        const node = nodeMap.get(nodeId)!;
        node.count++;
        node.dreamIds.push(dreamId);
      } else {
        nodeMap.set(nodeId, {
          id: nodeId,
          name: el.name,
          type: el.type,
          count: 1,
          dreamIds: [dreamId],
        });
      }
    }
  }

  // 构建边（同一梦境中出现的元素建立关联）
  const linkMap = new Map<string, DreamElementLink>();

  for (const [dreamId, elements] of dreamElements) {
    // 为同一梦境中的元素两两建立关联
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const sourceId = `${elements[i].type}-${elements[i].name}`;
        const targetId = `${elements[j].type}-${elements[j].name}`;

        // 确保边的ID一致（按字母序排列）
        const linkId = sourceId < targetId ? `${sourceId}--${targetId}` : `${targetId}--${sourceId}`;
        const [sortedSource, sortedTarget] = sourceId < targetId ? [sourceId, targetId] : [targetId, sourceId];

        if (linkMap.has(linkId)) {
          const link = linkMap.get(linkId)!;
          link.weight++;
          if (!link.dreamIds.includes(dreamId)) {
            link.dreamIds.push(dreamId);
          }
        } else {
          linkMap.set(linkId, {
            source: sortedSource,
            target: sortedTarget,
            weight: 1,
            dreamIds: [dreamId],
          });
        }
      }
    }
  }

  // 过滤掉只出现一次的节点（减少噪音）
  const filteredNodes = Array.from(nodeMap.values()).filter(n => n.count >= 1);
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

  // 过滤边，只保留两端节点都存在的边
  const filteredLinks = Array.from(linkMap.values()).filter(
    l => filteredNodeIds.has(l.source) && filteredNodeIds.has(l.target)
  );

  // 构建梦境日期映射
  const dreamDates: Record<string, string> = {};
  for (const dream of dreams) {
    dreamDates[dream.id] = dream.dream_date;
  }

  return {
    nodes: filteredNodes.sort((a, b) => b.count - a.count),
    links: filteredLinks.sort((a, b) => b.weight - a.weight),
    totalDreams: dreams.length,
    totalElements: filteredNodes.length,
    dreamDates,
  };
}

/**
 * 生成梦境星座名称
 */
export async function generateConstellationName(
  topElements: { name: string; type: DreamElementType; count: number }[]
): Promise<{ name: string; description: string; prophecy: string }> {
  const aiService = getAIService();

  const elementsDesc = topElements
    .map(e => `${e.name}(${e.type === 'person' ? '人物' : e.type === 'place' ? '地点' : e.type === 'object' ? '物品' : '动作'}, 出现${e.count}次)`)
    .join('、');

  const prompt = `基于以下梦境中频繁出现的元素，创造一个独特的"梦境星座"名称、简短描述和预言。

梦境核心元素：${elementsDesc}

要求：
1. 星座名称格式为"××座"，2-4个字，富有诗意和神秘感
2. 名称应该能反映这些元素的整体意象或情感
3. 描述用一句话（20-40字），解释这个星座代表的梦境特质
4. 预言用一句话（30-50字），基于这些梦境元素，给出一个神秘而积极的未来预示

请以JSON格式返回：{"name": "星座名", "description": "描述", "prophecy": "预言"}
只返回JSON，不要其他内容。`;

  try {
    const response = await aiService.chat(
      '你是一个富有想象力的梦境解读师，擅长将梦境元素转化为诗意的意象和神秘的预言。',
      prompt
    );
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('AI constellation name generation failed:', error);
  }

  // 降级方案：基于元素生成默认名称
  const firstElement = topElements[0]?.name || '梦';
  return {
    name: `${firstElement}影座`,
    description: `承载着${topElements.map(e => e.name).join('、')}的梦境印记`,
    prophecy: `当${firstElement}的光芒再次闪耀，你将迎来意想不到的转机与启示。`,
  };
}

/**
 * 使用AI提取梦境元素（更精准但较慢）
 */
export async function extractElementsWithAI(dreamContent: string): Promise<ExtractedElement[]> {
  const aiService = getAIService();

  const prompt = `请从以下梦境内容中提取关键元素，分为四类：
1. person（人物）：出现的人物角色
2. place（地点）：出现的场景或地点
3. object（物品）：出现的重要物品
4. action（动作）：关键的动作或行为

梦境内容：
${dreamContent}

请以JSON数组格式返回，每个元素包含name和type字段。只返回JSON，不要其他内容。
示例：[{"name":"母亲","type":"person"},{"name":"海边","type":"place"}]`;

  try {
    const response = await aiService.chat('你是一个梦境分析助手，擅长提取梦境中的关键元素。', prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('AI element extraction failed:', error);
  }

  // 降级到关键词提取
  return extractElementsFromText(dreamContent);
}

/**
 * 保存星座卡片
 */
export function saveConstellationCard(card: Omit<ConstellationCard, 'id' | 'createdAt'>): ConstellationCard {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO constellation_cards (id, name, description, prophecy, nodes, links, total_dreams, total_elements, top_elements, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    card.name,
    card.description,
    card.prophecy || '',
    JSON.stringify(card.nodes),
    JSON.stringify(card.links),
    card.totalDreams,
    card.totalElements,
    JSON.stringify(card.topElements),
    now
  );

  return {
    id,
    ...card,
    createdAt: now,
  };
}

/**
 * 获取所有星座卡片
 */
export function getConstellationCards(): ConstellationCard[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM constellation_cards ORDER BY created_at DESC');
  const rows = stmt.all() as Array<{
    id: string;
    name: string;
    description: string;
    prophecy: string | null;
    nodes: string;
    links: string;
    total_dreams: number;
    total_elements: number;
    top_elements: string;
    created_at: string;
  }>;

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    prophecy: row.prophecy || '',
    nodes: JSON.parse(row.nodes) as ConstellationNode[],
    links: JSON.parse(row.links) as ConstellationLink[],
    totalDreams: row.total_dreams,
    totalElements: row.total_elements,
    topElements: JSON.parse(row.top_elements),
    createdAt: row.created_at,
  }));
}

/**
 * 获取单个星座卡片
 */
export function getConstellationCardById(id: string): ConstellationCard | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM constellation_cards WHERE id = ?');
  const row = stmt.get(id) as {
    id: string;
    name: string;
    description: string;
    prophecy: string | null;
    nodes: string;
    links: string;
    total_dreams: number;
    total_elements: number;
    top_elements: string;
    created_at: string;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    prophecy: row.prophecy || '',
    nodes: JSON.parse(row.nodes) as ConstellationNode[],
    links: JSON.parse(row.links) as ConstellationLink[],
    totalDreams: row.total_dreams,
    totalElements: row.total_elements,
    topElements: JSON.parse(row.top_elements),
    createdAt: row.created_at,
  };
}

/**
 * 删除星座卡片
 */
export function deleteConstellationCard(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM constellation_cards WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * 批量删除星座卡片
 */
export function deleteConstellationCards(ids: string[]): { deleted: string[]; notFound: string[] } {
  const result = { deleted: [] as string[], notFound: [] as string[] };

  for (const id of ids) {
    if (deleteConstellationCard(id)) {
      result.deleted.push(id);
    } else {
      result.notFound.push(id);
    }
  }

  return result;
}
