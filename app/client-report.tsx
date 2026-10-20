'use client';
import {FileSpreadsheet,FileText} from 'lucide-react';
import {type Portfolio,type Client,brl,fmt,today,total,balance,overdue,next,walletSummary} from '../lib/model';
import {workbook,type Cell} from '../lib/xlsx';
// "Relatório": every client with contact data and money figures, plus a financial summary. Exports to Excel (.xlsx) or PDF (print).
type Row={c:Client;loans:number;lent:number;contracted:number;received:number;open:number;late:number;nextDue:string;nextAmount:number;status:string};
export function reportRows(d:Portfolio):Row[]{
 return d.clients.map(c=>{
  const ls=d.loans.filter(l=>l.clientId===c.id);
  const open=ls.reduce((s,l)=>s+balance(l),0),late=ls.reduce((s,l)=>s+overdue(l),0);
  const nx=ls.map(next).filter(Boolean).sort((a,b)=>a!.date.localeCompare(b!.date))[0];
  return {c,loans:ls.length,lent:ls.reduce((s,l)=>s+l.capital,0),contracted:ls.reduce((s,l)=>s+total(l),0),received:ls.reduce((s,l)=>s+l.receipts.reduce((a,r)=>a+r.amount,0),0),open,late,nextDue:nx?.date||'',nextAmount:nx?nx.amount-nx.paid:0,
   status:!ls.length?'Sem contrato':late>0?'Em atraso':open>0?'Em dia':'Quitado'};
 }).sort((a,b)=>a.c.name.localeCompare(b.c.name,'pt-BR'));
}
export function reportSummary(d:Portfolio,rows:Row[]){
 const w=walletSummary(d),sum=(k:'lent'|'contracted'|'received'|'open'|'late')=>rows.reduce((s,r)=>s+r[k],0);
 return [
  ['Clientes cadastrados',String(d.clients.length),null],
  ['Clientes ativos',String(d.clients.filter(c=>c.active).length),null],
  ['Clientes em atraso',String(rows.filter(r=>r.late>0).length),null],
  ['Contratos',String(d.loans.length),null],
  ['Contratos em andamento',String(d.loans.filter(l=>balance(l)>0).length),null],
  ['Total emprestado',null,sum('lent')],
  ['Total a receber (contratado)',null,sum('contracted')],
  ['Total recebido',null,sum('received')],
  ['Juros recebidos',null,w.receivedInterest],
  ['Saldo em aberto',null,sum('open')],
  ['Valor em atraso',null,sum('late')],
  ...(w.configured?[['Dinheiro disponível',null,w.available] as [string,null,number]]:[]),
 ] as [string,string|null,number|null][];
}
function download(blob:Blob,name:string){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

export default function ClientReport({data,owner}:{data:Portfolio;owner:string}){
 const rows=reportRows(data),summary=reportSummary(data,rows),date=fmt(today());
 const excel=()=>{
  const head=['Cliente','Telefone','E-mail','Endereço','Grupo','Cadastro','Situação','Contratos','Emprestado','Total contratado','Recebido','Em aberto','Em atraso','Próximo vencimento','Valor do próximo'];
  download(workbook([
   {name:'Resumo',widths:[32,20],rows:[[{bold:'Relatório Emprestô'}],[owner],['Gerado em '+date],[],...summary.map(([k,t,m]):Cell[]=>[k,m===null?Number(t):{money:m}])]},
   {name:'Clientes',widths:[28,16,26,30,14,10,13,10,14,16,14,14,14,18,16],rows:[head.map(h=>({bold:h})),...rows.map((r):Cell[]=>[r.c.name,r.c.phone,r.c.email,r.c.address,r.c.group,r.c.active?'Ativo':'Inativo',r.status,r.loans,{money:r.lent},{money:r.contracted},{money:r.received},{money:r.open},{money:r.late},r.nextDue?fmt(r.nextDue):'',r.nextDue?{money:r.nextAmount}:''])]},
  ]),`relatorio-empresto-${today()}.xlsx`);
 };
 return <section className="panel client-report print-area">
  <div className="panel-header"><div><h2>Relatório</h2><p>Todos os clientes, seus dados e o resumo financeiro. Gerado em {date}.</p></div>
   <div className="report-actions no-print"><button className="btn secondary" onClick={excel}><FileSpreadsheet size={15}/>Baixar Excel</button><button className="btn secondary" onClick={()=>window.print()}><FileText size={15}/>Baixar PDF</button></div></div>
  <div className="report-body"><p className="print-only report-owner">{owner} · Emprestô · {date}</p>
  <h3>Resumo financeiro</h3>
  <div className="report-summary">{summary.map(([k,t,m])=><div key={k}><small>{k}</small><strong>{m===null?t:brl(m)}</strong></div>)}</div>
  <h3>Clientes ({rows.length})</h3>
  {rows.length?<div className="report-table-wrap"><table className="report-table"><thead><tr><th>Cliente</th><th>Contato</th><th>Situação</th><th>Contratos</th><th>Emprestado</th><th>Recebido</th><th>Em aberto</th><th>Em atraso</th><th>Próximo vencimento</th></tr></thead>
   <tbody>{rows.map(r=><tr key={r.c.id}><td data-label="Cliente"><strong>{r.c.name}</strong>{!r.c.active&&<small> (inativo)</small>}{r.c.address&&<small className="report-sub">{r.c.address}</small>}</td><td data-label="Contato">{r.c.phone||'—'}{r.c.email&&<small className="report-sub">{r.c.email}</small>}</td><td data-label="Situação"><span className={'report-status s-'+(r.status==='Em atraso'?'late':r.status==='Em dia'?'ok':'done')}>{r.status}</span></td><td data-label="Contratos">{r.loans}</td><td data-label="Emprestado">{brl(r.lent)}</td><td data-label="Recebido">{brl(r.received)}</td><td data-label="Em aberto">{brl(r.open)}</td><td data-label="Em atraso">{r.late?brl(r.late):'—'}</td><td data-label="Próximo vencimento">{r.nextDue?<>{fmt(r.nextDue)}<small className="report-sub">{brl(r.nextAmount)}</small></>:'—'}</td></tr>)}</tbody></table></div>:<p>Nenhum cliente cadastrado ainda.</p>}
  <p className="report-note no-print">No PDF, escolha “Salvar como PDF” na tela de impressão.</p></div>
 </section>;
}
