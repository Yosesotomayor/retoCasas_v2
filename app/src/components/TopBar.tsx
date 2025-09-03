"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const HOME_ICON = "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 fill=%22black%22 viewBox=%220 0 24 24%22><path d=%22M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3z%22/></svg>') center / 20px no-repeat";

export default function Topbar() {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="h-14 bg-gray-800 text-white flex items-center justify-between px-5 shadow-md">
      <Link href="/" passHref>
        <span className="flex items-center gap-2">
          <button
            className="w-7 h-7 rounded-lg bg-white hover:bg-gray-100 transition-colors cursor-pointer"
            style={{
              WebkitMask: HOME_ICON,
              mask: HOME_ICON,
            }}
            aria-label="Ir al inicio"
          />
          <span className="font-semibold">Inicio</span>
        </span>
      </Link>
      
      {session && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">
            Hola, {session.user?.name}
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 
            text-white text-sm rounded-lg transition-colors"
            aria-label="Cerrar sesión"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Salir
          </button>
        </div>
      )}
    </header>
  );
}
