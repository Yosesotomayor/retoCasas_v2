export const CATEGORY_MAP: Record<string, readonly string[]> = {
  MSSubClass: [
    "20","30","40","45","50","60","70","75","80","85","90","120","150","160","180","190"
  ],
  MSZoning: ["A","C","FV","I","RH","RL","RP","RM"],
  Street: ["Grvl","Pave"],
  Alley: ["Grvl","Pave","NA"],
  LotShape: ["Reg","IR1","IR2","IR3"],
  LandContour: ["Lvl","Bnk","HLS","Low"],
  Utilities: ["AllPub","NoSewr","NoSeWa","ELO"],
  LotConfig: ["Inside","Corner","CulDSac","FR2","FR3"],
  LandSlope: ["Gtl","Mod","Sev"],
  Neighborhood: [
    "Blmngtn","Blueste","BrDale","BrkSide","ClearCr","CollgCr","Crawfor","Edwards","Gilbert",
    "IDOTRR","MeadowV","Mitchel","Names","NoRidge","NPkVill","NridgHt","NWAmes","OldTown",
    "SWISU","Sawyer","SawyerW","Somerst","StoneBr","Timber","Veenker"
  ],
  Condition1: ["Artery","Feedr","Norm","RRNn","RRAn","PosN","PosA","RRNe","RRAe"],
  Condition2: ["Artery","Feedr","Norm","RRNn","RRAn","PosN","PosA","RRNe","RRAe"],
  BldgType: ["1Fam","2FmCon","Duplx","TwnhsE","TwnhsI"],
  HouseStyle: ["1Story","1.5Fin","1.5Unf","2Story","2.5Fin","2.5Unf","SFoyer","SLvl"],
  RoofStyle: ["Flat","Gable","Gambrel","Hip","Mansard","Shed"],
  RoofMatl: ["ClyTile","CompShg","Membran","Metal","Roll","Tar&Grv","WdShake","WdShngl"],
  Exterior1st: [
    "AsbShng","AsphShn","BrkComm","BrkFace","CBlock","CemntBd","HdBoard","ImStucc","MetalSd",
    "Other","Plywood","PreCast","Stone","Stucco","VinylSd","Wd Sdng","WdShing"
  ],
  Exterior2nd: [
    "AsbShng","AsphShn","BrkComm","BrkFace","CBlock","CemntBd","HdBoard","ImStucc","MetalSd",
    "Other","Plywood","PreCast","Stone","Stucco","VinylSd","Wd Sdng","WdShing"
  ],
  MasVnrType: ["BrkCmn","BrkFace","CBlock","None","Stone"],
  ExterQual: ["Ex","Gd","TA","Fa","Po"],
  ExterCond: ["Ex","Gd","TA","Fa","Po"],
  Foundation: ["BrkTil","CBlock","PConc","Slab","Stone","Wood"],
  BsmtQual: ["Ex","Gd","TA","Fa","Po","NA"],
  BsmtCond: ["Ex","Gd","TA","Fa","Po","NA"],
  BsmtExposure: ["Gd","Av","Mn","No","NA"],
  BsmtFinType1: ["GLQ","ALQ","BLQ","Rec","LwQ","Unf","NA"],
  BsmtFinType2: ["GLQ","ALQ","BLQ","Rec","LwQ","Unf","NA"],
  Heating: ["Floor","GasA","GasW","Grav","OthW","Wall"],
  HeatingQC: ["Ex","Gd","TA","Fa","Po"],
  CentralAir: ["N","Y"],
  Electrical: ["SBrkr","FuseA","FuseF","FuseP","Mix"],
  KitchenQual: ["Ex","Gd","TA","Fa","Po"],
  Functional: ["Typ","Min1","Min2","Mod","Maj1","Maj2","Sev","Sal"],
  FireplaceQu: ["Ex","Gd","TA","Fa","Po","NA"],
  GarageType: ["2Types","Attchd","Basment","BuiltIn","CarPort","Detchd","NA"],
  GarageFinish: ["Fin","RFn","Unf","NA"],
  GarageQual: ["Ex","Gd","TA","Fa","Po","NA"],
  GarageCond: ["Ex","Gd","TA","Fa","Po","NA"],
  PavedDrive: ["Y","P","N"],
  PoolQC: ["Ex","Gd","TA","Fa","NA"],
  Fence: ["GdPrv","MnPrv","GdWo","MnWw","NA"],
  MiscFeature: ["Elev","Gar2","Othr","Shed","TenC","NA"],
  SaleType: ["WD","CWD","VWD","New","COD","Con","ConLw","ConLI","ConLD","Oth"],
  SaleCondition: ["Normal","Abnorml","AdjLand","Alloca","Family","Partial"]
};
