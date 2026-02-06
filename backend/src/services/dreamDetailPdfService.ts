/**
 * Dream Detail PDF Export Service
 * 使用 Puppeteer 生成与网页一致的梦境详情 PDF
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { DreamEntry, EmotionTag, DreamFollowup, DreamPattern } from '../../../shared/types/dream';
import { EmotionTagLabels } from '../../../shared/types/dream';

const EXPORT_DIR = path.join(process.cwd(), 'data', 'exports');

function ensureExportDir(): void {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
}

// 情绪图标映射
const emotionIcons: Record<string, string> = {
  happy: '😊', excited: '🤩', peaceful: '😌', hopeful: '🌟', loving: '🥰',
  sad: '😢', anxious: '😰', angry: '😠', scared: '😱', lonely: '😔',
  confused: '😵', nostalgic: '🥹', curious: '🤔', surprised: '😲', neutral: '😐',
};

// 模式类型标签
const patternTypeLabels: Record<string, string> = {
  stress: '压力相关',
  recurring_theme: '重复主题',
  emotional: '情绪模式',
  predictive: '预示性',
};

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function formatSleepTime(start?: string, end?: string): string {
  if (!start && !end) return '';
  if (start && end) return `${start} - ${end}`;
  return start || end || '';
}

function generateClarityStars(clarity: number): string {
  return Array(5).fill(0).map((_, i) => 
    `<span class="star ${i < clarity ? 'filled' : ''}">${i < clarity ? '★' : '☆'}</span>`
  ).join('');
}

function generateSymbolsHtml(analysis: DreamEntry['analysis']): string {
  if (!analysis?.symbolAnalysis?.elements?.length) {
    return '<p class="empty-text">暂无象征分析</p>';
  }
  
  const typeIcons: Record<string, string> = {
    person: '👤', object: '📦', scene: '🏞️', action: '⚡',
  };
  
  return analysis.symbolAnalysis.elements.map(el => `
    <div class="symbol-item">
      <div class="symbol-header">
        <span class="symbol-icon">${typeIcons[el.type] || '💭'}</span>
        <span class="symbol-name">${el.name}</span>
        <span class="symbol-type">${el.type}</span>
      </div>
      <p class="symbol-meaning">${el.meaning}</p>
    </div>
  `).join('');
}

function generateEmotionAnalysisHtml(analysis: DreamEntry['analysis']): string {
  if (!analysis?.emotionAnalysis) {
    return '<p class="empty-text">暂无情绪分析</p>';
  }
  
  const ea = analysis.emotionAnalysis;
  const intensity = Math.round(ea.emotionIntensity * 100);
  
  return `
    <div class="emotion-analysis">
      <div class="emotion-row">
        <span class="emotion-label">主要情绪</span>
        <span class="emotion-value">${ea.primaryEmotion}</span>
      </div>
      <div class="emotion-row">
        <span class="emotion-label">情绪强度</span>
        <div class="intensity-bar">
          <div class="intensity-fill" style="width: ${intensity}%"></div>
        </div>
        <span class="intensity-value">${intensity}%</span>
      </div>
      ${ea.potentialStress?.length ? `
        <div class="emotion-row stress">
          <span class="emotion-label">潜在压力源</span>
          <div class="stress-tags">
            ${ea.potentialStress.map(s => `<span class="stress-tag">${s}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      ${ea.psychologicalInsight ? `
        <div class="insight-box">
          <p class="insight-text">${ea.psychologicalInsight}</p>
        </div>
      ` : ''}
    </div>
  `;
}

function generateFollowupsHtml(followups?: DreamFollowup[]): string {
  if (!followups?.length) return '';
  
  return `
    <div class="section">
      <h2 class="section-title">🔗 后续关联</h2>
      <div class="followups-list">
        ${followups.map(f => `
          <div class="followup-item ${f.cameTrue ? 'came-true' : ''}">
            <div class="followup-header">
              <span class="followup-date">${new Date(f.followupDate).toLocaleDateString('zh-CN')}</span>
              <span class="followup-status ${f.cameTrue ? 'true' : 'false'}">${f.cameTrue ? '✓ 已应验' : '○ 未应验'}</span>
            </div>
            <p class="followup-content">${f.content}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function generatePatternsHtml(patterns?: DreamPattern[]): string {
  if (!patterns?.length) return '';
  
  return `
    <div class="section">
      <h2 class="section-title">🔍 模式识别</h2>
      <div class="patterns-list">
        ${patterns.map(p => `
          <div class="pattern-item">
            <div class="pattern-header">
              <span class="pattern-type">${patternTypeLabels[p.patternType] || p.patternType}</span>
              <span class="pattern-confidence">置信度 ${Math.round(p.confidence * 100)}%</span>
            </div>
            <p class="pattern-desc">${p.patternDescription}</p>
            ${p.stressSource ? `<p class="pattern-stress">压力来源: ${p.stressSource}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function generateCreativeHtml(analysis: DreamEntry['analysis']): string {
  if (!analysis?.generatedStory && !analysis?.generatedPoem) return '';
  
  let html = '<div class="section page-break"><h2 class="section-title">✨ 创意内容</h2>';
  
  if (analysis.generatedStory) {
    html += `
      <div class="creative-box">
        <h3 class="creative-title">📖 梦境故事</h3>
        <div class="creative-content">${analysis.generatedStory.split('\n').map(p => `<p>${p}</p>`).join('')}</div>
      </div>
    `;
  }
  
  if (analysis.generatedPoem) {
    html += `
      <div class="creative-box poem">
        <h3 class="creative-title">🎭 梦境诗歌</h3>
        <div class="creative-content poem-content">${analysis.generatedPoem.split('\n').map(p => `<p>${p}</p>`).join('')}</div>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}


/**
 * 生成梦境详情 HTML
 */
