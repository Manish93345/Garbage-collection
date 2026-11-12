"""Send a sample image to the local SORTED Flask prediction endpoint.

Usage:
    python test_api.py path/to/image.jpg
    python test_api.py path/to/image.jpg --url http://127.0.0.1:5000/predict
"""

import argparse
import mimetypes
from pathlib import Path

import requests


def parse_args():
    parser = argparse.ArgumentParser(description="Smoke-test the SORTED prediction API.")
    parser.add_argument("image", type=Path, help="Path to a JPG, JPEG, or PNG image.")
    parser.add_argument("--url", default="http://127.0.0.1:5000/predict", help="Prediction endpoint URL.")
    parser.add_argument("--timeout", type=float, default=120.0, help="HTTP timeout in seconds.")
    return parser.parse_args()


def main():
    args = parse_args()
    image_path = args.image.expanduser()
    if not image_path.is_file():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    mime_type, _ = mimetypes.guess_type(image_path.name)
    if mime_type not in {"image/jpeg", "image/png"}:
        raise ValueError("Please provide a JPG, JPEG, or PNG image.")

    try:
        with image_path.open("rb") as image_file:
            response = requests.post(
                args.url,
                files={"image": (image_path.name, image_file, mime_type)},
                timeout=args.timeout,
            )
        print("HTTP Status:", response.status_code)
        try:
            print("API Response:", response.json())
        except requests.exceptions.JSONDecodeError:
            print("API Response was not valid JSON:", response.text[:1000])
        response.raise_for_status()
    except requests.exceptions.Timeout as exc:
        raise RuntimeError(f"Request timed out after {args.timeout} seconds.") from exc
    except requests.exceptions.ConnectionError as exc:
        raise RuntimeError("Could not connect to Flask. Start it with `python -m backend.app` and retry.") from exc


if __name__ == "__main__":
    main()