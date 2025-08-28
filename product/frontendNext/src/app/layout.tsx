import "./globals.css"     // <-- IMPORTA TU CSS GLOBAL AQUÍ
import React from "react";

export const metadata = {
  title: "My App",
  description: "This is my app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}