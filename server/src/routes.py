import os
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, List, Union
import json
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.groq import GroqModel
from dotenv import load_dotenv
from utils.mlflow_flow import set_tracking
from utils.utils_yose import make_features
import mlflow
from config import setup_logging

# Load environment variables first
load_dotenv()

logger = setup_logging()

ENDPOINT_URL = os.getenv("MLFLOW_TRACKING_URI")
MODEL_NAME = os.getenv("MODEL_NAME")
ALIAS = os.getenv("MODEL_ALIAS")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Global model variable for caching
_cached_model = None

router = APIRouter()

def get_cached_model():
    global _cached_model

    if _cached_model is not None:
        return _cached_model

    logger.info("Loading MLflow model for the first time...")
    set_tracking(ENDPOINT_URL)

    m = None
    load_errors = []

    # Try to load model with same logic as /predict
    if MODEL_NAME and ALIAS:
        try:
            m = mlflow.pyfunc.load_model(f"models:/{MODEL_NAME}@{ALIAS}")
            logger.info(f"Loaded model via alias: {MODEL_NAME}@{ALIAS}")
        except Exception as e:
            err = f"Alias: models:/{MODEL_NAME}@{ALIAS} -> {type(e).__name__}: {str(e)[:200]}"
            logger.warning(err)
            load_errors.append(err)

    if m is None:
        try:
            m = mlflow.pyfunc.load_model("runs:/c5d7f7da87664b67ad1595f33557c4cc/model")
            logger.info("Loaded model via runs URI")
        except Exception as e:
            err = f"Runs falla: {type(e).__name__}: {str(e)[:200]}"
            logger.error(err)
            load_errors.append(err)

    if m is None:
        logger.error("Could not load MLflow model")
        raise Exception(f"Failed to load model: {load_errors}")

    _cached_model = m
    logger.info("Model cached successfully")
    return _cached_model

class PropertyValue(BaseModel):
    name: str
    value: Union[str, int, float]

class HouseFeaturesRaw(BaseModel):
    MSSubClass: Union[str, int]
    MSZoning: str
    LotFrontage: Union[int, float]
    LotArea: Union[int, float]
    Street: str
    Alley: str
    LotShape: str
    LandContour: str
    Utilities: str
    LotConfig: str
    LandSlope: str

    # Location
    Neighborhood: str
    Condition1: str
    Condition2: str

    # Building
    BldgType: str
    HouseStyle: str
    OverallQual: Union[int, float]
    OverallCond: Union[int, float]
    YearBuilt: Union[int, float]
    YearRemodAdd: Union[int, float]

    # Exterior
    RoofStyle: str
    RoofMatl: str
    Exterior1st: str
    Exterior2nd: str
    MasVnrType: str
    MasVnrArea: Union[int, float]
    ExterQual: str
    ExterCond: str
    Foundation: str

    # Basement
    BsmtQual: str
    BsmtCond: str
    BsmtExposure: str
    BsmtFinType1: str
    BsmtFinSF1: Union[int, float]
    BsmtFinType2: str
    BsmtFinSF2: Union[int, float]
    BsmtUnfSF: Union[int, float]
    TotalBsmtSF: Union[int, float]

    # Systems
    Heating: str
    HeatingQC: str
    CentralAir: str
    Electrical: str

    # Interior
    FirstFlrSF: Union[int, float] = Field(alias="1stFlrSF")
    SecondFlrSF: Union[int, float] = Field(alias="2ndFlrSF")
    LowQualFinSF: Union[int, float]
    GrLivArea: Union[int, float]
    BsmtFullBath: Union[int, float]
    BsmtHalfBath: Union[int, float]
    FullBath: Union[int, float]
    HalfBath: Union[int, float]
    BedroomAbvGr: Union[int, float]
    KitchenAbvGr: Union[int, float]
    KitchenQual: str
    TotRmsAbvGrd: Union[int, float]
    Functional: str
    Fireplaces: Union[int, float]
    FireplaceQu: str

    # Garage
    GarageType: str
    GarageYrBlt: Union[int, float]
    GarageFinish: str
    GarageCars: Union[int, float]
    GarageArea: Union[int, float]
    GarageQual: str
    GarageCond: str
    PavedDrive: str

    # Outdoor
    WoodDeckSF: Union[int, float]
    OpenPorchSF: Union[int, float]
    EnclosedPorch: Union[int, float]
    ThreeSsnPorch: Union[int, float] = Field(alias="3SsnPorch")
    ScreenPorch: Union[int, float]
    PoolArea: Union[int, float]
    PoolQC: str
    Fence: str
    MiscFeature: str
    MiscVal: Union[int, float]

    # Sale
    MoSold: Union[int, float]
    YrSold: Union[int, float]
    SaleType: str
    SaleCondition: str

