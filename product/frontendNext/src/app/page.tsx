"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div>
        <h1 className="text-4xl font-bold">Welcome to HousePricing App</h1>
        <p className="mt-2 text-lg">Find your dream home today!</p>

        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => {
            
            router.push("/houses");
          }}
        >
          View Houses
        </button>

      </div>
    </div>
  );
}
