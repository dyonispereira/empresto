'use client';
import React,{useState} from 'react';
import {Wallet} from 'lucide-react';
import PremiumBg from '../premium-bg';
export default function LoginForm({initialMode='entrar'}:{initialMode?:'entrar'|'cadastrar'}){
 const [mode,setMode]=useState<'entrar'|'cadastrar'>(initialMode);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');try{const form=Object.fromEntries(new FormData(e.currentTarget));if(mode==='cadastrar'&&form.password!==form.confirm)throw Error('As senhas não conferem.');const r=await fetch('/api/auth/'+mode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const j=(await r.json().catch(()=>({}))) as {error?:string};if(!r.ok)throw Error(j.error||'Não foi possível continuar. Tente novamente.');window.location.href='/';}catch(err){setError((err as Error).message);setBusy(false);}}
 const signup=mode==='cadastrar';
 return <main className="auth-page"><PremiumBg/><section className="auth-card">
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
  {!signup&&<p className="auth-note">Esqueceu a senha? Fale com o suporte do Emprestô.</p>}
 </section></main>;
}
