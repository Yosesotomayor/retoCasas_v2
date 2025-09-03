"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/House_Price_Insights_transparent.png"

type MsgType = "ok" | "err" | null;

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<{ 
    type: MsgType;
     text: string }>
     ({ type: null,
    text: ""  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setMsg({ type: "err", text: "Completa todos los campos." });
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setMsg({
        type: "err",
        text: "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número.",
      });
      return;
    }
    if (password !== confirmPassword) {
      setMsg({ type: "err", text: "Las contraseñas no coinciden." });
      return;
    }

    setLoading(true);
    setMsg({ type: null, text: "" });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMsg({ type: "err", text: data.error || "Error al registrarse" });
        return;
      }

      setMsg({ type: "ok", text: "¡Registro exitoso! Iniciando sesión..." });
      
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setMsg({ type: "err", text: "Error al iniciar sesión automáticamente" });
      } else {
        router.push("/home");
      }
    } catch {
      setMsg({ type: "err", text: "Error de conexión." });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/home" });
    } catch {
      setMsg({ type: "err", text: "Error con Google." });
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-[calc(100vh-56px)] grid place-items-center px-4 
      bg-[radial-gradient(1200px_600px_at_70%_-100px,rgba(255,212,59,0.20),transparent_60%)]">
      <section className="w-[min(420px,92vw)] bg-white rounded-[14px] shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-7 text-center animate-[pop_.3s_ease-out]">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <Image src={logo} alt="House Price Insights" width={48} height={48} />
        </div>
        <p className="mt-0 mb-4 text-[13px] text-[#9FA4AD]">
          Descubre el valor real de tu vivienda
        </p>

        {/* Mensajes */}
        {msg.type && (
          <div
            className={`mt-2 mb-2 px-3 py-2 rounded-lg text-[13px] border ${
              msg.type === "ok"
                ? "bg-[rgba(39,174,96,0.10)] text-[#177a43] border-[rgba(39,174,96,0.25)]"
                : "bg-[rgba(231,76,60,0.10)] text-[#9c2b1f] border-[rgba(231,76,60,0.25)]"
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Formulario */}
        <form className="text-left" onSubmit={onSubmit}>
          <div className="my-2">
            <label htmlFor="name" className="block mb-1 text-[13px] text-[#4c4f56]">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              placeholder="Tu nombre completo"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-3 rounded-[10px] border border-[#ddd] bg-[#F9F9F9] text-[15px]
                focus:outline-none focus:border-[#FFD43B]
                focus:shadow-[0_0_0_3px_rgba(255,212,59,0.35)] focus:bg-white transition disabled:opacity-50"
            />
          </div>

          <div className="my-2">
            <label htmlFor="email" className="block mb-1 text-[13px] text-[#4c4f56]">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-3 rounded-[10px] border border-[#ddd] bg-[#F9F9F9] text-[15px]
                focus:outline-none focus:border-[#FFD43B]
                focus:shadow-[0_0_0_3px_rgba(255,212,59,0.35)] focus:bg-white transition disabled:opacity-50"
            />
          </div>

          <div className="my-2">
            <label htmlFor="password" className="block mb-1 text-[13px] text-[#4c4f56]">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-3 rounded-[10px] border border-[#ddd] bg-[#F9F9F9] text-[15px]
                focus:outline-none focus:border-[#FFD43B]
                focus:shadow-[0_0_0_3px_rgba(255,212,59,0.35)] focus:bg-white transition disabled:opacity-50"
            />
            <div className="mt-1 text-[12px] text-[#9FA4AD]">
              Usa al menos 8 caracteres, una mayúscula y un número.
            </div>
          </div>

          <div className="my-2">
            <label htmlFor="confirmPassword" className="block mb-1 text-[13px] text-[#4c4f56]">
              Confirma contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repítela"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-3 rounded-[10px] border border-[#ddd] bg-[#F9F9F9] text-[15px]
                focus:outline-none focus:border-[#FFD43B]
                focus:shadow-[0_0_0_3px_rgba(255,212,59,0.35)] focus:bg-white transition disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 px-4 py-3 rounded-[10px] font-extrabold uppercase tracking-[0.7px]
              bg-[#FFD43B] text-[#1A1A1A] hover:bg-[#E6BD2F] active:translate-y-[1px] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registrando..." : "Registro"}
          </button>
        </form>

        {/* Separador */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="px-3 text-sm text-gray-500">o</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full px-4 py-3 rounded-[10px] border border-[#ddd] bg-white hover:bg-gray-50 
            flex items-center justify-center gap-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Conectando..." : "Continuar con Google"}
        </button>

        {/* Links */}
        <div className="mt-4 text-[14px] text-[#555] text-center">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-[#2C3E50] hover:text-[#FFD43B] underline-offset-2 hover:underline">
            Inicia sesión
          </a>
        </div>

        {/* Legal */}
        <div className="mt-3 text-[12px] text-[#9FA4AD] text-center">
          Al registrarte aceptas nuestros{" "}
          <a href="/terms" className="underline">Términos</a> y{" "}
          <a href="/privacy" className="underline">Privacidad</a>.
        </div>
      </section>
    </main>
  );
}
