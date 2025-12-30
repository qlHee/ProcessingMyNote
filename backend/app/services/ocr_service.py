"""
OCR Service - Text recognition from images
Uses pytesseract or PaddleOCR for Chinese/English text recognition
"""
import re
from pathlib import Path
from typing import Optional
from datetime import datetime


class OCRService:
    """
    OCR service for extracting text from note images
    Supports both Chinese and English text
    """
    
    _instance = None
    _ocr = None
    _ocr_type = None  # 'tesseract', 'paddle', or None
    
    def __new__(cls):
        """Singleton pattern for OCR instance (heavy to initialize)"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        self._initialized = False
    
    def _ensure_initialized(self):
        """Lazy initialization of OCR engine"""
        if not self._initialized:
            # Try pytesseract first (more stable)
            try:
                import pytesseract
                from PIL import Image
                # Test if tesseract is available
                pytesseract.get_tesseract_version()
                self._ocr = pytesseract
                self._ocr_type = 'tesseract'
                self._initialized = True
                print("OCR: Using pytesseract")
                return
            except Exception as e:
                print(f"pytesseract not available: {e}")
            
            # Try PaddleOCR as fallback
            try:
                from paddleocr import PaddleOCR
                self._ocr = PaddleOCR(
                    use_angle_cls=True,
                    lang='ch',
                    use_gpu=False,
                    show_log=False,
                )
                self._ocr_type = 'paddle'
                self._initialized = True
                print("OCR: Using PaddleOCR")
                return
            except Exception as e:
                print(f"PaddleOCR not available: {e}")
            
            # No OCR available
            print("Warning: No OCR engine available. Using timestamp-based naming.")
            self._ocr = None
            self._ocr_type = None
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
            return self._generate_default_text(image_path)
        
        try:
            if self._ocr_type == 'tesseract':
                from PIL import Image
                img = Image.open(image_path)
                # Try Chinese + English
                text = self._ocr.image_to_string(img, lang='chi_sim+eng')
                if not text.strip():
                    text = self._ocr.image_to_string(img, lang='eng')
                return text.strip()
            
            elif self._ocr_type == 'paddle':
                result = self._ocr.ocr(image_path, cls=True)
                if not result or not result[0]:
                    return ""
                lines = []
                for line in result[0]:
                    if line and len(line) >= 2:
                        text = line[1][0]
                        lines.append(text)
                return "\n".join(lines)
        
        except Exception as e:
            print(f"OCR error: {e}")
            return self._generate_default_text(image_path)
        
        return self._generate_default_text(image_path)
    
    def _generate_default_text(self, image_path: str) -> str:
        """Generate default text when OCR is not available"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        return f"笔记 - {timestamp}"
    
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
