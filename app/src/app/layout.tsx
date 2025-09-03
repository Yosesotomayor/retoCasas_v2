import "./globals.css";
import Topbar from "@/components/TopBar";
import Providers from "@/components/Providers";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" className="bg-gray-800">
      <body className="min-h-screen grid grid-rows-[auto_1fr]">
        <Providers>
          <Topbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
