import base64
import io
import numpy as np
from typing import Optional

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
    if not CV2_AVAILABLE or not PIL_AVAILABLE:
        return None
    try:
        image_data = base64.b64decode(frame_base64)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        frame = np.array(image)
        return cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
    except Exception:
        return None


def detect_faces(frame: np.ndarray) -> int:
    if not CV2_AVAILABLE:
        return 1
    try:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        face_cascade = cv2.CascadeClassifier(cascade_path)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        return len(faces)
    except Exception:
        return 1


def analyze_frame(frame_base64: str) -> dict:
    frame = decode_frame(frame_base64)
    if frame is None:
        return {"event_type": "analysis_failed", "severity": "low", "face_count": 0}

    face_count = detect_faces(frame)

    if face_count == 0:
        return {"event_type": "no_face", "severity": "medium", "face_count": 0}
    elif face_count > 1:
        return {"event_type": "multiple_persons", "severity": "high", "face_count": face_count}
    else:
        return {"event_type": "all_clear", "severity": "low", "face_count": 1}
