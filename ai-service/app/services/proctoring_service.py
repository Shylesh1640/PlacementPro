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
    """Decode base64 image (with or without data-URL prefix) to OpenCV BGR frame."""
    if not (CV2_AVAILABLE and PIL_AVAILABLE):
        return None
    try:
        if ',' in frame_base64:
            frame_base64 = frame_base64.split(',')[1]
        image_data = base64.b64decode(frame_base64)
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        frame = np.array(image)
        return cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
    except Exception as e:
        print(f"Frame decode error: {e}")
        return None


def detect_faces_haar(frame: np.ndarray) -> int:
    """
    Haar-cascade face detection (CPU-only, no GPU required).
    Returns number of faces found, or -1 on error.
    """
    try:
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        if face_cascade.empty():
            return -1
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.05,
            minNeighbors=4,
            minSize=(50, 50),
            maxSize=(400, 400),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )
        return int(len(faces)) if len(faces) > 0 else 0
    except Exception as e:
        print(f"Face detection error: {e}")
        return -1


def analyze_frame(frame_base64: str) -> Dict[str, Any]:
    """
    Analyze a webcam frame for proctoring violations.
    Called every ~5 seconds during an active assessment.

    Returns a dict with:
      event_type: str
      severity:   'high' | 'medium' | 'low'
      face_count: int
      message:    str
      flagged:    bool
    """
    frame = decode_frame(frame_base64)

    if frame is None:
        return {
            'event_type': 'analysis_failed',
            'severity':   'low',
            'face_count': 0,
            'message':    'Could not decode camera frame',
            'flagged':    False,
        }

    face_count = detect_faces_haar(frame)

    if face_count == -1:
        # Cascade unavailable — don't flag student, just report
        return {
            'event_type': 'all_clear',
            'severity':   'low',
            'face_count': 0,
            'message':    'Face detection unavailable (library issue)',
            'flagged':    False,
        }
    elif face_count == 0:
        return {
            'event_type': 'no_face',
            'severity':   'medium',
            'face_count': 0,
            'message':    'No face detected in camera feed — please stay in frame',
            'flagged':    True,
        }
    elif face_count > 1:
        return {
            'event_type': 'multiple_persons',
            'severity':   'high',
            'face_count': face_count,
            'message':    f'{face_count} persons detected in camera frame',
            'flagged':    True,
        }
    else:
        return {
            'event_type': 'all_clear',
            'severity':   'low',
            'face_count': 1,
            'message':    'Proctoring clear',
            'flagged':    False,
        }
