from pydantic import BaseModel, ConfigDict, Field


class PostResponse(BaseModel):
    id: int
    author: str
    avatar: str
    content: str
    images: list[str]
    time: str
    created_at: str = Field(alias="createdAt")
    category: str
    likes: int
    comments: int

    model_config = ConfigDict(populate_by_name=True)
