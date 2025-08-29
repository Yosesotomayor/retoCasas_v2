"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "@/assets/House_Price_Insights_transparent.png"
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  return (
    <div
      style={{ marginTop: "var(--topbar-height)" }}
     className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div>
        <div className="flex items-center justify-center gap-3 mb-2 ">
          <Image
          src={logo}
          alt="House Price Insights"
          className="max-w-[30vw] max-h-[30vh] h-auto w-auto object-contain"
        />
        </div>

        <div>
          <h1 className="text-4xl font-bold">Analiza, predice y entiende hoy el precio de tu vivienda.</h1>
        </div>
        <h1 >Welcome to HousePricing App</h1>

        <p className="mt-2 text-lg">Find your dream home today!</p>
        <Link className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" href="/houses">Houses</Link>


        <Link className="mt-4 px-4 py-2 bg-green-500 text-white rounded" href="/signup">Register</Link>

      </div>
    </div>
  );
}
