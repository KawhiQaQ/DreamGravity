/**
 * 图片服务 - 处理图片下载和本地存储
 */
import * as fs from 'fs';
import * as path from 'path';

// 图片保存目录
const IMAGE_DIR = path.join(process.cwd(), 'data', 'images');

/**
 * 确保图片目录存在
 */
function ensureImageDir(): void {
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
  }
}

/**
 * 下载远程图片并保存到本地
 * @param imageUrl 远程图片URL
 * @param prefix 文件名前缀（如 'dream', 'ip' 等）
 * @param id 关联的ID（如 dreamId, reportId）
 * @returns 本地访问路径 (如 /api/images/dream_xxx.png)
 */
export async function downloadAndSaveImage(
  imageUrl: string,
  prefix: string,
  id: string
): Promise<string> {
  ensureImageDir();
  
  // 生成文件名
  const fileName = `${prefix}_${id}_${Date.now()}.png`;
  const filePath = path.join(IMAGE_DIR, fileName);
  
  try {
    // 下载图片
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 保存到本地
    fs.writeFileSync(filePath, buffer);
    
    console.log(`[imageService] 图片保存成功: ${fileName}`);
    
    // 返回本地访问路径
    return `/api/images/${fileName}`;
  } catch (error) {
    console.error('[imageService] 下载图片失败:', error);
    // 如果下载失败，返回原始 URL（作为降级方案）
    return imageUrl;
  }
}

/**
 * 检查是否是本地图片路径
 */
export function isLocalImagePath(url: string | null | undefined): boolean {
  return !!url && url.startsWith('/api/images/');
}

/**
 * 删除本地图片
 */
export function deleteLocalImage(localPath: string): boolean {
  if (!isLocalImagePath(localPath)) {
    return false;
  }
  
  const fileName = localPath.replace('/api/images/', '');
  const filePath = path.join(IMAGE_DIR, fileName);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[imageService] 图片删除成功: ${fileName}`);
      return true;
    }
  } catch (error) {
    console.error('[imageService] 删除图片失败:', error);
  }
  
  return false;
}
