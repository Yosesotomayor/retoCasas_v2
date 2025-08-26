import React, { useState } from "react";
import logo from "../assets/House_Price_Insights_transparent.png"
type MsgType = "ok" | "err" | null;

export default function Home() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [msg, setMsg] = useState<{ type: MsgType; text: string }>({
    type: null,
    text: "",
  });

  const onSubmit = () => { // handle form submission
    if (!user.trim() || !pass || !pass2) { // Check for empty fields
      return setMsg({ type: "err", text: "Completa todos los campos." });
    }
    if (pass.length < 8 || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass)) {
      return setMsg({
        type: "err",
        text: "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número.",
      });
    }
    if (pass !== pass2) {
      return setMsg({ type: "err", text: "Las contraseñas no coinciden." });
    }
    setMsg({ type: "ok", text: "¡Todo listo! Puedes continuar." });

    // TODO: dispara aquí tu flujo real de registro (fetch/axios/Bubble/etc.)
    // await api.register({ user, pass });
  };

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-[#1A1A1A] font-[Inter]">
      {/* Topbar */}
      <div className="h-14 bg-[#2b2b2b] text-white flex items-center gap-3 px-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <div
          aria-hidden="true"
          className="w-7 h-7 rounded-[7px] bg-white"
          style={{
            WebkitMask:
              "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 fill=%22black%22 viewBox=%220 0 24 24%22><path d=%22M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3z%22/></svg>') center / 20px no-repeat",
            mask:
              "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 fill=%22black%22 viewBox=%220 0 24 24%22><path d=%22M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3z%22/></svg>') center / 20px no-repeat",
          }}
        />
        <span className="font-semibold">Inicio</span>
      </div>

      {/* Main */}
      <main className="min-h-[calc(100vh-56px)] grid place-items-center px-4 
        bg-[radial-gradient(1200px_600px_at_70%_-100px,rgba(255,212,59,0.20),transparent_60%)]">
        <section className="w-[min(420px,92vw)] bg-white rounded-[14px] shadow-[0_10px_26px_rgba(0,0,0,0.10)] p-7 text-center animate-[pop_.3s_ease-out]">
          {/* Brand */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <img 
              src={logo}
              alt="House Price Insights logo"
              className="w-40 h-auto"
            />

          </div>
          <p className="mt-0 mb-4 text-[13px] text-[#9FA4AD]">
            Descubre el valor real de tu vivienda
          </p>

          {/* Messages */}
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

          {/* Form */}
          <div className="text-left">
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
          </div>

          <button
            onClick={onSubmit}
            className="w-full mt-2 px-4 py-3 rounded-[10px] font-extrabold uppercase tracking-[0.7px]
              bg-[#FFD43B] text-[#1A1A1A] hover:bg-[#E6BD2F] active:translate-y-[1px] transition"
          >
            Registro
          </button>

          {/* Links */}
          <div className="mt-4 text-[14px] text-[#555]">
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
          <div className="mt-3 text-[12px] text-[#9FA4AD]">
            Al registrarte aceptas nuestros{" "}
            <a href="/terminos" className="underline">Términos</a> y{" "}
            <a href="/privacidad" className="underline">Privacidad</a>.
          </div>
        </section>
      </main>
    </div>
  );
}
