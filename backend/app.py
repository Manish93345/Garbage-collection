
from flask import Flask, request, jsonify
from PIL import Image, UnidentifiedImageError
from io import BytesIO

from backend.model_loader import predict_image

app = Flask(__name__)

# Maximum upload size: 5 MB
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Garbage Classification API is running!",
        "classes": ["glass", "metal", "paper", "plastic"]
    })


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


@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        "error": "File size exceeds 5 MB limit"
    }), 413


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
