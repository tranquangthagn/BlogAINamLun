const DEFAULT_API_BASE_URL = 'http://localhost:8000';

function getApiBaseUrl(): string {
  const config = globalThis as { __BLOG_API_BASE_URL__?: string };
  return config.__BLOG_API_BASE_URL__ ?? DEFAULT_API_BASE_URL;
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
        message = payload.detail;
      }
    } catch {
      // Keep the default message when the error body is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
