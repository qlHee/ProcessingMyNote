"""
Image Processing Service - OpenCV based image enhancement
Transforms handwritten notes into clean, scannable documents
"""
import cv2
import numpy as np
from pathlib import Path
from dataclasses import dataclass
from app.config import settings


@dataclass
class ProcessingParams:
    """Parameters for image processing"""
    block_size: int = 11      # Adaptive threshold block size (must be odd)
    c: int = 2                # Threshold constant
    contrast: float = 1.0     # Contrast factor (0.5 - 2.0)
    brightness: int = 0       # Brightness adjustment (-100 to 100)
    denoise_strength: int = 10  # Denoising strength (0-30)
    sharpen: bool = True      # Apply sharpening
    
    @classmethod
    def from_dict(cls, data: dict) -> "ProcessingParams":
        """Create from dictionary"""
        return cls(
            block_size=data.get("block_size", 11),
            c=data.get("c", 2),
            contrast=data.get("contrast", 1.0),
            brightness=data.get("brightness", 0),
            denoise_strength=data.get("denoise_strength", 10),
            sharpen=data.get("sharpen", True),
        )
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "block_size": self.block_size,
            "c": self.c,
            "contrast": self.contrast,
            "brightness": self.brightness,
            "denoise_strength": self.denoise_strength,
            "sharpen": self.sharpen,
        }


class ImageProcessor:
    """
    Image processing pipeline for handwritten notes
    Transforms photos into clean, high-contrast scanned documents
    """
    
    def __init__(self, params: ProcessingParams = None):
        self.params = params or ProcessingParams()
    
    def process(self, image_path: str, output_path: str = None) -> str:
        """
        Main processing pipeline
        
        Args:
            image_path: Path to input image
            output_path: Path for output image (optional)
            
        Returns:
            Path to processed image
        """
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")
        
        # Processing pipeline
        processed = self._pipeline(img)
        
        # Generate output path if not provided
        if output_path is None:
            input_path = Path(image_path)
            output_path = str(settings.PROCESSED_DIR / f"{input_path.stem}_processed{input_path.suffix}")
        
        # Save processed image
        cv2.imwrite(output_path, processed)
        return output_path
    
    def _pipeline(self, img: np.ndarray) -> np.ndarray:
        """
        Full processing pipeline:
        1. Adjust contrast/brightness
        2. Convert to grayscale
        3. Denoise
        4. Adaptive threshold (binarization)
        5. Morphological operations
        6. Sharpen (optional)
        """
        # Step 1: Adjust contrast and brightness
        img = self._adjust_contrast_brightness(img)
        
        # Step 2: Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Step 3: Denoise
        if self.params.denoise_strength > 0:
            gray = cv2.fastNlMeansDenoising(
                gray, 
                None, 
                h=self.params.denoise_strength,
                templateWindowSize=7,
                searchWindowSize=21
            )
        
        # Step 4: Adaptive threshold for binarization
        # This creates the "white paper, black text" effect
        block_size = self.params.block_size
        if block_size % 2 == 0:
            block_size += 1  # Must be odd
        
        binary = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            block_size,
            self.params.c
        )
        
        # Step 5: Morphological operations to clean up
        kernel = np.ones((2, 2), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        # Step 6: Optional sharpening
        if self.params.sharpen:
            binary = self._sharpen(binary)
        
        # Convert back to BGR for consistent output
        result = cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)
        
        return result
    
    def _adjust_contrast_brightness(self, img: np.ndarray) -> np.ndarray:
        """Adjust contrast and brightness"""
        alpha = self.params.contrast  # Contrast
        beta = self.params.brightness  # Brightness
        return cv2.convertScaleAbs(img, alpha=alpha, beta=beta)
    
    def _sharpen(self, img: np.ndarray) -> np.ndarray:
        """Apply sharpening filter"""
        kernel = np.array([
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ])
        return cv2.filter2D(img, -1, kernel)
    
    def process_with_params(
        self, 
        image_path: str, 
        output_path: str,
        params: dict
    ) -> str:
        """
        Process image with custom parameters
        Used for AI-driven adjustments
        """
        self.params = ProcessingParams.from_dict(params)
        return self.process(image_path, output_path)


class ImageEnhancer:
    """
    Additional enhancement methods for specific issues
    """
    
    @staticmethod
    def remove_shadow(img: np.ndarray) -> np.ndarray:
        """Remove shadows from document image"""
        rgb_planes = cv2.split(img)
        result_planes = []
        
        for plane in rgb_planes:
            dilated = cv2.dilate(plane, np.ones((7, 7), np.uint8))
            bg = cv2.medianBlur(dilated, 21)
            diff = 255 - cv2.absdiff(plane, bg)
            result_planes.append(cv2.normalize(diff, None, 0, 255, cv2.NORM_MINMAX))
        
        return cv2.merge(result_planes)
    
    @staticmethod
    def deskew(img: np.ndarray) -> np.ndarray:
        """Correct skewed document"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
        
        # Find edges
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        
        # Detect lines
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=10)
        
        if lines is None:
            return img
        
        # Calculate average angle
        angles = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
            if abs(angle) < 45:  # Only consider near-horizontal lines
                angles.append(angle)
        
        if not angles:
            return img
        
        median_angle = np.median(angles)
        
        # Rotate image
        h, w = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
        rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        
        return rotated
    
    @staticmethod
    def auto_crop(img: np.ndarray, padding: int = 10) -> np.ndarray:
        """Auto crop to content area"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
        
        # Threshold
        _, thresh = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY_INV)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return img
        
        # Get bounding box of all contours
        x_min, y_min = img.shape[1], img.shape[0]
        x_max, y_max = 0, 0
        
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            x_min = min(x_min, x)
            y_min = min(y_min, y)
            x_max = max(x_max, x + w)
            y_max = max(y_max, y + h)
        
        # Add padding
        x_min = max(0, x_min - padding)
        y_min = max(0, y_min - padding)
        x_max = min(img.shape[1], x_max + padding)
        y_max = min(img.shape[0], y_max + padding)
        
        return img[y_min:y_max, x_min:x_max]


# Convenience function for quick processing
def process_note_image(
    input_path: str,
    output_path: str = None,
    params: dict = None
) -> tuple[str, dict]:
    """
    Process a note image with default or custom parameters
    
    Returns:
        Tuple of (output_path, params_used)
    """
    processor = ImageProcessor()
    
    if params:
        processor.params = ProcessingParams.from_dict(params)
    
    result_path = processor.process(input_path, output_path)
    return result_path, processor.params.to_dict()
