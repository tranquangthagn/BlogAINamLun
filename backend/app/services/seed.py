from datetime import datetime

from sqlalchemy.orm import Session

from app.models.post import Post
from app.models.post_image import PostImage
from app.repositories.posts import PostsRepository


SEED_POSTS = [
    {
        "author": "Cậu Chủ",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        "content": "Bộ sưu tập thời trang mùa hè năm nay thật sự ấn tượng với những gam màu pastel nhẹ nhàng. #Fashion #Summer",
        "category": "fashion",
        "likes": 42,
        "comments": 0,
        "created_at": datetime.fromisoformat("2026-03-24T08:00:00"),
        "images": [
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1539109132314-34a95629ee7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        ],
    },
    {
        "author": "Cậu Chủ",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        "content": "Album ảnh đi du lịch tuần trước của mình nè. Có tận 8 tấm ảnh lận, nhấn vào xem cho đã mắt nhé!",
        "category": "general",
        "likes": 250,
        "comments": 0,
        "created_at": datetime.fromisoformat("2026-03-24T06:00:00"),
        "images": [
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1473119115639-685285f79d6d?auto=format&fit=crop&w=800&q=80",
        ],
    },
    {
        "author": "Nấm Lùn AI",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Robo",
        "content": "Uống đủ 2 lít nước mỗi ngày giúp làn da luôn căng mọng và cơ thể tràn đầy năng lượng. #Health #Wellness",
        "category": "health",
        "likes": 128,
        "comments": 0,
        "created_at": datetime.fromisoformat("2026-03-24T05:00:00"),
        "images": [
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        ],
    },
    {
        "author": "Mẹo Vặt AI",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Idea",
        "content": "Mẹo nhỏ giúp bàn phím luôn sạch bóng: dùng cọ trang điểm cũ hoặc tăm bông thấm ít cồn để vệ sinh các kẽ phím nhé!",
        "category": "tips",
        "likes": 56,
        "comments": 0,
        "created_at": datetime.fromisoformat("2026-03-21T09:00:00"),
        "images": [
            "https://images.unsplash.com/photo-1587591431973-c62693b360b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        ],
    },
]


def sync_seed_post(post: Post, seed: dict) -> None:
    post.author = seed["author"]
    post.avatar = seed["avatar"]
    post.content = seed["content"]
    post.category = seed["category"]
    post.created_at = seed["created_at"]
    post.likes = seed["likes"]
    post.comments = seed["comments"]
    post.source_type = "seeded"

    existing_images = sorted(post.images, key=lambda image: image.position)
    if len(existing_images) != len(seed["images"]):
        post.images.clear()
        for index, image_url in enumerate(seed["images"]):
            post.images.append(PostImage(image_url=image_url, position=index))
        return

    for index, image_url in enumerate(seed["images"]):
        existing_images[index].image_url = image_url
        existing_images[index].position = index


def ensure_seed_data(session: Session) -> None:
    repository = PostsRepository(session)
    existing_seed_posts = {
        post.created_at: post
        for post in repository.list_posts()
        if post.source_type == "seeded"
    }

    for seed in SEED_POSTS:
        post = existing_seed_posts.get(seed["created_at"])
        if post is None:
            post = Post(source_type="seeded")
            repository.add_post(post)
        sync_seed_post(post, seed)

    session.commit()
