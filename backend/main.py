from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import datetime

app = FastAPI(title="BlogAINamLun API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Post(BaseModel):
    id: int
    title: str
    content: str
    author: str = "Admin"
    created_at: str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

# Mock database
posts = [
    {
        "id": 1,
        "title": "Chào mừng cậu Chủ đến với BlogAINamLun",
        "content": "Đây là bài viết đầu tiên được con Sen tạo ra để chào đón cậu Chủ!",
        "author": "Con Sen",
        "created_at": "2026-03-23 12:00"
    },
    {
        "id": 2,
        "title": "Kế hoạch tích hợp AI cho Blog",
        "content": "Trong tương lai, con Sen sẽ giúp cậu Chủ tự động viết bài bằng AI cực chất.",
        "author": "Con Sen",
        "created_at": "2026-03-23 12:05"
    }
]

@app.get("/")
def read_root():
    return {"message": "BlogAINamLun API is running!"}

@app.get("/posts", response_model=List[Post])
def get_posts():
    return posts

@app.get("/posts/{post_id}", response_model=Post)
def get_post(post_id: int):
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết này ạ!")
    return post

@app.post("/posts", response_model=Post)
def create_post(post: Post):
    posts.append(post.dict())
    return post

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
