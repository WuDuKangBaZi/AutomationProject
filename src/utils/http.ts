// src/utils/http.ts
import router from '@/router';
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { ApiResponse } from '@/types/api';

export const globalLoading = ref(false);

interface HttpOptions extends RequestInit {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  signal?: AbortSignal;
}

class Http {
  private baseURL: string;
  private isRefreshing = false;
  private retryQueue: Array<() => void> = [];
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '';
  }

  private async refreshToken(): Promise<void> {
    const authStore = useAuthStore();
    if (this.isRefreshing) {
      return new Promise(resolve => {
        this.retryQueue.push(resolve);
      });
    }
    this.isRefreshing = true;
    try {
      const res = await fetch(this.baseURL + '/auth/refreshToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: authStore.refreshToken }),
      });
      if (!res.ok) {
        throw new Error(`刷新令牌错误：${res.status}`);
      }
      const data: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json();
      if (data.code === 200) {
        console.log('Token 刷新成功');
        console.log('新 token：', data.data.accessToken);
        authStore.setToken(data.data.accessToken, data.data.refreshToken);
        this.retryQueue.forEach(cb => cb());
        this.retryQueue = [];
      } else {
        authStore.clearToken();
        router.replace({ path: '/login' }).catch(() => { });
        throw new Error('刷新令牌失败，请重新登录');
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  private buildQuery(params?: Record<string, any>) {
    if (!params) return '';
    return (
      '?' +
      Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    );
  }

  private async request<T>(url: string, options: HttpOptions = {}, retry = false): Promise<T> {
    const authStore = useAuthStore();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
    };

    if (options.params && options.method?.toUpperCase() === 'GET') {
      url += this.buildQuery(options.params);
    }

    globalLoading.value = true;
    const controller = new AbortController();
    if (!options.signal) options.signal = controller.signal;

    try {
      const res = await fetch(this.baseURL + url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      if (!res.ok) {
        throw new Error(`HTTP 错误：${res.status}`);
      }
      const contentDisp = res.headers.get('Content-Disposition') || res.headers.get('content-disposition');
      if (contentDisp) {
        const blob = await res.blob();
        let filename = 'downloaded_file';
        const filenameMatch = /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i.exec(contentDisp);
        if (filenameMatch && filenameMatch[1]) {
          try {
            filename = decodeURIComponent(filenameMatch[1].replace(/(^"|"$)/g, ''));
          } catch {
            filename = filenameMatch[1].replace(/(^"|"$)/g, '');
          }
        }
        const urlObject = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlObject;
        a.download = filename;
        a.click();
        a.remove();
        window.URL.revokeObjectURL(urlObject);
        return (undefined as unknown) as T;
      }
      
      const data: ApiResponse<T> = await res.json();
      // ⭐⭐⭐ 401 自动刷新 token
      if (data.code === 401 && !retry) {
        // 401 token过期，进入刷新逻辑
        return await new Promise<T>((resolve, reject) => {
          this.retryQueue.push(async () => {
            try {
              const data = await this.request<T>(url, options, true);
              resolve(data);
            } catch (err) {
              reject(err);
            }
          });

          this.refreshToken().catch(reject);
        });
      } else if (data.code !== 200) {
        // 其他错误
        throw new Error(data.message || "请求错误");
      }
      // 文件下载支持
      


      if (data.code === 200) {
        return data.data;
      } else if (data.code === 401 || data.code === 403) {
        authStore.clearToken();
        router.replace({ path: '/login' }).catch(() => { });
        setTimeout(() => { window.location.href = '/login'; }, 100);
        throw new Error('权限不足，请重新登录');
      } else {
        throw new Error(data.message || '请求错误');
      }
    } finally {
      globalLoading.value = false;
    }
  }

  public get<T>(url: string, params?: Record<string, any>, options?: Omit<HttpOptions, 'method' | 'params'>) {
    return this.request<T>(url, { method: 'GET', params, ...options });
  }

  public post<T>(url: string, body?: any, options?: Omit<HttpOptions, 'method' | 'body'>) {
    return this.request<T>(url, { method: 'POST', body, ...options });
  }

  public put<T>(url: string, body?: any, options?: Omit<HttpOptions, 'method' | 'body'>) {
    return this.request<T>(url, { method: 'PUT', body, ...options });
  }

  public delete<T>(url: string, options?: Omit<HttpOptions, 'method'>) {
    return this.request<T>(url, { method: 'DELETE', ...options });
  }
}

export default new Http();
