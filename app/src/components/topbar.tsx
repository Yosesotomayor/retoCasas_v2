"use client";

import { useRouter } from "next/navigation";

const HOME_ICON = "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 fill=%22black%22 viewBox=%220 0 24 24%22><path d=%22M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3z%22/></svg>') center / 20px no-repeat";

export default function Topbar() {
  const router = useRouter();

  const handleHomeClick = () => {
    router.push("/");
  };

  return (
    <header className="h-14 bg-gray-800 text-white flex items-center gap-3 px-5 shadow-md">
      <button
        onClick={handleHomeClick}
        className="w-7 h-7 rounded-lg bg-white hover:bg-gray-100 transition-colors cursor-pointer"
        style={{
          WebkitMask: HOME_ICON,
          mask: HOME_ICON,
        }}
        aria-label="Ir al inicio"
      />
      <span className="font-semibold">Inicio</span>
    </header>
  );
}