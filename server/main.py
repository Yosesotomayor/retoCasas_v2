import os
import uvicorn
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Server", version="0.1.0")


@app.get("/")
def hello():
    return "Hello World"

# predict
@app.get("/predict")
def predict():
    return "Hello World - PREDICT"

def main():
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "true").lower() == "true"

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info" if not debug else "debug",
    )


if __name__ == "__main__":
    main()
