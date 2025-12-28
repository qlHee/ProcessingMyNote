"""
OCR Service - Text recognition from images
Uses PaddleOCR for Chinese/English text recognition
"""
import re
from pathlib import Path
from typing import Optional


class OCRService:
    """
    OCR service for extracting text from note images
    Supports both Chinese and English text
    """
    
    _instance = None
    _ocr = None
    
    def __new__(cls):
        """Singleton pattern for OCR instance (heavy to initialize)"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        self._initialized = False
    
    def _ensure_initialized(self):
        """Lazy initialization of PaddleOCR"""
        if not self._initialized:
            try:
                from paddleocr import PaddleOCR
                self._ocr = PaddleOCR(
                    use_angle_cls=True,
                    lang='ch',  # Chinese + English
                    use_gpu=False,
                    show_log=False,
                )
                self._initialized = True
            except ImportError:
                print("Warning: PaddleOCR not installed. Using mock OCR.")
                self._ocr = None
                self._initialized = True
    
    def extract_text(self, image_path: str) -> str:
        """
        Extract text from image
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Extracted text as string
        """
        self._ensure_initialized()
        
        if self._ocr is None:
            return self._mock_extract(image_path)
        
        try:
            result = self._ocr.ocr(image_path, cls=True)
            
            if not result or not result[0]:
                return ""
            
            # Extract text from OCR result
            lines = []
            for line in result[0]:
                if line and len(line) >= 2:
                    text = line[1][0]  # Text content
                    lines.append(text)
            
            return "\n".join(lines)
        except Exception as e:
            print(f"OCR error: {e}")
            return self._mock_extract(image_path)
    
    def _mock_extract(self, image_path: str) -> str:
        """Mock OCR for testing when PaddleOCR is not available"""
        filename = Path(image_path).stem
        return f"[OCR Mock] Content from: {filename}"
    
    def generate_title(self, image_path: str, max_length: int = 50) -> str:
        """
        Generate a title from the first line of OCR text
        
        Args:
            image_path: Path to the image file
            max_length: Maximum title length
            
        Returns:
            Generated title string
        """
        text = self.extract_text(image_path)
        
        if not text:
            # Fallback to filename-based title
            filename = Path(image_path).stem
            return self._clean_filename(filename)
        
        # Get first meaningful line
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        if not lines:
            return self._clean_filename(Path(image_path).stem)
        
        title = lines[0]
        
        # Clean and truncate
        title = self._clean_title(title)
        
        if len(title) > max_length:
            title = title[:max_length-3] + "..."
        
        return title if title else "Untitled Note"
    
    def _clean_title(self, title: str) -> str:
        """Clean title string"""
        # Remove special characters that shouldn't be in titles
        title = re.sub(r'[<>:"/\\|?*]', '', title)
        # Remove excessive whitespace
        title = ' '.join(title.split())
        return title.strip()
    
    def _clean_filename(self, filename: str) -> str:
        """Convert filename to readable title"""
        # Replace underscores and hyphens with spaces
        title = filename.replace('_', ' ').replace('-', ' ')
        # Remove file extensions if any
        title = re.sub(r'\.(jpg|jpeg|png|gif|bmp|webp)$', '', title, flags=re.IGNORECASE)
        # Title case
        title = title.title()
        return title.strip()


# Singleton instance
ocr_service = OCRService()


def extract_text_from_image(image_path: str) -> str:
    """Convenience function to extract text"""
    return ocr_service.extract_text(image_path)


def generate_title_from_image(image_path: str) -> str:
    """Convenience function to generate title"""
    return ocr_service.generate_title(image_path)
