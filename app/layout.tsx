import type { Metadata, Viewport } from 'next';
import InstallApp from './install-app';
import './globals.css';
export const metadata:Metadata={title:'Emprestô — seu app de gestão de empréstimos',description:'Organize capital, empréstimos, recebimentos e cobranças.',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'Emprestô',statusBarStyle:'default'},icons:{icon:[{url:'/favicon.svg',type:'image/svg+xml'},{url:'/icon-192.png',sizes:'192x192',type:'image/png'}],apple:'/apple-touch-icon.png'}};
export const viewport:Viewport={themeColor:'#184f3e'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}<InstallApp/></body></html>}
