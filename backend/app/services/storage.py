import os
import uuid
import mimetypes
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException
from app.core.config import settings

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024  # 3 MB default

class StorageService:
    def __init__(self):
        self.local_dir = settings.LOCAL_STORAGE_DIR
        os.makedirs(self.local_dir, exist_ok=True)
        self.supabase_client = None
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
            try:
                from supabase import create_client
                self.supabase_client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SERVICE_ROLE_KEY
                )
            except Exception as e:
                print(f"[StorageService] Warning: Failed to initialize Supabase client: {e}. Falling back to local storage.")

    def validate_file(self, file: UploadFile, max_size_mb: int = 3) -> None:
        filename = file.filename or ""
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file extension '{ext}'. Only JPG, JPEG, PNG, and WebP are allowed."
            )
        
        content_type = file.content_type
        if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file MIME type '{content_type}'. Only JPEG, PNG, and WebP images are allowed."
            )

    async def save_screenshot(self, file: UploadFile, registration_id: str, max_size_mb: int = 3) -> str:
        self.validate_file(file, max_size_mb)
        
        contents = await file.read()
        max_bytes = max_size_mb * 1024 * 1024
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum limit of {max_size_mb} MB."
            )
        
        ext = os.path.splitext(file.filename or "proof.png")[1].lower()
        if not ext:
            ext = ".png"
        
        unique_filename = f"{registration_id}_{uuid.uuid4().hex[:8]}{ext}"

        # If Supabase storage is configured, upload to private bucket
        if self.supabase_client:
            try:
                bucket = settings.SUPABASE_STORAGE_BUCKET
                path = f"screenshots/{unique_filename}"
                self.supabase_client.storage.from_(bucket).upload(
                    path,
                    contents,
                    file_options={"content-type": file.content_type or "image/png"}
                )
                return f"supabase://{bucket}/{path}"
            except Exception as e:
                # If Supabase upload fails, log and fallback to local
                print(f"[StorageService] Supabase upload failed ({e}), saving locally.")

        # Local storage save
        local_path = os.path.join(self.local_dir, unique_filename)
        with open(local_path, "wb") as f:
            f.write(contents)
        
        return f"local://{unique_filename}"

    async def save_player_photo(self, file: UploadFile, max_size_mb: int = 3) -> str:
        self.validate_file(file, max_size_mb)
        contents = await file.read()
        max_bytes = max_size_mb * 1024 * 1024
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum limit of {max_size_mb} MB."
            )
        
        ext = os.path.splitext(file.filename or "photo.webp")[1].lower()
        if not ext:
            ext = ".webp"
        
        unique_filename = f"player_{uuid.uuid4().hex[:12]}{ext}"

        if self.supabase_client:
            try:
                bucket = settings.SUPABASE_STORAGE_BUCKET
                path = f"photos/{unique_filename}"
                self.supabase_client.storage.from_(bucket).upload(
                    path,
                    contents,
                    file_options={"content-type": file.content_type or "image/webp"}
                )
                return f"supabase://{bucket}/{path}"
            except Exception as e:
                print(f"[StorageService] Supabase player photo upload failed ({e}), saving locally.")

        local_path = os.path.join(self.local_dir, unique_filename)
        with open(local_path, "wb") as f:
            f.write(contents)
        
        return f"local://{unique_filename}"

    def get_public_or_signed_url(self, storage_path: Optional[str], expiry_seconds: int = 604800) -> Optional[str]:
        """
        Generates direct signed URL (7 days validity) or public URL for web/mobile browsers.
        """
        if not storage_path:
            return None
        if storage_path.startswith("http://") or storage_path.startswith("https://"):
            return storage_path
        if storage_path.startswith("supabase://"):
            parts = storage_path.replace("supabase://", "").split("/", 1)
            if len(parts) == 2:
                bucket, path = parts[0], parts[1]
                if self.supabase_client:
                    try:
                        res = self.supabase_client.storage.from_(bucket).create_signed_url(path, expiry_seconds)
                        url = res.get("signedURL") or res.get("signedUrl")
                        if url:
                            return url
                    except Exception as e:
                        print(f"[StorageService] create_signed_url error: {e}")
                
                # Fallback to direct supabase URL
                if settings.SUPABASE_URL:
                    base = settings.SUPABASE_URL.rstrip("/")
                    return f"{base}/storage/v1/object/public/{bucket}/{path}"

        filename = storage_path.replace("local://", "")
        if "/" in filename:
            filename = os.path.basename(filename)
        return f"/api/v1/storage/local/{filename}"

    def get_file_bytes_or_url(self, storage_path: str) -> Tuple[Optional[bytes], Optional[str], str]:
        """
        Returns (file_bytes, signed_url, mime_type)
        """
        if storage_path.startswith("supabase://"):
            # Format: supabase://bucket/path
            parts = storage_path.replace("supabase://", "").split("/", 1)
            bucket = parts[0]
            path = parts[1]
            if self.supabase_client:
                # Generate signed URL valid for 7 days
                res = self.supabase_client.storage.from_(bucket).create_signed_url(path, 604800)
                signed_url = res.get("signedURL") or res.get("signedUrl")
                return None, signed_url, "image/jpeg"
        
        # Local fallback
        filename = storage_path.replace("local://", "")
        # Also handle raw path if stored
        if "/" in filename:
            filename = os.path.basename(filename)
        local_path = os.path.join(self.local_dir, filename)
        if not os.path.exists(local_path):
            raise HTTPException(status_code=404, detail="Payment screenshot file not found.")
        
        with open(local_path, "rb") as f:
            data = f.read()
        
        mime_type, _ = mimetypes.guess_type(local_path)
        return data, None, mime_type or "image/jpeg"

    def delete_file(self, storage_path: Optional[str]) -> bool:
        """
        Deletes a file from Supabase storage bucket or local disk.
        """
        if not storage_path:
            return False
        try:
            if storage_path.startswith("supabase://"):
                parts = storage_path.replace("supabase://", "").split("/", 1)
                if len(parts) == 2 and self.supabase_client:
                    bucket, path = parts[0], parts[1]
                    self.supabase_client.storage.from_(bucket).remove([path])
                    return True
            elif storage_path.startswith("local://"):
                filename = storage_path.replace("local://", "")
                if "/" in filename:
                    filename = os.path.basename(filename)
                local_path = os.path.join(self.local_dir, filename)
                if os.path.exists(local_path):
                    os.remove(local_path)
                    return True
        except Exception as e:
            print(f"[StorageService] Failed to delete storage file {storage_path}: {e}")
        return False

storage_service = StorageService()
