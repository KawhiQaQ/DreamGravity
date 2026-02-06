/**
 * PDF Export Service
 * Generates PDF reports for dream records
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getDreamById, getDreams } from '../dao/dreamDao';
import { EmotionTagLabels } from '../../../shared/types/dream';
import type { DreamEntry } from '../../../shared/types/dream';
import type { ExportPdfDTO } from '../../../shared/types/api';

// 确保导出目录存在
const EXPORT_DIR = path.join(process.cwd(), 'data', 'exports');

/**
 * 确保导出目录存在
 */
function ensureExportDir(): void {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
}

/**
 * 格式化日期
 */
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 查找可用的中文字体
 */
function findChineseFont(): string | null {
  const fontPaths = [
    // Windows 字体
    'C:/Windows/Fonts/msyh.ttf',      // 微软雅黑
    'C:/Windows/Fonts/simhei.ttf',    // 黑体
    'C:/Windows/Fonts/simsun.ttc',    // 宋体
    // macOS 字体
    '/System/Library/Fonts/PingFang.ttc',
    '/Library/Fonts/Arial Unicode.ttf',
    // Linux 字体
    '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
  ];

  for (const fontPath of fontPaths) {
    if (fs.existsSync(fontPath)) {
      // 跳过 .ttc 文件，pdfkit 不支持
      if (fontPath.endsWith('.ttc')) {
        continue;
      }
      return fontPath;
    }
  }
  return null;
}

/**
 * 导出梦境记录为PDF
 */
