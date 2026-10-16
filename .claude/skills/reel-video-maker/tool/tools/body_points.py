# Finds body points (head, shoulders, elbows, wrists, hips, knees, ankles) in
# character images with MediaPipe Pose (offline; pip install mediapipe==0.10.14).
# Points are stored as 0..1 of the image so the renderer can place rings,
# arrows and zooms on "hips", "head", ... instead of guessed coordinates.
import os
os.environ.setdefault('GLOG_minloglevel', '2')
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')
import numpy as np
from PIL import Image

NAMES = {0: 'nose', 11: 'shoulder_l', 12: 'shoulder_r', 13: 'elbow_l', 14: 'elbow_r', 15: 'wrist_l', 16: 'wrist_r',
         23: 'hip_l', 24: 'hip_r', 25: 'knee_l', 26: 'knee_r', 27: 'ankle_l', 28: 'ankle_r'}
_pose = None


def _model():
    global _pose
    if _pose is None:
        import mediapipe as mp
        _pose = mp.solutions.pose.Pose(static_image_mode=True, model_complexity=1, min_detection_confidence=0.3)
    return _pose


def body_points(img):
    """img: PIL RGBA image of the character. Returns {name: [x, y]} (0..1) or None."""
    im = img.convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    res = _model().process(np.asarray(bg.convert('RGB')))
    if not res.pose_landmarks:
        return None
    lms = res.pose_landmarks.landmark
    return {name: [round(min(1, max(0, lms[i].x)), 4), round(min(1, max(0, lms[i].y)), 4)] for i, name in NAMES.items()}
