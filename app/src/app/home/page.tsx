"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/DreamlandLogo_transparent.png";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center
      bg-[radial-gradient(1200px_600px_at_70%_-120px,rgba(255,212,59,0.18),transparent_60%)] bg-[#F4F4F6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD43B] mx-auto"></div>
          <p className="mt-4 text-[#4c0e0e]">Cargando...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="font-[Inter] text-[#4c0e0e]
    bg-[radial-gradient(1200px_600px_at_70%_-120px,rgba(255,212,59,0.18),transparent_60%)] bg-[#F4F4F6]">
      <div className="max-w-[1200px] mx-auto px-5 py-10 lg:py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <Image
            src={logo}
            alt="House Price Insights"
            priority
            className="w-[200px] md:w-[240px] h-auto mx-auto mb-6"
          />
          <h1 className="font-extrabold uppercase tracking-[1.2px] leading-[1.05]
          text-[28px] md:text-[36px] mb-3 text-[#4c0e0e]">
            Bienvenido, {session.user?.name}
          </h1>
          <p className="text-lg text-[#6C6F77]">
            Explora todas las herramientas disponibles para analizar propiedades
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link
            href="/prediction"
            className="group w-full rounded-[14px] bg-white border border-black/10
            ring-1 ring-black/5 shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-8
            transition hover:shadow-[0_16px_32px_rgba(0,0,0,0.12)] hover:scale-[1.02]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-[#FFD43B] rounded-[10px] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#4c0e0e]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold uppercase tracking-[0.7px] text-[18px] text-[#4c0e0e] mb-1">
                  Predicción de Precios
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-wide
                px-2 py-1 rounded-full bg-[rgba(255,212,59,0.25)] text-[#7a6a10]">
                  Machine Learning
                </span>
              </div>
            </div>
            <p className="text-[#6C6F77] leading-relaxed">
              Descubre el valor de mercado de cualquier propiedad usando nuestros modelos avanzados de machine learning con alta precisión.
            </p>
            <div className="flex items-center gap-2 mt-6 text-[#1A1A1A] font-semibold
            group-hover:gap-3 transition-all">
              Comenzar análisis
              <span aria-hidden className="text-[#FFD43B]">→</span>
            </div>
          </Link>

          <Link
            href="/houses"
            className="group w-full rounded-[14px] bg-white border border-black/10
            ring-1 ring-black/5 shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-8
            transition hover:shadow-[0_16px_32px_rgba(0,0,0,0.12)] hover:scale-[1.02]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-[#1A1A1A] rounded-[10px] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#FFD43B]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                  <path d="M6 8a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold uppercase tracking-[0.7px] text-[18px] text-[#4c0e0e] mb-1">
                  Explorar Propiedades
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-wide
                px-2 py-1 rounded-full bg-[rgba(26,26,26,0.1)] text-[#4c0e0e]">
                  Base de Datos
                </span>
              </div>
            </div>
            <p className="text-[#6C6F77] leading-relaxed">
              Navega por nuestra amplia base de datos de propiedades con información detallada, fotos y análisis de mercado.
            </p>
            <div className="flex items-center gap-2 mt-6 text-[#4c0e0e] font-semibold
            group-hover:gap-3 transition-all">
              Ver propiedades
              <span aria-hidden className="text-[#FFD43B]">→</span>
            </div>
          </Link>

          <Link
            href="/subscription"
            className="group w-full rounded-[14px] bg-white border border-black/10
            ring-1 ring-black/5 shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-8
            transition hover:shadow-[0_16px_32px_rgba(0,0,0,0.12)] hover:scale-[1.02]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-[10px] flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold uppercase tracking-[0.7px] text-[18px] text-[#4c0e0e] mb-1">
                  Mi Suscripción
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-wide
                px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700">
                  {(session.user as any)?.subscription?.type || 'FREE'}
                </span>
              </div>
            </div>
            <p className="text-[#6C6F77] leading-relaxed">
              Gestiona tu plan, revisa tu uso de consultas y actualiza tu método de pago desde el portal de suscripciones.
            </p>
            <div className="flex items-center gap-2 mt-6 text-[#4c0e0e] font-semibold
            group-hover:gap-3 transition-all">
              Gestionar plan
              <span aria-hidden className="text-purple-500">→</span>
            </div>
          </Link>
        </div>

      </div>
    </main>
  );
}