export async function exportDreamsToPdf(options: ExportPdfDTO): Promise<{ pdfPath: string; filename: string }> {
  ensureExportDir();

  // 获取要导出的梦境
  let dreams: DreamEntry[] = [];
  
  if (options.dreamIds && options.dreamIds.length > 0) {
    // 导出指定的梦境
    for (const id of options.dreamIds) {
      const dream = getDreamById(id);
      if (dream) {
        dreams.push(dream);
      }
    }
  } else if (options.dateRange) {
    // 按日期范围导出
    const result = getDreams({
      dateRange: options.dateRange,
      limit: 1000,
    });
    // 获取完整的梦境数据（包含分析等）
    dreams = result.data.map(preview => getDreamById(preview.id)).filter((d): d is DreamEntry => d !== null);
  } else {
    // 导出所有梦境
    const result = getDreams({ limit: 1000 });
    dreams = result.data.map(preview => getDreamById(preview.id)).filter((d): d is DreamEntry => d !== null);
  }

  if (dreams.length === 0) {
    throw new Error('没有找到可导出的梦境记录');
  }

  // 按日期排序
  dreams.sort((a, b) => new Date(b.dreamDate).getTime() - new Date(a.dreamDate).getTime());

  // 生成PDF
  const filename = `dream-journal-${uuidv4().slice(0, 8)}.pdf`;
  const pdfPath = path.join(EXPORT_DIR, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: 'Dream Journal',
          Author: 'Dream Journal App',
          Subject: 'Dream Records Export',
        },
      });

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // 尝试注册中文字体
      const chineseFont = findChineseFont();
      if (chineseFont) {
        try {
          doc.registerFont('Chinese', chineseFont);
          doc.font('Chinese');
        } catch (e) {
          console.warn('Failed to load Chinese font, using default font');
        }
      }

      // 标题页
      doc.fontSize(28).text('Dream Journal', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).text(`Export Date: ${formatDate(new Date())}`, { align: 'center' });
      doc.fontSize(12).text(`Total: ${dreams.length} records`, { align: 'center' });
      doc.moveDown(2);

      // 目录
      doc.fontSize(18).text('Contents', { underline: true });
      doc.moveDown(0.5);
      dreams.forEach((dream, index) => {
        const preview = dream.content.length > 30 ? dream.content.slice(0, 30) + '...' : dream.content;
        doc.fontSize(10).text(`${index + 1}. ${formatDate(dream.dreamDate)} - ${preview}`);
      });

      // 梦境内容
      dreams.forEach((dream, index) => {
        doc.addPage();
        
        // 梦境标题
        doc.fontSize(16).text(`Dream #${index + 1}`, { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(12).text(`Date: ${formatDate(dream.dreamDate)}`);
        doc.text(`Emotion: ${EmotionTagLabels[dream.emotionTag] || dream.emotionTag}`);
        doc.text(`Clarity: ${'*'.repeat(dream.clarity)}${'_'.repeat(5 - dream.clarity)}`);
        if (dream.isRecurring) {
          doc.text('Tag: Recurring Dream');
        }
        doc.moveDown(0.5);

        // 梦境内容
        doc.fontSize(14).text('Content:', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).text(dream.content, { align: 'justify' });
        doc.moveDown(0.5);

        // 分析结果（如果有且需要包含）
        if (options.includeAnalysis !== false && dream.analysis) {
          doc.fontSize(14).text('Analysis:', { underline: true });
          doc.moveDown(0.3);

          // 象征分析
          if (dream.analysis.symbolAnalysis?.elements?.length > 0) {
            doc.fontSize(12).text('Symbol Elements:');
            dream.analysis.symbolAnalysis.elements.forEach(element => {
              doc.fontSize(10).text(`  - ${element.name} (${element.type}): ${element.meaning}`);
            });
            doc.moveDown(0.3);
          }

          // 情绪分析
          if (dream.analysis.emotionAnalysis) {
            doc.fontSize(12).text('Emotion Analysis:');
            doc.fontSize(10).text(`  Primary Emotion: ${dream.analysis.emotionAnalysis.primaryEmotion}`);
            doc.text(`  Intensity: ${Math.round(dream.analysis.emotionAnalysis.emotionIntensity * 100)}%`);
            if (dream.analysis.emotionAnalysis.potentialStress?.length > 0) {
              doc.text(`  Stress Sources: ${dream.analysis.emotionAnalysis.potentialStress.join(', ')}`);
            }
            if (dream.analysis.emotionAnalysis.psychologicalInsight) {
              doc.text(`  Insight: ${dream.analysis.emotionAnalysis.psychologicalInsight}`);
            }
            doc.moveDown(0.3);
          }

          // 创意内容
          if (dream.analysis.generatedStory) {
            doc.fontSize(12).text('Generated Story:');
            doc.fontSize(10).text(dream.analysis.generatedStory);
            doc.moveDown(0.3);
          }
          if (dream.analysis.generatedPoem) {
            doc.fontSize(12).text('Generated Poem:');
            doc.fontSize(10).text(dream.analysis.generatedPoem);
            doc.moveDown(0.3);
          }
        }

        // 后续关联（如果有且需要包含）
        if (options.includeFollowups !== false && dream.followups && dream.followups.length > 0) {
          doc.fontSize(14).text('Follow-ups:', { underline: true });
          doc.moveDown(0.3);
          dream.followups.forEach((followup, fIndex) => {
            doc.fontSize(10).text(`${fIndex + 1}. [${formatDate(followup.followupDate)}] ${followup.content}`);
            doc.text(`   Status: ${followup.cameTrue ? 'Came True' : 'Not Yet'}`);
          });
          doc.moveDown(0.3);
        }

        // 模式识别（如果有且需要包含）
        if (options.includePatterns !== false && dream.patterns && dream.patterns.length > 0) {
          doc.fontSize(14).text('Pattern Recognition:', { underline: true });
          doc.moveDown(0.3);
          dream.patterns.forEach(pattern => {
            const typeLabels: Record<string, string> = {
              stress: 'Stress Related',
              recurring_theme: 'Recurring Theme',
              emotional: 'Emotional Pattern',
              predictive: 'Predictive',
            };
            doc.fontSize(10).text(`- ${typeLabels[pattern.patternType] || pattern.patternType}`);
            doc.text(`  ${pattern.patternDescription}`);
            if (pattern.stressSource) {
              doc.text(`  Stress Source: ${pattern.stressSource}`);
            }
            doc.text(`  Confidence: ${Math.round(pattern.confidence * 100)}%`);
          });
        }
      });

      // 结束文档
      doc.end();

      stream.on('finish', () => {
        resolve({ pdfPath, filename });
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 获取导出文件的URL路径
 */
export function getExportUrl(filename: string): string {
  return `/api/exports/${filename}`;
}

/**
 * 清理旧的导出文件（超过24小时）
 */
export function cleanupOldExports(): void {
  ensureExportDir();
  const files = fs.readdirSync(EXPORT_DIR);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  files.forEach(file => {
    const filePath = path.join(EXPORT_DIR, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
    }
  });
}
