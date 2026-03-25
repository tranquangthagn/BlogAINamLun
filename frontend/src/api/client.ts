const DEFAULT_API_BASE_URL = 'http://localhost:8000';
const ERROR_MESSAGE_MAP: Record<string, string> = {
  AUTOMATION_QUOTA_EXCEEDED: 'AI tam thoi het quota tao bai. Hay thu lai sau it phut.',
  AUTOMATION_NOT_CONFIGURED: 'AI chua duoc cau hinh API key. Hay kiem tra backend truoc khi tao bai.',
  AUTOMATION_GENERATION_FAILED: 'AI tao bai chua thanh cong. Hay thu lai them mot lan nua.',
};

function getLocalApiBaseUrl(): string | null {
  const runtimeLocation = globalThis.location;
  if (!runtimeLocation) {
    return null;
  }

  const hostname = runtimeLocation.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return null;
  }

  const protocol = runtimeLocation.protocol || 'http:';
  return `${protocol}//${hostname}:8000`;
}

function getApiBaseUrl(): string {
  const config = globalThis as { __BLOG_API_BASE_URL__?: string };
  return config.__BLOG_API_BASE_URL__ ?? getLocalApiBaseUrl() ?? DEFAULT_API_BASE_URL;
}

function normalizeApiErrorMessage(message: string): string {
  return ERROR_MESSAGE_MAP[message] ?? message;
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const payload = await response.json();
      if (typeof payload?.detail === 'string') {
        message = normalizeApiErrorMessage(payload.detail);
      }
    } catch {
      // Keep the default message when the error body is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
