from io import BytesIO

import fastapi
import httpx
import multipart
import pydantic
import pypdf
from fastapi import FastAPI, File, UploadFile
from PIL import Image
from pydantic import BaseModel, EmailStr
from pypdf import PdfReader
from workers import WorkerEntrypoint

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


class EmailProbe(BaseModel):
    email: EmailStr


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/compatibility")
async def compatibility():
    EmailProbe(email="probe@example.com")
    return {
        "fastapi": fastapi.__version__,
        "httpx": httpx.__version__,
        "pydantic": pydantic.__version__,
        "python_multipart": multipart.__version__,
        "pillow": Image.__version__,
        "pypdf": pypdf.__version__,
        "email_validation": "ok",
    }


@app.post("/inspect-image")
async def inspect_image(file: UploadFile = File(...)):
    content = await file.read()
    with Image.open(BytesIO(content)) as image:
        return {"format": image.format, "width": image.width, "height": image.height}


@app.post("/inspect-pdf")
async def inspect_pdf(file: UploadFile = File(...)):
    reader = PdfReader(BytesIO(await file.read()))
    return {"pages": len(reader.pages)}


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        import asgi

        return await asgi.fetch(app, request.js_object, self.env)
