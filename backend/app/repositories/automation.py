from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.automation_history import AutomationHistory
from app.models.automation_settings import AutomationSettings


class AutomationRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_settings(self) -> AutomationSettings | None:
        stmt: Select[tuple[AutomationSettings]] = select(AutomationSettings).order_by(AutomationSettings.id.asc())
        return self.session.scalar(stmt)

    def save_settings(self, settings: AutomationSettings) -> AutomationSettings:
        self.session.add(settings)
        return settings

    def list_history(self) -> list[AutomationHistory]:
        stmt: Select[tuple[AutomationHistory]] = select(AutomationHistory).order_by(
            AutomationHistory.created_at.desc(),
            AutomationHistory.id.desc(),
        )
        return list(self.session.scalars(stmt).all())

    def add_history_item(self, item: AutomationHistory) -> AutomationHistory:
        self.session.add(item)
        return item

    def get_history_item(self, item_id: int) -> AutomationHistory | None:
        stmt: Select[tuple[AutomationHistory]] = select(AutomationHistory).where(AutomationHistory.id == item_id)
        return self.session.scalar(stmt)
