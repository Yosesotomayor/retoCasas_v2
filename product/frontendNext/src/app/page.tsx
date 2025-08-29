"use client";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/House_Price_Insights_transparent.png";

export default function Home() {
  return (
    <div className="min-h-screen font-[Inter] text-[#1A1A1A]
      bg-[radial-gradient(1200px_600px_at_70%_-120px,rgba(255,212,59,0.18),transparent_60%)] bg-[#F4F4F6]">



      {/* HERO simple y limpio */}
      <main className="max-w-[1200px] mx-auto px-5 py-10 lg:py-16">
        {/* Logo */}
        <div className="mb-10">
          <Image
            src={logo}
            alt="House Price Insights"
            priority  
            className="w-[220px] md:w-[280px] h-auto"
          />
        </div>

        {/* Título + CTA en “card” para que matchee con Register */}
        <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <h1 className="font-extrabold uppercase tracking-[1.2px] leading-[1.05]
              text-[34px] md:text-[44px] max-w-[22ch]">
            Analiza, predice y entiende hoy el precio de tu vivienda.
          </h1>

          <div className="w-full md:w-auto">
            <div className="rounded-[14px] border border-black/10 bg-white shadow-[0_10px_26px_rgba(0,0,0,0.10)]
                p-4 md:p-5 flex items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-[10px] font-extrabold uppercase tracking-[0.7px]
                  px-5 py-3 bg-[#FFD43B] text-[#1A1A1A] hover:bg-[#E6BD2F] transition"
              >
                Regístrate
              </Link>
              <Link
                href="/houses"
                className="inline-flex items-center justify-center rounded-[10px] font-extrabold uppercase tracking-[0.7px]
                  px-5 py-3 border-2 border-black/15 text-[#1A1A1A] hover:border-black/35 transition"
              >
                Explorar casas
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-6 text-sm text-[#9FA4AD]">
          Estimaciones rápidas con modelos de machine learning y variables clave.
        </p>
      </main>
    </div>
  );
}
