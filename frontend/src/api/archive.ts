import type { Post } from '../data/mockData';
import { requestJson } from './client';

export interface PostStateResponse {
  post_id: number;
  saved: boolean;
  read: boolean;
}

export async function listArchive(kind: 'saved' | 'read'): Promise<Post[]> {
  const query = new URLSearchParams({ kind });
  return requestJson<Post[]>(`/api/archive?${query.toString()}`);
}

export async function savePost(postId: number): Promise<PostStateResponse> {
  return requestJson<PostStateResponse>(`/api/posts/${postId}/save`, {
    method: 'POST',
  });
}

export async function unsavePost(postId: number): Promise<PostStateResponse> {
  return requestJson<PostStateResponse>(`/api/posts/${postId}/save`, {
    method: 'DELETE',
  });
}

export async function markPostRead(postId: number): Promise<PostStateResponse> {
  return requestJson<PostStateResponse>(`/api/posts/${postId}/read`, {
    method: 'POST',
  });
}