class HouseProperties(BaseModel):
    properties: List[PropertyValue]

# System prompt for structured output
HOUSE_COMPLETION_PROMPT = """
Eres un experto en bienes raíces que debe completar TODAS las características de una casa para hacer una predicción de precio.

Basándote en la descripción del usuario, debes inferir y completar TODAS las 80 propiedades de casa con valores realistas y coherentes entre sí.

IMPORTANTE:
- NO incluyas SalePrice (es el precio que vamos a predecir)
- USA EXACTAMENTE los valores categóricos listados
- Completa TODAS las 80 propiedades requeridas

**INFORMACIÓN BÁSICA:**
- MSSubClass: Clase de edificio (20,30,40,45,50,60,70,75,80,85,90,120,150,160,180,190)
- MSZoning: Zona (A,C,FV,I,RH,RL,RP,RM)
- LotFrontage: Frente del lote en pies (número)
- LotArea: Área del lote en sq ft (número)
- Street: Tipo de calle (Grvl,Pave)
- Alley: Tipo de callejón (Grvl,Pave,NA)
- LotShape: Forma del lote (Reg,IR1,IR2,IR3)
- LandContour: Contorno del terreno (Lvl,Bnk,HLS,Low)
- Utilities: Servicios públicos (AllPub,NoSewr,NoSeWa,ELO)
- LotConfig: Configuración del lote (Inside,Corner,CulDSac,FR2,FR3)
- LandSlope: Pendiente del terreno (Gtl,Mod,Sev)

**UBICACIÓN:**
- Neighborhood: Vecindario (Blmngtn,Blueste,BrDale,BrkSide,ClearCr,CollgCr,Crawfor,Edwards,Gilbert,IDOTRR,MeadowV,Mitchel,Names,NoRidge,NPkVill,NridgHt,NWAmes,OldTown,SWISU,Sawyer,SawyerW,Somerst,StoneBr,Timber,Veenker)
- Condition1: Condición proximidad 1 (Artery,Feedr,Norm,RRNn,RRAn,PosN,PosA,RRNe,RRAe)
- Condition2: Condición proximidad 2 (Artery,Feedr,Norm,RRNn,RRAn,PosN,PosA,RRNe,RRAe)

**EDIFICIO:**
- BldgType: Tipo de vivienda (1Fam,2FmCon,Duplx,TwnhsE,TwnhsI)
- HouseStyle: Estilo de casa (1Story,1.5Fin,1.5Unf,2Story,2.5Fin,2.5Unf,SFoyer,SLvl)
- OverallQual: Calidad general 1-10 (número)
- OverallCond: Condición general 1-10 (número)
- YearBuilt: Año de construcción (número)
- YearRemodAdd: Año de remodelación (número)

**EXTERIOR:**
- RoofStyle: Estilo de techo (Flat,Gable,Gambrel,Hip,Mansard,Shed)
- RoofMatl: Material del techo (ClyTile,CompShg,Membran,Metal,Roll,Tar&Grv,WdShake,WdShngl)
- Exterior1st: Material exterior 1 (AsbShng,AsphShn,BrkComm,BrkFace,CBlock,CemntBd,HdBoard,ImStucc,MetalSd,Other,Plywood,PreCast,Stone,Stucco,VinylSd,Wd Sdng,WdShing)
- Exterior2nd: Material exterior 2 (igual que Exterior1st)
- MasVnrType: Tipo de revestimiento (BrkCmn,BrkFace,CBlock,None,Stone)
- MasVnrArea: Área de revestimiento (número)
- ExterQual: Calidad exterior (Ex,Gd,TA,Fa,Po)
- ExterCond: Condición exterior (Ex,Gd,TA,Fa,Po)
- Foundation: Tipo de cimentación (BrkTil,CBlock,PConc,Slab,Stone,Wood)

**SÓTANO:**
- BsmtQual: Calidad del sótano (Ex,Gd,TA,Fa,Po,NA)
- BsmtCond: Condición del sótano (Ex,Gd,TA,Fa,Po,NA)
- BsmtExposure: Exposición del sótano (Gd,Av,Mn,No,NA)
- BsmtFinType1: Tipo de acabado 1 (GLQ,ALQ,BLQ,Rec,LwQ,Unf,NA)
- BsmtFinSF1: Área acabada 1 en sq ft (número)
- BsmtFinType2: Tipo de acabado 2 (GLQ,ALQ,BLQ,Rec,LwQ,Unf,NA)
- BsmtFinSF2: Área acabada 2 en sq ft (número)
- BsmtUnfSF: Área sin acabar en sq ft (número)
- TotalBsmtSF: Área total sótano en sq ft (número)

**SISTEMAS:**
- Heating: Tipo de calefacción (Floor,GasA,GasW,Grav,OthW,Wall)
- HeatingQC: Calidad de calefacción (Ex,Gd,TA,Fa,Po)
- CentralAir: Aire acondicionado central (N,Y)
- Electrical: Sistema eléctrico (SBrkr,FuseA,FuseF,FuseP,Mix)

**INTERIOR:**
- 1stFlrSF: Área 1er piso en sq ft (número)
- 2ndFlrSF: Área 2do piso en sq ft (número)
- LowQualFinSF: Área baja calidad en sq ft (número)
- GrLivArea: Área habitable en sq ft (número)
- BsmtFullBath: Baños completos sótano (número)
- BsmtHalfBath: Medios baños sótano (número)
- FullBath: Baños completos (número)
- HalfBath: Medios baños (número)
- BedroomAbvGr: Dormitorios (número)
- KitchenAbvGr: Cocinas (número)
- KitchenQual: Calidad de cocina (Ex,Gd,TA,Fa,Po)
- TotRmsAbvGrd: Total habitaciones (número)
- Functional: Funcionalidad (Typ,Min1,Min2,Mod,Maj1,Maj2,Sev,Sal)
- Fireplaces: Chimeneas (número)
- FireplaceQu: Calidad de chimenea (Ex,Gd,TA,Fa,Po,NA)

**GARAJE:**
- GarageType: Tipo de garaje (2Types,Attchd,Basment,BuiltIn,CarPort,Detchd,NA)
- GarageYrBlt: Año construcción garaje (número)
- GarageFinish: Acabado interior garaje (Fin,RFn,Unf,NA)
- GarageCars: Capacidad de autos (número)
- GarageArea: Área del garaje en sq ft (número)
- GarageQual: Calidad del garaje (Ex,Gd,TA,Fa,Po,NA)
- GarageCond: Condición del garaje (Ex,Gd,TA,Fa,Po,NA)
- PavedDrive: Entrada pavimentada (Y,P,N)

**EXTERIORES:**
- WoodDeckSF: Área deck madera en sq ft (número)
- OpenPorchSF: Área porche abierto en sq ft (número)
- EnclosedPorch: Área porche cerrado en sq ft (número)
- 3SsnPorch: Área porche 3 estaciones en sq ft (número)
- ScreenPorch: Área porche con malla en sq ft (número)
- PoolArea: Área de piscina en sq ft (número)
- PoolQC: Calidad de piscina (Ex,Gd,TA,Fa,NA)
- Fence: Tipo de cerca (GdPrv,MnPrv,GdWo,MnWw,NA)
- MiscFeature: Características misceláneas (Elev,Gar2,Othr,Shed,TenC,NA)
- MiscVal: Valor misceláneo en $ (número)

**VENTA:**
- MoSold: Mes de venta (número 1-12)
- YrSold: Año de venta (número)
- SaleType: Tipo de venta (WD,CWD,VWD,New,COD,Con,ConLw,ConLI,ConLD,Oth)
- SaleCondition: Condición de venta (Normal,Abnorml,AdjLand,Alloca,Family,Partial)

INSTRUCCIONES:
1. Completa TODAS las propiedades basándote en la descripción del usuario
2. Usa valores realistas y coherentes entre sí
3. Si no se especifica algo, usa valores típicos/promedio
4. Para campos categóricos, usa SOLO los valores listados arriba
5. Para números, usa valores enteros o decimales según corresponda
6. Devuelve SOLO un objeto JSON válido con todas las propiedades como pares clave-valor

FORMATO DE RESPUESTA:
Devuelve ÚNICAMENTE un JSON válido con EXACTAMENTE estas 80 propiedades (NO más, NO menos):

{
  "MSSubClass": 60,
  "MSZoning": "RL",
  "LotFrontage": 80,
  "LotArea": 9600,
  "Street": "Pave",
  "Alley": "NA",
  "LotShape": "Reg",
  "LandContour": "Lvl",
  "Utilities": "AllPub",
  "LotConfig": "Inside",
  "LandSlope": "Gtl",
  "Neighborhood": "OldTown",
  "Condition1": "Norm",
  "Condition2": "Norm",
  "BldgType": "1Fam",
  "HouseStyle": "1Story",
  "OverallQual": 7,
  "OverallCond": 6,
  "YearBuilt": 2005,
  "YearRemodAdd": 2005,
  "RoofStyle": "Gable",
  "RoofMatl": "CompShg",
  "Exterior1st": "VinylSd",
  "Exterior2nd": "VinylSd",
  "MasVnrType": "None",
  "MasVnrArea": 0,
  "ExterQual": "Gd",
  "ExterCond": "Gd",
  "Foundation": "PConc",
  "BsmtQual": "NA",
  "BsmtCond": "NA",
  "BsmtExposure": "NA",
  "BsmtFinType1": "NA",
  "BsmtFinSF1": 0,
  "BsmtFinType2": "NA",
  "BsmtFinSF2": 0,
  "BsmtUnfSF": 0,
  "TotalBsmtSF": 0,
  "Heating": "GasA",
  "HeatingQC": "Ex",
  "CentralAir": "Y",
  "Electrical": "SBrkr",
  "1stFlrSF": 1722,
  "2ndFlrSF": 0,
  "LowQualFinSF": 0,
  "GrLivArea": 1722,
  "BsmtFullBath": 0,
  "BsmtHalfBath": 0,
  "FullBath": 2,
  "HalfBath": 1,
  "BedroomAbvGr": 3,
  "KitchenAbvGr": 1,
  "KitchenQual": "Gd",
  "TotRmsAbvGrd": 6,
  "Functional": "Typ",
  "Fireplaces": 1,
  "FireplaceQu": "Gd",
  "GarageType": "Attchd",
  "GarageYrBlt": 2005,
  "GarageFinish": "Fin",
  "GarageCars": 2,
  "GarageArea": 400,
  "GarageQual": "Gd",
  "GarageCond": "Gd",
  "PavedDrive": "Y",
  "WoodDeckSF": 200,
  "OpenPorchSF": 100,
  "EnclosedPorch": 0,
  "3SsnPorch": 0,
  "ScreenPorch": 0,
  "PoolArea": 0,
  "PoolQC": "NA",
  "Fence": "NA",
  "MiscFeature": "NA",
  "MiscVal": 0,
  "MoSold": 6,
  "YrSold": 2023,
  "SaleType": "WD",
  "SaleCondition": "Normal"
}

REGLAS CRÍTICAS:
- Devuelve SOLO el JSON, sin texto adicional ni markdown
- NUNCA incluyas "SalePrice" (es lo que vamos a predecir)
- USA EXACTAMENTE los valores categóricos listados arriba
- Incluye las 80 propiedades exactas mostradas en el ejemplo
"""

