from sqlalchemy import inspect


def test_expected_tables_exist(db_engine):
    inspector = inspect(db_engine)

    assert set(inspector.get_table_names()) >= {
        "posts",
        "post_images",
        "user_post_states",
        "automation_settings",
        "automation_history",
    }
