import base64
import io
import numpy as np
from typing import Optional, Dict, Any

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


def decode_frame(frame_base64: str) -> Optional[np.ndarray]:
    """Decode base64 JPEG/PNG to OpenCV BGR frame."""
    if not (CV2_AVAILABLE and PIL_AVAILABLE):
        return None
    try:
        if ',' in frame_base64:
            frame_base64 = frame_base64.split(',', 1)[1]
        image_bytes = base64.b64decode(frame_base64 + '==')
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        frame = np.array(image)
        return cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
    except Exception as e:
        print(f"Frame decode error: {e}")
        return None


def detect_faces(frame: np.ndarray) -> int:
    """
    Count faces using Haar Cascade + histogram equalisation.
    Returns: -1 = detection unavailable, 0 = no face, N = N faces detected
    """
    if not CV2_AVAILABLE:
        return -1
    try:
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        if face_cascade.empty():
            return -1
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.08,
            minNeighbors=4,
            minSize=(40, 40),
            maxSize=(500, 500),
        )
        return len(faces) if hasattr(faces, '__len__') and len(faces) > 0 else 0
    except Exception as e:
        print(f"Face detection error: {e}")
        return -1


def detect_objects_near_face(frame: np.ndarray, face_count: int) -> bool:
    """
    Heuristic: flag if >30% of frame is very bright (phone screen, book, second monitor).
    """
    if not CV2_AVAILABLE or face_count == 0:
        return False
    try:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        _, bright = cv2.threshold(gray, 230, 255, cv2.THRESH_BINARY)
        bright_ratio = cv2.countNonZero(bright) / (frame.shape[0] * frame.shape[1])
        return bright_ratio > 0.3
    except Exception:
        return False


def analyze_frame(frame_base64: str) -> Dict[str, Any]:
    """Full proctoring analysis of a webcam frame."""
    frame = decode_frame(frame_base64)

    if frame is None:
        return {
            'event_type': 'analysis_failed',
            'severity': 'low',
            'face_count': 0,
            'message': 'Could not decode camera frame',
            'flagged': False,
        }

    face_count = detect_faces(frame)

    if face_count == -1:
        return {
            'event_type': 'all_clear',
            'severity': 'low',
            'face_count': 0,
            'message': 'Face detection unavailable (running without camera model)',
            'flagged': False,
        }

    if face_count == 0:
        return {
            'event_type': 'no_face',
            'severity': 'medium',
            'face_count': 0,
            'message': 'No face detected in camera feed. Please look at the screen.',
            'flagged': True,
        }

    if face_count > 1:
        return {
            'event_type': 'multiple_persons',
            'severity': 'high',
            'face_count': face_count,
            'message': f'{face_count} persons detected. Only one person allowed during the exam.',
            'flagged': True,
        }

    if detect_objects_near_face(frame, face_count):
        return {
            'event_type': 'suspicious_object',
            'severity': 'medium',
            'face_count': 1,
            'message': 'Bright object or screen detected near face. Please ensure no unauthorized aids.',
            'flagged': True,
        }

    return {
        'event_type': 'all_clear',
        'severity': 'low',
        'face_count': 1,
        'message': 'Proctoring clear — 1 face detected',
        'flagged': False,
    }
