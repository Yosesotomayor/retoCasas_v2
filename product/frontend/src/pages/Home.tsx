/**
 * Componente: Home.tsx
 * Descripción: Vista principal de la página de registro de usuario de PriceHousing
 * 
 * El componente realiza:
 * registro del usuario en el sistema
 * gestión de sesiones y autenticación
 * manejo de errores y mensajes al usuario
 * redirección a la página de inicio después del registro
 * redirección a la página de cambio de contraseña
 * redirección a la página de inicio de sesión
 * @returns {JSX.Element} Interfaz visual de bienvenida con navegación y multimedia.
 * 
 * Authors: Ivan Alexander Ramos Ramirez
 * Contribuyentes: *
 */


import logo from "../assets/House_Price_Insights_transparent.png"
import Topbar from "../components/topbar";

export default function Home() {


  return (
    <div className="min-h-screen bg-[#F4F4F6] text-[#1A1A1A] font-[Inter]">

      <Topbar />


    </div>
  );
}
