Caseblitz healthtech track

## Medical prescription OCR

The ML service uses `khedim/Medical-Prescription-OCR` as its primary
handwriting recognizer. It detects line crops before inference because the
model was trained on line-level prescription images. Gemini remains the safe
fallback when the model is unavailable or returns no usable text.

To enable the primary model locally:

1. Accept the model conditions at https://huggingface.co/khedim/Medical-Prescription-OCR.
2. Install the ML requirements from `ml`:

	```powershell
	.\venv\Scripts\python.exe -m pip install -r requirements.txt
	```

3. Authenticate Hugging Face if required by the model:

	```powershell
	huggingface-cli login
	```

If the model cannot be loaded, the service keeps the existing Gemini fallback
and does not invent medication instructions.