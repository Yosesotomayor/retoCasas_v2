import os
from fastapi import FastAPI
from dotenv import load_dotenv
import uvicorn
import joblib
import json
import glob
import sys
sys.path.append("../")

from database import Database
from contextlib import asynccontextmanager
from config import setup_logging
import routes
import warnings

warnings.filterwarnings("ignore")

load_dotenv()
logger = setup_logging()

DATA_DIR = os.getenv("DATA_DIR", "data/housing_data/")
MODELS = []
WEIGHTS = {}

@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup
    try:
        logger.info("Starting up application...")
        database_url = os.getenv("DATABASE_URL")

        logger.info("Initializing database...")
        Database.initialize(database_url)

        logger.info("Connecting to the database...")
        await Database.wait_for_connection()

        logger.info("Creating tables if they do not exist...")
        await Database.create_tables()  # Asegúrate de que este método se llame

        logger.info("Loading models...")
        # Load models on startup
        global MODELS, WEIGHTS
        models_dir = os.path.join(os.path.dirname(__file__), "models")
        weights_path = os.path.join(models_dir, "weights.json")

        MODELS = []
        WEIGHTS = {}

        if os.path.exists(weights_path):
            with open(weights_path, "r") as f:
                WEIGHTS.update(json.load(f))
        else:
            WEIGHTS.update({"elasticnet": 0.5, "lgbm": 0.5})

        logger.info(f"Model weights loaded: {WEIGHTS}")
        # Cargar modelos .pkl (orden determinista por nombre)
        for mf in sorted(glob.glob(os.path.join(models_dir, "*.pkl"))):
            try:
                with open(mf, "rb") as fh:
                    MODELS.append(joblib.load(fh))
            except Exception as e:
                print(f"[startup] Warning: no se pudo cargar {mf}: {type(e).__name__}: {e}")

        logger.info("Modelos cargados en startup")
        print(f"[startup] Modelos cargados={len(MODELS)}, weights={WEIGHTS}")

    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise e

    yield

    await Database.cleanup()
    logger.info("Application shutdown")


app = FastAPI(title="Server", version="0.1.0", lifespan=lifespan)




# Include router
app.include_router(routes.router)

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