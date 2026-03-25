import re

from app.schemas.automation_generation import TrendSignal


CURATED_IMAGE_LIBRARY = {
    "fashion": [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1539109132314-34a95629ee7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=80",
    ],
    "health": [
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=80",
    ],
    "tips": [
        "https://images.unsplash.com/photo-1587591431973-c62693b360b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    ],
}


class AutomationImageProvider:
    def resolve_images(self, source: str, category: str, signal: TrendSignal) -> list[str]:
        images: list[str] = []
        if signal.image_url:
            images.append(signal.image_url)

        catalog = CURATED_IMAGE_LIBRARY.get(category, CURATED_IMAGE_LIBRARY["tips"])
        rotation = self._rotation_seed(source=source, category=category, title=signal.title)
        rotated = catalog[rotation:] + catalog[:rotation]

        for image_url in rotated:
            if image_url not in images:
                images.append(image_url)
            if len(images) >= 3:
                break

        return images[:3]

    def _rotation_seed(self, source: str, category: str, title: str) -> int:
        seed = sum(ord(char) for char in f"{source}:{category}:{title}")
        return seed % 3


def extract_first_image_url(description: str | None) -> str | None:
    if not description:
        return None

    match = re.search(r'<img[^>]+src="([^"]+)"', description)
    if not match:
        return None

    return match.group(1)


def strip_html_description(description: str | None) -> str | None:
    if not description:
        return None

    text = re.sub(r"<[^>]+>", " ", description)
    text = re.sub(r"\s+", " ", text).strip()
    return text or None
