export type PostCategory = 'fashion' | 'health' | 'tips' | 'general';

export interface Post {
  id: number;
  author: string;
  avatar: string;
  content: string;
  images?: string[];
  time: string;
  createdAt: string;
  category: PostCategory;
  likes: number;
  comments: number;
}
