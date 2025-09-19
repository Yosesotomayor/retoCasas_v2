"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { useState, useEffect, KeyboardEvent } from "react";
import UsageCard from "../../components/UsageCard";

interface PropertyValue {
  name: string;
  value: any;
}

interface PredictionResponse {
  price: number;
  properties: PropertyValue[];
  usageInfo?: {
    limit: number;
    used: number;
    remaining: number;
    subscriptionType: string;
    resetDate: string;
  };
}

interface UsageInfo {
  subscription: {
    type: "FREE" | "BASIC" | "PREMIUM";
    status: string;
    currentPeriodEnd?: string;
  };
  usage: {
    limit: number;
    used: number;
    remaining: number;
    resetDate: string;
  };
}

export default function Prediction() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllProperties, setShowAllProperties] = useState(false);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [usageCardData, setUsageCardData] = useState<any>(null);

  // Fetch usage info when user is loaded
  useEffect(() => {
    if (session?.user) {
      fetchUsageInfo();
    }
  }, [session]);

  const fetchUsageInfo = async () => {
    try {
      const response = await fetch("/api/usage");
      if (response.ok) {
        const data = await response.json();
        setUsageInfo(data);
        setUsageCardData(data); // Also update usage card data
      }
    } catch (error) {
      console.error("Error fetching usage info:", error);
    }
  };

  const handlePredict = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setShowAllProperties(false);

    try {
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Handle usage limit exceeded
      if (!response.ok && response.status === 429) {
        setError(`Has alcanzado tu límite diario de ${data.usageInfo.limit} consultas. ${
          data.usageInfo.subscriptionType === "FREE"
            ? "Actualiza tu plan para obtener más consultas."
            : "Las consultas se reinician mañana."
        }`);
        return;
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      setResult(data);

      // Update usage info if returned
      if (data.usageInfo) {
        setUsageInfo(prev => prev ? {
          ...prev,
          usage: {
            ...prev.usage,
            used: data.usageInfo.used,
            remaining: data.usageInfo.remaining,
          }
        } : null);

        // Also update usage card data immediately
        setUsageCardData(prev => prev ? {
          ...prev,
          user: {
            ...prev.user,
            monthlyUsage: data.usageInfo.used,
            remainingUsage: data.usageInfo.remaining,
            canMakeRequest: data.usageInfo.remaining > 0,
          }
        } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      handlePredict();
    }
  };


  return (
    <main className="font-[Inter] text-[#4c0e0e] bg-[radial-gradient(1200px_600px_at_70%_-120px,rgba(255,212,59,0.18),transparent_60%)] bg-[#F4F4F6]">
      <div className="max-w-[800px] mx-auto px-5 py-10 lg:py-16">
        {/* Header */}
        <div className="text-center mb-6">
          <h1
            className="font-extrabold uppercase tracking-[1.2px] leading-[1.05]
          text-[28px] md:text-[36px] mb-4"
          >
            Predicción de Precios
          </h1>
          <p className="text-lg text-[#6C6F77] mb-8">
            Describe la propiedad y obtén una estimación de precio al instante
          </p>

          {/* Auth Status */}
          {session ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <div
                className="inline-flex items-center gap-3 px-4 py-2 bg-white/80
              border border-green-200/50 rounded-[10px] backdrop-blur-sm"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium text-sm">
                  Conectado como {session.user?.name}
                </span>
              </div>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-3 px-4 py-2 bg-white/80
            border border-blue-200/50 rounded-[10px] backdrop-blur-sm mb-4"
            >
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

        {/* Usage Card */}
        {session && (
          <div className="mb-6">
            <UsageCard externalUsage={usageCardData} />
          </div>
        )}

        {/* Input Section */}
        <div
          className="w-full rounded-[14px] bg-white border border-black/10
        ring-1 ring-black/5 shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-8 mb-6"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="house-description"
                className="block text-sm font-semibold text-[#4c0e0e] mb-3"
              >
                Descripción de la propiedad
              </label>
              <div className="relative">
                <textarea
                  id="house-description"
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "56px";
                    const maxHeight = 120;
                    const newHeight = Math.min(target.scrollHeight, maxHeight);
                    target.style.height = newHeight + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  placeholder="Ej: Casa de 3 habitaciones, 2 baños, 150m², con jardín en Madrid centro..."
                  rows={1}
                  className="w-full px-4 py-4 text-[#1A1A1A] placeholder-[#6C6F77]
                  border border-black/20 rounded-[10px] bg-white resize-none
                  focus:outline-none focus:ring-2 focus:ring-[#FFD43B] focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  leading-6"
                  style={{
                    minHeight: "56px",
                    maxHeight: "120px",
                    overflowY:
                      prompt && prompt.length > 150 ? "auto" : "hidden",
                  }}
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
              disabled={!prompt.trim() || loading || (!session && true) || (session && usageInfo?.usage.remaining === 0)}
              className="w-full py-4 px-6 bg-[#FFD43B] text-[#4c0e0e] font-bold
              rounded-[10px] transition-all duration-200
              hover:bg-[#FFD43B]/90 hover:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-[#FFD43B] focus:ring-offset-2"
            >
              {loading ? "Analizando..." :
               !session ? "Inicia sesión para predecir" :
               usageInfo?.usage.remaining === 0 ? "Sin consultas disponibles" :
               "Obtener Predicción"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {error && (
          <div
            className="w-full rounded-[14px] bg-white border border-red-200
          ring-1 ring-red-100 shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-6 mb-8"
          >
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
              <div
                className="relative w-full rounded-[20px]
              bg-gradient-to-br from-gray-700 via-gray-900 to-black
              border border-[#FFD43B]/30 shadow-[0_20px_40px_rgba(0,0,0,0.25)] p-10 overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 50%, #0A0A0A 100%)",
                }}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FFD43B]/10 to-transparent rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#FFD43B]/5 to-transparent rounded-full blur-xl"></div>

                <div className="relative text-center">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-[#FFD43B] rounded-full animate-pulse"></div>
                    <h3 className="font-bold uppercase tracking-[1px] text-[#FFD43B] text-sm">
                      Precio Estimado
                    </h3>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-center gap-1 text-white mb-2">
                      <span className="text-4xl md:text-5xl font-black">$</span>
                      <span className="text-6xl md:text-7xl font-black tracking-tight">
                        {result.price.toLocaleString("en-US")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="w-4 h-4 text-[#FFD43B]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-300 text-sm font-medium">
                      Estimación basada en machine learning
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Properties */}
            {result.properties && result.properties.length > 0 && (
              <div
                className="w-full rounded-[16px] bg-white border border-black/10
              ring-1 ring-black/5 shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#FFD43B] to-[#FFD43B]/80 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-[#1A1A1A]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m9-9V7a2 2 0 00-2-2h-2m0 0V3a2 2 0 00-2-2H9a2 2 0 00-2 2v2m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2h-2"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-[#1A1A1A] text-lg">
                    Características Analizadas
                  </h3>
                  <div className="ml-auto px-3 py-1 bg-[#F4F4F6] rounded-full">
                    <span className="text-xs font-semibold text-[#6C6F77]">
                      {result.properties.length} items
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(showAllProperties
                    ? result.properties
                    : result.properties.slice(0, 8)
                  ).map((property, index) => (
                    <div
                      key={index}
                      className="group p-3 bg-gradient-to-br from-[#F8F9FA] to-[#F4F4F6]
                    rounded-lg border border-black/5 hover:border-[#FFD43B]/30 transition-all duration-200
                    hover:shadow-md hover:scale-[1.02]"
                    >
                      <div
                        className="text-xs font-semibold text-[#6C6F77] mb-1 truncate"
                        title={property.name}
                      >
                        {property.name}
                      </div>
                      <div
                        className="text-sm font-bold text-[#1A1A1A] truncate"
                        title={String(property.value)}
                      >
                        {typeof property.value === "number"
                          ? property.value.toLocaleString("en-US")
                          : String(property.value)}
                      </div>
                    </div>
                  ))}
                </div>

                {result.properties.length > 8 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAllProperties(!showAllProperties)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#6C6F77]
                      hover:text-[#1A1A1A] transition-colors rounded-lg hover:bg-[#F4F4F6]"
                    >
                      {showAllProperties ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                          Mostrar menos
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                          Ver {result.properties.length - 8} características más
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-center mt-12">
          <p className="text-[#6C6F77] text-sm">
            Presiona{" "}
            <kbd className="px-2 py-1 bg-white border border-black/20 rounded text-xs font-mono">
              Enter
            </kbd>{" "}
            o haz clic en el botón para obtener tu predicción
          </p>
        </div>
      </div>
    </main>
  );
}
