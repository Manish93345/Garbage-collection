# SORTED — Garbage Classification for Waste Management

SORTED is a computer-vision project that classifies an image of a waste item into one of four material categories: **glass, metal, paper, or plastic**. It uses transfer learning with an ImageNet-pretrained **EfficientNet-B0** model implemented in PyTorch.

The project covers dataset exploration, model training and evaluation, a local Flask application, and hosted inference through a Gradio application on Hugging Face Spaces.

## Project links

| Resource | Link |
|---|---|
| Source code | [GitHub repository](https://github.com/Manish93345/Garbage-collection) |
| Live application | [SORTED on Hugging Face Spaces](https://huggingface.co/spaces/Manish85211/sorted-garbage-classifier) |
| Trained model checkpoint | [Hugging Face model repository](https://huggingface.co/Manish85211/sorted-garbage-classifier) |
| Dataset | [TrashNet](https://github.com/garythung/trashnet) |

The model checkpoint is hosted separately from the application source. The local Flask model loader downloads the checkpoint from the Hugging Face model repository with `huggingface_hub`. The public Space uses Gradio and ZeroGPU for hosted inference.

## Problem and scope

Given one image containing one waste item, SORTED predicts one of four supported material classes and returns a confidence score.

**This is image classification.** The current system does not perform object detection, instance segmentation, multi-object sorting, contamination detection, or physical control of a sorting machine.

## Dataset

The project uses four classes selected from the six-class TrashNet collection.

| Class | Images |
|---|---:|
| Glass | 501 |
| Metal | 410 |
| Paper | 594 |
| Plastic | 482 |
| **Total** | **1,987** |

Cardboard and trash were excluded from this four-class experiment. The dataset integrity check recorded 1,987 valid images and no corrupted images. The inspected images were 512 × 384 RGB.

A stratified split with random seed 42 was used:

| Split | Images | Share |
|---|---:|---:|
| Training | 1,390 | 70% |
| Validation | 298 | 15% |
| Test | 299 | 15% |
| **Total** | **1,987** | **100%** |

The split manifests were checked for path overlap; no overlap was reported.

## Model and training

- **Architecture:** EfficientNet-B0
- **Initial weights:** ImageNet1K_V1
- **Input:** 224 × 224 RGB image
- **Classifier head:** Dropout (0.3) followed by Linear (1,280 → 4)
- **Loss:** Cross-entropy
- **Optimizer:** AdamW
- **Training environment:** Google Colab with an NVIDIA Tesla T4

Training was carried out in two stages:

1. **Classifier training:** the feature extractor was frozen and the new classifier head was trained for 10 epochs. There were 5,124 trainable parameters. The highest recorded validation accuracy was 81.54%.
2. **Fine-tuning:** the later feature blocks (features[6:]) and classifier were trained for 10 epochs, using learning rates of 0.00001 for the unfrozen feature blocks and 0.0001 for the classifier. The highest recorded validation accuracy was 86.91%. The checkpoint selected by the lowest validation loss occurred at epoch 10 (validation loss 0.4057; validation accuracy 84.90%).

The best Phase 2 checkpoint was evaluated once on the held-out test split.

## Evaluation

The final test evaluation covered 299 images and achieved **90.30% accuracy (270/299 correct)**.

| Class | Precision | Recall | F1-score | Support |
|---|---:|---:|---:|---:|
| Glass | 0.9189 | 0.8947 | 0.9067 | 76 |
| Metal | 0.8382 | 0.9344 | 0.8837 | 61 |
| Paper | 0.9444 | 0.9551 | 0.9497 | 89 |
| Plastic | 0.8955 | 0.8219 | 0.8571 | 73 |
| **Macro average** | **0.8993** | **0.9015** | **0.8993** | **299** |
| **Weighted average** | **0.9043** | **0.9030** | **0.9027** | **299** |

Paper had the strongest F1-score (0.9497). Plastic had the lowest recall (0.8219), and is an area for further improvement. Performance on real-world images may vary with lighting, backgrounds, camera viewpoints, occlusion, and mixed-material objects. The softmax confidence score is not presented as a calibrated probability of correctness.

## Application features

The local Flask application includes:

- JPG, PNG, and WEBP image upload (5 MB limit)
- Drag-and-drop upload, preview, and image removal
- Browser camera capture and retake
- Prediction result with class and confidence score
- Optional correct/incorrect feedback submission

In the **local Flask application**, submitted feedback images and metadata are stored in the local feedback directory and CSV log. Feedback is not automatically used to retrain the model.

The **hosted Hugging Face Space** is a separate Gradio application. Its inference path uses the hosted model checkpoint; persistent cloud feedback storage is not claimed as an enabled feature.

## Repository structure

```text
Garbage-collection/
├── backend/
│   ├── app.py
│   └── model_loader.py
├── frontend/
│   ├── index.html
│   └── static/
│       ├── script.js
│       └── style.css
├── notebooks/
│   └── 01_Dataset_Exploration.ipynb
├── feedback/
│   └── local feedback records and images
├── .gitignore
├── .python-version
├── requirements.txt
├── test_api.py
└── README.md
```

The trained model weights and raw dataset are not stored in this source repository. The checkpoint is downloaded by the model loader from Hugging Face.

## Run the local Flask application

### 1. Clone the repository

```bash
git clone https://github.com/Manish93345/Garbage-collection.git
cd Garbage-collection
```

### 2. Create and activate a virtual environment

**Windows PowerShell**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

The requirements file installs the CPU build of PyTorch and Torchvision. The first model load downloads the checkpoint from the Hugging Face model repository and may require an internet connection.

### 4. Start the application

Run from the repository root:

```bash
python -m backend.app
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in a browser.

### 5. Test the prediction API

With the local server running, execute:

```bash
python test_api.py
```

## Training notebook

The repository contains `notebooks/01_Dataset_Exploration.ipynb`. The notebook records the dataset exploration and the project training/evaluation workflow. It was developed in Google Colab and uses a Google Drive project directory; update the project and dataset paths to match the environment before running it.

The experiment uses the prepared TrashNet image folders and generates split manifests, training checkpoints/logs, evaluation metrics, and the exported `garbage_classifier_final.pth` checkpoint. Training and evaluation are not run by starting the Flask application.

## Deployment notes

- **Local:** Flask backend with the HTML/CSS/JavaScript frontend.
- **Hosted:** Gradio application on Hugging Face Spaces with ZeroGPU inference.
- **Model artifact:** hosted independently in the Hugging Face model repository.
- **Render:** an earlier deployment attempt was not retained because prediction requests encountered worker timeouts/resource limits in the tested configuration.

The live Space is the hosted demonstration. Hosted availability and inference behaviour depend on the Space's current runtime state and resource availability.

## Limitations and future work

- Only four predefined material classes are supported.
- One image and one principal item are classified at a time.
- The TrashNet subset is relatively small and may not represent varied real-world conditions.
- Plastic has lower recall than the other evaluated classes.
- Confidence scores have not been calibrated.
- Local feedback storage is filesystem-based; hosted persistent feedback storage is not enabled.
- Future work includes broader datasets and classes, real-world image testing, further model comparisons, confidence calibration, improved error handling, and persistent feedback storage with appropriate privacy controls.

## References

1. Thung, G. and Yang, M. (2016). [TrashNet dataset repository](https://github.com/garythung/trashnet).
2. Thung, G. and Yang, M. (2016). [Classification of Trash for Recyclability Status](https://cs229.stanford.edu/proj2016/report/ThungYang-ClassificationOfTrashForRecyclabilityStatus-report.pdf). Stanford University, CS229 project report.
3. Tan, M. and Le, Q. V. (2019). [EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks](https://proceedings.mlr.press/v97/tan19a.html). Proceedings of ICML.
4. [PyTorch documentation](https://pytorch.org/docs/).
5. [Torchvision documentation](https://pytorch.org/vision/stable/).
6. [Flask documentation](https://flask.palletsprojects.com/).
7. [Gradio documentation](https://www.gradio.app/docs).
8. [Hugging Face Spaces documentation](https://huggingface.co/docs/hub/spaces).

---

**Project:** SORTED — Garbage Classification for Waste Management  
**Author:** Manish Kumar  
**Department:** Computer Science and Engineering, NIT Mizoram  
**Academic session:** 2026–2027
