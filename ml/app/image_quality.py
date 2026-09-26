from dataclasses import dataclass
from pathlib import Path
from tempfile import NamedTemporaryFile

import cv2
import numpy as np


@dataclass(frozen=True)
class ImageQualityReport:
    quality_status: str
    quality_score: float
    blur_score: float
    brightness: float
    contrast: float
    document_detected: bool
    cropped: bool
    multiple_documents: bool
    orientation_degrees: float
    message: str | None = None

    def as_dict(self):
        return {
            "quality_status": self.quality_status,
            "quality_score": round(self.quality_score, 2),
            "blur_score": round(self.blur_score, 2),
            "brightness": round(self.brightness, 2),
            "contrast": round(self.contrast, 2),
            "document_detected": self.document_detected,
            "cropped": self.cropped,
            "multiple_documents": self.multiple_documents,
            "orientation_degrees": round(self.orientation_degrees, 2),
            "message": self.message
        }


def _document_contours(gray):
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    contours, _ = cv2.findContours(
        edges,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )
    return sorted(contours, key=cv2.contourArea, reverse=True)


def assess_image_quality(image_path: str) -> ImageQualityReport:
    image = cv2.imdecode(
        np.fromfile(str(image_path), dtype=np.uint8),
        cv2.IMREAD_COLOR
    )
    if image is None:
        raise ValueError("The uploaded image could not be read.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(np.mean(gray))
    contrast = float(np.std(gray))
    contours = _document_contours(gray)
    page_area = height * width
    substantial = [
        contour for contour in contours
        if cv2.contourArea(contour) >= page_area * 0.12
    ]
    document_detected = bool(substantial) or (
        contrast >= 20
        and 15 <= brightness <= 240
        and height >= 200
        and width >= 200
    )
    largest = substantial[0] if substantial else None
    cropped = False
    orientation_degrees = 0.0

    if largest is not None:
        x, y, box_width, box_height = cv2.boundingRect(largest)
        cropped = (
            x <= 2 or y <= 2
            or x + box_width >= width - 2
            or y + box_height >= height - 2
        )
        rectangle = cv2.minAreaRect(largest)
        angle = rectangle[2]
        if rectangle[1][0] < rectangle[1][1]:
            angle += 90
        orientation_degrees = float(angle)

    multiple_documents = len(substantial) >= 2 and (
        cv2.contourArea(substantial[1]) >= page_area * 0.12
    )
    severe = (
        brightness < 10
        or brightness > 250
        or contrast < 7
        or blur_score < 15
        or cropped
        or multiple_documents
        or not document_detected
    )
    recoverable = (
        blur_score >= 15
        and contrast >= 7
        and 8 <= brightness <= 248
        and not cropped
        and not multiple_documents
        and document_detected
    )
    quality_score = min(
        1.0,
        max(
            0.0,
            0.45 * min(blur_score / 250, 1)
            + 0.30 * min(contrast / 80, 1)
            + 0.25 * (1 - abs(brightness - 128) / 128)
        )
    )

    if severe:
        status = "UNRECOVERABLE"
        message = (
            "Part of the prescription appears to be outside the image. "
            "Please capture the complete prescription."
            if cropped else
            "The prescription image is not readable enough to process."
        )
    elif recoverable and (
        blur_score < 120 or contrast < 35 or brightness < 55 or brightness > 205
    ):
        status = "RECOVERABLE"
        message = "The image can be enhanced before extraction."
    else:
        status = "GOOD"
        message = None

    return ImageQualityReport(
        quality_status=status,
        quality_score=quality_score,
        blur_score=blur_score,
        brightness=brightness,
        contrast=contrast,
        document_detected=document_detected,
        cropped=cropped,
        multiple_documents=multiple_documents,
        orientation_degrees=orientation_degrees,
        message=message
    )


def enhance_image(image_path: str) -> str:
    image = cv2.imdecode(
        np.fromfile(str(image_path), dtype=np.uint8),
        cv2.IMREAD_COLOR
    )
    if image is None:
        raise ValueError("The uploaded image could not be read.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    contours = _document_contours(gray)
    if contours:
        rectangle = cv2.minAreaRect(contours[0])
        angle = rectangle[2]
        if rectangle[1][0] < rectangle[1][1]:
            angle += 90
        if abs(angle) > 1:
            height, width = image.shape[:2]
            center = (width / 2, height / 2)
            rotation = cv2.getRotationMatrix2D(center, angle, 1.0)
            image = cv2.warpAffine(
                image,
                rotation,
                (width, height),
                borderMode=cv2.BORDER_REPLICATE
            )
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    denoised = cv2.medianBlur(gray, 3)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)
    sharpened = cv2.addWeighted(
        enhanced,
        1.5,
        cv2.GaussianBlur(enhanced, (0, 0), 3),
        -0.5,
        0
    )
    upscaled = cv2.resize(
        sharpened,
        None,
        fx=1.5,
        fy=1.5,
        interpolation=cv2.INTER_CUBIC
    )
    with NamedTemporaryFile(delete=False, suffix=Path(image_path).suffix or ".png") as file:
        output_path = file.name
    encoded, content = cv2.imencode(".png", upscaled)
    if not encoded:
        raise ValueError("The enhanced prescription image could not be saved.")
    content.tofile(output_path)
    return output_path


def prepare_image_for_extraction(image_path: str):
    report = assess_image_quality(image_path)
    if report.quality_status == "UNRECOVERABLE":
        return image_path, report
    if report.quality_status == "RECOVERABLE":
        enhanced_path = enhance_image(image_path)
        enhanced_report = assess_image_quality(enhanced_path)
        return enhanced_path, ImageQualityReport(
            quality_status="enhanced" if enhanced_report.quality_status != "UNRECOVERABLE" else "UNRECOVERABLE",
            quality_score=enhanced_report.quality_score,
            blur_score=enhanced_report.blur_score,
            brightness=enhanced_report.brightness,
            contrast=enhanced_report.contrast,
            document_detected=enhanced_report.document_detected,
            cropped=enhanced_report.cropped,
            multiple_documents=enhanced_report.multiple_documents,
            orientation_degrees=enhanced_report.orientation_degrees,
            message=enhanced_report.message
        )
    return image_path, report