# Valid categorical values mapping
VALID_CATEGORIES = {
    "MSSubClass": ["20","30","40","45","50","60","70","75","80","85","90","120","150","160","180","190"],
    "MSZoning": ["A","C","FV","I","RH","RL","RP","RM"],
    "Street": ["Grvl","Pave"],
    "Alley": ["Grvl","Pave","NA"],
    "LotShape": ["Reg","IR1","IR2","IR3"],
    "LandContour": ["Lvl","Bnk","HLS","Low"],
    "Utilities": ["AllPub","NoSewr","NoSeWa","ELO"],
    "LotConfig": ["Inside","Corner","CulDSac","FR2","FR3"],
    "LandSlope": ["Gtl","Mod","Sev"],
    "Neighborhood": ["Blmngtn","Blueste","BrDale","BrkSide","ClearCr","CollgCr","Crawfor","Edwards","Gilbert","IDOTRR","MeadowV","Mitchel","Names","NoRidge","NPkVill","NridgHt","NWAmes","OldTown","SWISU","Sawyer","SawyerW","Somerst","StoneBr","Timber","Veenker"],
    "Condition1": ["Artery","Feedr","Norm","RRNn","RRAn","PosN","PosA","RRNe","RRAe"],
    "Condition2": ["Artery","Feedr","Norm","RRNn","RRAn","PosN","PosA","RRNe","RRAe"],
    "BldgType": ["1Fam","2FmCon","Duplx","TwnhsE","TwnhsI"],
    "HouseStyle": ["1Story","1.5Fin","1.5Unf","2Story","2.5Fin","2.5Unf","SFoyer","SLvl"],
    "RoofStyle": ["Flat","Gable","Gambrel","Hip","Mansard","Shed"],
    "RoofMatl": ["ClyTile","CompShg","Membran","Metal","Roll","Tar&Grv","WdShake","WdShngl"],
    "Exterior1st": ["AsbShng","AsphShn","BrkComm","BrkFace","CBlock","CemntBd","HdBoard","ImStucc","MetalSd","Other","Plywood","PreCast","Stone","Stucco","VinylSd","Wd Sdng","WdShing"],
    "Exterior2nd": ["AsbShng","AsphShn","BrkComm","BrkFace","CBlock","CemntBd","HdBoard","ImStucc","MetalSd","Other","Plywood","PreCast","Stone","Stucco","VinylSd","Wd Sdng","WdShing"],
    "MasVnrType": ["BrkCmn","BrkFace","CBlock","None","Stone"],
    "ExterQual": ["Ex","Gd","TA","Fa","Po"],
    "ExterCond": ["Ex","Gd","TA","Fa","Po"],
    "Foundation": ["BrkTil","CBlock","PConc","Slab","Stone","Wood"],
    "BsmtQual": ["Ex","Gd","TA","Fa","Po","NA"],
    "BsmtCond": ["Ex","Gd","TA","Fa","Po","NA"],
    "BsmtExposure": ["Gd","Av","Mn","No","NA"],
    "BsmtFinType1": ["GLQ","ALQ","BLQ","Rec","LwQ","Unf","NA"],
    "BsmtFinType2": ["GLQ","ALQ","BLQ","Rec","LwQ","Unf","NA"],
    "Heating": ["Floor","GasA","GasW","Grav","OthW","Wall"],
    "HeatingQC": ["Ex","Gd","TA","Fa","Po"],
    "CentralAir": ["N","Y"],
    "Electrical": ["SBrkr","FuseA","FuseF","FuseP","Mix"],
    "KitchenQual": ["Ex","Gd","TA","Fa","Po"],
    "Functional": ["Typ","Min1","Min2","Mod","Maj1","Maj2","Sev","Sal"],
    "FireplaceQu": ["Ex","Gd","TA","Fa","Po","NA"],
    "GarageType": ["2Types","Attchd","Basment","BuiltIn","CarPort","Detchd","NA"],
    "GarageFinish": ["Fin","RFn","Unf","NA"],
    "GarageQual": ["Ex","Gd","TA","Fa","Po","NA"],
    "GarageCond": ["Ex","Gd","TA","Fa","Po","NA"],
    "PavedDrive": ["Y","P","N"],
    "PoolQC": ["Ex","Gd","TA","Fa","NA"],
    "Fence": ["GdPrv","MnPrv","GdWo","MnWw","NA"],
    "MiscFeature": ["Elev","Gar2","Othr","Shed","TenC","NA"],
    "SaleType": ["WD","CWD","VWD","New","COD","Con","ConLw","ConLI","ConLD","Oth"],
    "SaleCondition": ["Normal","Abnorml","AdjLand","Alloca","Family","Partial"]
}

