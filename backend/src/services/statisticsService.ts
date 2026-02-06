/**
 * Dream Statistics Service
 * Handles dream theme analysis and statistics generation
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import { getAIService } from './ai';
import type {
  DreamStatistics,
  DreamReport,
  ThemeStatistics,
  CharacterStatistics,
  EmotionDistribution,
  CommonThemeComparison,
} from '../../../shared/types/api';
import { EmotionTagLabels } from '../../../shared/types/dream';

// 常见梦境主题及其平均出现率（基于心理学研究数据）
const COMMON_DREAM_THEMES: Record<string, { avgPercentage: number; description: string }> = {
  '飞行': { avgPercentage: 15, description: '飞行梦通常象征自由、超越限制或逃避现实的渴望' },
  '坠落': { avgPercentage: 20, description: '坠落梦常与失控感、焦虑或生活中的不安全感相关' },
  '追逐': { avgPercentage: 25, description: '被追逐的梦反映逃避问题或面对压力的心理状态' },
  '考试': { avgPercentage: 18, description: '考试梦象征对评判的恐惧或对自我能力的质疑' },
  '迷路': { avgPercentage: 12, description: '迷路梦表示生活方向的迷茫或决策困难' },
  '裸体': { avgPercentage: 10, description: '裸体梦反映脆弱感或害怕被他人看穿' },
  '死亡': { avgPercentage: 8, description: '死亡梦通常象征结束与新开始，而非字面意义' },
  '水': { avgPercentage: 22, description: '水相关的梦与情绪状态密切相关' },
  '动物': { avgPercentage: 16, description: '动物梦常代表本能、直觉或特定性格特征' },
  '房屋': { avgPercentage: 14, description: '房屋梦象征自我或心理状态的不同层面' },
  '学校': { avgPercentage: 15, description: '学校梦反映学习压力或对过去的怀念' },
  '工作': { avgPercentage: 18, description: '工作梦通常与职业压力或成就感相关' },
  '旅行': { avgPercentage: 12, description: '旅行梦象征人生旅程或对改变的渴望' },
  '亲人': { avgPercentage: 20, description: '亲人出现的梦反映家庭关系或情感需求' },
  '朋友': { avgPercentage: 15, description: '朋友梦反映社交需求或人际关系状态' },
  '天空': { avgPercentage: 10, description: '天空梦象征精神追求或对自由的向往' },
  '森林': { avgPercentage: 8, description: '森林梦代表潜意识或未知的探索' },
  '城市': { avgPercentage: 12, description: '城市梦反映社会生活或现代压力' },
};

interface DreamRow {
  id: string;
  content: string;
  emotion_tag: string;
  clarity: number;
  is_recurring: number;
  dream_date: string;
}

interface AnalysisRow {
  symbol_analysis: string;
}

/**
 * Get all dreams with their analyses for statistics
 */
function getAllDreamsForStats(): { dreams: DreamRow[]; analyses: AnalysisRow[] } {
  const db = getDatabase();
  
  const dreamsStmt = db.prepare('SELECT id, content, emotion_tag, clarity, is_recurring, dream_date FROM dreams ORDER BY dream_date DESC');
  const dreams = dreamsStmt.all() as DreamRow[];
  
  const analysesStmt = db.prepare('SELECT symbol_analysis FROM dream_analyses');
  const analyses = analysesStmt.all() as AnalysisRow[];
  
  return { dreams, analyses };
}

/**
 * Extract themes from dream content and analyses
 */
