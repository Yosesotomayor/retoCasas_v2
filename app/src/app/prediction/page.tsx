"use client";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { CATEGORY_MAP } from "@/lib/categories";

// Configuración de secciones del formulario
const formSections = {
  property: {
    title: "📋 Información Básica de la Propiedad",
    fields: [
      { name: "MSSubClass", type: "number", label: "Clase de Edificio" },
      { name: "MSZoning", type: "text", label: "Zona" },
      { name: "LotFrontage", type: "number", label: "Frente del Lote (ft)" },
      { name: "LotArea", type: "number", label: "Área del Lote (sq ft)" },
      { name: "Street", type: "text", label: "Tipo de Calle" },
      { name: "Alley", type: "text", label: "Tipo de Callejón" },
      { name: "LotShape", type: "text", label: "Forma del Lote" },
      { name: "LandContour", type: "text", label: "Contorno del Terreno" },
      { name: "Utilities", type: "text", label: "Servicios Públicos" },
      { name: "LotConfig", type: "text", label: "Configuración del Lote" },
      { name: "LandSlope", type: "text", label: "Pendiente del Terreno" }
    ]
  },
  location: {
    title: "📍 Ubicación y Entorno",
    fields: [
      { name: "Neighborhood", type: "text", label: "Vecindario" },
      { name: "Condition1", type: "text", label: "Condición de Proximidad 1" },
      { name: "Condition2", type: "text", label: "Condición de Proximidad 2" }
    ]
  },
  building: {
    title: "🏠 Características del Edificio",
    fields: [
      { name: "BldgType", type: "text", label: "Tipo de Vivienda" },
      { name: "HouseStyle", type: "text", label: "Estilo de Casa" },
      { name: "OverallQual", type: "number", label: "Calidad General (1-10)" },
      { name: "OverallCond", type: "number", label: "Condición General (1-10)" },
      { name: "YearBuilt", type: "number", label: "Año de Construcción" },
      { name: "YearRemodAdd", type: "number", label: "Año de Remodelación" }
    ]
  },
  exterior: {
    title: "🏗️ Exterior y Estructura",
    fields: [
      { name: "RoofStyle", type: "text", label: "Estilo de Techo" },
      { name: "RoofMatl", type: "text", label: "Material del Techo" },
      { name: "Exterior1st", type: "text", label: "Material Exterior 1" },
      { name: "Exterior2nd", type: "text", label: "Material Exterior 2" },
      { name: "MasVnrType", type: "text", label: "Tipo de Revestimiento" },
      { name: "MasVnrArea", type: "number", label: "Área de Revestimiento" },
      { name: "ExterQual", type: "text", label: "Calidad Exterior" },
      { name: "ExterCond", type: "text", label: "Condición Exterior" },
      { name: "Foundation", type: "text", label: "Tipo de Cimentación" }
    ]
  },
  basement: {
    title: "🏠 Sótano",
    fields: [
      { name: "BsmtQual", type: "text", label: "Calidad del Sótano" },
      { name: "BsmtCond", type: "text", label: "Condición del Sótano" },
      { name: "BsmtExposure", type: "text", label: "Exposición del Sótano" },
      { name: "BsmtFinType1", type: "text", label: "Tipo de Acabado 1" },
      { name: "BsmtFinSF1", type: "number", label: "Área Acabada 1 (sq ft)" },
      { name: "BsmtFinType2", type: "text", label: "Tipo de Acabado 2" },
      { name: "BsmtFinSF2", type: "number", label: "Área Acabada 2 (sq ft)" },
      { name: "BsmtUnfSF", type: "number", label: "Área Sin Acabar (sq ft)" },
      { name: "TotalBsmtSF", type: "number", label: "Área Total Sótano (sq ft)" }
    ]
  },
  systems: {
    title: "⚡ Sistemas y Servicios",
    fields: [
      { name: "Heating", type: "text", label: "Tipo de Calefacción" },
      { name: "HeatingQC", type: "text", label: "Calidad de Calefacción" },
      { name: "CentralAir", type: "text", label: "Aire Acondicionado Central" },
      { name: "Electrical", type: "text", label: "Sistema Eléctrico" }
    ]
  },
  interior: {
    title: "🛏️ Espacios Interiores",
    fields: [
      { name: "1stFlrSF", type: "number", label: "Área 1er Piso (sq ft)" },
      { name: "2ndFlrSF", type: "number", label: "Área 2do Piso (sq ft)" },
      { name: "LowQualFinSF", type: "number", label: "Área Baja Calidad (sq ft)" },
      { name: "GrLivArea", type: "number", label: "Área Habitable (sq ft)" },
      { name: "BsmtFullBath", type: "number", label: "Baños Completos Sótano" },
      { name: "BsmtHalfBath", type: "number", label: "Medios Baños Sótano" },
      { name: "FullBath", type: "number", label: "Baños Completos" },
      { name: "HalfBath", type: "number", label: "Medios Baños" },
      { name: "BedroomAbvGr", type: "number", label: "Dormitorios" },
      { name: "KitchenAbvGr", type: "number", label: "Cocinas" },
      { name: "KitchenQual", type: "text", label: "Calidad de Cocina" },
      { name: "TotRmsAbvGrd", type: "number", label: "Total Habitaciones" },
      { name: "Functional", type: "text", label: "Funcionalidad de la Casa" },
      { name: "Fireplaces", type: "number", label: "Chimeneas" },
      { name: "FireplaceQu", type: "text", label: "Calidad de Chimenea" }
    ]
  },
  garage: {
    title: "🚗 Garaje",
    fields: [
      { name: "GarageType", type: "text", label: "Tipo de Garaje" },
      { name: "GarageYrBlt", type: "number", label: "Año Construcción Garaje" },
      { name: "GarageFinish", type: "text", label: "Acabado Interior Garaje" },
      { name: "GarageCars", type: "number", label: "Capacidad de Autos" },
      { name: "GarageArea", type: "number", label: "Área del Garaje (sq ft)" },
      { name: "GarageQual", type: "text", label: "Calidad del Garaje" },
      { name: "GarageCond", type: "text", label: "Condición del Garaje" },
      { name: "PavedDrive", type: "text", label: "Entrada Pavimentada" }
    ]
  },
  outdoor: {
    title: "🌳 Espacios Exteriores",
    fields: [
      { name: "WoodDeckSF", type: "number", label: "Área Deck Madera (sq ft)" },
      { name: "OpenPorchSF", type: "number", label: "Área Porche Abierto (sq ft)" },
      { name: "EnclosedPorch", type: "number", label: "Área Porche Cerrado (sq ft)" },
      { name: "3SsnPorch", type: "number", label: "Área Porche 3 Estaciones (sq ft)" },
      { name: "ScreenPorch", type: "number", label: "Área Porche con Malla (sq ft)" },
      { name: "PoolArea", type: "number", label: "Área de Piscina (sq ft)" },
      { name: "PoolQC", type: "text", label: "Calidad de Piscina" },
      { name: "Fence", type: "text", label: "Tipo de Cerca" },
      { name: "MiscFeature", type: "text", label: "Características Misceláneas" },
      { name: "MiscVal", type: "number", label: "Valor Misceláneo ($)" }
    ]
  },
  sale: {
    title: "💰 Información de Venta",
    fields: [
      { name: "MoSold", type: "number", label: "Mes de Venta" },
      { name: "YrSold", type: "number", label: "Año de Venta" },
      { name: "SaleType", type: "text", label: "Tipo de Venta" },
      { name: "SaleCondition", type: "text", label: "Condición de Venta" }
    ]
  }
};

