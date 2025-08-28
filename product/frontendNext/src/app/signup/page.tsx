"use client";

import { useState } from "react";
import logo from "../../assets/House_Price_Insights_transparent.png";
import Image from "next/image";

// Coloca un archivo en /public/logo.png o ajusta la ruta/extension:

type MsgType = "ok" | "err" | null; // Marcar un mensaje como correcto o error

export default function SignUp() {
  const [user, setUser] = useState(""); // Nombre de usuario
  const [pass, setPass] = useState(""); // Contraseña
  const [pass2, setPass2] = useState(""); // Repetir contraseña
  const [msg, setMsg] = useState<{ 
    type: MsgType;
     text: string }>
     ({ type: null,
    text: ""  });

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!user.trim() || !pass || !pass2) {
      setMsg({ type: "err", text: "Completa todos los campos." });
      return;
    }
    if (pass.length < 8 || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass)) {
      setMsg({
        type: "err",
        text: "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número.",
      });
      return;
    }
    if (pass !== pass2) {
      setMsg({ type: "err", text: "Las contraseñas no coinciden." });
      return;
    }

    setMsg({ type: "ok", text: "¡Todo listo! Puedes continuar." });

    // TODO: aquí dispara tu flujo real de registro (fetch/axios/Bubble/etc.)
    // await api.register({ user, pass });
  };

  return (
    <main
      className="min-h-[calc(100vh-56px)] grid place-items-center px-4 
      bg-[radial-gradient(1200px_600px_at_70%_-100px,rgba(255,212,59,0.20),transparent_60%)]"
    >
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
            <label htmlFor="user" className="block mb-1 text-[13px] text-[#4c4f56]">
              Usuario
            </label>
            <input
              id="user"
              type="text"
              placeholder="Tu nombre de usuario"
              autoComplete="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full px-3.5 py-3 rounded-[10px] border border-[#ddd] bg-[#F9F9F9] text-[15px]
                focus:outline-none focus:border-[#FFD43B]
                focus:shadow-[0_0_0_3px_rgba(255,212,59,0.35)] focus:bg-white transition"
            />
          </div>

          <div className="my-2">
            <label htmlFor="pass" className="block mb-1 text-[13px] text-[#4c4f56]">
              Contraseña
            </label>
            <input
              id="pass"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full px-3.5 py-3 rounded-[10px] border border-[#ddd] bg-[#F9F9F9] text-[15px]
                focus:outline-none focus:border-[#FFD43B]
                focus:shadow-[0_0_0_3px_rgba(255,212,59,0.35)] focus:bg-white transition"
            />
            <div className="mt-1 text-[12px] text-[#9FA4AD]">
              Usa al menos 8 caracteres, una mayúscula y un número.
            </div>
          </div>

          <div className="my-2">
            <label htmlFor="pass2" className="block mb-1 text-[13px] text-[#4c4f56]">
              Confirma contraseña
            </label>
            <input
              id="pass2"
              type="password"
              placeholder="Repítela"
              autoComplete="new-password"
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
              className="w-full px-3.5 py-3 rounded-[10px] border border-[#ddd] bg-[#F9F9F9] text-[15px]
                focus:outline-none focus:border-[#FFD43B]
                focus:shadow-[0_0_0_3px_rgba(255,212,59,0.35)] focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 px-4 py-3 rounded-[10px] font-extrabold uppercase tracking-[0.7px]
              bg-[#FFD43B] text-[#1A1A1A] hover:bg-[#E6BD2F] active:translate-y-[1px] transition"
          >
            Registro
          </button>
        </form>

        {/* Links */}
        <div className="mt-4 text-[14px] text-[#555] text-center">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-[#2C3E50] hover:text-[#FFD43B] underline-offset-2 hover:underline">
            Inicia sesión
          </a>{" "}
          ·{" "}
          <a href="/recuperar" className="text-[#2C3E50] hover:text-[#FFD43B] underline-offset-2 hover:underline">
            Olvidé mi contraseña
          </a>
        </div>

        {/* Legal */}
        <div className="mt-3 text-[12px] text-[#9FA4AD] text-center">
          Al registrarte aceptas nuestros{" "}
          <a href="/terminos" className="underline">Términos</a> y{" "}
          <a href="/privacidad" className="underline">Privacidad</a>.
        </div>
      </section>
    </main>
  );
}
