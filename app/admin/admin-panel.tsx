'use client';
import React,{useEffect,useState} from 'react';
import {ArrowLeft,BadgeDollarSign,Gift,LogOut,Search} from 'lucide-react';
import PricingEditor from './pricing-editor';
type Finance={configured:boolean;funded:number;lent:number;available:number;receivable:number;overdue:number;receivedInterest:number;loans:number;openLoans:number};
type Charge={id:string;value:number;status:string;dueDate:string;paidDate:string|null;invoiceUrl:string|null};
type Subscriber={id:string;charges:Charge[];name:string;email:string;createdAt:string;clients:number;finance:Finance|null;admin:boolean;paidUntil:string|null;subscription:string|null;courtesyUntil:string|null;courtesyForever:boolean;customPrice:number|null;lastSeen:string|null;activeSeconds:number;online:boolean};
const date=(iso:string)=>new Date(iso).toLocaleDateString('pt-BR');
const when=(iso:string)=>new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
const duration=(sec:number)=>{const m=Math.floor(sec/60),h=Math.floor(m/60);return h?h+'h '+(m%60)+'min':m?m+' min':'menos de 1 min';};
const brl=(cents:number)=>(cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function situation(s:Subscriber){if(s.admin)return {label:'Administrador',tone:'ok'};if(s.courtesyUntil)return {label:s.courtesyForever?'Cortesia sem prazo':'Cortesia até '+date(s.courtesyUntil),tone:'gift'};if(s.paidUntil)return {label:'Pago até '+date(s.paidUntil),tone:'ok'};return s.clients?{label:'Aguardando pagamento',tone:'bad'}:{label:'Testando (sem clientes)',tone:'free'};}
const PAID=['RECEIVED','CONFIRMED','RECEIVED_IN_CASH'];
const chargeStatus=(c:Charge)=>PAID.includes(c.status)?{label:'Pago',tone:'ok'}:c.status==='OVERDUE'?{label:'Vencido',tone:'bad'}:c.status==='PENDING'?{label:'Aguardando',tone:'free'}:{label:c.status==='REFUNDED'?'Estornado':c.status,tone:'free'};
const OPTIONS:[string,number|null][]=[['30 dias',30],['90 dias',90],['1 ano',365],['Sem prazo',null]];
export default function AdminPanel(){
 const [users,setUsers]=useState<Subscriber[]|null>(null),[error,setError]=useState(''),[query,setQuery]=useState(''),[busy,setBusy]=useState(''),[toast,setToast]=useState('');
 async function load(){try{const r=await fetch('/api/admin/users',{cache:'no-store'});const j=await r.json() as {users?:Subscriber[];error?:string};if(!r.ok)throw Error(j.error||'Não foi possível carregar.');setUsers(j.users!);setError('')}catch(e){setError((e as Error).message)}}
 useEffect(()=>{const t=setTimeout(load,0);return()=>clearTimeout(t)},[]);
 async function grant(s:Subscriber,days:number|null){setBusy(s.id);try{const r=await fetch('/api/admin/courtesy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:s.id,days})});const j=await r.json() as {error?:string};if(!r.ok)throw Error(j.error||'Não foi possível salvar.');setToast(days===0?'Cortesia removida de '+s.name+'.':'Cortesia liberada para '+s.name+'.');await load()}catch(e){setToast((e as Error).message)}finally{setBusy('')}}
 async function setPrice(s:Subscriber,value:string|null){const price=value===null?null:Math.round(Number(value.replace(/\./g,'').replace(',','.'))*100);if(price!==null&&!(price>0)){setToast('Informe o valor, por exemplo 19,90.');return}setBusy(s.id);try{const r=await fetch('/api/admin/custom-price',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:s.id,price})});const j=await r.json() as {error?:string};if(!r.ok)throw Error(j.error||'Não foi possível salvar.');setToast(price===null?s.name+' volta a pagar pela faixa de clientes.':'Preço especial salvo para '+s.name+'.');await load()}catch(e){setToast((e as Error).message)}finally{setBusy('')}}
 async function runCharges(){setBusy('charges');try{const r=await fetch('/api/admin/auto-charge',{method:'POST'});const j=await r.json() as {users?:number;sent?:number;failed?:number;error?:string};if(!r.ok)throw Error(j.error||'Não foi possível executar.');setToast(`${j.sent} enviada(s), ${j.failed} com falha, ${j.users} usuário(s) com cobrança automática.`)}catch(e){setToast((e as Error).message)}finally{setBusy('')}}
 const q=query.trim().toLowerCase();const list=(users||[]).filter(s=>!q||s.name.toLowerCase().includes(q)||s.email.includes(q));
 const count=(f:(s:Subscriber)=>boolean)=>(users||[]).filter(f).length;
 const charges=(users||[]).flatMap(s=>s.charges.map(c=>({...c,who:s.name}))).sort((a,b)=>b.dueDate.localeCompare(a.dueDate));
 const month=new Date().toISOString().slice(0,7);
 const receivedMonth=charges.filter(c=>PAID.includes(c.status)&&(c.paidDate||c.dueDate).startsWith(month)).reduce((t,c)=>t+c.value,0);
 const waiting=charges.filter(c=>c.status==='PENDING'||c.status==='OVERDUE').reduce((t,c)=>t+c.value,0);
 // Plain links: vinext's client-side <Link> navigation fails in production, so pages load normally.
 return <main className="admin-page">
  {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
  <div className="admin-top"><a className="text-btn" href="/"><ArrowLeft size={14}/>Voltar à minha carteira</a><form method="post" action="/api/auth/sair"><button className="logout-btn" type="submit"><LogOut size={16}/>Sair</button></form></div>
  <div className="eyebrow">PAINEL ADMINISTRATIVO</div><h1>Assinantes do Emprestô</h1>
  {users&&<div className="admin-metrics"><div><strong>{users.length}</strong><span>contas</span></div><div><strong>{count(s=>!!s.paidUntil&&!s.admin)}</strong><span>pagantes</span></div><div><strong>{count(s=>s.online)}</strong><span>online agora</span></div><div><strong>{count(s=>!!s.courtesyUntil)}</strong><span>cortesias</span></div><div><strong>{count(s=>!s.paidUntil&&!s.courtesyUntil&&!s.admin)}</strong><span>sem pagamento</span></div></div>}
  <PricingEditor onToast={setToast}/>
  <section className="admin-box"><h2>Cobrança automática no WhatsApp</h2><p className="auth-note">Roda todo dia às 9h para quem ativou em Ajustes. Use o botão para enviar agora as cobranças que vencem hoje; parcelas já cobradas são puladas.</p><button className="btn secondary" disabled={!!busy} onClick={runCharges}>Enviar cobranças de hoje agora</button></section>
  {users&&<section className="admin-box"><h2>Cobranças</h2><div className="admin-charge-totals"><div><span>Recebido este mês</span><strong>{brl(receivedMonth)}</strong></div><div><span>Aguardando pagamento</span><strong>{brl(waiting)}</strong></div></div>
   {charges.length?<div className="admin-charges">{charges.slice(0,50).map(c=>{const st=chargeStatus(c);return <div className="admin-charge" key={c.id}><div><strong>{c.who}</strong><small>Vence {date(c.dueDate+'T12:00:00')}{c.paidDate?' · pago em '+date(c.paidDate+'T12:00:00'):''}</small></div><strong>{brl(c.value)}</strong><span className={'admin-tag '+st.tone}>{st.label}</span>{c.invoiceUrl?<a className="text-btn" href={c.invoiceUrl} target="_blank" rel="noreferrer">Fatura</a>:<span/>}</div>})}</div>:<p className="auth-note">Nenhuma cobrança gerada ainda.</p>}
  </section>}
  <label className="admin-search"><Search size={15}/><input placeholder="Buscar por nome ou e-mail" value={query} onChange={e=>setQuery(e.target.value)}/></label>
  {error&&<p className="auth-error">{error} <button className="text-btn" onClick={load}>Tentar novamente</button></p>}
  {!users&&!error&&<p className="auth-note">Carregando…</p>}
  {users&&!list.length&&<p className="auth-note">Nenhum assinante encontrado.</p>}
  <div className="admin-list">{list.map(s=>{const st=situation(s);return <section className="admin-row" key={s.id}>
   <div className="admin-who"><strong>{s.name}</strong><span>{s.email}</span><small>Cadastro em {date(s.createdAt)} · {s.clients} cliente{s.clients===1?'':'s'}</small></div>
   <span className={'admin-tag '+st.tone}>{st.label}</span>
   <div className="admin-activity"><span className={'admin-dot'+(s.online?' on':'')}/>{s.online?<strong>Online agora</strong>:<span>Offline</span>}<span>Último acesso: {s.lastSeen?when(s.lastSeen):'nunca'}</span><span>Tempo de uso: {s.lastSeen?duration(s.activeSeconds):'—'}</span></div>
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
   {!s.admin&&<SpecialPrice s={s} busy={!!busy} onSave={setPrice}/>}
  </section>})}</div>
  {toast&&<div className="admin-toast" role="status" onClick={()=>setToast('')}>{toast}</div>}
 </main>;
}

// Per-account monthly price that replaces the client tiers; the account pays it from the Assinatura tab.
function SpecialPrice({s,busy,onSave}:{s:Subscriber;busy:boolean;onSave:(s:Subscriber,value:string|null)=>void}){
 const [value,setValue]=useState(s.customPrice?(s.customPrice/100).toFixed(2).replace('.',','):'');
 return <div className="admin-actions"><BadgeDollarSign size={14}/><span>Preço especial:</span>
  <input className="admin-price" inputMode="decimal" placeholder="Pela faixa" value={value} onChange={e=>setValue(e.target.value)} aria-label={'Preço especial por mês para '+s.name}/><span>/mês</span>
  <button disabled={busy||!value} onClick={()=>onSave(s,value)}>Salvar</button>
  {s.customPrice&&<button className="remove" disabled={busy} onClick={()=>{setValue('');onSave(s,null)}}>Remover</button>}
 </div>;
}
