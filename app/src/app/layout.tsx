import "./globals.css";
import Topbar from "@/components/Topbar";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <Topbar />
        {children}
      </body>
    </html>
  );
}
