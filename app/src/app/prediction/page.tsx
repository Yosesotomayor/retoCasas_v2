"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Prediction() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FFD43B] mx-auto"></div>
            <p className="mt-4 text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Predicción del Precio de Vivienda</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 font-medium">
            ✅ Bienvenido, {session.user?.name}! Tienes acceso a la predicción de precios.
          </p>
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
