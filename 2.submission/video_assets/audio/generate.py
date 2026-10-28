import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts

HERE = Path(__file__).parent
VOICE = "en-KE-ChilembaNeural"
RATE = "-8%"  # measured, ~150wpm pace per VIDEO.md voice direction


async def synth(text: str, out_path: Path) -> None:
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
    await communicate.save(str(out_path))


def duration_seconds(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path),
        ],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())


async def main() -> None:
    segments = json.loads((HERE / "segments.json").read_text())
    report = []
    for seg in segments:
        out_path = HERE / f"{seg['id']}.mp3"
        await synth(seg["text"], out_path)
        dur = duration_seconds(out_path)
        report.append((seg["id"], seg["target"], dur))
        print(f"{seg['id']:<22} target {seg['target']:<12} actual {dur:6.2f}s  -> {out_path.name}")

    total = sum(r[2] for r in report)
    print(f"\nTotal narration length: {total:.2f}s ({total/60:.2f} min)")


if __name__ == "__main__":
    asyncio.run(main())
