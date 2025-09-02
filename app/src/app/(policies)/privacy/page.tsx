"use client";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen font-[Inter] text-[#1A1A1A]
      bg-[radial-gradient(1200px_600px_at_70%_-120px,rgba(255,212,59,0.18),transparent_60%)] bg-[#F4F4F6]">



      {/* Contenido principal */}
      <main className="min-h-[calc(100vh-56px)] grid place-items-center px-4 py-8">
        <section className="w-[min(720px,92vw)] bg-white rounded-[14px] shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-7 animate-[pop_.3s_ease-out]">
          <h1 className="text-2xl font-extrabold uppercase tracking-[1px] mb-4">
            Política de Privacidad
          </h1>
          <p className="text-sm text-[#9FA4AD] mb-6">
            Última actualización: 1 de septiembre de 2025
          </p>

          <div className="space-y-5 text-[15px] leading-relaxed">
            <p>
              En <strong>House Price Insights</strong> valoramos tu privacidad. Esta
              política explica cómo recopilamos, usamos y protegemos tu
              información cuando utilizas nuestra aplicación web.
            </p>

            <h2 className="text-lg font-bold mt-4">1. Información que recopilamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Datos de registro: nombre de usuario, correo electrónico y contraseña.</li>
              <li>Datos de uso: información técnica como navegador, dirección IP y páginas visitadas.</li>
              <li>Datos de vivienda: información que introduces para obtener estimaciones.</li>
            </ul>

            <h2 className="text-lg font-bold mt-4">2. Cómo utilizamos la información</h2>
            <p>
              La información recopilada se usa para gestionar tu cuenta, generar
              estimaciones, mejorar el servicio y comunicarnos contigo.
            </p>

            <h2 className="text-lg font-bold mt-4">3. Cómo protegemos tu información</h2>
            <p>
              Usamos medidas razonables de seguridad para proteger tus datos.
              Nunca venderemos ni compartiremos tu información sin tu
              consentimiento, salvo que lo exija la ley.
            </p>

            <h2 className="text-lg font-bold mt-4">4. Derechos de los usuarios</h2>
            <p>
              Puedes acceder, actualizar o eliminar tu información personal y
              contactarnos en cualquier momento para resolver dudas relacionadas
              con tus datos.
            </p>

            <h2 className="text-lg font-bold mt-4">5. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política ocasionalmente. La versión más
              reciente estará siempre disponible en esta página.
            </p>

            <h2 className="text-lg font-bold mt-4">6. Contacto</h2>
            <p>
              Si tienes preguntas, escríbenos a{" "}
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
