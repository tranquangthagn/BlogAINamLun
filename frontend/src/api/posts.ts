import type { Post } from '../types/post';
import { requestJson } from './client';

export async function listPosts(): Promise<Post[]> {
  return requestJson<Post[]>('/api/posts');
}
