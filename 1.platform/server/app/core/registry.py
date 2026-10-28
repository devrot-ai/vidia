"""Tracks running missions so they can be aborted and counted."""

from __future__ import annotations

import asyncio
import time
from collections import defaultdict

from app.core.runner import MissionRunner


class Registry:
    def __init__(
        self,
        *,
        live_per_ip_per_hour: int = 3,
        max_concurrent: int = 3,
        replay_per_ip_per_hour: int = 12,
    ) -> None:
        self._runners: dict[str, MissionRunner] = {}
        self._tasks: dict[str, asyncio.Task[object]] = {}
        self._ip_hits: dict[str, list[float]] = defaultdict(list)
        self._replay_hits: dict[str, list[float]] = defaultdict(list)
        self.live_per_ip_per_hour = live_per_ip_per_hour
        self.replay_per_ip_per_hour = replay_per_ip_per_hour
        self.max_concurrent = max_concurrent

    def start(self, runner: MissionRunner) -> None:
        task = asyncio.get_running_loop().create_task(runner.run())
        self._runners[runner.m.id] = runner
        self._tasks[runner.m.id] = task
        mission_id = runner.m.id

        def _done(_t: asyncio.Task[object]) -> None:
            self._cleanup(mission_id)

        task.add_done_callback(_done)

    def _cleanup(self, mission_id: str) -> None:
        self._runners.pop(mission_id, None)
        self._tasks.pop(mission_id, None)

    def abort(self, mission_id: str, reason: str = "aborted by user") -> bool:
        runner = self._runners.get(mission_id)
        if runner is None:
            return False
        runner.abort(reason)
        return True

    @property
    def running(self) -> int:
        return len(self._runners)

    def _allow(self, hits: dict[str, list[float]], ip: str, per_hour: int) -> bool:
        now = time.time()
        recent = [t for t in hits[ip] if now - t < 3600]
        if recent:
            hits[ip] = recent
        else:
            hits.pop(ip, None)  # never let the counter dict grow without bound
        if len(recent) >= per_hour:
            return False
        recent.append(now)
        return True

    def allow_live(self, ip: str) -> bool:
        if self.running >= self.max_concurrent:
            return False
        return self._allow(self._ip_hits, ip, self.live_per_ip_per_hour)

    def allow_replay(self, ip: str) -> bool:
        """Replays are free, but each one streams events from a background task."""
        return self._allow(self._replay_hits, ip, self.replay_per_ip_per_hour)

    async def shutdown(self) -> None:
        for mid in list(self._runners):
            self.abort(mid, "server shutting down")
        for task in list(self._tasks.values()):
            task.cancel()
