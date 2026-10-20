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
// The same columns feed the Excel sheets and the on-screen/PDF tables, so both always carry the same information.
type Col=[string,(r:Row)=>Cell,number];
const money=(v:number):Cell=>({money:v});
const clientCols:Col[]=[['Cliente',r=>r.c.name,28],['Telefone',r=>r.c.phone,16],['E-mail',r=>r.c.email,26],['Endereço',r=>r.c.address,30],['Grupo',r=>r.c.group,14],['Cadastro',r=>r.c.active?'Ativo':'Inativo',10],['Situação',r=>r.status,13],['Contratos',r=>r.loans,10],['Emprestado',r=>money(r.lent),14],['Total contratado',r=>money(r.contracted),16],['Recebido',r=>money(r.received),14],['Em aberto',r=>money(r.open),14],['Em atraso',r=>money(r.late),14],['Próximo vencimento',r=>r.nextDue?fmt(r.nextDue):'',18],['Valor do próximo',r=>r.nextDue?money(r.nextAmount):'',16]];
const registerCols:Col[]=[['Nome',r=>r.c.name,28],['Celular',r=>r.c.phone,18],['E-mail',r=>r.c.email,28],['Endereço',r=>r.c.address,36],['Geolocalização',r=>r.c.geo,24],['Grupo',r=>r.c.group,14],['Situação',r=>r.c.active?'Ativo':'Inativo',10],['Observações',r=>r.c.notes,40]];
const pill:Record<string,string>={'Em atraso':'s-late','Em dia':'s-ok','Ativo':'s-ok','Quitado':'s-done','Sem contrato':'s-done','Inativo':'s-done'};
function show(v:Cell,head:string){
 if(v===null||v==='')return '—';
 if(typeof v==='object')return 'money' in v?brl(v.money):v.bold;
 if(typeof v==='string'&&(head==='Situação'||head==='Cadastro'))return <span className={'report-status '+(pill[v]||'s-done')}>{v}</span>;
 return v;
}
function Table({cols,rows}:{cols:Col[];rows:Row[]}){
 return <div className="report-table-wrap"><table className="report-table"><thead><tr>{cols.map(c=><th key={c[0]}>{c[0]}</th>)}</tr></thead>
  <tbody>{rows.map(r=><tr key={r.c.id}>{cols.map(([h,f],i)=>{const v=f(r);return <td key={h} data-label={h} className={typeof v==='number'||(v!==null&&typeof v==='object'&&'money' in v)?'num':undefined}>{i===0?<strong>{String(v)}</strong>:show(v,h)}</td>})}</tr>)}</tbody></table></div>;
}
function download(blob:Blob,name:string){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

export default function ClientReport({data,owner}:{data:Portfolio;owner:string}){
 const rows=reportRows(data),summary=reportSummary(data,rows),date=fmt(today());
 const excel=()=>{
  download(workbook([
   {name:'Resumo',widths:[32,20],rows:[[{bold:'Relatório Emprestô'}],[owner],['Gerado em '+date],[],...summary.map(([k,t,m]):Cell[]=>[k,m===null?Number(t):{money:m}])]},
   {name:'Clientes',widths:clientCols.map(c=>c[2]),rows:[clientCols.map(c=>({bold:c[0]})),...rows.map(r=>clientCols.map(c=>c[1](r)))]},
   {name:'Cadastro',widths:registerCols.map(c=>c[2]),rows:[registerCols.map(c=>({bold:c[0]})),...rows.map(r=>registerCols.map(c=>c[1](r)))]},
  ]),`relatorio-empresto-${today()}.xlsx`);
 };
 return <section className="panel client-report print-area">
  <div className="panel-header"><div><h2>Relatório</h2><p>Resumo financeiro, valores por cliente e dados cadastrais de todos os clientes, ativos e inativos. Gerado em {date}.</p></div>
   <div className="report-actions no-print"><button className="btn secondary" onClick={excel}><FileSpreadsheet size={15}/>Baixar Excel</button><button className="btn secondary" onClick={()=>window.print()}><FileText size={15}/>Baixar PDF</button></div></div>
  <div className="report-body"><p className="print-only report-owner">{owner} · Emprestô · {date}</p>
  <h3>Resumo financeiro</h3>
  <div className="report-summary">{summary.map(([k,t,m])=><div key={k}><small>{k}</small><strong>{m===null?t:brl(m)}</strong></div>)}</div>
  <h3>Clientes ({rows.length})</h3>
  {rows.length?<Table cols={clientCols} rows={rows}/>:<p>Nenhum cliente cadastrado ainda.</p>}
  <h3 className="report-break">Dados cadastrais ({rows.length} clientes: {rows.filter(r=>r.c.active).length} ativos, {rows.filter(r=>!r.c.active).length} inativos)</h3>
  {rows.length>0&&<Table cols={registerCols} rows={rows}/>}
  <p className="report-note no-print">No PDF, escolha “Salvar como PDF” na tela de impressão.</p></div>
 </section>;
}
