import type {PixSettings} from './pix';
export type Client={id:string;name:string;phone:string;email:string;active:boolean;address:string;geo:string;group:string;notes:string;photo:string};
export type Installment={id:string;date:string;originalDate:string;amount:number;paid:number};
export type Receipt={id:string;date:string;amount:number;method:string;notes:string;interest:number;principal:number;onTime:boolean;allocations?:{id:string;amount:number}[]};
export type Collateral={kind:'Moto'|'Veículo';name:string;marketValue:number;document:string;notes:string;returnedAt?:string};
export type Loan={reversals?:{receipt:Receipt;reason:string;date:string}[];collateral?:Collateral;id:string;clientId:string;name:string;capital:number;rate:number;date:string;frequency:string;installments:Installment[];receipts:Receipt[];edits?:{date:string;reason:string;changes:{id:string;fromAmount:number;toAmount:number;fromDate:string;toDate:string}[]}[];history:{date:string;from:string;to:string;reason:string}[]};
export type Reminder={id:string;clientId:string;title:string;date:string;done:boolean};
export type CashEntry={id:string;date:string;amount:number;kind:'opening'|'deposit'|'withdrawal'|'correction';notes:string};
export type Portfolio={settings?:{accent?:string};pixSettings?:PixSettings;cashEntries?:CashEntry[];clients:Client[];loans:Loan[];reminders:Reminder[]};
export const empty:Portfolio={clients:[],loans:[],reminders:[]};
export const frequencies=['Pagamento único','Semanal','Quinzenal (15 dias)','Cada duas semanas (14 dias)','Mensal','Diariamente','Diário (segunda a sexta)','Diário (segunda a sábado)','Trimestral','Semestral','Anual'];
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const uid=()=>crypto.randomUUID();
export const brl=(c:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(c/100);
export const fmt=(s:string)=>s.split('-').reverse().join('/');
export const days=(date:string)=>Math.round((new Date(date+'T12:00:00Z').getTime()-new Date(today()+'T12:00:00Z').getTime())/86400000);
export function shift(s:string,n:number){const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function schedule(first:string,count:number,frequency:string){
 const start=new Date(first+'T12:00:00Z');const out:string[]=[];let d=first;
 for(let i=0;i<count;i++){
 if(frequency.includes('segunda')){while(new Date(d+'T12:00:00Z').getUTCDay()===0||(frequency.includes('sexta')&&new Date(d+'T12:00:00Z').getUTCDay()===6))d=shift(d,1);out.push(d);d=shift(d,1);continue;}
 if(['Mensal','Trimestral','Semestral','Anual'].includes(frequency)){const step=frequency==='Mensal'?1:frequency==='Trimestral'?3:frequency==='Semestral'?6:12;const month=start.getUTCMonth()+step*i;const last=new Date(Date.UTC(start.getUTCFullYear(),month+1,0)).getUTCDate();d=new Date(Date.UTC(start.getUTCFullYear(),month,Math.min(start.getUTCDate(),last),12)).toISOString().slice(0,10);}
 else d=shift(first,i*(frequency==='Semanal'?7:frequency.startsWith('Quinzenal')?15:frequency.startsWith('Cada duas')?14:1));out.push(d);
 }return out;
}
export const total=(l:Loan)=>l.installments.reduce((s,p)=>s+p.amount,0);
export const balance=(l:Loan)=>l.installments.reduce((s,p)=>s+p.amount-p.paid,0);
export const overdue=(l:Loan)=>l.installments.filter(p=>p.date<today()).reduce((s,p)=>s+p.amount-p.paid,0);
export const next=(l:Loan)=>l.installments.filter(p=>p.paid<p.amount).sort((a,b)=>a.date.localeCompare(b.date))[0];
export function makeLoan(v:{clientId:string;name:string;capital:number;rate:number;date:string;first:string;count:number;frequency:string}):Loan{
 const t=Math.round(v.capital*(1+v.rate/100));const n=v.frequency==='Pagamento único'?1:v.count;const dates=schedule(v.first,n,v.frequency);const q=Math.floor(t/n);
 return {id:uid(),clientId:v.clientId,name:v.name,capital:v.capital,rate:v.rate,date:v.date,frequency:v.frequency,installments:dates.map((date,i)=>({id:uid(),date,originalDate:date,amount:q+(i<t%n?1:0),paid:0})),receipts:[],history:[]};
}
export function receive(l:Loan,amount:number,method:string,date:string,notes:string){
 if(!Number.isSafeInteger(amount)||amount<=0||amount>balance(l))throw Error('Informe um valor maior que zero e até o saldo em aberto.');
 if(!['Dinheiro','Pix','Cartão','Moto','Veículo','Outros'].includes(method)||date<l.date||date>today())throw Error('Forma ou data de recebimento inválida.');
 let remaining=amount;let onTime=true;const allocations:{id:string;amount:number}[]=[];
 for(const p of [...l.installments].sort((a,b)=>a.date.localeCompare(b.date))){const used=Math.min(remaining,p.amount-p.paid);if(used&&date>p.date)onTime=false;if(used)allocations.push({id:p.id,amount:used});p.paid+=used;remaining-=used;if(!remaining)break;}
 const previous=l.receipts.reduce((s,r)=>s+r.amount,0);const expectedInterest=total(l)-l.capital;const interest=Math.round((previous+amount)*expectedInterest/total(l))-Math.round(previous*expectedInterest/total(l));
 l.receipts.push({id:uid(),date,amount,method,notes,interest,principal:amount-interest,onTime,allocations});
}
export function validatePortfolio(d:any):asserts d is Portfolio{
 if(!d||!Array.isArray(d.clients)||!Array.isArray(d.loans)||!Array.isArray(d.reminders))throw Error('Carteira inválida');
 if(d.cashEntries!==undefined){if(!Array.isArray(d.cashEntries))throw Error('Movimentações inválidas');for(const e of d.cashEntries)if(!e.id||!Number.isSafeInteger(e.amount)||!['opening','deposit','withdrawal','correction'].includes(e.kind)||typeof e.notes!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.date))throw Error('Movimentação de caixa inválida');}
 const ids=new Set();for(const c of d.clients){if(!c.id||ids.has(c.id)||typeof c.name!=='string'||!c.name.trim()||c.name.length>200||typeof c.phone!=='string'||typeof c.photo!=='string'||c.photo.length>500000||!/^$|^data:image\/(jpeg|png|webp);base64,|^\/api\/attachments\/[0-9a-f-]{36}$/.test(c.photo))throw Error('Cliente inválido');ids.add(c.id);}
 for(const l of d.loans){if(l.collateral)setCollateral({...l},l.collateral);if(!ids.has(l.clientId)||!Number.isSafeInteger(l.capital)||l.capital<=0||!Number.isFinite(l.rate)||l.rate<0||!Array.isArray(l.installments)||!l.installments.length||l.installments.length>360||!Array.isArray(l.receipts))throw Error('Empréstimo inválido');for(const p of l.installments){if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!Number.isSafeInteger(p.amount)||p.amount<=0||!Number.isSafeInteger(p.paid)||p.paid<0||p.paid>p.amount)throw Error('Parcela inválida');}if(l.installments.reduce((s:number,p:Installment)=>s+p.amount,0)!==Math.round(l.capital*(1+l.rate/100)))throw Error('Total inconsistente');if(l.receipts.reduce((s:number,r:Receipt)=>s+r.amount,0)!==l.installments.reduce((s:number,p:Installment)=>s+p.paid,0))throw Error('Recebimentos inconsistentes');}
 for(const r of d.reminders)if(!ids.has(r.clientId)||!r.title||!/^\d{4}-\d{2}-\d{2}$/.test(r.date))throw Error('Lembrete inválido');
}