function generateDreamDetailHtml(dream: DreamEntry): string {
  const emotionIcon = emotionIcons[dream.emotionTag] || '💭';
  const emotionLabel = EmotionTagLabels[dream.emotionTag] || dream.emotionTag;
  const sleepTime = formatSleepTime(dream.sleepStartTime, dream.sleepEndTime);
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>梦境详情 - ${formatDate(dream.dreamDate)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page {
      size: A4;
      margin: 20mm 15mm;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      background: #0f172a;
      color: #f8fafc;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    /* 头部 */
    .header {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid rgba(167, 139, 250, 0.2);
      page-break-inside: avoid;
    }
    
    .date-title {
      font-size: 24px;
      font-weight: bold;
      color: #f8fafc;
      margin-bottom: 12px;
    }
    
    .sleep-time {
      color: #9ca3af;
      font-size: 16px;
      margin-left: 8px;
    }
    
    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #9ca3af;
    }
    
    .emotion-icon {
      font-size: 24px;
    }
    
    .star {
      color: #4b5563;
      font-size: 18px;
    }
    
    .star.filled {
      color: #facc15;
    }
    
    .recurring-tag {
      background: rgba(167, 139, 250, 0.2);
      color: #a78bfa;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
    }
    
    /* 内容区 */
    .section {
      background: #1e293b;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    /* 梦境内容 */
    .dream-content {
      font-size: 16px;
      line-height: 1.8;
      color: #e2e8f0;
      white-space: pre-wrap;
    }
    
    /* 梦境图片 */
    .dream-image {
      width: 100%;
      max-height: 400px;
      object-fit: contain;
      border-radius: 12px;
      background: rgba(0,0,0,0.2);
    }
    
    /* 象征分析 */
    .symbol-item {
      background: rgba(15, 23, 42, 0.5);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    
    .symbol-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .symbol-icon {
      font-size: 20px;
    }
    
    .symbol-name {
      font-weight: 600;
      color: #8b5cf6;
    }
    
    .symbol-type {
      font-size: 12px;
      color: #6b7280;
      background: rgba(107, 114, 128, 0.2);
      padding: 2px 8px;
      border-radius: 4px;
    }
    
    .symbol-meaning {
      color: #9ca3af;
      font-size: 14px;
    }
    
    /* 情绪分析 */
    .emotion-analysis {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .emotion-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .emotion-row.stress {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .emotion-label {
      color: #9ca3af;
      min-width: 80px;
    }
    
    .emotion-value {
      color: #8b5cf6;
      font-weight: 600;
    }
    
    .intensity-bar {
      flex: 1;
      height: 8px;
      background: rgba(107, 114, 128, 0.3);
      border-radius: 4px;
      overflow: hidden;
      max-width: 200px;
    }
    
    .intensity-fill {
      height: 100%;
      background: linear-gradient(90deg, #8b5cf6, #06b6d4);
      border-radius: 4px;
    }
    
    .intensity-value {
      color: #06b6d4;
      font-weight: 600;
    }
    
    .stress-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .stress-tag {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 13px;
    }
    
    .insight-box {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 12px;
      padding: 16px;
      margin-top: 8px;
    }
    
    .insight-text {
      color: #d1d5db;
      font-size: 14px;
      line-height: 1.7;
    }
    
    /* 后续关联 */
    .followups-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .followup-item {
      background: rgba(15, 23, 42, 0.5);
      border-radius: 12px;
      padding: 16px;
      border-left: 3px solid #6b7280;
      page-break-inside: avoid;
    }
    
    .followup-item.came-true {
      border-left-color: #10b981;
    }
    
    .followup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .followup-date {
      color: #9ca3af;
      font-size: 13px;
    }
    
    .followup-status {
      font-size: 13px;
      padding: 2px 8px;
      border-radius: 4px;
    }
    
    .followup-status.true {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }
    
    .followup-status.false {
      background: rgba(107, 114, 128, 0.2);
      color: #9ca3af;
    }
    
    .followup-content {
      color: #e2e8f0;
      font-size: 14px;
    }
    
    /* 模式识别 */
    .patterns-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .pattern-item {
      background: rgba(15, 23, 42, 0.5);
      border-radius: 12px;
      padding: 16px;
      page-break-inside: avoid;
    }
    
    .pattern-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .pattern-type {
      background: rgba(139, 92, 246, 0.2);
      color: #a78bfa;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 13px;
    }
    
    .pattern-confidence {
      color: #6b7280;
      font-size: 13px;
    }
    
    .pattern-desc {
      color: #e2e8f0;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .pattern-stress {
      color: #f87171;
      font-size: 13px;
    }
    
    /* 创意内容 */
    .creative-box {
      background: rgba(15, 23, 42, 0.5);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    
    .creative-box.poem {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1));
    }
    
    .creative-title {
      font-size: 16px;
      font-weight: 600;
      color: #a78bfa;
      margin-bottom: 12px;
    }
    
    .creative-content {
      color: #d1d5db;
      font-size: 14px;
      line-height: 1.8;
    }
    
    .creative-content p {
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    
    .creative-content p:last-child {
      margin-bottom: 0;
    }
    
    .poem-content {
      font-style: italic;
      text-align: center;
    }
    
    .empty-text {
      color: #6b7280;
      text-align: center;
      padding: 24px;
    }
    
    /* 分页控制 */
    .page-break {
      page-break-before: always;
    }
    
    /* 页脚 */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(107, 114, 128, 0.3);
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 头部 -->
    <div class="header">
      <h1 class="date-title">
        ${formatDate(dream.dreamDate)}
        ${sleepTime ? `<span class="sleep-time">🌙 ${sleepTime}</span>` : ''}
      </h1>
      <div class="meta-row">
        <div class="meta-item">
          <span class="emotion-icon">${emotionIcon}</span>
          <span>${emotionLabel}</span>
        </div>
        <div class="meta-item">
          <span>清晰度:</span>
          ${generateClarityStars(dream.clarity)}
        </div>
        ${dream.isRecurring ? '<span class="recurring-tag">重复梦境</span>' : ''}
      </div>
    </div>
    
    <!-- 梦境内容 -->
    <div class="section">
      <h2 class="section-title">💭 梦境内容</h2>
      <p class="dream-content">${dream.content}</p>
    </div>
    
    ${dream.imageUrl ? `
    <!-- 梦境图片 -->
    <div class="section">
      <h2 class="section-title">🎨 梦境可视化</h2>
      <img src="${dream.imageUrl}" alt="梦境可视化" class="dream-image" />
    </div>
    ` : ''}
    
    ${dream.analysis ? `
    <!-- 象征分析 -->
    <div class="section">
      <h2 class="section-title">🔮 象征分析</h2>
      ${generateSymbolsHtml(dream.analysis)}
    </div>
    
    <!-- 情绪分析 -->
    <div class="section">
      <h2 class="section-title">💜 情绪分析</h2>
      ${generateEmotionAnalysisHtml(dream.analysis)}
    </div>
    ` : ''}
    
    ${generateFollowupsHtml(dream.followups)}
    
    ${generatePatternsHtml(dream.patterns)}
    
    ${generateCreativeHtml(dream.analysis)}
    
    <!-- 页脚 -->
    <div class="footer">
      <p>导出于 ${new Date().toLocaleString('zh-CN')} · AI 梦境记录与解析器</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 使用 Puppeteer 导出梦境详情为 PDF
 */
export async function exportDreamDetailToPdf(dream: DreamEntry): Promise<{ pdfPath: string; filename: string }> {
  ensureExportDir();
  
  const html = generateDreamDetailHtml(dream);
  const dateStr = new Date(dream.dreamDate).toLocaleDateString('zh-CN').replace(/\//g, '-');
  const filename = `dream-${dateStr}-${uuidv4().slice(0, 8)}.pdf`;
  const pdfPath = path.join(EXPORT_DIR, filename);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    });
    
    return { pdfPath, filename };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export function getDreamDetailExportUrl(filename: string): string {
  return `/api/exports/${filename}`;
}
