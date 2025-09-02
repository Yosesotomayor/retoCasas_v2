"use client";
import Link from "next/link";

export default function Terms() {
  return (
    <div className="min-h-screen font-[Inter] text-[#1A1A1A]
      bg-[radial-gradient(1200px_600px_at_70%_-120px,rgba(255,212,59,0.18),transparent_60%)] bg-[#F4F4F6]">

      {/* Contenido principal */}
      <main className="min-h-[calc(100vh-56px)] grid place-items-center px-4 py-8">
        <section className="w-[min(720px,92vw)] bg-white rounded-[14px] shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-7 animate-[pop_.3s_ease-out]">
          <h1 className="text-2xl font-extrabold uppercase tracking-[1px] mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-sm text-[#9FA4AD] mb-6">
            Última actualización: 1 de septiembre de 2025
          </p>

          <div className="space-y-5 text-[15px] leading-relaxed">
            <p>
              Bienvenido a <strong>House Price Insights</strong>. Estos Términos y
              Condiciones regulan el uso de nuestra aplicación web. Al registrarte
              o utilizar nuestros servicios, aceptas cumplir con estas condiciones.
            </p>

            <h2 className="text-lg font-bold mt-4">1. Uso permitido</h2>
            <p>
              La aplicación se proporciona únicamente con fines informativos y educativos. 
              No garantizamos que las estimaciones de precios representen el valor real o final de una propiedad.
            </p>

            <h2 className="text-lg font-bold mt-4">2. Registro de usuario</h2>
            <p>
              Para acceder a ciertas funciones deberás crear una cuenta. 
              Eres responsable de mantener la confidencialidad de tus credenciales y de todas las actividades que se realicen con tu cuenta.
            </p>

            <h2 className="text-lg font-bold mt-4">3. Limitación de responsabilidad</h2>
            <p>
              No nos hacemos responsables de decisiones de compra, venta o inversión
              basadas en los resultados de la aplicación. El uso de la información
              es bajo tu propio riesgo.
            </p>

            <h2 className="text-lg font-bold mt-4">4. Modificaciones</h2>
            <p>
              Nos reservamos el derecho a modificar estos Términos en cualquier momento.
              La versión más reciente estará disponible en esta página.
            </p>

            <h2 className="text-lg font-bold mt-4">5. Contacto</h2>
            <p>
              Si tienes dudas sobre estos Términos, puedes escribirnos a{" "}
              <a href="mailto:contacto@housepriceinsights.com" className="underline text-[#2C3E50] hover:text-[#FFD43B]">
                contacto@housepriceinsights.com
              </a>.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[10px] font-extrabold uppercase tracking-[0.7px]
                px-5 py-3 bg-[#FFD43B] text-[#1A1A1A] hover:bg-[#E6BD2F] transition"
            >
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
