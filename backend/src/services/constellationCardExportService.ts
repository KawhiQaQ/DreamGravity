/**
 * Constellation Card Export Service
 * 使用 Puppeteer 生成与网页一致的星座卡片图片
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ConstellationCard, DreamElementType } from '../../../shared/types/api';

const EXPORT_DIR = path.join(process.cwd(), 'data', 'exports');

function ensureExportDir(): void {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
}

// 元素类型颜色配置
const TYPE_COLORS: Record<DreamElementType, string> = {
  person: '#8b5cf6',
  place: '#06b6d4',
  object: '#f59e0b',
  action: '#10b981',
};

/**
 * 生成星座卡片 HTML
 */
function generateConstellationCardHtml(card: ConstellationCard): string {
  // 生成背景星星（使用固定种子确保一致性）
  const bgStars = Array.from({ length: 50 }).map((_, i) => {
    const seed = i * 137.5;
    const x = (seed * 7) % 400;
    const y = (seed * 11) % 500;
    const r = ((seed * 3) % 15) / 10 + 0.5;
    const opacity = ((seed * 5) % 50) / 100 + 0.2;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${opacity}" />`;
  }).join('');

  // 生成星座连线
  const links = card.links.map((link, i) => 
    `<line x1="${link.x1}" y1="${link.y1}" x2="${link.x2}" y2="${link.y2}" 
           stroke="url(#lineGradient)" stroke-width="2" stroke-opacity="0.6" />`
  ).join('');

  // 生成星座节点
  const nodes = card.nodes.map((node, i) => {
    const color = TYPE_COLORS[node.type];
    return `
      <g>
        <!-- 外层光晕 -->
        <circle cx="${node.x}" cy="${node.y}" r="${node.size * 4}" fill="${color}" opacity="0.1" />
        <!-- 中层光晕 -->
        <circle cx="${node.x}" cy="${node.y}" r="${node.size * 2.5}" fill="${color}" opacity="0.2" />
        <!-- 星星主体 -->
        <circle cx="${node.x}" cy="${node.y}" r="${node.size}" fill="${color}" 
                filter="url(#glow)" />
        <!-- 中心亮点 -->
        <circle cx="${node.x}" cy="${node.y}" r="${node.size * 0.4}" fill="white" opacity="0.9" />
      </g>
    `;
  }).join('');

  // 生成元素标签
  const elementTags = card.topElements.slice(0, 5).map((el, i) => {
    const color = TYPE_COLORS[el.type];
    return `<span class="element-tag" style="background: ${color}20; color: ${color}; border-color: ${color}40;">${el.name}</span>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${card.name} - 梦境星座</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      width: 400px;
      height: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .card {
      width: 400px;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
      border-radius: 24px;
      padding: 32px;
      border: 1px solid rgba(139, 92, 246, 0.3);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5),
                  0 0 60px rgba(139, 92, 246, 0.15);
    }
    
    .constellation-svg {
      display: block;
      margin: 0 auto 24px;
      filter: drop-shadow(0 0 30px rgba(139, 92, 246, 0.4));
    }
    
    .title {
      text-align: center;
      margin-bottom: 16px;
    }
    
    .title h1 {
      font-size: 32px;
      font-weight: bold;
      background: linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #67e8f9 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 12px;
      letter-spacing: 2px;
    }
    
    .title p {
      font-size: 14px;
      color: #9ca3af;
      line-height: 1.7;
      padding: 0 8px;
    }
    
    .elements {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin-bottom: 20px;
    }
    
    .element-tag {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      border: 1px solid;
      font-weight: 500;
    }
    
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .stat-box {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      border: 1px solid rgba(139, 92, 246, 0.1);
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .stat-value.purple {
      color: #a78bfa;
    }
    
    .stat-value.cyan {
      color: #67e8f9;
    }
    
    .stat-label {
      font-size: 12px;
      color: #6b7280;
    }
    
    .footer {
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid rgba(139, 92, 246, 0.2);
    }
    
    .footer p {
      font-size: 12px;
      color: #4b5563;
    }
    
    .footer .brand {
      color: #6b7280;
      margin-top: 8px;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="card">
    <!-- 星座图 SVG -->
    <svg class="constellation-svg" width="336" height="336" viewBox="0 0 336 336">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8b5cf6" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- 背景星星 -->
      <g transform="translate(18, 18)">
        ${bgStars}
      </g>
      
      <!-- 星座连线 -->
      <g transform="translate(18, 18)">
        ${links}
      </g>
      
      <!-- 星座节点 -->
      <g transform="translate(18, 18)">
        ${nodes}
      </g>
    </svg>
    
    <!-- 标题和描述 -->
    <div class="title">
      <h1>${card.name}</h1>
      <p>${card.description}</p>
    </div>
    
    <!-- 元素标签 -->
    <div class="elements">
      ${elementTags}
    </div>
    
    <!-- 统计信息 -->
    <div class="stats">
      <div class="stat-box">
        <div class="stat-value purple">${card.totalDreams}</div>
        <div class="stat-label">当时梦境数</div>
      </div>
      <div class="stat-box">
        <div class="stat-value cyan">${card.totalElements}</div>
        <div class="stat-label">当时元素数</div>
      </div>
    </div>
    
    <!-- 页脚 -->
    <div class="footer">
      <p>生成于 ${new Date(card.createdAt).toLocaleString('zh-CN')}</p>
      <p class="brand">✨ AI 梦境记录与解析器</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 使用 Puppeteer 导出星座卡片为图片
 */
export async function exportConstellationCardToImage(card: ConstellationCard): Promise<{ imagePath: string; filename: string }> {
  ensureExportDir();
  
  const html = generateConstellationCardHtml(card);
  const filename = `constellation-${card.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '')}-${uuidv4().slice(0, 8)}.png`;
  const imagePath = path.join(EXPORT_DIR, filename);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    
    const page = await browser.newPage();
    
    // 设置视口大小
    await page.setViewport({ width: 400, height: 800, deviceScaleFactor: 2 });
    
    // 设置页面内容
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // 获取卡片元素
    const cardElement = await page.$('.card');
    if (!cardElement) {
      throw new Error('Card element not found');
    }
    
    // 截图
    await cardElement.screenshot({
      path: imagePath,
      type: 'png',
      omitBackground: true,
    });
    
    return { imagePath, filename };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export function getConstellationCardExportUrl(filename: string): string {
  return `/api/exports/${filename}`;
}