def validate_and_fix_house_data(house_data):
    """Validate and fix categorical values in house data"""
    fixed_data = house_data.copy()

    for field, value in house_data.items():
        if field in VALID_CATEGORIES:
            # Convert to string for comparison
            str_value = str(value)
            valid_values = VALID_CATEGORIES[field]

            # Check if exact match
            if str_value in valid_values:
                continue

            # Try case-insensitive match
            for valid_val in valid_values:
                if str_value.lower() == valid_val.lower():
                    fixed_data[field] = valid_val
                    logger.warning(f"Fixed {field}: {str_value} -> {valid_val}")
                    break
            else:
                # Use default value if no match found
                if field == "MSSubClass":
                    fixed_data[field] = "20"  # Most common
                elif field in ["Condition1", "Condition2"]:
                    fixed_data[field] = "Norm"  # Most common
                elif field == "MSZoning":
                    fixed_data[field] = "RL"  # Most common
                elif field in ["ExterQual", "ExterCond", "HeatingQC", "KitchenQual"]:
                    fixed_data[field] = "TA"  # Average
                elif field == "CentralAir":
                    fixed_data[field] = "Y"
                elif field in ["BsmtQual", "BsmtCond", "BsmtExposure", "BsmtFinType1", "BsmtFinType2", "FireplaceQu", "GarageType", "GarageFinish", "GarageQual", "GarageCond", "PoolQC", "Fence", "MiscFeature"]:
                    fixed_data[field] = "NA"  # No feature
                else:
                    # Use first valid value as fallback
                    fixed_data[field] = valid_values[0]

                logger.warning(f"Invalid value for {field}: {str_value}, using default: {fixed_data[field]}")

    return fixed_data

