/**
 * API 配置和工具函数
 * 处理开发和生产环境的 API 请求
 */

// API 基础 URL - 开发环境使用代理，生产环境使用环境变量
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * 通用 fetch 封装，包含错误处理
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `请求失败: ${response.status}`;
    throw new ApiError(errorMessage, response.status, errorData);
  }

  // 处理 204 No Content 响应
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 构建查询参数字符串
 */
export function buildQueryString(params: Record<string, string | string[] | number | undefined>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(key, v));
    } else {
      searchParams.set(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
