
const API_URL = "/predict";

const fileInput = document.getElementById("file-input");
const browseButton = document.getElementById("browse-button");
const dropArea = document.getElementById("drop-area");

const uploadPlaceholder = document.getElementById("upload-placeholder");
const previewContainer = document.getElementById("preview-container");
const imagePreview = document.getElementById("image-preview");

const removeButton = document.getElementById("remove-image");
const analyzeButton = document.getElementById("analyze-button");
const analyzeText = document.getElementById("analyze-text");

const resultContent = document.getElementById("result-content");
const resultStatus = document.getElementById("result-status");

const uploadNote = document.getElementById("upload-note");
const toast = document.getElementById("toast");

let selectedFile = null;
let previewUrl = null;
let toastTimer = null;
let latestPrediction = null;
let feedbackSubmitting = false;


// -----------------------------
// Toast notification
// -----------------------------

function showToast(message) {

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


// -----------------------------
// File validation
// -----------------------------

function validateFile(file) {

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        showToast("Please select a JPG, PNG or WEBP image.");
        return false;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must be below 5 MB.");
        return false;
    }

    return true;
}


// -----------------------------
// File selection
// -----------------------------

function handleFile(file) {

    if (!file || !validateFile(file)) {
        return;
    }

    selectedFile = file;
    if (inputMode === "camera") {
        capturedBlob = null;
    }

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }

    previewUrl = URL.createObjectURL(file);

    imagePreview.src = previewUrl;

    uploadPlaceholder.classList.add("hidden");
    previewContainer.classList.remove("hidden");

    analyzeButton.disabled = false;

    uploadNote.textContent = file.name;

    resetResult();
}


// -----------------------------
// Open file browser
// -----------------------------

browseButton.addEventListener("click", () => {
    fileInput.click();
});


dropArea.addEventListener("click", (event) => {

    if (
        event.target.closest("button") ||
        event.target.closest(".remove-button")
    ) {
        return;
    }

    if (!selectedFile) {
        fileInput.click();
    }
});


fileInput.addEventListener("change", (event) => {

    const file = event.target.files[0];

    handleFile(file);
});


// -----------------------------
// Drag and drop
// -----------------------------

["dragenter", "dragover"].forEach(eventName => {

    dropArea.addEventListener(eventName, event => {

        event.preventDefault();
        dropArea.classList.add("dragging");

    });

});


["dragleave", "drop"].forEach(eventName => {

    dropArea.addEventListener(eventName, event => {

        event.preventDefault();
        dropArea.classList.remove("dragging");

    });

});


dropArea.addEventListener("drop", event => {

    const file = event.dataTransfer.files[0];

    handleFile(file);

});


// -----------------------------
// Remove selected image
// -----------------------------

function removeImage() {

    selectedFile = null;

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }

    imagePreview.removeAttribute("src");

    fileInput.value = "";

    previewContainer.classList.add("hidden");
    uploadPlaceholder.classList.remove("hidden");

    analyzeButton.disabled = true;

    uploadNote.textContent =
        "Your image is processed for classification.";

    capturedBlob = null;

    resetResult();
}


removeButton.addEventListener("click", removeImage);


// -----------------------------
// Reset result panel
// -----------------------------

function resetResult() {

    latestPrediction = null;
    resultStatus.textContent = "AWAITING INPUT";

    resultContent.innerHTML = `
        <div class="empty-result">
            <div class="result-placeholder-icon">◌</div>

            <h3>Your result will appear here.</h3>

            <p>
                Upload an image to discover its material category.
            </p>
        </div>
    `;

}


// -----------------------------
// Loading state
// -----------------------------

function setLoading(isLoading) {

    analyzeButton.disabled = isLoading ||
    (inputMode === "camera" ? !capturedBlob : !selectedFile);

    analyzeText.textContent = isLoading
        ? "Analyzing image..."
        : "Analyze image";

    resultStatus.textContent = isLoading
        ? "PROCESSING"
        : "AWAITING INPUT";

}


// -----------------------------
// Render prediction result
// -----------------------------

