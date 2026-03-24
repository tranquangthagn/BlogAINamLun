from pydantic import BaseModel


class PostStateResponse(BaseModel):
    post_id: int
    saved: bool
    read: bool
