import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Emprestô — seu app de gestão de empréstimos',description:'Organize capital, empréstimos, recebimentos e cobranças.',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'Carteira Prime',statusBarStyle:'default'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
