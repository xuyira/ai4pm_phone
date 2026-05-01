from fastapi import FastAPI

app = FastAPI()


@app.get("/")
@app.get("/api/health")
async def health():
    return {"ok": True, "service": "resume-parser"}