export function editInstallment(l:Loan,id:string,amount:number,date:string,reason:string,asOf=today()){
 const target=l.installments.find(p=>p.id===id);
 if(!target||target.paid===target.amount)throw Error('Parcelas quitadas não podem ser editadas.');
 if(!Number.isSafeInteger(amount)||amount<=0||amount<=target.paid)throw Error('O novo valor deve superar o valor já recebido e manter saldo em aberto.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date<l.date)throw Error('Informe uma data válida, a partir da liberação.');
 const others=l.installments.filter(p=>p.id!==id&&p.paid<p.amount&&p.date>=asOf).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 const difference=amount-target.amount;
 const changes:{id:string;fromAmount:number;toAmount:number;fromDate:string;toDate:string}[]=[];
 if(difference!==0){
  if(!others.length)throw Error('Não há outras parcelas a vencer para redistribuir a diferença. Você pode alterar apenas a data.');
  const remaining=others.reduce((s,p)=>s+p.amount-p.paid,0)-difference;
  if(remaining<others.length)throw Error('O novo valor deixaria outra parcela sem saldo. Reduza o valor informado.');
  const base=Math.floor(remaining/others.length),cents=remaining%others.length;
  others.forEach((p,i)=>changes.push({id:p.id,fromAmount:p.amount,toAmount:p.paid+base+(i<cents?1:0),fromDate:p.date,toDate:p.date}));
 }
 if(amount===target.amount&&date===target.date)throw Error('Altere o valor ou a data para salvar.');
 changes.unshift({id:target.id,fromAmount:target.amount,toAmount:amount,fromDate:target.date,toDate:date});
 for(const c of changes){const p=l.installments.find(p=>p.id===c.id)!;p.amount=c.toAmount;p.date=c.toDate;}
 l.edits??=[];l.edits.push({date:asOf,reason,changes});
 return changes;
}

export const liquidReceipt=(method:string)=>['Dinheiro','Pix','Cartão'].includes(method);
export function walletSummary(d:Portfolio){
 const funded=(d.cashEntries||[]).reduce((s,e)=>s+e.amount,0);
 const disbursed=d.loans.reduce((s,l)=>s+l.capital,0);
 const receipts=d.loans.flatMap(l=>l.receipts);
 const cashReceived=receipts.filter(r=>liquidReceipt(r.method)).reduce((s,r)=>s+r.amount,0);
 const assetsReceived=receipts.filter(r=>!liquidReceipt(r.method)).reduce((s,r)=>s+r.amount,0);
 const principalOpen=d.loans.reduce((s,l)=>s+l.capital-l.receipts.reduce((a,r)=>a+r.principal,0),0);
 const interestOpen=d.loans.reduce((s,l)=>s+total(l)-l.capital-l.receipts.reduce((a,r)=>a+r.interest,0),0);
 const capitalInAssets=receipts.filter(r=>!liquidReceipt(r.method)).reduce((s,r)=>s+r.principal,0);
 const receivedInterest=receipts.filter(r=>liquidReceipt(r.method)).reduce((s,r)=>s+r.interest,0);
 const weightedRate=principalOpen?d.loans.reduce((s,l)=>s+(l.capital-l.receipts.reduce((a,r)=>a+r.principal,0))*l.rate,0)/principalOpen:0;
 return {configured:!!d.cashEntries?.length,available:funded-principalOpen-capitalInAssets,capitalInAssets,receivedInterest,cashBalance:funded+cashReceived-disbursed,funded,cashReceived,assetsReceived,principalOpen,interestOpen,weightedRate};
}
export function recordCash(d:Portfolio,kind:CashEntry['kind'],amount:number,notes:string,date=today()){
 if(!Number.isSafeInteger(amount)||amount<0||!notes.trim())throw Error('Informe valor e descrição válidos.');
 const w=walletSummary(d);
 if(kind==='opening'&&w.configured)throw Error('O saldo inicial já foi cadastrado. Registre um aporte ou retirada.');
 if(kind!=='opening'&&!w.configured)throw Error('Cadastre primeiro o saldo disponível atual.');
 if(!['opening','correction'].includes(kind)&&amount===0)throw Error('Informe um valor maior que zero.');
 if(kind==='withdrawal'&&amount>w.available)throw Error('Retirada superior ao dinheiro disponível.');
 const value=kind==='correction'?amount-w.funded:kind==='withdrawal'?-amount:amount;
 d.cashEntries??=[];d.cashEntries.push({id:uid(),date,kind,amount:value,notes});
}

export function collateralSummary(l:Loan){
 const principal=l.capital-l.receipts.reduce((s,r)=>s+r.principal,0);
 const interest=total(l)-l.capital-l.receipts.reduce((s,r)=>s+r.interest,0);
 return {principal,interest,redemption:principal+interest,margin:(l.collateral?.marketValue||0)-l.capital,coverage:l.collateral?.marketValue?l.capital/l.collateral.marketValue*100:0};
}
export function setCollateral(l:Loan,c:Collateral){
 if(!['Moto','Veículo'].includes(c.kind)||!c.name.trim()||!Number.isSafeInteger(c.marketValue)||c.marketValue<=0)throw Error('Informe tipo, nome e valor de mercado do bem.');
 if(typeof c.document!=='string'||c.document.length>1400000||!/^$|^data:image\/(jpeg|png|webp);base64,|^\/api\/attachments\/[0-9a-f-]{36}$/.test(c.document))throw Error('Documento inválido ou muito grande.');
 l.collateral={...c,name:c.name.trim(),returnedAt:l.collateral?.returnedAt};
}

export function matchesLoanStatus(l:Loan,status:string){
 if(status==='Todos')return true;
 if(status==='Quitado')return balance(l)===0;
 if(status==='Em andamento')return balance(l)>0;
 if(status==='Vencido')return overdue(l)>0;
 if(status==='Em dia')return balance(l)>0&&overdue(l)===0;
 return false;
}

export function reverseLastReceipt(l:Loan,reason:string){
 const r=l.receipts.at(-1);if(!r||!reason.trim())throw Error('Informe o motivo do estorno.');
 if(l.collateral?.returnedAt)throw Error('Bem já devolvido. Revise a operação antes de estornar.');
 if(r.allocations){for(const a of r.allocations){const p=l.installments.find(p=>p.id===a.id);if(!p||p.paid<a.amount)throw Error('Parcela não permite estorno automático.');}for(const a of r.allocations)l.installments.find(p=>p.id===a.id)!.paid-=a.amount;}
 else {if(l.edits?.length||l.history.length)throw Error('Recebimento antigo com alterações de parcelas: não é possível determinar o abatimento original com segurança.');
 const copy=JSON.parse(JSON.stringify(l)) as Loan;copy.installments.forEach(p=>p.paid=0);copy.receipts=[];for(const prior of l.receipts.slice(0,-1))receive(copy,prior.amount,prior.method,prior.date,prior.notes);copy.installments.forEach(p=>{l.installments.find(x=>x.id===p.id)!.paid=p.paid;});}
 l.receipts.pop();l.reversals??=[];l.reversals.push({receipt:r,reason:reason.trim(),date:today()});
}
