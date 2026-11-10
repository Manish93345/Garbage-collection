
import requests

# Change this to the path of a real test image
IMAGE_PATH = r"D:\Study\Sem_7\CV_Project\dataset\raw\plastic"

# Select one image from your dataset folder
import os

image_files = [
    f for f in os.listdir(IMAGE_PATH)
    if f.lower().endswith((".jpg", ".jpeg", ".png"))
]

if not image_files:
    raise FileNotFoundError("No images found in the selected folder!")

image_path = os.path.join(IMAGE_PATH, image_files[0])

url = "http://127.0.0.1:5000/predict"

with open(image_path, "rb") as image:
    response = requests.post(
        url,
        files={
            "image": (
                os.path.basename(image_path),
                image,
                "image/jpeg"
            )
        }
    )

print("HTTP Status:", response.status_code)
print("API Response:", response.json())
