import { Inter, Manrope, Open_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./providers/ThemeProvider";
import { I18nProvider } from "./providers/I18nProvider";
import PublicPageAdminGuard from "./components/atoms/PublicPageAdminGuard";
import NetworkStatusBanner from "./components/atoms/NetworkStatusBanner";
import { AuthProvider } from "./providers/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" });

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${openSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-inter antialiased">
        <I18nProvider>
          <AuthProvider>
            <ThemeProvider>
              <PublicPageAdminGuard>
                <main className="flex-grow">{children}</main>
              </PublicPageAdminGuard>
              <NetworkStatusBanner />
            </ThemeProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
