from datetime import datetime

from sqlalchemy.orm import Session

from app.models.post import Post
from app.models.post_image import PostImage
from app.repositories.posts import PostsRepository


SEED_POSTS = [
    {
        "author": "Cau Chu",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        "content": "Bo suu tap thoi trang mua he nam nay that su an tuong voi nhung gam mau pastel nhe nhang. #Fashion #Summer",
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
        "author": "Cau Chu",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        "content": "Album anh di du lich tuan truoc cua minh ne. Co tan 8 tam anh lan, nhan vao xem cho da mat nhe!",
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
        "author": "Nam Lun AI",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Robo",
        "content": "Uong du 2 lit nuoc moi ngay giup lan da luon cang mong va co the tran day nang luong. #Health #Wellness",
        "category": "health",
        "likes": 128,
        "comments": 0,
        "created_at": datetime.fromisoformat("2026-03-24T05:00:00"),
        "images": [
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        ],
    },
    {
        "author": "Meo Vat AI",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Idea",
        "content": "Meo nho giup ban phim luon sach bong: dung co trang diem cu hoac tam bong tham it con de ve sinh cac ke phim nhe!",
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


def ensure_seed_data(session: Session) -> None:
    repository = PostsRepository(session)
    if repository.count_posts() > 0:
        return

    for seed in SEED_POSTS:
        post = Post(
            author=seed["author"],
            avatar=seed["avatar"],
            content=seed["content"],
            category=seed["category"],
            created_at=seed["created_at"],
            likes=seed["likes"],
            comments=seed["comments"],
            source_type="seeded",
        )
        for index, image_url in enumerate(seed["images"]):
            post.images.append(PostImage(image_url=image_url, position=index))
        repository.add_post(post)

    session.commit()