// Componente para campos individuales
interface FormFieldProps {
  name: string;
  type: "text" | "number" | "select";
  label: string;
  value: string | number;
  onChange: (name: string, value: string | number) => void;
  options?: { value: string | number; label: string }[];
  originalType?: "text" | "number";
}

const FormField: React.FC<FormFieldProps> = ({ name, type, label, value, onChange, options, originalType }) => {
  if (type === "select") {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <select
          name={name}
          value={value === undefined ? "" : value}
          onChange={(e) => {
            let v: string | number = e.target.value;
            if (originalType === "number" && /^\d+$/.test(v)) v = Number(v);
            onChange(name, v);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">-- Seleccionar --</option>
          {options?.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(name, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={label}
      />
    </div>
  );
};

// Componente para secciones colapsables
interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, isExpanded, onToggle, children }) => (
  <div className="border border-gray-200 rounded-lg mb-4">
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg border-b border-gray-200 flex items-center justify-between transition-colors"
    >
      <span className="font-medium text-gray-900">{title}</span>
      <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
        ▼
      </span>
    </button>
    {isExpanded && (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children}
        </div>
      </div>
    )}
  </div>
);

// Función para obtener datos del ML Service desde el cliente
async function fetchMLService() {
    const API_URL = '/api/ml-service';

  
  try {
    const response = await fetch(API_URL, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Service error! status: ${response.status}`);
    }
    
    const data = await response.text();
    return { success: true, data, error: null, serviceUrl: API_URL };
  } catch (error) {
    return { 
      success: false, 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error',
      serviceUrl: API_URL
    };
  }
}
// funcion para ver la respuesta en la consola de la prediccion
const logPredictionResponse = (response: any) => {
  console.log('Respuesta de la predicción:', response);
};

export default function Prediction() {
  // Estado para controlar qué secciones están expandidas
  const [expandedSections, setExpandedSections] = useState<string[]>(['property']);
  
  // Estado para los valores del formulario
  const [formData, setFormData] = useState<Record<string, string | number>>({});

  // Estado para sesión y resultado del ML service
  const [session, setSession] = useState<any>(null);
  const [result, setResult] = useState<any>({ success: false, data: null, error: null, serviceUrl: '' });
  const [loading, setLoading] = useState(true);

  // Efecto para cargar la sesión y el ML service
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Cargar el ML service
        const mlResult = await fetchMLService();
        setResult(mlResult);
      } catch (error) {
        setResult({
          success: false,
          data: null,
          error: 'Error al cargar el servicio ML',
          serviceUrl: 'http://ec2-18-232-61-103.compute-1.amazonaws.com:8000/'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Función para alternar la expansión de secciones
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Función para manejar cambios en los campos
  const handleFieldChange = (name: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    // Normalizar: enviar null en lugar de ''
    const payload: Record<string, any> = {};
    Object.entries(formData).forEach(([k, v]) => {
      payload[k] = (v === '' ? null : v);
    });
    fetch('/api/ml-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const resp = await res.json().catch(() => ({}));
        if (!res.ok || !resp.success) throw new Error(resp.error || `Status ${res.status}`);
        setResult({ success: true, data: resp.data, error: null, serviceUrl: '/ml-service' });
      })
      .catch(err => {
        setResult({ success: false, data: null, error: err.message, serviceUrl: '/ml-service' });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Predicción del Precio de Vivienda</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {session ? (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-medium">
              ✅ Bienvenido, {session.user?.name}! Tienes acceso a la predicción de precios.
            </p>
          </div>
        ) : (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800 font-medium">
              ℹ️ Puedes usar la predicción sin iniciar sesión, pero te recomendamos 
              <Link href="/login" className="underline ml-1">iniciar sesión</Link> 
              {" "}para acceder a todas las funcionalidades.
            </p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Respuesta del microservicio ML</h2>
          
          {loading ? (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800">🔄 Cargando servicio ML...</p>
            </div>
          ) : result.success ? (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Respuesta del modelo ML ({result.serviceUrl}):</h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-800 overflow-auto max-h-96">
                {result.data}
              </pre>
              <form onSubmit={handleSubmit} className="mt-4">
                {/* Formulario organizado por secciones */}
                {Object.entries(formSections).map(([sectionKey, section]) => (
                  <CollapsibleSection
                    key={sectionKey}
                    title={section.title}
                    isExpanded={expandedSections.includes(sectionKey)}
                    onToggle={() => toggleSection(sectionKey)}
                  >
                    {section.fields.map((field) => {
                      const categoricalValues = CATEGORY_MAP[field.name];
                      const isSelect = !!categoricalValues
                      return (
                        <FormField
                          key={field.name}
                          name={field.name}
                          type={isSelect ? "select" : (field.type as "text" | "number")}
                          originalType={field.type as "text" | "number"}

                          label={field.label}
                          value={formData[field.name] || ''}
                          onChange={handleFieldChange}
                          options={isSelect ? categoricalValues.map(v => ({ value: v, label: v })) : undefined}
                        />
                      );
                    })}
                  </CollapsibleSection>
                ))}
                
                {/* Botones de acción */}
                <div className="mt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setExpandedSections(Object.keys(formSections))}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Expandir Todo
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedSections([])}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Colapsar Todo
                  </button>
                  <button

                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Predecir Precio
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">
                ❌ Error al obtener datos: {result.error}
              </p>
              <button 
                onClick={() => {
                  setLoading(true);
                  fetchMLService().then(setResult).finally(() => setLoading(false));
                }}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                🔄 Reintentar
              </button>
            </div>
          )}
        </div>
        
        <p className="text-gray-600 mb-4">
          Aquí podrás introducir los datos de una propiedad para obtener una 
          predicción de su precio usando nuestro modelo de machine learning.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            🚧 Función en desarrollo - Próximamente disponible
          </p>
        </div>
      </div>
    </div>
  );
}