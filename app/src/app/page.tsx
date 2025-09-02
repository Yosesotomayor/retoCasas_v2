"use client";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/House_Price_Insights_transparent.png";

export default function Home() {
  return (
    <div
      className="min-h-screen font-[Inter] text-[#1A1A1A]
      bg-[radial-gradient(1200px_600px_at_70%_-120px,rgba(255,212,59,0.18),transparent_60%)] bg-[#F4F4F6]"
      // style={{ paddingBottom: "calc(1rem - var(--topbar-height, 56px))" }}
    >
      {/* HERO simple y limpio */}
      <main className="max-w-[1200px] mx-auto px-5 py-10 lg:py-16">
        {/* Logo */}
        <div className="mb-10">
          <Image
            src={logo}
            alt="House Price Insights"
            priority  
            className="w-[340px] md:w-[420px] h-auto"
          />
        </div>

    <section className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-start">
      {/* Título */}
      <h1 className="font-extrabold uppercase tracking-[1.2px] leading-[1.05]
          text-[34px] md:text-[44px] max-w-[22ch]">
        Analiza, predice y entiende hoy el precio de tu vivienda.
      </h1>

      {/* CTA Card derecha */}
      <div className="w-full md:max-w-sm rounded-[14px] bg-white border border-black/10
          ring-1 ring-black/5 shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-5
          transition hover:shadow-[0_16px_32px_rgba(0,0,0,0.12)]">
        <span className="inline-block text-[11px] font-bold uppercase tracking-wide
            px-2 py-1 rounded-full bg-[rgba(255,212,59,0.25)] text-[#7a6a10]">
          Comienza gratis
        </span>

        <p className="mt-3 text-sm text-[#6C6F77]">
          Crea tu cuenta o entra para guardar estimaciones y compararlas.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-[10px]
              font-extrabold uppercase tracking-[0.7px] px-5 py-3
              bg-[#FFD43B] text-[#1A1A1A] hover:bg-[#E6BD2F] active:translate-y-[1px] transition"
          >
            Regístrate
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-[10px]
              font-extrabold uppercase tracking-[0.7px] px-5 py-3
              bg-[#000000] text-[#FFD43B] hover:bg-[#E6BD2F] active:translate-y-[1px] transition"
          >
            Inicia sesión
          </Link>
        </div>
        <Link
          href="/predictHouse"
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-[10px]
            font-semibold px-5 py-3 text-[#1A1A1A] border border-black/20
            hover:border-black/40 bg-white/60 backdrop-blur-[2px] transition"
        >
          Predice el precio de tu vivienda <span aria-hidden>→</span>
        </Link>

      </div>
    </section>


        <p className="mt-6 text-lg text-[#6C6F77]">
          Estimaciones rápidas con modelos de machine learning y variables clave.
        </p>
      </main>
    </div>
  );
}
