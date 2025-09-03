import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

async function fetchMLService() {
  const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(ML_SERVICE_URL, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`ML Service error! status: ${response.status}`);
    }
    
    const data = await response.text();
    return { success: true, data, error: null, serviceUrl: ML_SERVICE_URL };
  } catch (error) {
    return { 
      success: false, 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error',
      serviceUrl: ML_SERVICE_URL
    };
  }
}

export default async function Prediction() {
  const session = await getServerSession(authOptions);
  const result = await fetchMLService();

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
          
          {result.success ? (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Respuesta del modelo ML ({result.serviceUrl}):</h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-800 overflow-auto max-h-96">
                {result.data}
              </pre>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">
                ❌ Error al obtener datos: {result.error}
              </p>
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
