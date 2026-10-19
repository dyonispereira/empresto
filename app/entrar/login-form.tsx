'use client';
import React,{useState} from 'react';
import {Wallet,Plane,Smartphone,Coins,Banknote,Gem,Crown,TrendingUp,Car,Watch,Diamond} from 'lucide-react';
// Floating luxury icons behind the login card: [Icon, left %, size px, duration s, delay s].
const FLOATERS:[typeof Plane,number,number,number,number][]=[[Coins,6,38,19,0],[Plane,18,46,24,-6],[Banknote,30,42,21,-12],[Smartphone,44,34,18,-3],[Gem,57,36,22,-15],[Crown,70,40,20,-8],[TrendingUp,82,44,23,-2],[Car,93,40,25,-14],[Watch,12,30,17,-10],[Diamond,38,28,20,-17],[Coins,64,30,16,-5],[Banknote,88,34,19,-11],[Plane,50,30,26,-20],[Gem,24,26,18,-7]];
export default function LoginForm(){
 const [mode,setMode]=useState<'entrar'|'cadastrar'>('entrar');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');try{const form=Object.fromEntries(new FormData(e.currentTarget));if(mode==='cadastrar'&&form.password!==form.confirm)throw Error('As senhas não conferem.');const r=await fetch('/api/auth/'+mode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const j=(await r.json().catch(()=>({}))) as {error?:string};if(!r.ok)throw Error(j.error||'Não foi possível continuar. Tente novamente.');window.location.href='/';}catch(err){setError((err as Error).message);setBusy(false);}}
 const signup=mode==='cadastrar';
 return <main className="auth-page"><div className="auth-bg" aria-hidden="true"><div className="auth-glow"/>{FLOATERS.map(([Icon,left,size,duration,delay],i)=><span key={i} className="auth-floater" style={{left:left+'%',animationDuration:duration+'s',animationDelay:delay+'s'}}><Icon size={size} strokeWidth={1.4}/></span>)}{Array.from({length:24},(_,i)=><i key={i} className="auth-spark" style={{left:(i*37%100)+'%',top:(i*53%100)+'%',animationDelay:-(i*0.7)+'s'}}/>)}</div><section className="auth-card">
  <div className="auth-brand"><span className="brand-icon"><Wallet size={24}/></span><span className="empresto-wordmark">Emprestô<span className="brand-dot">.</span><small>seu app de gestão de empréstimos</small></span></div>
  <div className="auth-tabs" role="tablist"><button type="button" role="tab" aria-selected={!signup} className={!signup?'active':''} onClick={()=>{setMode('entrar');setError('')}}>Entrar</button><button type="button" role="tab" aria-selected={signup} className={signup?'active':''} onClick={()=>{setMode('cadastrar');setError('')}}>Criar conta</button></div>
  <form onSubmit={submit} key={mode}>
   {signup&&<label className="field"><span>Seu nome</span><input name="name" autoComplete="name" required maxLength={120}/></label>}
   <label className="field"><span>E-mail</span><input name="email" type="email" autoComplete="email" required maxLength={200}/></label>
   <label className="field"><span>Senha</span><input name="password" type="password" autoComplete={signup?'new-password':'current-password'} required minLength={signup?8:1} maxLength={200}/>{signup&&<small>Pelo menos 8 caracteres.</small>}</label>
   {signup&&<label className="field"><span>Repita a senha</span><input name="confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={200}/></label>}
   {error&&<p className="auth-error" role="alert">{error}</p>}
   <button className="btn auth-submit" type="submit" disabled={busy}>{busy?'Aguarde…':signup?'Criar minha conta':'Entrar'}</button>
  </form>
  <p className="auth-note">{signup?'Comece grátis com até 5 clientes. Para cadastrar mais, assine por R$ 29,90/mês.':'Esqueceu a senha? Fale com o suporte do Emprestô.'}</p>
 </section></main>;
}
