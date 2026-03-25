from collections import deque
from dataclasses import dataclass
from threading import Lock, Thread
from time import sleep

from app.core.database import get_session_factory
from app.schemas.automation_generation import AutomationBatchPlan


@dataclass
class RunnerWorkItem:
    plan: AutomationBatchPlan


class AutomationJobRunner:
    def __init__(self, session_factory=None, idle_sleep_seconds: float = 0.05):
        self.session_factory = session_factory or get_session_factory()
        self.idle_sleep_seconds = idle_sleep_seconds
        self._lock = Lock()
        self._queue: deque[RunnerWorkItem] = deque()
        self._worker: Thread | None = None

    def enqueue(self, plans: list[AutomationBatchPlan], start_async: bool = True) -> None:
        with self._lock:
            for plan in plans:
                self._queue.append(RunnerWorkItem(plan=plan))

        if start_async:
            self._ensure_started()

    def run_until_idle(self) -> None:
        while True:
            item = self._pop_next()
            if item is None:
                return
            self._process(item.plan)

    def _ensure_started(self) -> None:
        with self._lock:
            if self._worker and self._worker.is_alive():
                return
            self._worker = Thread(target=self._worker_loop, name="automation-job-runner", daemon=True)
            self._worker.start()

    def _worker_loop(self) -> None:
        while True:
            item = self._pop_next()
            if item is None:
                return
            self._process(item.plan)
            sleep(self.idle_sleep_seconds)

    def _pop_next(self) -> RunnerWorkItem | None:
        with self._lock:
            if not self._queue:
                return None
            return self._queue.popleft()

    def _process(self, plan: AutomationBatchPlan) -> None:
        from app.services.automation import AutomationService

        session = self.session_factory()
        try:
            AutomationService(session).process_batch_job(plan)
        finally:
            session.close()


_runner_lock = Lock()
_runner_instance: AutomationJobRunner | None = None


def get_automation_runner(session_factory=None) -> AutomationJobRunner:
    global _runner_instance
    with _runner_lock:
        if _runner_instance is None or session_factory is not None:
            _runner_instance = AutomationJobRunner(session_factory=session_factory)
        return _runner_instance


def set_automation_runner_for_tests(runner: AutomationJobRunner | None) -> None:
    global _runner_instance
    with _runner_lock:
        _runner_instance = runner
