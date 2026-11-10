
from flask import Flask, request, jsonify, render_template
from PIL import Image, UnidentifiedImageError
from io import BytesIO

from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4
import csv

ALLOWED_CLASSES = {"glass", "metal", "paper", "plastic"}
FEEDBACK_DIR = Path(__file__).resolve().parent.parent / "feedback"
FEEDBACK_CSV = FEEDBACK_DIR / "feedback_log.csv"


from backend.model_loader import predict_image


app = Flask(
    __name__,
    template_folder="../frontend",
    static_folder="../frontend/static",
    static_url_path="/static"
)


# Maximum upload size: 5 MB
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024


@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:
        return jsonify({
            "error": "No image file provided"
        }), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({
            "error": "No file selected"
        }), 400

    try:
        image = Image.open(BytesIO(file.read()))

        result = predict_image(image)

        return jsonify({
            "success": True,
            "prediction": result["predicted_class"],
            "confidence": result["confidence"]
        })

    except (UnidentifiedImageError, OSError):
        return jsonify({
            "error": "Invalid image file"
        }), 400


@app.route("/feedback", methods=["POST"])
def save_feedback():
    predicted = request.form.get("predicted_class", "").strip().lower()
    feedback = request.form.get("feedback", "").strip().lower()
    actual = request.form.get("actual_class", "").strip().lower()
    image_file = request.files.get("image")

    if predicted not in ALLOWED_CLASSES:
        return jsonify({"error": "Invalid predicted class"}), 400
    if feedback not in {"correct", "incorrect"}:
        return jsonify({"error": "Invalid feedback type"}), 400
    if feedback == "incorrect":
        if actual not in ALLOWED_CLASSES:
            return jsonify({"error": "Please select the actual material category"}), 400
        if actual == predicted:
            return jsonify({"error": "Actual category must differ from predicted category"}), 400
    else:
        actual = predicted

    if image_file is None or not image_file.filename:
        return jsonify({"error": "Image is required"}), 400

    try:
        confidence = float(request.form.get("confidence", ""))
        if not 0 <= confidence <= 100:
            raise ValueError("Invalid confidence value")
        image = Image.open(BytesIO(image_file.read())).convert("RGB")

        if feedback == "correct":
            folder = FEEDBACK_DIR / "correct" / predicted
        else:
            folder = FEEDBACK_DIR / "incorrect" / f"predicted_{predicted}" / f"actual_{actual}"
        folder.mkdir(parents=True, exist_ok=True)

        filename = f"{uuid4().hex}.jpg"
        image_path = folder / filename
        image.save(image_path, format="JPEG", quality=95)

        relative_path = str(image_path.relative_to(FEEDBACK_DIR))
        FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)
        write_header = not FEEDBACK_CSV.exists()
        try:
            with FEEDBACK_CSV.open("a", newline="", encoding="utf-8") as csv_file:
                writer = csv.writer(csv_file)
                if write_header:
                    writer.writerow(["timestamp_utc", "feedback", "predicted_class",
                                     "actual_class", "confidence_percent", "image_path"])
                writer.writerow([datetime.now(timezone.utc).isoformat(), feedback,
                                 predicted, actual, f"{confidence:.2f}", relative_path])
        except Exception:
            image_path.unlink(missing_ok=True)
            raise

        return jsonify({"success": True, "message": "Thank you! Your feedback has been saved."})
    except (UnidentifiedImageError, OSError):
        return jsonify({"error": "Invalid image file"}), 400
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception:
        app.logger.exception("Unable to save classification feedback")
        return jsonify({"error": "Unable to save feedback right now"}), 500


@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        "error": "File size exceeds 5 MB limit"
    }), 413


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
