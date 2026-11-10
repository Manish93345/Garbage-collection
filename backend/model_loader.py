import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from pathlib import Path


# Project paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "garbage_classifier_final.pth"


# Device configuration
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# Load checkpoint
checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE,
    weights_only=True
)

class_to_idx = checkpoint["class_to_idx"]

idx_to_class = {
    index: name for name, index in class_to_idx.items()
}


# Recreate EfficientNet-B0 architecture
model = models.efficientnet_b0(weights=None)

model.classifier = nn.Sequential(
    nn.Dropout(p=0.3),
    nn.Linear(1280, len(class_to_idx))
)

model.load_state_dict(checkpoint["model_state_dict"])

model = model.to(DEVICE)
model.eval()


# Image preprocessing
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def predict_image(image: Image.Image):

    image = image.convert("RGB")

    image_tensor = preprocess(image)
    image_tensor = image_tensor.unsqueeze(0).to(DEVICE)

    with torch.inference_mode():

        outputs = model(image_tensor)

        probabilities = torch.softmax(outputs, dim=1)

        confidence, predicted_index = torch.max(
            probabilities, dim=1
        )

    predicted_class = idx_to_class[predicted_index.item()]

    return {
        "predicted_class": predicted_class,
        "confidence": round(confidence.item() * 100, 2)
    }


print("Garbage classification model loaded successfully!")
print("Device:", DEVICE)
print("Classes:", list(class_to_idx.keys()))
