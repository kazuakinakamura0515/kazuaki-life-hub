import type { Metadata, Viewport } from "next";
import "./globals.css";
import {PwaRegister} from "@/components/pwa-register";
import {Suspense} from "react";
import {ThemeRegister} from "@/components/theme-register";

export const metadata: Metadata = {title:{default:"KAZUAKI LIFE HUB",template:"%s | LIFE HUB"},description:"Business / Travel / Points / Camera Dashboard",manifest:"/manifest.webmanifest",appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"LIFE HUB"},icons:{apple:"/icon.svg"}};
export const viewport: Viewport={themeColor:"#0d1b31",width:"device-width",initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ja"><body><Suspense fallback={<main className="state-page">読み込み中です…</main>}>{children}</Suspense><ThemeRegister/><PwaRegister/></body></html>}
