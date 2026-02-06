/**
 * Hitem3D AI 3D 模型生成服务
 * 调用 Hitem3D API 从图片生成 3D 模型
 */

const HITEM3D_API_BASE = 'https://api.hitem3d.ai/open-api/v1';

export type Hitem3DModel = 'hitem3dv1.5' | 'hitem3dv2.0' | 'scene-portraitv1.5' | 'scene-portraitv2.0';
export type Hitem3DResolution = '512' | '1024' | '1536' | '1536pro';
export type Hitem3DFormat = 'obj' | 'glb' | 'stl' | 'fbx' | 'usdz';
export type Hitem3DRequestType = 1 | 2 | 3; // 1: mesh only, 2: texture only, 3: both

export type Hitem3DTaskStatus = 'created' | 'queueing' | 'processing' | 'success' | 'failed';

interface Hitem3DTokenResponse {
  code: string;
  data?: {
    accessToken: string;
    tokenType: string;
    nonce: string;
  };
  msg?: string;
}

interface Hitem3DSubmitResponse {
  code: string;
  data?: {
    task_id: string;
  };
  msg?: string;
}

interface Hitem3DQueryResponse {
  code: string;
  data?: {
    task_id: string;
    state: Hitem3DTaskStatus;
    id?: string;
    cover_url?: string;
    url?: string;
  };
  msg?: string;
}

export interface Hitem3DTaskOptions {
  model?: Hitem3DModel;
  resolution?: Hitem3DResolution;
  format?: Hitem3DFormat;
  requestType?: Hitem3DRequestType;
  face?: number;
  callbackUrl?: string;
}

// 缓存 token，避免频繁请求
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * 带超时的 fetch 封装
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`请求超时 (${timeoutMs / 1000}秒)`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 获取 Hitem3D 凭证
 */
function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.HITEM3D_ACCESS_KEY;
  const clientSecret = process.env.HITEM3D_SECRET_KEY;
  
  if (!clientId || !clientSecret) {
    throw new Error('HITEM3D_ACCESS_KEY and HITEM3D_SECRET_KEY environment variables are required');
  }
  
  return { clientId, clientSecret };
}

/**
 * 获取访问 Token
 */
async function getAccessToken(): Promise<string> {
  // 检查缓存的 token 是否有效（提前 5 分钟过期）
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }
  
  const { clientId, clientSecret } = getCredentials();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetchWithTimeout(`${HITEM3D_API_BASE}/auth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json'
    }
  }, 30000);
  
  const responseText = await response.text();
  
  if (!response.ok) {
    throw new Error(`Hitem3D Auth error: ${response.status} - ${responseText}`);
  }
  
  let data: Hitem3DTokenResponse;
  try {
    data = JSON.parse(responseText) as Hitem3DTokenResponse;
  } catch {
    throw new Error(`Hitem3D Auth error: Invalid JSON response - ${responseText}`);
  }
  
  // code 可能是 200、"0"、0 或 "success" 表示成功
  const code = String(data.code);
  const isSuccess = code === '200' || code === '0' || code === 'success';
  if (!isSuccess) {
    throw new Error(`Hitem3D Auth error: ${data.code} - ${data.msg || 'Unknown error'}`);
  }
  
  if (!data.data?.accessToken) {
    throw new Error(`Hitem3D Auth did not return accessToken. Response: ${responseText}`);
  }
  
  // 缓存 token，假设有效期 1 小时
  cachedToken = {
    token: data.data.accessToken,
    expiresAt: Date.now() + 60 * 60 * 1000
  };
  
  return data.data.accessToken;
}

/**
 * 从图片 URL 生成 3D 模型
 * @param imageUrl 图片 URL
 * @param options 生成选项
 * @returns 任务 ID
 */
export async function createImageTo3DTask(
  imageUrl: string,
  options: Hitem3DTaskOptions = {}
): Promise<string> {
  const accessToken = await getAccessToken();
  
  const {
    model = 'hitem3dv2.0',
    resolution = '1536',
    format = 'glb',
    requestType = 3, // 默认生成几何体+贴图
    face = 1000000,
    callbackUrl
  } = options;

  // 格式映射
  const formatMap: Record<Hitem3DFormat, string> = {
    obj: '1',
    glb: '2',
    stl: '3',
    fbx: '4',
    usdz: '5'
  };

  // 先下载图片，然后以 multipart/form-data 方式上传
  const imageResponse = await fetchWithTimeout(imageUrl, {}, 60000); // 60秒超时下载图片
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

  // 构建 FormData
  const formData = new FormData();
  formData.append('images', imageBlob, 'totem.png');
  formData.append('request_type', String(requestType));
  formData.append('model', model);
  formData.append('resolution', resolution);
  formData.append('format', formatMap[format]);
  formData.append('face', String(face));
  if (callbackUrl) {
    formData.append('callback_url', callbackUrl);
  }

  const response = await fetchWithTimeout(`${HITEM3D_API_BASE}/submit-task`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  }, 120000); // 120秒超时提交任务

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hitem3D API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as Hitem3DSubmitResponse;

  const code = String(data.code);
  const isSuccess = code === '200' || code === '0' || code === 'success';
  if (!isSuccess) {
    throw new Error(`Hitem3D API error: ${data.code} - ${data.msg || 'Unknown error'}`);
  }

  if (!data.data?.task_id) {
    throw new Error('Hitem3D API did not return task_id');
  }

  return data.data.task_id;
}

/**
 * 查询任务状态
 * @param taskId 任务 ID
 * @returns 任务状态信息
 */
export async function getTaskStatus(taskId: string): Promise<{
  status: Hitem3DTaskStatus;
  modelUrl?: string;
  coverUrl?: string;
}> {
  const accessToken = await getAccessToken();

  const response = await fetchWithTimeout(
    `${HITEM3D_API_BASE}/query-task?task_id=${encodeURIComponent(taskId)}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    },
    30000 // 30秒超时
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hitem3D API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as Hitem3DQueryResponse;

  const code = String(data.code);
  const isSuccess = code === '200' || code === '0' || code === 'success';
  if (!isSuccess) {
    throw new Error(`Hitem3D API error: ${data.code} - ${data.msg || 'Unknown error'}`);
  }

  return {
    status: data.data?.state || 'failed',
    modelUrl: data.data?.url,
    coverUrl: data.data?.cover_url
  };
}

/**
 * 将 Hitem3D 状态映射到内部状态
 */
export function mapHitem3DStatus(status: Hitem3DTaskStatus): 'pending' | 'processing' | 'completed' | 'failed' {
  switch (status) {
    case 'created':
    case 'queueing':
      return 'pending';
    case 'processing':
      return 'processing';
    case 'success':
      return 'completed';
    case 'failed':
    default:
      return 'failed';
  }
}
