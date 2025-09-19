"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

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

const SUBSCRIPTION_PLANS = {
  FREE: {
    name: "Free",
    price: "$0",
    queries: 3,
    description: "Ideal para probar el servicio",
    features: [],
    priceId: null,
  },
  BASIC: {
    name: "Basic",
    price: "$9.99",
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    queries: 20,
    description: "Perfecto para uso regular",
    features: ["20 consultas diarias", "Predicciones avanzadas"],
  },
  PREMIUM: {
    name: "Premium",
    price: "$19.99",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    queries: 50,
    description: "Para usuarios avanzados",
    features: ["50 consultas diarias", "Predicciones avanzadas"],
  },
};

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

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
      }
    } catch (error) {
      console.error("Error fetching usage info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (priceId: string, subscriptionType: string) => {
    console.log("Starting upgrade process:", { priceId, subscriptionType });
    setUpgrading(true);
    try {
      console.log("Sending request to create-checkout endpoint");
      const response = await fetch("/api/subscriptions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId, subscriptionType }),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const { url } = await response.json();
        console.log("Checkout URL received, redirecting to:", url);
        window.location.href = url;
      } else {
        const error = await response.json();
        console.error("Upgrade error response:", error);
        alert("Error al procesar la suscripción. Por favor, inténtalo de nuevo.");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Error al procesar la suscripción. Por favor, inténtalo de nuevo.");
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch("/api/subscriptions/portal", {
        method: "POST",
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        alert("Error al acceder al portal de suscripciones.");
      }
    } catch (error) {
      console.error("Portal error:", error);
      alert("Error al acceder al portal de suscripciones.");
    }
  };

  if (!session) {
    return (
      <main className="bg-gray-50">
        <div className="max-w-md mx-auto px-4 pt-20">
          <div className="text-center space-y-6">
            <div className="w-12 h-12 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Suscripciones</h1>
            <p className="text-gray-600 text-sm">Inicia sesión para gestionar tu plan</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 px-4 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="bg-gray-50">
        <div className="max-w-md mx-auto px-4 pt-20">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 mx-auto border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
            <p className="text-gray-600 text-sm">Cargando...</p>
          </div>
        </div>
      </main>
    );
  }

  const currentPlan = SUBSCRIPTION_PLANS[usageInfo?.subscription.type || "FREE"];
  const usagePercentage = usageInfo ? (usageInfo.usage.used / usageInfo.usage.limit) * 100 : 0;

  return (
    <main className="bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="pt-8 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Suscripciones</h1>
              <p className="text-sm text-gray-600 mt-1">Gestiona tu plan y uso</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                usageInfo?.subscription.type === "FREE"
                  ? "bg-gray-100 text-gray-700"
                  : usageInfo?.subscription.type === "BASIC"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}>
                {currentPlan.name}
              </span>
            </div>
          </div>
        </div>

        {/* Current Plan & Usage */}
        <div className="py-8 space-y-6">
          {/* Current Plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Plan Actual</h2>
                <p className="text-sm text-gray-600">{currentPlan.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {currentPlan.price}
                  <span className="text-sm font-normal text-gray-500 pl-0.5">/mes</span>
                </div>
              </div>
            </div>

            {/* Usage Progress */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Uso diario</span>
                <span className="font-medium text-gray-900">
                  {usageInfo?.usage.used || 0} de {usageInfo?.usage.limit || 0}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    usagePercentage >= 90
                      ? "bg-red-500"
                      : usagePercentage >= 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {currentPlan.features.slice(0, 4).map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {usageInfo?.subscription.type !== "FREE" && (
                <button
                  onClick={handleManageSubscription}
                  className="flex-1 py-2 px-4 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Gestionar Suscripción
                </button>
              )}
              <Link
                href="/prediction"
                className="flex-1 py-2 px-4 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors text-center"
              >
                Ir a Predicciones
              </Link>
            </div>
          </div>

          {/* Available Plans - Only show if FREE */}
          {usageInfo?.subscription.type === "FREE" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Planes Disponibles</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(SUBSCRIPTION_PLANS)
                  .filter(([key]) => key !== "FREE")
                  .map(([key, plan]) => (
                  <div
                    key={key}
                    className={`bg-white rounded-xl border-2 p-6 relative ${
                      key === "PREMIUM" ? "border-black" : "border-gray-200"
                    }`}
                  >
                    {key === "PREMIUM" && (
                      <div className="absolute -top-2 left-4">
                        <span className="bg-black text-white px-2 py-1 text-xs font-medium rounded">
                          Recomendado
                        </span>
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-sm text-gray-500">/mes</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => plan.priceId && handleUpgrade(plan.priceId, key)}
                      disabled={upgrading || !plan.priceId}
                      className={`w-full py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
                        key === "PREMIUM"
                          ? "bg-black text-white hover:bg-gray-800"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      } ${upgrading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {upgrading ? "Procesando..." : `Actualizar a ${plan.name}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}