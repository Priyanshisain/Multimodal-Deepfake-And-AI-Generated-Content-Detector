import os
import uuid
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException
from app.config import (
    UPLOADS_DIR,
    MAX_FILE_SIZE_BYTES,
    SUPPORTED_VIDEO_EXTS,
    SUPPORTED_IMAGE_EXTS,
    SUPPORTED_AUDIO_EXTS,
    SUPPORTED_TEXT_EXTS
)

class MediaService:
    @staticmethod
    def get_storage_path(extension: str) -> Path:
        """Returns structured folder /storage/uploads/YYYY/MM/."""
        now = datetime.utcnow()
        month_dir = UPLOADS_DIR / f"{now.year:04d}" / f"{now.month:02d}"
        month_dir.mkdir(parents=True, exist_ok=True)
        unique_name = f"{uuid.uuid4()}{extension}"
        return month_dir / unique_name

    @classmethod
    def validate_file(cls, file: UploadFile) -> str:
        """
        Validates filename extension and returns media type ('video', 'image', 'audio', 'text').
        """
        ext = Path(file.filename).suffix.lower()
        if ext in SUPPORTED_VIDEO_EXTS:
            return "video"
        elif ext in SUPPORTED_IMAGE_EXTS:
            return "image"
        elif ext in SUPPORTED_AUDIO_EXTS:
            return "audio"
        elif ext in SUPPORTED_TEXT_EXTS:
            return "text"
        else:
            supported = list(SUPPORTED_VIDEO_EXTS | SUPPORTED_IMAGE_EXTS | SUPPORTED_AUDIO_EXTS | SUPPORTED_TEXT_EXTS)
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(supported)}"
            )

    @classmethod
    async def save_upload(cls, file: UploadFile) -> Tuple[str, str, int, str]:
        """
        Saves uploaded file to disk within size limit.
        Returns: (media_type, target_file_path, file_size_bytes, original_filename)
        """
        media_type = cls.validate_file(file)
        ext = Path(file.filename).suffix.lower()
        target_path = cls.get_storage_path(ext)

        total_bytes = 0
        with open(target_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # 1MB buffer
                total_bytes += len(chunk)
                if total_bytes > MAX_FILE_SIZE_BYTES:
                    f.close()
                    if target_path.exists():
                        target_path.unlink()
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB"
                    )
                f.write(chunk)

        return media_type, str(target_path), total_bytes, file.filename

    @classmethod
    def extract_audio_from_video(cls, video_path: str) -> Optional[str]:
        """
        Extracts audio from video to a temporary WAV file using imageio_ffmpeg if available.
        """
        try:
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            audio_out = Path(video_path).with_suffix(".extracted.wav")
            cmd = [
                ffmpeg_exe,
                "-y",
                "-i", video_path,
                "-vn",
                "-acodec", "pcm_s16le",
                "-ar", "16000",
                "-ac", "1",
                str(audio_out)
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode == 0 and audio_out.exists() and audio_out.stat().st_size > 100:
                return str(audio_out)
        except Exception:
            pass
        return None