function displayResult(data) {

    const category = data.prediction;
    latestPrediction = { prediction: category, confidence: Number(data.confidence) };
    const confidence = Number(data.confidence);

    const safeCategory = escapeHTML(category);

    resultStatus.textContent = "ANALYSIS COMPLETE";

    resultContent.innerHTML = `
        <div class="prediction-result">

            <div class="eyebrow">
                <span class="status-dot"></span>
                MATERIAL IDENTIFIED
            </div>

            <div class="prediction-category">
                ${safeCategory}
            </div>

            <p class="prediction-label">
                Predicted material category
            </p>

            <div class="confidence-value">
                ${confidence.toFixed(2)}%
            </div>

            <p class="prediction-label">
                Model confidence score
            </p>

            <div class="confidence-track">
                <div
                    class="confidence-fill"
                    style="width: ${confidence}%"
                ></div>
            </div>

            <div class="prediction-caption">
                This result represents the model's predicted category
                and confidence score. It is not a guarantee of
                material composition or recyclability.
            </div>


            <div class="feedback-section" id="feedback-section">
                <p class="feedback-question">Was this prediction correct?</p>
                <div class="feedback-actions">
                    <button type="button" class="feedback-button" id="feedback-correct">👍 Correct</button>
                    <button type="button" class="feedback-button" id="feedback-incorrect">👎 Incorrect</button>
                </div>
                <div class="feedback-correction hidden" id="feedback-correction">
                    <label for="actual-class">What is the actual material?</label>
                    <select id="actual-class">
                        <option value="">Select actual category</option>
                        <option value="glass">Glass</option>
                        <option value="metal">Metal</option>
                        <option value="paper">Paper</option>
                        <option value="plastic">Plastic</option>
                    </select>
                    <button type="button" class="feedback-submit" id="submit-incorrect">Submit feedback</button>
                </div>
                <p class="feedback-message" id="feedback-message" role="status"></p>
            </div>

        </div>
    `;

}



// -----------------------------
// Classification feedback
// -----------------------------
resultContent.addEventListener("click", async (event) => {
    if (event.target.closest("#feedback-correct")) {
        await submitFeedback("correct");
    } else if (event.target.closest("#feedback-incorrect")) {
        document.getElementById("feedback-correction").classList.remove("hidden");
        document.getElementById("feedback-incorrect").disabled = true;
    } else if (event.target.closest("#submit-incorrect")) {
        const actual = document.getElementById("actual-class").value;
        if (!actual) {
            showToast("Please select the actual material category.");
            return;
        }
        await submitFeedback("incorrect", actual);
    }
});

async function submitFeedback(type, actual = "") {
    if (!selectedFile || !latestPrediction || feedbackSubmitting) {
        showToast("Please analyze an image before submitting feedback.");
        return;
    }

    feedbackSubmitting = true;
    const message = document.getElementById("feedback-message");
    const buttons = resultContent.querySelectorAll(".feedback-button, .feedback-submit");
    buttons.forEach(button => button.disabled = true);
    message.textContent = "Saving your feedback...";

    const formData = new FormData();
    formData.append("image", selectedFile, selectedFile.name || "classification.jpg");
    formData.append("predicted_class", latestPrediction.prediction);
    formData.append("confidence", String(latestPrediction.confidence));
    formData.append("feedback", type);
    if (type === "incorrect") formData.append("actual_class", actual);

    try {
        const response = await fetch("/feedback", { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to save feedback.");
        document.getElementById("feedback-section").innerHTML =
            `<p class="feedback-thanks">${escapeHTML(data.message)}</p>`;
    } catch (error) {
        console.error("Feedback error:", error);
        message.textContent = error.message || "Unable to save feedback.";
        buttons.forEach(button => button.disabled = false);
    } finally {
        feedbackSubmitting = false;
    }
}

// -----------------------------
// Safe text rendering
// -----------------------------

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, char => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[char];

    });

}


// -----------------------------
// API integration
// -----------------------------

async function analyzeImage() {

    if (!selectedFile) {
        showToast("Please select an image first.");
        return;
    }

    const formData = new FormData();

    formData.append("image", selectedFile);

    setLoading(true);

    try {

        const response = await fetch(API_URL, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to process the image."
            );
        }

        if (!data.success) {
            throw new Error("Prediction failed.");
        }

        displayResult(data);

    } catch (error) {

        console.error("Prediction error:", error);

        resultStatus.textContent = "ANALYSIS FAILED";

        showToast(
            error.message || "Something went wrong."
        );

    } finally {

        setLoading(false);

    }

}

// =====================================
// CAMERA CAPTURE FUNCTIONALITY
// =====================================

const uploadTab = document.getElementById("upload-tab");
const cameraTab = document.getElementById("camera-tab");

const cameraPanel = document.getElementById("camera-panel");

const cameraVideo = document.getElementById("camera-video");
const cameraCanvas = document.getElementById("camera-canvas");

const cameraPlaceholder = document.getElementById("camera-placeholder");

const startCameraButton = document.getElementById("start-camera");
const captureCameraButton = document.getElementById("capture-camera");
const retakeCameraButton = document.getElementById("retake-camera");
const stopCameraButton = document.getElementById("stop-camera");

const cameraNote = document.getElementById("camera-note");

let cameraStream = null;
let capturedBlob = null;
let inputMode = "upload";


// =====================================
// STOP CAMERA
// =====================================

