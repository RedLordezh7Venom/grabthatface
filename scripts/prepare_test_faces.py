import os
import numpy as np
from sklearn.datasets import fetch_olivetti_faces
from PIL import Image
from pathlib import Path

def main():
    print("Fetching Olivetti faces...")
    data = fetch_olivetti_faces()
    images = data.images
    targets = data.target
    
    target_dir = Path("tests/data/faces/olivetti")
    target_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Preparing {len(images)} images...")
    
    # Save the first 5 images for the first 10 people for testing
    # 400 images total, 40 people, 10 images each
    for i in range(len(images)):
        person_id = targets[i]
        person_dir = target_dir / f"person_{person_id:02d}"
        person_dir.mkdir(exist_ok=True)
        
        # Olivetti images are grayscale in [0, 1]
        img_array = (images[i] * 255).astype(np.uint8)
        img = Image.fromarray(img_array, mode='L').convert('RGB')
        
        # Resize to 256x256 for better face detection
        img = img.resize((256, 256), Image.Resampling.LANCZOS)
        
        filename = f"image_{i % 10:02d}.jpg"
        img.save(person_dir / filename)
        
    print(f"Dataset prepared at {target_dir}")

if __name__ == "__main__":
    main()
