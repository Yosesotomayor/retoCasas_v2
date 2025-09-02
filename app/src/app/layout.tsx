import "./globals.css";
import Topbar from "@/components/TopBar";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" className="bg-gray-800">
      <body className="min-h-screen grid grid-rows-[auto_1fr]">
        <Topbar />
        {children}
      </body>
    </html>
  );
}
