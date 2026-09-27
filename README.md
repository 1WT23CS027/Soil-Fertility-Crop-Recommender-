# AgriSense AI — fixed prediction pipeline

## Run the app

### 1. Backend
From the project root:

```bash
python server.py
```

The API runs at `http://127.0.0.1:5000`.

You can check it at `http://127.0.0.1:5000/health`.

### 2. Frontend
In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

## Important changes

- `server.py` is now the **only prediction implementation**.
- `app.py` is only a compatibility entry point and imports `server.py`; it contains no fallback prediction rules.
- React no longer has a local fallback crop algorithm. If the backend is unavailable, it shows an error instead of inventing a crop.
- The backend returns one canonical crop object containing the crop ID, display name, description and image path.
- The frontend renders the image path returned by the backend, so the crop name and image cannot drift apart because of a second mapping.
- The model's probability is returned as a confidence value when supported.
- `agrisense.db` remains an **analysis history database**. New predictions are saved using the exact crop returned by the model. Existing historical rows are not silently rewritten.
- The backend uses absolute paths based on `server.py`, so it works even if Python is launched from another working directory.
- Required backend packages now include Flask and flask-cors.

## Model note

`model.pkl` was trained with scikit-learn 1.6.1 in the supplied project. If your local environment reports a scikit-learn version warning, use the project's environment/package version that was used to train the model rather than silently retraining it with a different version.
