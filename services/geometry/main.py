"""
Geometry worker (week 7 to 10). Deployed to Fly.io or Railway, not Vercel.
Measures STL, 3MF, OBJ (trimesh) and STEP (OpenCascade via cadquery-ocp),
returns volume, area, bounding box and printability flags.

Run locally:
  pip install fastapi uvicorn trimesh numpy
  uvicorn main:app --reload
"""
from fastapi import FastAPI, UploadFile, HTTPException
import trimesh
import io

app = FastAPI(title="JH1 geometry worker")


@app.post("/measure")
async def measure(file: UploadFile):
    data = await file.read()
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext in {"step", "stp"}:
        raise HTTPException(501, "STEP support lands with the OpenCascade build.")
    try:
        mesh = trimesh.load(io.BytesIO(data), file_type=ext, force="mesh")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(422, f"Could not read file: {exc}")
    extents = [round(float(x), 1) for x in mesh.extents]
    return {
        "volumeCm3": round(float(abs(mesh.volume)) / 1000, 3),
        "areaCm2": round(float(mesh.area) / 100, 3),
        "bbox": extents,
        "watertight": bool(mesh.is_watertight),
        "triangles": int(len(mesh.faces)),
    }