function stopCamera() {

    if (cameraStream) {

        cameraStream.getTracks().forEach(track => {
            track.stop();
        });

        cameraStream = null;
    }

    cameraVideo.srcObject = null;

    startCameraButton.disabled = false;
    captureCameraButton.disabled = true;
    retakeCameraButton.disabled = true;
    stopCameraButton.disabled = true;

    cameraPlaceholder.classList.remove("hidden");

}


// =====================================
// SWITCH INPUT MODE
// =====================================


function switchInputMode(mode) {

    // Stop any active camera stream
    stopCamera();

    // Clear previous camera capture when changing modes
    capturedBlob = null;

    inputMode = mode;

    if (mode === "upload") {

        cameraPanel.classList.add("hidden");
        dropArea.classList.remove("hidden");

        uploadTab.classList.add("active");
        cameraTab.classList.remove("active");

        analyzeButton.disabled = !selectedFile;

    } else {

        cameraPanel.classList.remove("hidden");
        dropArea.classList.add("hidden");

        uploadTab.classList.remove("active");
        cameraTab.classList.add("active");

        analyzeButton.disabled = true;

        cameraNote.textContent =
            "Allow camera access when your browser asks for permission.";
    }

    resetResult();
}



// =====================================
// TAB EVENTS
// =====================================

uploadTab.addEventListener("click", () => {
    switchInputMode("upload");
});

cameraTab.addEventListener("click", () => {
    switchInputMode("camera");
});


// =====================================
// START CAMERA
// =====================================

async function startCamera() {

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {

        showToast("Camera access is not supported by this browser.");
        return;
    }

    try {

        cameraStream = await navigator.mediaDevices.getUserMedia({

            video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },

            audio: false

        });

        cameraVideo.srcObject = cameraStream;

        await cameraVideo.play();

        cameraPlaceholder.classList.add("hidden");

        startCameraButton.disabled = true;
        captureCameraButton.disabled = false;
        retakeCameraButton.disabled = true;
        stopCameraButton.disabled = false;

        cameraNote.textContent = "Camera is active. Position your waste item and capture.";

    } catch (error) {

        console.error("Camera error:", error);

        if (error.name === "NotAllowedError") {

            cameraNote.textContent =
                "Camera permission denied. Please allow access in browser settings.";

        } else if (error.name === "NotFoundError") {

            cameraNote.textContent =
                "No camera was found on this device.";

        } else {

            cameraNote.textContent =
                "Unable to access camera. Please try again.";

        }

        showToast(cameraNote.textContent);

    }

}


startCameraButton.addEventListener("click", startCamera);


// =====================================
// CAPTURE IMAGE
// =====================================

captureCameraButton.addEventListener("click", () => {

    if (!cameraStream || cameraVideo.readyState < 2) {

        showToast("Camera is not ready yet.");
        return;

    }

    const width = cameraVideo.videoWidth;
    const height = cameraVideo.videoHeight;

    if (!width || !height) {

        showToast("Unable to capture image.");
        return;

    }

    cameraCanvas.width = width;
    cameraCanvas.height = height;

    const context = cameraCanvas.getContext("2d");

    context.drawImage(
        cameraVideo,
        0,
        0,
        width,
        height
    );

    cameraCanvas.toBlob(blob => {

        if (!blob) {

            showToast("Image capture failed.");
            return;

        }

        capturedBlob = blob;

        selectedFile = new File(
            [blob],
            "camera-capture.jpg",
            { type: "image/jpeg" }
        );

        analyzeButton.disabled = false;

        captureCameraButton.disabled = true;
        retakeCameraButton.disabled = false;

        cameraNote.textContent =
            "Image captured successfully. You can analyze or retake it.";

        uploadNote.textContent = "Camera image captured.";

        resetResult();

    }, "image/jpeg", 0.92);

});


// =====================================
// RETAKE IMAGE
// =====================================

retakeCameraButton.addEventListener("click", () => {

    capturedBlob = null;
    selectedFile = null;

    analyzeButton.disabled = true;

    captureCameraButton.disabled = false;
    retakeCameraButton.disabled = true;

    cameraNote.textContent =
        "Position your waste item and capture again.";

    resetResult();

});


// =====================================
// STOP CAMERA BUTTON
// =====================================

stopCameraButton.addEventListener("click", () => {

    stopCamera();

    cameraNote.textContent = "Camera stopped.";

});


// =====================================
// CLEANUP WHEN PAGE IS CLOSED
// =====================================

window.addEventListener("pagehide", () => {

    if (cameraStream) {

        cameraStream.getTracks().forEach(track => {
            track.stop();
        });

    }

});


analyzeButton.addEventListener("click", analyzeImage);

