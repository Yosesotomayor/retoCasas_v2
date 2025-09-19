"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { useState, KeyboardEvent } from "react";

interface PropertyValue {
  name: string;
  value: any;
}

interface PredictionResponse {
  price?: number;
  properties?: PropertyValue[];
  error?: string;
}

export default function Prediction() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handlePredict();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <main className="font-[Inter] text-[#1A1A1A] min-h-[calc(100vh-56px)]
    bg-[radial-gradient(1200px_600px_at_70%_-120px,rgba(255,212,59,0.18),transparent_60%)] bg-[#F4F4F6]">
      <div className="max-w-[800px] mx-auto px-5 py-10 lg:py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-extrabold uppercase tracking-[1.2px] leading-[1.05]
          text-[28px] md:text-[36px] mb-4">
            Predicción de Precios
          </h1>
          <p className="text-lg text-[#6C6F77] mb-8">
            Describe la propiedad y obtén una estimación de precio al instante
          </p>

          {/* Auth Status */}
          {session ? (
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80
            border border-green-200/50 rounded-[10px] backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium text-sm">
                Conectado como {session.user?.name}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80
            border border-blue-200/50 rounded-[10px] backdrop-blur-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-700 font-medium text-sm">
                Modo invitado •{" "}
                <Link href="/login" className="underline hover:no-underline">
                  Iniciar sesión
                </Link>
              </span>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className="w-full rounded-[14px] bg-white border border-black/10
        ring-1 ring-black/5 shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="house-description" className="block text-sm font-semibold text-[#1A1A1A] mb-3">
                Descripción de la propiedad
              </label>
              <div className="relative">
                <input
                  id="house-description"
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  placeholder="Ej: Casa de 3 habitaciones, 2 baños, 150m², con jardín en Madrid centro..."
                  className="w-full px-4 py-4 text-[#1A1A1A] placeholder-[#6C6F77]
                  border border-black/20 rounded-[10px] bg-white
                  focus:outline-none focus:ring-2 focus:ring-[#FFD43B] focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200"
                />
                {loading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#FFD43B] border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handlePredict}
              disabled={!prompt.trim() || loading}
              className="w-full py-4 px-6 bg-[#FFD43B] text-[#1A1A1A] font-bold
              rounded-[10px] transition-all duration-200
              hover:bg-[#FFD43B]/90 hover:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-[#FFD43B] focus:ring-offset-2"
            >
              {loading ? 'Analizando...' : 'Obtener Predicción'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {error && (
          <div className="w-full rounded-[14px] bg-white border border-red-200
          ring-1 ring-red-100 shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-6 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
              <h3 className="font-bold text-red-800">Error en la predicción</h3>
            </div>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {result && !error && (
          <div className="space-y-6">
            {/* Price Result */}
            {result.price && (
              <div className="w-full rounded-[14px] bg-gradient-to-br from-[#FFD43B] to-[#FFD43B]/80
              border border-[#FFD43B]/30 shadow-[0_10px_26px_rgba(255,212,59,0.20)] p-8">
                <div className="text-center">
                  <h3 className="font-extrabold uppercase tracking-[0.7px] text-[#1A1A1A] mb-2">
                    Precio Estimado
                  </h3>
                  <div className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] mb-2">
                    {formatPrice(result.price)}
                  </div>
                  <p className="text-[#1A1A1A]/70 text-sm font-medium">
                    Estimación basada en machine learning
                  </p>
                </div>
              </div>
            )}

            {/* Properties */}
            {result.properties && result.properties.length > 0 && (
              <div className="w-full rounded-[14px] bg-white border border-black/10
              ring-1 ring-black/5 shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-8">
                <h3 className="font-extrabold uppercase tracking-[0.7px] text-[#1A1A1A] mb-6">
                  Características Analizadas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.properties.map((property, index) => (
                    <div key={index} className="flex items-center justify-between
                    p-4 bg-[#F4F4F6] rounded-[8px] border border-black/5">
                      <span className="font-medium text-[#6C6F77] text-sm">
                        {property.name}
                      </span>
                      <span className="font-bold text-[#1A1A1A] text-sm">
                        {typeof property.value === 'number'
                          ? property.value.toLocaleString('es-ES')
                          : String(property.value)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-center mt-12">
          <p className="text-[#6C6F77] text-sm">
            Presiona <kbd className="px-2 py-1 bg-white border border-black/20 rounded text-xs font-mono">Enter</kbd>
            {" "}o haz clic en el botón para obtener tu predicción
          </p>
        </div>
      </div>
    </main>
  );
}