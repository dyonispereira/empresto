'use client';
import React,{useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,Gift,LogOut,Search} from 'lucide-react';
type Finance={configured:boolean;funded:number;lent:number;available:number;receivable:number;overdue:number;receivedInterest:number;loans:number;openLoans:number};
type Subscriber={id:string;name:string;email:string;createdAt:string;clients:number;finance:Finance|null;admin:boolean;paidUntil:string|null;subscription:string|null;courtesyUntil:string|null;courtesyForever:boolean};
const date=(iso:string)=>new Date(iso).toLocaleDateString('pt-BR');
const brl=(cents:number)=>(cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function situation(s:Subscriber){if(s.admin)return {label:'Administrador',tone:'ok'};if(s.courtesyUntil)return {label:s.courtesyForever?'Cortesia sem prazo':'Cortesia até '+date(s.courtesyUntil),tone:'gift'};if(s.paidUntil)return {label:'Pago até '+date(s.paidUntil),tone:'ok'};return {label:s.clients>5?'Bloqueado (mais de 5 clientes)':'Gratuito ('+s.clients+' de 5)',tone:s.clients>5?'bad':'free'};}
const OPTIONS:[string,number|null][]=[['30 dias',30],['90 dias',90],['1 ano',365],['Sem prazo',null]];
export default function AdminPanel(){
 const [users,setUsers]=useState<Subscriber[]|null>(null),[error,setError]=useState(''),[query,setQuery]=useState(''),[busy,setBusy]=useState(''),[toast,setToast]=useState('');
 async function load(){try{const r=await fetch('/api/admin/users',{cache:'no-store'});const j=await r.json() as {users?:Subscriber[];error?:string};if(!r.ok)throw Error(j.error||'Não foi possível carregar.');setUsers(j.users!);setError('')}catch(e){setError((e as Error).message)}}
 useEffect(()=>{const t=setTimeout(load,0);return()=>clearTimeout(t)},[]);
 async function grant(s:Subscriber,days:number|null){setBusy(s.id);try{const r=await fetch('/api/admin/courtesy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:s.id,days})});const j=await r.json() as {error?:string};if(!r.ok)throw Error(j.error||'Não foi possível salvar.');setToast(days===0?'Cortesia removida de '+s.name+'.':'Cortesia liberada para '+s.name+'.');await load()}catch(e){setToast((e as Error).message)}finally{setBusy('')}}
 const q=query.trim().toLowerCase();const list=(users||[]).filter(s=>!q||s.name.toLowerCase().includes(q)||s.email.includes(q));
 const count=(f:(s:Subscriber)=>boolean)=>(users||[]).filter(f).length;
 return <main className="admin-page">
  <div className="admin-top"><Link className="text-btn" href="/"><ArrowLeft size={14}/>Voltar à minha carteira</Link><form method="post" action="/api/auth/sair"><button className="logout-btn" type="submit"><LogOut size={16}/>Sair</button></form></div>
  <div className="eyebrow">PAINEL ADMINISTRATIVO</div><h1>Assinantes do Emprestô</h1>
  {users&&<div className="admin-metrics"><div><strong>{users.length}</strong><span>contas</span></div><div><strong>{count(s=>!!s.paidUntil&&!s.admin)}</strong><span>pagantes</span></div><div><strong>{count(s=>!!s.courtesyUntil)}</strong><span>cortesias</span></div><div><strong>{count(s=>!s.paidUntil&&!s.courtesyUntil&&!s.admin)}</strong><span>gratuitos</span></div></div>}
  <label className="admin-search"><Search size={15}/><input placeholder="Buscar por nome ou e-mail" value={query} onChange={e=>setQuery(e.target.value)}/></label>
  {error&&<p className="auth-error">{error} <button className="text-btn" onClick={load}>Tentar novamente</button></p>}
  {!users&&!error&&<p className="auth-note">Carregando…</p>}
  {users&&!list.length&&<p className="auth-note">Nenhum assinante encontrado.</p>}
  <div className="admin-list">{list.map(s=>{const st=situation(s);return <section className="admin-row" key={s.id}>
   <div className="admin-who"><strong>{s.name}</strong><span>{s.email}</span><small>Cadastro em {date(s.createdAt)} · {s.clients} cliente{s.clients===1?'':'s'}</small></div>
   <span className={'admin-tag '+st.tone}>{st.label}</span>
   <div className="admin-finance">{s.finance?<>
    <div><span>Aporte</span><strong>{s.finance.configured?brl(s.finance.funded):'—'}</strong></div>
    <div><span>Emprestado</span><strong>{brl(s.finance.lent)}</strong></div>
    <div><span>Disponível</span><strong>{s.finance.configured?brl(s.finance.available):'—'}</strong></div>
    <div><span>A receber</span><strong>{brl(s.finance.receivable)}</strong></div>
    <div><span>Em atraso</span><strong className={s.finance.overdue?'red':''}>{brl(s.finance.overdue)}</strong></div>
    <div><span>Juros recebidos</span><strong>{brl(s.finance.receivedInterest)}</strong></div>
    <div><span>Clientes</span><strong>{s.clients}</strong></div>
    <div><span>Empréstimos ativos</span><strong>{s.finance.openLoans} de {s.finance.loans}</strong></div>
   </>:<p>Ainda não cadastrou nada na carteira.</p>}</div>
   {!s.admin&&<div className="admin-actions"><Gift size={14}/><span>Cortesia:</span>{OPTIONS.map(([label,days])=><button key={label} disabled={!!busy} onClick={()=>grant(s,days)}>{label}</button>)}{s.courtesyUntil&&<button className="remove" disabled={!!busy} onClick={()=>grant(s,0)}>Remover</button>}</div>}
  </section>})}</div>
  {toast&&<div className="admin-toast" role="status" onClick={()=>setToast('')}>{toast}</div>}
 </main>;
}
