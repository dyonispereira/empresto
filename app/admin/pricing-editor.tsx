'use client';
import React,{useEffect,useState} from 'react';
import {Plus,Trash2} from 'lucide-react';
type Tier={upTo:number|null;price:number};
type Row={upTo:string;price:string};
const toRow=(t:Tier):Row=>({upTo:t.upTo===null?'':String(t.upTo),price:(t.price/100).toFixed(2).replace('.',',')});
const cents=(v:string)=>Math.round(Number(v.replace(/\./g,'').replace(',','.'))*100);
// Lets the administrator set the monthly price for each range of clients.
export default function PricingEditor({onToast}:{onToast:(m:string)=>void}){
 const [rows,setRows]=useState<Row[]|null>(null),[busy,setBusy]=useState(false);
 useEffect(()=>{fetch('/api/admin/pricing',{cache:'no-store'}).then(r=>r.json() as Promise<{tiers?:Tier[]}>).then(j=>{if(j.tiers)setRows(j.tiers.map(toRow))}).catch(()=>onToast('Não foi possível carregar os preços.'))},[onToast]);
 if(!rows)return <section className="admin-box"><h2>Preços por faixa</h2><p className="auth-note">Carregando…</p></section>;
 const set=(i:number,k:keyof Row,v:string)=>setRows(rows.map((r,j)=>j===i?{...r,[k]:v}:r));
 const from=(i:number)=>i?(Number(rows[i-1].upTo)||0)+1:1;
 async function save(){setBusy(true);try{const tiers=rows!.map((r,i)=>({upTo:i===rows!.length-1?null:Number(r.upTo),price:cents(r.price)}));const res=await fetch('/api/admin/pricing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tiers})});const j=await res.json() as {tiers?:Tier[];error?:string};if(!res.ok)throw Error(j.error||'Não foi possível salvar.');setRows(j.tiers!.map(toRow));onToast('Preços salvos. Valem para as próximas cobranças.')}catch(e){onToast((e as Error).message)}finally{setBusy(false)}}
 return <section className="admin-box"><h2>Preços por faixa de clientes</h2><p className="auth-note">Quem já paga continua com o valor atual até precisar de mais clientes.</p>
  <div className="admin-tiers">{rows.map((r,i)=>{const last=i===rows.length-1;return <div className="admin-tier" key={i}>
   <span>{last?`A partir de ${from(i)} clientes`:`De ${from(i)} até`}</span>
   {!last&&<input aria-label="Até quantos clientes" inputMode="numeric" value={r.upTo} onChange={e=>set(i,'upTo',e.target.value.replace(/\D/g,''))}/>}{!last&&<span>clientes</span>}
   <label>R$<input aria-label="Valor mensal" inputMode="decimal" value={r.price} onChange={e=>set(i,'price',e.target.value.replace(/[^\d,]/g,''))}/>/mês</label>
   {rows.length>1&&<button className="icon" title="Remover faixa" onClick={()=>setRows(rows.filter((_,j)=>j!==i))}><Trash2 size={15}/></button>}
  </div>})}</div>
  <div className="admin-tier-actions"><button className="text-btn" disabled={rows.length>=6} onClick={()=>{const prev=rows.slice(0,-1),last=rows.at(-1)!;setRows([...prev,{upTo:String(from(rows.length-1)+4),price:last.price},{upTo:'',price:last.price}])}}><Plus size={14}/>Adicionar faixa</button><button className="btn" disabled={busy} onClick={save}>{busy?'Salvando…':'Salvar preços'}</button></div>
 </section>;
}
