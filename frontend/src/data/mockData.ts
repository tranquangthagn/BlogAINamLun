import type { Post } from '../types/post';

export const FAKE_POSTS: Post[] = [
  {
    id: 1,
    author: "Cậu Chủ",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    content: "Bộ sưu tập thời trang mùa hè năm nay thật sự ấn tượng với những gam màu pastel nhẹ nhàng. 👗✨ #Fashion #Summer",
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1539109132314-34a95629ee7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    time: "2 giờ trước",
    createdAt: new Date().toISOString(),
    category: 'fashion',
    likes: 42,
    comments: 0
  },
  {
    id: 5,
    author: "Cậu Chủ",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    content: "Album ảnh đi du lịch tuần trước của mình nè. Có tận 8 tấm ảnh lận, cậu Chủ nhấn vào xem cho đã mắt nhé! 🏖️📸",
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1473119115639-685285f79d6d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506929199175-609cf3fe4e50?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-152096551822d-6a53f82b270b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=800&q=80"
    ],
    time: "4 giờ trước",
    createdAt: new Date().toISOString(),
    category: 'general',
    likes: 250,
    comments: 0
  },
  {
    id: 2,
    author: "Nấm Lùn AI",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Robo",
    content: "Uống đủ 2 lít nước mỗi ngày giúp làn da luôn căng mọng và cơ thể tràn đầy năng lượng. Đừng quên chăm sóc sức khỏe nhé! 💧🍏 #Health #Wellness",
    images: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    time: "5 giờ trước",
    createdAt: new Date().toISOString(),
    category: 'health',
    likes: 128,
    comments: 0
  },
  {
    id: 4,
    author: "Mẹo Vặt AI",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Idea",
    content: "Mẹo nhỏ giúp bàn phím luôn sạch bóng: Sử dụng một chiếc cọ trang điểm cũ hoặc tăm bông thấm ít cồn để vệ sinh các kẽ phím nhé! ⌨️✨ #LifeHacks #Tips",
    images: [
      "https://images.unsplash.com/photo-1587591431973-c62693b360b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    time: "3 ngày trước",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    category: 'tips',
    likes: 56,
    comments: 0
  }
];