function extractThemes(dreams: DreamRow[], analyses: AnalysisRow[]): ThemeStatistics[] {
  const themeCount: Record<string, number> = {};
  
  // 扩展的主题关键词映射
  const themeKeywordMap: Record<string, string[]> = {
    '飞行': ['飞', '飞行', '飞翔', '翱翔', '漂浮', '悬浮', '升空'],
    '坠落': ['坠落', '掉落', '跌落', '下坠', '摔下', '掉下'],
    '追逐': ['追逐', '追赶', '逃跑', '逃避', '被追', '奔跑', '逃离'],
    '考试': ['考试', '测试', '考场', '答题', '成绩', '分数'],
    '迷路': ['迷路', '迷失', '找不到路', '走丢', '迷宫'],
    '水': ['水', '海', '河', '湖', '游泳', '溺水', '洪水', '雨', '泳池', '海洋', '河流', '湖泊', '瀑布'],
    '动物': ['动物', '狗', '猫', '鸟', '蛇', '鱼', '虫', '老虎', '狮子', '熊', '兔子', '马', '龙', '蝴蝶', '蜘蛛', '老鼠'],
    '房屋': ['房屋', '房子', '家', '房间', '卧室', '客厅', '厨房', '楼', '建筑', '门', '窗', '楼梯', '电梯', '走廊'],
    '学校': ['学校', '教室', '老师', '同学', '上课', '课堂', '校园', '大学', '高中', '小学'],
    '工作': ['工作', '办公室', '公司', '老板', '同事', '会议', '上班', '职场', '加班'],
    '旅行': ['旅行', '旅游', '出行', '火车', '飞机', '汽车', '船', '行李', '机场', '车站', '酒店'],
    '战斗': ['战斗', '打架', '打斗', '战争', '攻击', '武器', '枪', '刀', '剑'],
    '恋爱': ['恋爱', '爱情', '约会', '亲吻', '拥抱', '男友', '女友', '暗恋', '表白', '结婚', '婚礼'],
    '分离': ['分离', '离别', '告别', '分手', '离开', '失去'],
    '重逢': ['重逢', '相遇', '见面', '团聚', '再见'],
    '死亡': ['死亡', '去世', '死', '葬礼', '墓地', '棺材', '鬼', '亡灵'],
    '裸体': ['裸体', '裸', '没穿衣服', '光着'],
    '食物': ['食物', '吃', '餐厅', '饭', '菜', '水果', '蛋糕', '面包', '饿'],
    '金钱': ['金钱', '钱', '财富', '发财', '中奖', '彩票', '银行', '存款'],
    '亲人': ['亲人', '父母', '爸爸', '妈妈', '爷爷', '奶奶', '兄弟', '姐妹', '孩子', '儿子', '女儿'],
    '朋友': ['朋友', '好友', '闺蜜', '哥们', '伙伴'],
    '陌生人': ['陌生人', '不认识的人', '神秘人', '黑影'],
    '天空': ['天空', '云', '太阳', '月亮', '星星', '夜空', '日出', '日落', '彩虹'],
    '森林': ['森林', '树林', '树', '丛林', '草地', '花园', '公园'],
    '山': ['山', '爬山', '山顶', '悬崖', '峭壁', '山洞'],
    '城市': ['城市', '街道', '马路', '商场', '超市', '医院', '银行'],
  };
  
  // 从梦境内容中提取主题
  dreams.forEach(dream => {
    const content = dream.content;
    const matchedThemes = new Set<string>();
    
    // 遍历所有主题及其关键词
    Object.entries(themeKeywordMap).forEach(([theme, keywords]) => {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          matchedThemes.add(theme);
          break; // 一个主题只计数一次
        }
      }
    });
    
    // 统计匹配到的主题
    matchedThemes.forEach(theme => {
      themeCount[theme] = (themeCount[theme] || 0) + 1;
    });
  });
  
  // 从符号分析中提取主题
  analyses.forEach(analysis => {
    try {
      const symbols = JSON.parse(analysis.symbol_analysis);
      if (symbols.elements && Array.isArray(symbols.elements)) {
        const matchedThemes = new Set<string>();
        
        symbols.elements.forEach((el: { name: string; type: string; meaning: string }) => {
          const text = `${el.name} ${el.meaning}`;
          
          Object.entries(themeKeywordMap).forEach(([theme, keywords]) => {
            for (const keyword of keywords) {
              if (text.includes(keyword)) {
                matchedThemes.add(theme);
                break;
              }
            }
          });
        });
        
        matchedThemes.forEach(theme => {
          themeCount[theme] = (themeCount[theme] || 0) + 1;
        });
      }
    } catch {
      // Skip invalid JSON
    }
  });
  
  const total = Object.values(themeCount).reduce((a, b) => a + b, 0) || 1;
  
  return Object.entries(themeCount)
    .map(([theme, count]) => ({
      theme,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // 返回前15个主题
}

/**
 * Extract characters from dream analyses
 */
function extractCharacters(analyses: AnalysisRow[]): CharacterStatistics[] {
  const characterCount: Record<string, number> = {};
  
  analyses.forEach(analysis => {
    try {
      const symbols = JSON.parse(analysis.symbol_analysis);
      if (symbols.elements) {
        symbols.elements
          .filter((el: { type: string }) => el.type === 'person')
          .forEach((el: { name: string }) => {
            characterCount[el.name] = (characterCount[el.name] || 0) + 1;
          });
      }
    } catch {
      // Skip invalid JSON
    }
  });
  
  const total = Object.values(characterCount).reduce((a, b) => a + b, 0) || 1;
  
  return Object.entries(characterCount)
    .map(([character, count]) => ({
      character,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Calculate emotion distribution
 */
function calculateEmotionDistribution(dreams: DreamRow[]): EmotionDistribution[] {
  const emotionCount: Record<string, number> = {};
  
  dreams.forEach(dream => {
    emotionCount[dream.emotion_tag] = (emotionCount[dream.emotion_tag] || 0) + 1;
  });
  
  const total = dreams.length || 1;
  
  return Object.entries(emotionCount)
    .map(([emotion, count]) => ({
      emotion,
      label: EmotionTagLabels[emotion as keyof typeof EmotionTagLabels] || emotion,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get dream statistics
 */
export function getDreamStatistics(): DreamStatistics {
  const { dreams, analyses } = getAllDreamsForStats();
  
  const totalDreams = dreams.length;
  const analyzedDreams = analyses.length;
  const recurringDreams = dreams.filter(d => d.is_recurring).length;
  const averageClarity = totalDreams > 0
    ? Math.round((dreams.reduce((sum, d) => sum + d.clarity, 0) / totalDreams) * 10) / 10
    : 0;
  
  const themes = extractThemes(dreams, analyses);
  const characters = extractCharacters(analyses);
  const emotionDistribution = calculateEmotionDistribution(dreams);
  
  // Get date range
  const dates = dreams.map(d => d.dream_date).sort();
  const dateRange = {
    start: dates[0] || new Date().toISOString().split('T')[0],
    end: dates[dates.length - 1] || new Date().toISOString().split('T')[0],
  };
  
  return {
    totalDreams,
    analyzedDreams,
    recurringDreams,
    averageClarity,
    themes,
    characters,
    emotionDistribution,
    dateRange,
  };
}

/**
 * Compare user themes with common dream themes
 */
function compareWithCommonThemes(userThemes: ThemeStatistics[]): CommonThemeComparison[] {
  const comparisons: CommonThemeComparison[] = [];
  
  // Add user themes that match common themes
  Object.entries(COMMON_DREAM_THEMES).forEach(([theme, data]) => {
    const userTheme = userThemes.find(t => t.theme === theme);
    comparisons.push({
      theme,
      userPercentage: userTheme?.percentage || 0,
      averagePercentage: data.avgPercentage,
      description: data.description,
    });
  });
  
  return comparisons.sort((a, b) => b.userPercentage - a.userPercentage);
}

/**
 * Generate dream report with AI insights
 */
export async function generateDreamReport(): Promise<DreamReport> {
  const statistics = getDreamStatistics();
  const themeComparison = compareWithCommonThemes(statistics.themes);
  
  // Generate AI insights
  const aiService = getAIService();
  
  const statsContext = `
用户梦境统计数据：
- 总梦境数：${statistics.totalDreams}
- 已分析梦境：${statistics.analyzedDreams}
- 重复梦境：${statistics.recurringDreams}
- 平均清晰度：${statistics.averageClarity}/5
- 主要主题：${statistics.themes.slice(0, 5).map(t => `${t.theme}(${t.percentage}%)`).join('、') || '暂无'}
- 主要情绪：${statistics.emotionDistribution.slice(0, 3).map(e => `${e.label}(${e.percentage}%)`).join('、') || '暂无'}
- 常见人物：${statistics.characters.slice(0, 3).map(c => c.character).join('、') || '无'}

与常见梦境主题对比：
${themeComparison.slice(0, 5).map(c => `- ${c.theme}：用户${c.userPercentage}% vs 平均${c.averagePercentage}%`).join('\n')}
`;

  const systemPrompt = `你是一位专业的梦境分析师和心理学专家。请基于用户的梦境统计数据提供专业分析。
注意：你收到的是统计数据摘要，不是具体梦境内容。请直接基于这些统计数据进行分析，不要要求用户提供更多信息。
请用中文回答，语气专业但亲切。`;

  const insightsPrompt = `请基于以下用户梦境统计数据，提供专业的心理学洞察分析（400-500字）：

${statsContext}

请从以下角度进行深入分析：

1. 【梦境模式特征】
分析用户梦境的整体特征和规律，包括主题偏好、情绪倾向等。

2. 【心理状态解读】
基于主要主题，解读用户可能的潜在心理状态、内心需求或关注点。

3. 【情绪健康评估】
根据情绪分布，评估用户的情绪健康状况，指出积极因素和需要关注的方面。

4. 【对比分析】
将用户的梦境模式与常见梦境进行对比，指出独特之处和共性特征。

5. 【深层意义】
从心理学角度解读这些梦境可能反映的深层心理需求或生活状态。

请用专业但易懂的语言，直接输出分析内容。`;

  const recommendationsPrompt = `请基于以下用户梦境统计数据，提供详细的个性化建议（350-450字）：

${statsContext}

请从以下方面提供具体、可操作的建议：

1. 【睡眠质量优化】
根据梦境特征，提供改善睡眠质量的具体方法和习惯建议。

2. 【情绪调节策略】
针对情绪分布特点，提供情绪管理和心理调适的实用技巧。

3. 【梦境记录技巧】
如何更好地记录和理解梦境，提升梦境觉察能力。

4. 【日常生活建议】
基于梦境反映的心理状态，提供日常生活中的调整建议。

5. 【自我探索方向】
建议用户可以进一步探索的心理成长方向。

请用温暖、支持性的语气，直接输出建议内容。`;

  const [insights, recommendations] = await Promise.all([
    aiService.chat(systemPrompt, insightsPrompt),
    aiService.chat(systemPrompt, recommendationsPrompt),
  ]);
  
  const report: DreamReport = {
    id: uuidv4(),
    generatedAt: new Date().toISOString(),
    statistics,
    themeComparison,
    insights,
    recommendations,
  };
  
  // Save report to database
  saveReport(report);
  
  return report;
}

/**
 * Save report to database
 */
function saveReport(report: DreamReport): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO dream_reports (id, statistics, theme_comparison, insights, recommendations, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    report.id,
    JSON.stringify(report.statistics),
    JSON.stringify(report.themeComparison),
    report.insights,
    report.recommendations,
    report.generatedAt
  );
}

/**
 * Get all saved reports
 */
export function getReports(): DreamReport[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM dream_reports ORDER BY created_at DESC');
  const rows = stmt.all() as Array<{
    id: string;
    statistics: string;
    theme_comparison: string;
    insights: string;
    recommendations: string;
    created_at: string;
  }>;
  
  return rows.map(row => ({
    id: row.id,
    generatedAt: row.created_at,
    statistics: JSON.parse(row.statistics) as DreamStatistics,
    themeComparison: JSON.parse(row.theme_comparison) as CommonThemeComparison[],
    insights: row.insights,
    recommendations: row.recommendations,
  }));
}

/**
 * Get a single report by ID
 */
export function getReportById(id: string): DreamReport | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM dream_reports WHERE id = ?');
  const row = stmt.get(id) as {
    id: string;
    statistics: string;
    theme_comparison: string;
    insights: string;
    recommendations: string;
    created_at: string;
  } | undefined;
  
  if (!row) return null;
  
  return {
    id: row.id,
    generatedAt: row.created_at,
    statistics: JSON.parse(row.statistics) as DreamStatistics,
    themeComparison: JSON.parse(row.theme_comparison) as CommonThemeComparison[],
    insights: row.insights,
    recommendations: row.recommendations,
  };
}

/**
 * Delete a report by ID
 */
export function deleteReport(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM dream_reports WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Delete multiple reports by IDs
 */
export function deleteReports(ids: string[]): { deleted: string[]; notFound: string[] } {
  const result = { deleted: [] as string[], notFound: [] as string[] };
  
  for (const id of ids) {
    if (deleteReport(id)) {
      result.deleted.push(id);
    } else {
      result.notFound.push(id);
    }
  }
  
  return result;
}

/**
 * Helper to generate AI text - kept for backward compatibility
 */
async function generateAIText(aiService: ReturnType<typeof getAIService>, prompt: string): Promise<string> {
  try {
    const systemPrompt = '你是一位专业的梦境分析师。请直接回答问题，不要要求更多信息。';
    const response = await aiService.chat(systemPrompt, prompt);
    return response;
  } catch (error) {
    console.error('AI generation error:', error);
    return '暂时无法生成AI分析，请稍后重试。';
  }
}
