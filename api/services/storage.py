import logging
from pathlib import Path
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class StorageBackend(ABC):
    @abstractmethod
    async def save(self, key: str, data: bytes, content_type: str | None = None) -> str:
        ...

    @abstractmethod
    async def load(self, key: str) -> bytes | None:
        ...

    @abstractmethod
    async def delete(self, key: str) -> bool:
        ...

    @abstractmethod
    async def exists(self, key: str) -> bool:
        ...


class LocalStorageBackend(StorageBackend):
    def __init__(self, base_dir: str = "./uploads"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save(self, key: str, data: bytes, content_type: str | None = None) -> str:
        path = self.base_dir / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return str(path)

    async def load(self, key: str) -> bytes | None:
        path = self.base_dir / key
        if path.exists():
            return path.read_bytes()
        return None

    async def delete(self, key: str) -> bool:
        path = self.base_dir / key
        if path.exists():
            path.unlink()
            return True
        return False

    async def exists(self, key: str) -> bool:
        return (self.base_dir / key).exists()
