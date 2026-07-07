import type { Metadata, Viewport } from "next";
import "./globals.css";
import {PwaRegister} from "@/components/pwa-register";
import {Suspense} from "react";
import {ThemeRegister} from "@/components/theme-register";

export const metadata: Metadata = {metadataBase:new URL(process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000"),title:{default:"KAZUAKI LIFE HUB",template:"%s | LIFE HUB"},description:"Business / Travel / Points / Camera Dashboard",applicationName:"KAZUAKI LIFE HUB",manifest:"/manifest.webmanifest",appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"LIFE HUB"},icons:{icon:[{url:"/icon-192.png",sizes:"192x192",type:"image/png"},{url:"/icon-512.png",sizes:"512x512",type:"image/png"}],apple:[{url:"/apple-touch-icon.png",sizes:"180x180",type:"image/png"}]}};
export const viewport: Viewport={themeColor:"#0d1b31",width:"device-width",initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ja"><body><Suspense fallback={<main className="state-page">読み込み中です…</main>}>{children}</Suspense><ThemeRegister/><PwaRegister/></body></html>}
