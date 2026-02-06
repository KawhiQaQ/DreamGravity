/**
 * Report PDF Export Service
 * 使用 Puppeteer 生成与网页一致的 PDF 报告
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { DreamReport, CommonThemeComparison, DreamStatistics } from '../../../shared/types/api';

const EXPORT_DIR = path.join(process.cwd(), 'data', 'exports');

// 确保导出目录存在
function ensureExportDir(): void {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
}

// 15种高对比度颜色
const COLORS = [
  '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#ec4899', '#84cc16', '#f97316', '#14b8a6',
  '#a855f7', '#eab308', '#06b6d4', '#f43f5e', '#22c55e',
];

/**
 * 将长文本按段落分割，便于分页
 */
function splitTextIntoParagraphs(text: string): string[] {
  // 按换行符分割，过滤空行
  return text.split(/\n+/).filter(p => p.trim().length > 0);
}

/**
 * 生成报告 HTML
 */
function generateReportHtml(report: DreamReport): string {
  const { statistics, themeComparison, insights, recommendations } = report;
  
  // 生成主题云 HTML
  const themeCloudHtml = statistics.themes.length > 0 
    ? statistics.themes.map((t, i) => {
        const size = Math.max(0.8, Math.min(1.4, t.percentage / 20 + 0.8));
        const color = COLORS[i % COLORS.length];
        return `<span class="theme-tag" style="font-size: ${size}rem; background: ${color}15; border: 1px solid ${color}40; color: ${color};">${t.theme} <span class="percentage">${t.percentage}%</span></span>`;
      }).join('')
    : '<p class="empty-text">暂无主题数据</p>';

  // 生成情绪分布 HTML
  const emotionHtml = statistics.emotionDistribution.length > 0
    ? generateEmotionBars(statistics.emotionDistribution)
    : '<p class="empty-text">暂无情绪数据</p>';

  // 生成雷达图 SVG
  const radarSvg = generateRadarChart(themeComparison.slice(0, 6));

  // 生成主题对比卡片
  const themeCardsHtml = themeComparison.slice(0, 4).map((item, i) => `
    <div class="theme-card">
      <div class="theme-card-header">
        <span class="theme-name" style="color: ${COLORS[i % COLORS.length]}">${item.theme}</span>
        <span class="theme-stats">你 ${item.userPercentage}% · 平均 ${item.averagePercentage}%</span>
      </div>
      <p class="theme-desc">${item.description}</p>
    </div>
  `).join('');

  // 将洞察和建议按段落分割，生成可分页的HTML
  const insightParagraphs = splitTextIntoParagraphs(insights);
  const recommendationParagraphs = splitTextIntoParagraphs(recommendations);
  
  const insightsHtml = insightParagraphs.map(p => `<p class="insight-paragraph">${p}</p>`).join('');
  const recommendationsHtml = recommendationParagraphs.map(p => `<p class="insight-paragraph">${p}</p>`).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>梦境报告</title>
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
      padding: 0;
    }
    
    /* 报告头部 */
    .report-header {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 24px;
      border: 1px solid rgba(167, 139, 250, 0.2);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .report-title {
      font-size: 28px;
      font-weight: bold;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }
    
    .report-date {
      color: #9ca3af;
      font-size: 14px;
    }
    
    /* 数据概览 */
    .section {
      background: #1e293b;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    
    .stat-card {
      background: rgba(15, 23, 42, 0.5);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .stat-value.purple { color: #6366f1; }
    .stat-value.cyan { color: #06b6d4; }
    .stat-value.pink { color: #a78bfa; }
    .stat-value.yellow { color: #facc15; }
    
    .stat-label {
      font-size: 14px;
      color: #9ca3af;
    }
    
    /* 主题云 */
    .theme-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }
    
    .theme-tag {
      padding: 8px 16px;
      border-radius: 20px;
      display: inline-block;
    }
    
    .theme-tag .percentage {
      font-size: 0.75em;
      opacity: 0.7;
      margin-left: 4px;
    }
    
    /* 情绪分布 */
    .emotion-bars {
      display: flex;
      height: 80px;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    
    .emotion-bar {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 8px;
      min-width: 2px;
      position: relative;
    }
    
    .emotion-bar span {
      font-size: 11px;
      color: rgba(255,255,255,0.8);
      font-weight: 500;
    }
    
    .emotion-legend {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 16px;
    }
    
    .emotion-item {
      text-align: center;
    }
    
    .emotion-item-label {
      font-size: 13px;
      color: #9ca3af;
      margin-bottom: 6px;
    }
    
    .emotion-item-bar {
      height: 6px;
      background: rgba(107, 114, 128, 0.3);
      border-radius: 3px;
      overflow: hidden;
    }
    
    .emotion-item-fill {
      height: 100%;
      border-radius: 3px;
    }
    
    .emotion-item-value {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    
    /* 雷达图 */
    .radar-container {
      display: flex;
      justify-content: center;
      padding: 20px 0;
    }
    
    .radar-legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 16px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
    
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    
    /* 主题对比卡片 */
    .theme-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .theme-card {
      background: rgba(15, 23, 42, 0.5);
      border-radius: 12px;
      padding: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .theme-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .theme-name {
      font-weight: 600;
    }
    
    .theme-stats {
      font-size: 12px;
      color: #9ca3af;
    }
    
    .theme-desc {
      font-size: 13px;
      color: #9ca3af;
    }
    
    /* 洞察和建议 - 允许分页的长内容 */
    .section-long {
      background: #1e293b;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .section-long .section-title {
      page-break-after: avoid;
      break-after: avoid;
    }
    
    .insight-box {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05));
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 12px;
      padding: 20px;
    }
    
    .insight-box.accent {
      background: linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(139, 92, 246, 0.05));
      border-color: rgba(167, 139, 250, 0.2);
    }
    
    .insight-paragraph {
      color: #d1d5db;
      line-height: 1.8;
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
      orphans: 3;
      widows: 3;
    }
    
    .insight-paragraph:last-child {
      margin-bottom: 0;
    }
    
    .empty-text {
      color: #6b7280;
      text-align: center;
      padding: 32px;
    }
    
    /* 强制分页 */
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    
    /* 页脚 */
    .page-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(107, 114, 128, 0.3);
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 报告头部 -->
    <div class="report-header">
      <h1 class="report-title">🌟 专属梦境报告</h1>
      <p class="report-date">生成于 ${new Date(report.generatedAt).toLocaleString('zh-CN')}</p>
    </div>
    
    <!-- 数据概览 -->
    <div class="section">
      <h2 class="section-title">📈 数据概览</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value purple">${statistics.totalDreams}</div>
          <div class="stat-label">梦境记录</div>
        </div>
        <div class="stat-card">
          <div class="stat-value cyan">${statistics.themes.length}</div>
          <div class="stat-label">识别主题</div>
        </div>
        <div class="stat-card">
          <div class="stat-value pink">${statistics.recurringDreams}</div>
          <div class="stat-label">重复梦境</div>
        </div>
        <div class="stat-card">
          <div class="stat-value yellow">${statistics.averageClarity.toFixed(1)}/5</div>
          <div class="stat-label">清晰度</div>
        </div>
      </div>
    </div>
    
    <!-- 主题云 -->
    <div class="section">
      <h2 class="section-title">🏷️ 梦境主题云</h2>
      <div class="theme-cloud">${themeCloudHtml}</div>
    </div>
    
    <!-- 情绪分布 -->
    <div class="section">
      <h2 class="section-title">💭 情绪分布</h2>
      ${emotionHtml}
    </div>
    
    <!-- 主题对比分析 - 新页面开始 -->
    <div class="section page-break">
      <h2 class="section-title">🎯 主题对比分析</h2>
      <div class="radar-container">${radarSvg}</div>
      <div class="radar-legend">
        <div class="legend-item">
          <div class="legend-dot" style="background: #8b5cf6;"></div>
          <span>你的梦境</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot" style="background: #06b6d4;"></div>
          <span>平均水平</span>
        </div>
      </div>
    </div>
    
    <!-- 主题详情 -->
    <div class="section">
      <div class="theme-cards">${themeCardsHtml}</div>
    </div>
    
    <!-- 心理学洞察 - 新页面开始，允许内容分页 -->
    <div class="section-long page-break">
      <h2 class="section-title">🧠 心理学洞察</h2>
      <div class="insight-box">
        ${insightsHtml}
      </div>
    </div>
    
    <!-- 个性化建议 - 允许内容分页 -->
    <div class="section-long">
      <h2 class="section-title">💡 个性化建议</h2>
      <div class="insight-box accent">
        ${recommendationsHtml}
      </div>
    </div>
    
    <!-- 页脚 -->
    <div class="page-footer">
      <p>本报告由 AI 梦境分析系统自动生成 · ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`;
}


/**
 * 生成情绪分布条形图 HTML
 */
function generateEmotionBars(data: { label: string; percentage: number; emotion: string }[]): string {
  const chartData = data.slice(0, 15);
  const total = chartData.reduce((sum, d) => sum + d.percentage, 0);
  
  const barsHtml = chartData.map((item, index) => {
    const width = total > 0 ? (item.percentage / total) * 100 : 0;
    const color = COLORS[index % COLORS.length];
    return `<div class="emotion-bar" style="width: ${width}%; background: linear-gradient(180deg, ${color} 0%, ${color}80 100%);">
      ${width > 12 ? `<span>${item.label}</span>` : ''}
    </div>`;
  }).join('');
  
  const legendHtml = chartData.slice(0, 4).map((item, i) => {
    const color = COLORS[i % COLORS.length];
    return `<div class="emotion-item">
      <div class="emotion-item-label">${item.label}</div>
      <div class="emotion-item-bar">
        <div class="emotion-item-fill" style="width: ${Math.min(item.percentage, 100)}%; background: ${color};"></div>
      </div>
      <div class="emotion-item-value">${item.percentage}%</div>
    </div>`;
  }).join('');
  
  return `<div class="emotion-bars">${barsHtml}</div><div class="emotion-legend">${legendHtml}</div>`;
}

/**
 * 生成雷达图 SVG
 */
function generateRadarChart(data: CommonThemeComparison[]): string {
  if (data.length === 0) return '<p class="empty-text">暂无对比数据</p>';
  
  const size = 280;
  const center = size / 2;
  const maxRadius = 100;
  const levels = 3;
  
  // 生成网格线
  let gridLines = '';
  for (let i = 1; i <= levels; i++) {
    const r = (maxRadius / levels) * i;
    const points = data.map((_, idx) => {
      const angle = (Math.PI * 2 * idx) / data.length - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');
    gridLines += `<polygon points="${points}" fill="none" stroke="#374151" stroke-width="1"/>`;
  }
  
  // 生成轴线
  let axisLines = '';
  data.forEach((_, idx) => {
    const angle = (Math.PI * 2 * idx) / data.length - Math.PI / 2;
    const x = center + maxRadius * Math.cos(angle);
    const y = center + maxRadius * Math.sin(angle);
    axisLines += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#374151" stroke-width="1"/>`;
  });
  
  // 生成标签
  let labels = '';
  data.forEach((item, idx) => {
    const angle = (Math.PI * 2 * idx) / data.length - Math.PI / 2;
    const labelRadius = maxRadius + 25;
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    labels += `<text x="${x}" y="${y}" fill="#9ca3af" font-size="11" text-anchor="middle" dominant-baseline="middle">${item.theme}</text>`;
  });
  
  // 生成用户数据多边形
  const userPoints = data.map((item, idx) => {
    const angle = (Math.PI * 2 * idx) / data.length - Math.PI / 2;
    const r = (item.userPercentage / 30) * maxRadius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(' ');
  
  // 生成平均数据多边形
  const avgPoints = data.map((item, idx) => {
    const angle = (Math.PI * 2 * idx) / data.length - Math.PI / 2;
    const r = (item.averagePercentage / 30) * maxRadius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(' ');
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${gridLines}
    ${axisLines}
    <polygon points="${avgPoints}" fill="#06b6d420" stroke="#06b6d4" stroke-width="2"/>
    <polygon points="${userPoints}" fill="#8b5cf680" stroke="#8b5cf6" stroke-width="2"/>
    ${labels}
  </svg>`;
}

/**
 * 使用 Puppeteer 导出报告为 PDF
 */
export async function exportReportToPdf(report: DreamReport): Promise<{ pdfPath: string; filename: string }> {
  ensureExportDir();
  
  const html = generateReportHtml(report);
  const filename = `dream-report-${uuidv4().slice(0, 8)}.pdf`;
  const pdfPath = path.join(EXPORT_DIR, filename);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    
    const page = await browser.newPage();
    
    // 设置页面内容
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // 生成 PDF - 使用 preferCSSPageSize 让 CSS @page 规则生效
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

/**
 * 获取导出文件的URL路径
 */
export function getReportExportUrl(filename: string): string {
  return `/api/exports/${filename}`;
}
