'use client';
import {useEffect,useState} from 'react';
import {Download,X} from 'lucide-react';
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
const DISMISS_KEY='empresto_install_dismissed',DISMISS_DAYS=7;
// Registers the service worker and, on Android/Chrome, offers to install Emprestô as an app.
export default function InstallApp(){
 const [event,setEvent]=useState<InstallEvent|null>(null);
 useEffect(()=>{
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
  let dismissed=0;try{dismissed=Number(localStorage.getItem(DISMISS_KEY))||0}catch{}
  if(Date.now()-dismissed<DISMISS_DAYS*864e5)return;
  const onPrompt=(e:Event)=>{e.preventDefault();setEvent(e as InstallEvent)};
  const onInstalled=()=>setEvent(null);
  window.addEventListener('beforeinstallprompt',onPrompt);window.addEventListener('appinstalled',onInstalled);
  return ()=>{window.removeEventListener('beforeinstallprompt',onPrompt);window.removeEventListener('appinstalled',onInstalled)};
 },[]);
 if(!event)return null;
 const close=()=>{try{localStorage.setItem(DISMISS_KEY,String(Date.now()))}catch{}setEvent(null)};
 const install=async()=>{await event.prompt();const {outcome}=await event.userChoice;if(outcome==='dismissed')close();else setEvent(null)};
 return <div className="install-bar" role="dialog" aria-label="Instalar o Emprestô">
  <img src="/icon-192.png" alt="" width={40} height={40}/>
  <div><strong>Instale o Emprestô</strong><small>Abra direto da tela do celular, como um app.</small></div>
  <button type="button" className="install-go" onClick={install}><Download size={16}/>Instalar</button>
  <button type="button" className="install-x" onClick={close} aria-label="Agora não"><X size={18}/></button>
 </div>;
}
