from app.services.archive import ArchiveService


def test_save_post_creates_single_state_row(db_session, seeded_post):
    service = ArchiveService(db_session)

    service.save_post(seeded_post.id)
    service.save_post(seeded_post.id)

    saved_posts = service.list_archive(kind="saved")
    assert len(saved_posts) == 1
