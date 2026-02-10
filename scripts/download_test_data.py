import os
import requests
from pathlib import Path

def download_file(url, dest_path):
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(dest_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=1024):
                f.write(chunk)
        return True
    return False

def main():
    base_url = "http://vis-www.cs.umass.edu/lfw/images/"
    people = {
        "Ariel_Sharon": 10,
        "Colin_Powell": 10,
        "Donald_Rumsfeld": 10,
        "George_W_Bush": 10,
        "Gerhard_Schroeder": 10
    }
    
    target_dir = Path("tests/data/faces")
    target_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Downloading LFW subset to {target_dir}...")
    
    total_downloaded = 0
    for person, count in people.items():
        person_dir = target_dir / person
        person_dir.mkdir(exist_ok=True)
        
        for i in range(1, count + 1):
            filename = f"{person}_{i:04d}.jpg"
            url = f"{base_url}{person}/{filename}"
            dest = person_dir / filename
            
            if download_file(url, dest):
                print(f"Downloaded {filename}")
                total_downloaded += 1
            else:
                print(f"Failed to download {filename}")
                
    print(f"Finished. Downloaded {total_downloaded} images.")

if __name__ == "__main__":
    main()
