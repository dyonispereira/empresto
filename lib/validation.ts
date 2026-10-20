import {z} from 'zod';
import {normalizePix} from './pix';
import {Portfolio,total,validatePortfolio,walletSummary,today,frequencies} from './model';
import {savedThemes} from './themes';
const id=z.string().min(1).max(100);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{try{return new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s}catch{return false}},'Data inválida');
const cents=z.number().int().min(0).max(100000000000);
const image=z.string().max(1500000).refine(v=>!v||/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v)||/^\/api\/attachments\/[0-9a-f-]{36}$/.test(v),'Imagem inválida');
const receipt=z.object({id,date,amount:cents.positive(),method:z.enum(['Dinheiro','Pix','Cartão','Moto','Veículo','Outros']),notes:z.string().max(2000),interest:cents,principal:cents,onTime:z.boolean(),allocations:z.array(z.object({id,amount:cents.positive()})).max(360).optional()});
const schema=z.object({settings:z.object({accent:z.enum(savedThemes).optional()}).optional(),pixSettings:z.object({keyType:z.enum(['CPF','CNPJ','E-mail','Celular','Aleatória']),key:z.string().max(100),receiver:z.string().max(200),city:z.string().max(100),message:z.string().max(2000)}).optional(),clients:z.array(z.object({id,name:z.string().trim().min(1).max(200),phone:z.string().max(40),email:z.string().max(254),active:z.boolean(),address:z.string().max(1000),geo:z.string().max(100),group:z.string().max(100),notes:z.string().max(5000),photo:image})).max(10000),loans:z.array(z.object({id,clientId:id,name:z.string().min(1).max(150),capital:cents.positive(),rate:z.number().min(0).max(10000),date,frequency:z.enum(frequencies as [string,...string[]]),installments:z.array(z.object({id,date,originalDate:date,amount:cents.positive(),paid:cents})).min(1).max(360),receipts:z.array(receipt).max(10000),history:z.array(z.object({date,from:date,to:date,reason:z.string().max(2000)})).max(10000),edits:z.array(z.object({date,reason:z.string().max(2000),changes:z.array(z.object({id,fromAmount:cents,toAmount:cents,fromDate:date,toDate:date})).max(360)})).max(10000).optional(),reversals:z.array(z.object({receipt,reason:z.string().min(1).max(2000),date})).max(10000).optional(),collateral:z.object({kind:z.enum(['Moto','Veículo']),name:z.string().min(1).max(200),marketValue:cents.positive(),document:image,notes:z.string().max(2000),returnedAt:date.optional()}).optional()})).max(10000),cashEntries:z.array(z.object({id,date,amount:z.number().int().min(-100000000000).max(100000000000),kind:z.enum(['opening','deposit','withdrawal','correction']),notes:z.string().min(1).max(1000)})).max(10000).optional(),reminders:z.array(z.object({id,clientId:id,title:z.string().min(1).max(300),date,done:z.boolean()})).max(10000)}).strict();
export function checkPortfolio(value:unknown):Portfolio{
 const parsed=schema.safeParse(value);if(!parsed.success)throw Error('Dados inválidos: '+parsed.error.issues.slice(0,3).map(i=>`${i.path.join('.')}: ${i.message}`).join('; '));
 const d=parsed.data as Portfolio;if(d.pixSettings)d.pixSettings=normalizePix(d.pixSettings);validatePortfolio(d);
 const unique=(v:{id:string}[])=>{if(new Set(v.map(x=>x.id)).size!==v.length)throw Error('Identificadores duplicados.');};unique(d.clients);unique(d.loans);unique(d.reminders);unique(d.cashEntries||[]);
 if((d.cashEntries||[]).filter(e=>e.kind==='opening').length>1)throw Error('Aporte inicial duplicado.');
 for(const l of d.loans){unique(l.installments);unique(l.receipts);if(l.date>today())throw Error('Liberação futura não permitida.');let amount=0,interest=0;
 for(const r of l.receipts){if(r.date<l.date||r.date>today()||r.interest+r.principal!==r.amount)throw Error('Recebimento inconsistente.');amount+=r.amount;const expected=Math.round(amount*(total(l)-l.capital)/total(l));if(r.interest!==expected-interest)throw Error('Apropriação de juros inconsistente.');interest=expected;}
 for(const p of l.installments)if(p.date<l.date)throw Error('Parcela anterior à liberação.');
 }
 return d;
}
const canonical=(x:any):any=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const same=(a:unknown,b:unknown)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export function checkTransition(before:Portfolio,after:Portfolio){
 for(const e of before.cashEntries||[])if(!same(e,after.cashEntries?.find(x=>x.id===e.id)))throw Error('Movimentação de capital não pode ser apagada ou sobrescrita. Use correção.');
 for(const l of before.loans){const n=after.loans.find(x=>x.id===l.id);if(!n){if(after.clients.some(c=>c.id===l.clientId))throw Error('Não é permitido excluir contratos financeiros.');continue;}for(const k of ['clientId','capital','rate','date','frequency'] as const)if(l[k]!==n[k])throw Error('Dados originais do contrato são imutáveis.');
 const removed=l.receipts.filter(r=>!n.receipts.some(x=>x.id===r.id));if(removed.length){const last=l.receipts.at(-1);if(removed.length!==1||removed[0].id!==last?.id||!n.reversals?.some(v=>same(v.receipt,removed[0])&&v.reason.trim()))throw Error('Use o estorno do último recebimento.');}
 for(const r of l.receipts){const nr=n.receipts.find(x=>x.id===r.id);if(nr&&!same(r,nr))throw Error('Um recebimento não pode ser alterado. Estorne e registre novamente.');}
 const allocations=new Map<string,number>();
 const added=n.receipts.filter(r=>!l.receipts.some(x=>x.id===r.id));
 for(const r of added){if(!r.allocations||r.allocations.reduce((s,a)=>s+a.amount,0)!==r.amount)throw Error('Recebimento sem alocação consistente.');for(const a of r.allocations){if(!l.installments.some(p=>p.id===a.id))throw Error('Parcela de recebimento inválida.');allocations.set(a.id,(allocations.get(a.id)||0)+a.amount);}}
 for(const r of removed){if(r.allocations)for(const a of r.allocations)allocations.set(a.id,(allocations.get(a.id)||0)-a.amount);}
 if(!removed.some(r=>!r.allocations))for(const p of l.installments){const np=n.installments.find(x=>x.id===p.id);if(!np||np.paid!==p.paid+(allocations.get(p.id)||0))throw Error('Abatimento de parcela inconsistente.');}
 for(const r of l.reversals||[])if(!n.reversals?.some(x=>same(x,r)))throw Error('Histórico de estorno não pode ser alterado.');
 }
 const additions=after.loans.filter(l=>!before.loans.some(x=>x.id===l.id));if(additions.length){const w=walletSummary({...after,loans:after.loans.filter(l=>!additions.includes(l))});if(w.configured&&additions.reduce((s,l)=>s+l.capital,0)>w.available)throw Error('Capital insuficiente para a liberação.');for(const l of additions)if(!after.clients.find(c=>c.id===l.clientId)?.active)throw Error('Cliente inativo.');}
}
