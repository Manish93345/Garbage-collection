# SORTED — Garbage Classification for Waste Management

SORTED is a computer-vision-based web application that classifies waste images into four material categories: **Glass, Metal, Paper, and Plastic**. It uses a fine-tuned EfficientNet-B0 model with a Flask backend and a browser-based interface.

## Project Overview

The application accepts a waste image through file upload or camera capture, runs the trained image-classification model, and displays the predicted material category with a confidence score.

Users can also provide feedback on predictions:
- **Correct:** saves the image under the predicted class in the correct-feedback collection.
- **Incorrect:** asks the user to select the actual class and saves the image with both predicted and actual labels.
- **No feedback:** does not save the analyzed image.

Feedback metadata is recorded in `feedback/feedback_log.csv`.

## Supported Categories

- Glass
- Metal
- Paper
- Plastic

The project uses four selected classes from the TrashNet dataset. The original dataset also contains other classes, which are not part of this classifier.

## Key Features

- Image upload with JPG, PNG, and WEBP support.
- Camera capture and prediction.
- Image-size validation (maximum 5 MB).
- EfficientNet-B0-based image classification.
- Prediction confidence display.
- User feedback with thumbs-up and thumbs-down options.
- Separate storage for correct and incorrect feedback.
- CSV logging of submitted feedback.

## Technology Stack

- **Language:** Python
- **Deep learning:** PyTorch, Torchvision
- **Model architecture:** EfficientNet-B0
- **Image processing:** Pillow
- **Backend:** Flask
- **Frontend:** HTML, CSS, JavaScript
- **Training environment:** Google Colab
- **Version control:** Git and GitHub

## Model and Evaluation

The model was trained using transfer learning with ImageNet-pretrained EfficientNet-B0 weights, followed by fine-tuning of later feature-extraction blocks.

| Metric | Result |
|---|---:|
| Test images | 299 |
| Test accuracy | **90.30%** |

The reported test accuracy is from the held-out test split. User-submitted feedback images are stored separately and are not automatically added to the training or test dataset.

### Class-wise test results

| Class | Precision | Recall | F1-score |
|---|---:|---:|---:|
| Glass | 0.9189 | 0.8947 | 0.9067 |
| Metal | 0.8382 | 0.9344 | 0.8837 |
| Paper | 0.9444 | 0.9551 | 0.9497 |
| Plastic | 0.8955 | 0.8219 | 0.8571 |

These results are from the current model evaluation. Performance may vary on images with different backgrounds, lighting, viewpoints, or multiple objects.

## Repository Structure

```text
CV_Project/
├── backend/
│   ├── app.py
│   └── model_loader.py
├── dataset/
├── evaluation/
├── feedback/
│   ├── correct/
│   ├── incorrect/
│   └── feedback_log.csv
├── frontend/
│   ├── index.html
│   └── static/
│       ├── script.js
│       └── style.css
├── models/
│   └── garbage_classifier_final.pth
├── notebooks/
├── report/
├── test_api.py
├── requirements.txt
├── .gitignore
└── README.md
```

The `lisajaanu/` directory is the local Python virtual environment and is not part of the source-code setup. Dataset files, trained model weights, and generated feedback images should be kept out of the Git repository unless there is a specific reason to publish them.

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/Manish93345/Garbage-collection.git
cd Garbage-collection
```

### 2. Create and activate a virtual environment

Windows PowerShell:

```powershell
python -m venv lisajaanu
.\lisajaanu\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Add the trained model file

The trained model weights are not included in this GitHub repository. Obtain the project model file separately and place it at this exact path:

```text
models/garbage_classifier_final.pth
```

The application requires this file to load the classifier.

### 5. Run the application

From the repository root, run:

```bash
python -m backend.app
```

Then open the local address printed by Flask in your browser (by default, `http://127.0.0.1:5000`).

## Using the Application

1. Open SORTED in your browser.
2. Upload an image or switch to camera mode and capture an image.
3. Select **Analyze image**.
4. Review the predicted material and confidence score.
5. Optionally submit feedback:
   - Select **Correct** if the prediction is correct.
   - Select **Incorrect**, choose the actual category, and submit.
   - If no feedback is submitted, the analyzed image is not stored by the feedback feature.

## Feedback Storage

Feedback is stored locally in the project directory:

```text
feedback/
├── correct/
│   ├── glass/
│   ├── metal/
│   ├── paper/
│   └── plastic/
├── incorrect/
│   └── predicted_<class>/
│       └── actual_<class>/
└── feedback_log.csv
```

The CSV log records the feedback timestamp, feedback type, predicted class, actual class, confidence score, and saved image path.

Feedback images are collected for review. They are **not automatically used to retrain the model**.

## Current Project Status

- [x] Dataset preparation and integrity checks
- [x] Stratified train, validation, and test split
- [x] EfficientNet-B0 transfer learning and fine-tuning
- [x] Model evaluation
- [x] Flask prediction API
- [x] Web interface with image upload
- [x] Camera capture
- [x] Prediction feedback and CSV logging
- [ ] Final documentation and project report
- [ ] Final presentation
- [ ] Cloud deployment

## Limitations

- The classifier predicts only the four supported categories.
- Prediction quality can be affected by lighting, background clutter, camera angle, object size, and images containing multiple objects.
- The confidence score represents the model's confidence in its predicted class; it is not a guarantee that the prediction is correct.
- Feedback storage currently uses the local filesystem. A cloud deployment requires persistent storage to retain feedback images and logs across restarts or redeployments.

## Future Scope

- Expand the number of supported waste categories.
- Review and curate user feedback for possible future model improvement.
- Improve robustness to real-world backgrounds and camera conditions.
- Deploy the application with persistent storage.
- Add model monitoring and feedback analytics.

## Acknowledgements

The project uses the TrashNet waste-image dataset and the PyTorch/Torchvision implementation of EfficientNet-B0.

---

**Project:** SORTED — Garbage Classification for Waste Management
