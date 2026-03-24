import type { Post } from '../data/mockData';
import { requestJson } from './client';

export async function listPosts(): Promise<Post[]> {
  return requestJson<Post[]>('/api/posts');
}
