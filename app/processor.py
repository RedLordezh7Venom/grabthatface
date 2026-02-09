import face_recognition
import numpy as np
from typing import List, Tuple, Dict
import json
from .models import Photo, FaceEncoding

class FaceRecognizer:
    def __init__(self):
        self.known_face_encodings = []
        self.known_face_metadata = []

    def load_image_file(self, file_path: str):
        return face_recognition.load_image_file(file_path)

    def get_face_encodings(self, image) -> List[Tuple[np.ndarray, Tuple[int, int, int, int]]]:
        """
        Returns a list of (encoding, face_location) tuples.
        """
        # Find all the faces and face encodings in the image
        face_locations = face_recognition.face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        return list(zip(face_encodings, face_locations))

    def compare_faces_batch(self, known_encodings: List[np.ndarray], face_encoding_to_check: np.ndarray, tolerance=0.6) -> List[bool]:
        if not known_encodings:
            return []
        
        # Using numpy for efficient batch distance calculation
        # Euclidean distance
        distances = np.linalg.norm(np.array(known_encodings) - face_encoding_to_check, axis=1)
        return list(distances <= tolerance)

    def serialize_encoding(self, encoding: np.ndarray) -> str:
        return json.dumps(encoding.tolist())

    def deserialize_encoding(self, encoding_str: str) -> np.ndarray:
        return np.array(json.loads(encoding_str))