# Initialize Groq model and agent with JSON string output (more reliable)
groq_model = GroqModel("openai/gpt-oss-120b")
house_agent = Agent(groq_model, system_prompt=HOUSE_COMPLETION_PROMPT)

@router.get("/health")
def health():
    return {"status": "ok"}

@router.post("/llm")
async def llm_query(data: Dict[str, str] = Body(...)):
    try:
        prompt = data.get("prompt")
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")

        if not GROQ_API_KEY:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

        # Use the house agent to complete all properties with JSON output
        result = await house_agent.run(prompt)
        llm_response = result.output.strip()

        # Parse JSON response from LLM
        try:
            house_data = json.loads(llm_response)
        except json.JSONDecodeError as json_error:
            logger.error(f"JSON parsing error: {json_error}, Response: {llm_response[:500]}")
            raise HTTPException(status_code=500, detail="Error parsing LLM response as JSON")

        # Validate and fix categorical values
        house_data = validate_and_fix_house_data(house_data)
        normalized_data = {}

        # Define columns that should be float (based on working test data)
        float_columns = {
            'LotFrontage', 'MasVnrArea', 'BsmtFinSF1', 'BsmtFinSF2', 'BsmtUnfSF',
            'TotalBsmtSF', 'BsmtFullBath', 'BsmtHalfBath', 'GarageYrBlt',
            'GarageCars', 'GarageArea'
        }

        for key, value in house_data.items():
            # Convert string representations of None/NA to actual None
            if isinstance(value, str) and value.upper() in ['NA', 'NONE', 'NULL', 'N/A']:
                normalized_data[key] = None
            elif isinstance(value, str) and value.strip() == '':
                normalized_data[key] = None
            # Force specific columns to be float (critical for MLflow compatibility)
            elif key in float_columns and value is not None:
                try:
                    normalized_data[key] = float(value)
                except (ValueError, TypeError):
                    normalized_data[key] = 0.0
            # Keep other numeric values as native Python types
            elif isinstance(value, (int, float)) and key not in float_columns:
                try:
                    normalized_data[key] = int(value) if isinstance(value, int) or value.is_integer() else value
                except (ValueError, TypeError, AttributeError):
                    normalized_data[key] = value
            else:
                normalized_data[key] = value

        logger.info(f"Normalized data types sample: {[(k, type(v).__name__, v) for k, v in list(normalized_data.items())[:5]]}")

        # Use cached model for much faster predictions
        try:
            # Get cached model (loads only once)
            m = get_cached_model()

            # Create DataFrame (same as /predict)
            df_in = pd.DataFrame([normalized_data])
            logger.info(f"Input DataFrame shape: {df_in.shape}")

            # Apply feature engineering (same as /predict)
            fe_df = make_features(df_in)
            logger.info(f"After make_features shape: {fe_df.shape}")

            # Predict directly (same as /predict)
            raw = m.predict(fe_df)
            preds = np.expm1(raw)
            price = float(preds[0]) if hasattr(preds, '__getitem__') else float(preds)

            logger.info(f"Prediction successful: {price}")

        except Exception as pred_error:
            logger.error(f"Prediction error: {pred_error}")
            logger.error(f"Normalized data sample: {dict(list(normalized_data.items())[:5])}")
            price = 0

        # Convert to PropertyValue format
        properties = [{"name": key, "value": value} for key, value in house_data.items()]

        return {
            "price": price,
            "properties": properties
        }

    except Exception as e:
        logger.error(f"LLM query error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en LLM query: {type(e).__name__}: {str(e)[:200]}")
