import os
from pathlib import Path
from tempfile import NamedTemporaryFile

import mammoth
import pymupdf4llm
from fastapi import FastAPI, File, HTTPException, UploadFile

app = FastAPI()

MAX_FILE_SIZE = 10 * 1024 * 1024
SUPPORTED_EXTENSIONS = {".pdf", ".docx"}


def normalize_text(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\x00", "").strip()


def extract_docx_text(file_path: str) -> tuple[str, list[str]]:
    with open(file_path, "rb") as docx_file:
        result = mammoth.extract_raw_text(docx_file)

    warnings = [message.message for message in result.messages if message.message]
    return result.value, warnings


def evaluate_quality(raw_text: str, warnings: list[str]) -> dict[str, object]:
    next_warnings = list(warnings)
    quality_flag = "good"
    line_count = len([line for line in raw_text.split("\n") if line.strip()])

    if len(raw_text) < 400:
        quality_flag = "review_needed"
        next_warnings.append("提取文本偏少，可能存在扫描件、排版错乱或解析失败。")

    if line_count < 10:
        quality_flag = "review_needed"
        next_warnings.append("提取结果行数偏少，建议在优化前人工检查文本是否完整。")

    return {
        "qualityFlag": quality_flag,
        "warnings": next_warnings,
        "charCount": len(raw_text),
        "lineCount": line_count,
    }


def cleanup(path: str | None) -> None:
    if path and os.path.exists(path):
        os.remove(path)


@app.post("/")
@app.post("/api/parse_resume")
async def parse_resume(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()

    if suffix not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="仅支持 PDF 和 DOCX 格式。")

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
            parser_warnings: list[str] = []
            output_format = "markdown"
            parser = "pymupdf4llm"
        else:
            extracted_text, parser_warnings = extract_docx_text(temp_path)
            output_format = "text"
            parser = "mammoth"

        cleaned = normalize_text(extracted_text)
        if not cleaned:
            raise HTTPException(status_code=422, detail="未能从文件中提取到可用文本。")

        quality = evaluate_quality(cleaned, parser_warnings)

        return {
            "ok": True,
            "filename": file.filename,
            "fileType": suffix.lstrip("."),
            "parser": parser,
            "format": output_format,
            "charCount": quality["charCount"],
            "lineCount": quality["lineCount"],
            "qualityFlag": quality["qualityFlag"],
            "warnings": quality["warnings"],
            "content": cleaned,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"简历解析失败：{exc}") from exc
    finally:
        cleanup(temp_path)
