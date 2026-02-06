/**
 * Tripo AI 3D 模型生成服务
 * 调用 Tripo API 生成 3D 模型
 */

const TRIPO_API_BASE = 'https://api.tripo3d.ai/v2/openapi';

interface TripoTaskResponse {
  code: number;
  data: {
    task_id: string;
  };
}

interface TripoTaskStatusResponse {
  code: number;
  data: {
    task_id: string;
    type: string;
    status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled' | 'unknown';
    input: Record<string, unknown>;
    output?: {
      model?: string;
      rendered_image?: string;
    };
    progress: number;
    create_time: number;
  };
}

/**
 * 获取 Tripo API Key
 * 支持两种方式：直接使用 API Key，或使用 Client ID + Secret 组合
 */
function getApiKey(): string {
  // 优先使用直接的 API Key
  const apiKey = process.env.TRIPO_API_KEY;
  if (apiKey) {
    return apiKey;
  }
  
  // 如果没有 API Key，尝试使用 Client ID 和 Secret
  const clientId = process.env.TRIPO_CLIENT_ID;
  const clientSecret = process.env.TRIPO_CLIENT_SECRET;
  
  if (clientId && clientSecret) {
    // 有些 API 使用 clientId:clientSecret 格式
    return `${clientId}:${clientSecret}`;
  }
  
  throw new Error('TRIPO_API_KEY or (TRIPO_CLIENT_ID and TRIPO_CLIENT_SECRET) environment variables are required');
}

/**
 * 从文本描述生成 3D 模型
 * @param prompt 模型描述文本
 * @returns 任务ID
 */
export async function createTextTo3DTask(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${TRIPO_API_BASE}/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      type: 'text_to_model',
      prompt: prompt,
      model_version: 'v2.0-20240919',
      face_limit: 10000
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tripo API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json() as TripoTaskResponse;
  
  if (data.code !== 0) {
    throw new Error(`Tripo API error code: ${data.code}`);
  }
  
  return data.data.task_id;
}

/**
 * 从图片生成 3D 模型
 * @param imageUrl 图片URL
 * @returns 任务ID
 */
export async function createImageTo3DTask(imageUrl: string): Promise<string> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${TRIPO_API_BASE}/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      type: 'image_to_model',
      file: {
        type: 'url',
        url: imageUrl
      },
      model_version: 'v2.0-20240919',
      face_limit: 10000
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tripo API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json() as TripoTaskResponse;
  
  if (data.code !== 0) {
    throw new Error(`Tripo API error code: ${data.code}`);
  }
  
  return data.data.task_id;
}

/**
 * 查询任务状态
 * @param taskId 任务ID
 * @returns 任务状态信息
 */
export async function getTaskStatus(taskId: string): Promise<{
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled' | 'unknown';
  progress: number;
  modelUrl?: string;
  renderedImage?: string;
}> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${TRIPO_API_BASE}/task/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tripo API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json() as TripoTaskStatusResponse;
  
  if (data.code !== 0) {
    throw new Error(`Tripo API error code: ${data.code}`);
  }
  
  return {
    status: data.data.status,
    progress: data.data.progress,
    modelUrl: data.data.output?.model,
    renderedImage: data.data.output?.rendered_image
  };
}

/**
 * 下载模型文件
 * @param taskId 任务ID
 * @param format 导出格式
 * @returns 下载URL
 */
export async function downloadModel(taskId: string, format: 'glb' | 'fbx' | 'obj' | 'stl' = 'glb'): Promise<string> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${TRIPO_API_BASE}/task/${taskId}/download?type=${format}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tripo API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json() as { code: number; data: { model: string } };
  
  if (data.code !== 0) {
    throw new Error(`Tripo API error code: ${data.code}`);
  }
  
  return data.data.model;
}
