// llega info desde la base del repo
import fs from "fs";
import path from "path";
import { parse as csvParse } from "csv-parse/sync";

const csvFilePath = path.resolve("/home/ivanramos/proyectos/retoCasas/data/housing_data", "test.csv");
const csvData = fs.readFileSync(csvFilePath, "utf-8");
const data = csvParse(csvData, {
  columns: true,
  skip_empty_lines: true
});

// de csv a array con diccionario
const housingData = Array.isArray(data) ? data : [];
export { housingData };