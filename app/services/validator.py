from PIL import Image
import os
from loguru import logger

class DataValidator:
    """
    Production data validation layer.
    Ensures images are valid, not corrupted, and meet minimum quality for ML.
    """
    def __init__(self, min_width=200, min_height=200, max_size_mb=10):
        self.min_width = min_width
        self.min_height = min_height
        self.max_size_mb = max_size_mb

    def validate_image(self, file_path: str) -> bool:
        # 1. check exists
        if not os.path.exists(file_path):
            logger.error(f"Validation failed: {file_path} does not exist")
            return False
            
        # 2. Check size
        size_mb = os.path.getsize(file_path) / (1024 * 1024)
        if size_mb > self.max_size_mb:
            logger.warning(f"Validation failed: Image too large ({size_mb:.2f}MB)")
            return False
            
        # 3. Check integrity and dimensions
        try:
            with Image.open(file_path) as img:
                img.verify() # Verify it's a valid image
                width, height = img.size
                if width < self.min_width or height < self.min_height:
                    logger.warning(f"Validation failed: Image too small ({width}x{height})")
                    return False
            return True
        except Exception as e:
            logger.error(f"Validation failed: Corrupted image {file_path} - {e}")
            return False

validator = DataValidator()
