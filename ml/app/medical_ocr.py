from pathlib import Path

import cv2
import numpy as np
from PIL import Image


MODEL_ID = "khedim/Medical-Prescription-OCR"


class MedicalOCRError(RuntimeError):
    """Raised when the specialized medical handwriting model is unavailable."""


_processor = None
_model = None


def _load_model(model_id: str = MODEL_ID):
    global _processor, _model
    if _processor is not None and _model is not None:
        return _processor, _model

    try:
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel
    except ImportError as error:
        raise MedicalOCRError(
            "Medical OCR dependencies are not installed."
        ) from error

    try:
        _processor = TrOCRProcessor.from_pretrained(model_id)
        _model = VisionEncoderDecoderModel.from_pretrained(model_id)
        _model.eval()
    except Exception as error:
        raise MedicalOCRError(
            "Medical OCR model is unavailable. Accept the model terms and "
            "configure Hugging Face access before using it."
        ) from error
    return _processor, _model


def extract_line_crops(image_path: str):
    image = cv2.imdecode(
        np.fromfile(str(image_path), dtype=np.uint8),
        cv2.IMREAD_COLOR
    )
    if image is None:
        raise MedicalOCRError("The prescription image could not be read.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    threshold = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        31,
        15
    )
    row_density = (threshold > 0).sum(axis=1)
    active = row_density >= max(3, int(image.shape[1] * 0.006))
    bands = []
    start = None
    for index, is_active in enumerate(active):
        if is_active and start is None:
            start = index
        elif not is_active and start is not None:
            if index - start >= 3:
                bands.append((start, index))
            start = None
    if start is not None and len(active) - start >= 3:
        bands.append((start, len(active)))

    merged = []
    for start, end in bands:
        if merged and start - merged[-1][1] <= 8:
            merged[-1] = (merged[-1][0], end)
        else:
            merged.append((start, end))

    crops = []
    for start, end in merged:
        top = max(0, start - 12)
        bottom = min(image.shape[0], end + 12)
        if bottom - top < 18:
            continue
        crop = image[top:bottom, :]
        crops.append(Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)))

    if not crops:
        crops.append(Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB)))
    return crops


def extract_handwritten_text(image_path: str, model_id: str = MODEL_ID):
    processor, model = _load_model(model_id)
    try:
        import torch

        lines = []
        for crop in extract_line_crops(image_path):
            inputs = processor(images=crop, return_tensors="pt")
            with torch.no_grad():
                generated = model.generate(
                    inputs.pixel_values,
                    num_beams=4,
                    max_new_tokens=128
                )
            text = processor.batch_decode(
                generated,
                skip_special_tokens=True
            )[0].strip()
            if text:
                lines.append(text)
    except Exception as error:
        raise MedicalOCRError("Medical OCR inference failed.") from error

    return lines


def medication_candidates_from_lines(lines):
    ignored = (
        "clinic", "doctor", "consultant", "date", "name", "age", "sex",
        "b.p", "bp", "hr", "spo", "temp", "weight", "timing"
    )
    candidates = []
    seen = set()
    for line in lines:
        cleaned = " ".join(line.split()).strip(" -_:")
        lowered = cleaned.lower()
        if len(cleaned) < 3 or lowered.startswith(ignored):
            continue
        if lowered in seen:
            continue
        seen.add(lowered)
        candidates.append(cleaned)
    return candidates