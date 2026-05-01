import os
from pathlib import Path
from tempfile import NamedTemporaryFile

import pymupdf4llm
from docx import Document
from fastapi import FastAPI, File, HTTPException, UploadFile

app = FastAPI()

MAX_FILE_SIZE = 10 * 1024 * 1024
SUPPORTED_EXTENSIONS = {".pdf", ".doc", ".docx"}


def extract_docx_text(file_path: str) -> str:
    document = Document(file_path)
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs]
    return "\n".join([paragraph for paragraph in paragraphs if paragraph])


def cleanup(path: str | None) -> None:
    if path and os.path.exists(path):
        os.remove(path)


@app.post("/")
async def parse_resume(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()

    if suffix not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="仅支持 PDF、DOC、DOCX 格式。")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="文件大小不能超过 10MB。")

    temp_path = None

    try:
        with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name

        if suffix == ".pdf":
            extracted_text = pymupdf4llm.to_markdown(temp_path)
            output_format = "markdown"
            parser = "pymupdf4llm"
        elif suffix == ".docx":
            extracted_text = extract_docx_text(temp_path)
            output_format = "text"
            parser = "python-docx"
        else:
            raise HTTPException(
                status_code=422,
                detail="当前后端已支持 DOCX 直接读取文本；旧版 DOC 请先另存为 DOCX 或 PDF。"
            )

        cleaned = extracted_text.strip()
        if not cleaned:
            raise HTTPException(status_code=422, detail="未能从文件中提取到可用文本。")

        return {
            "ok": True,
            "filename": file.filename,
            "fileType": suffix.lstrip("."),
            "parser": parser,
            "format": output_format,
            "charCount": len(cleaned),
            "content": cleaned
        }
    finally:
        cleanup(temp_path)
