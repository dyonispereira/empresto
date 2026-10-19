import {env} from 'cloudflare:workers';
import {Portfolio,empty} from './model';
import {checkPortfolio,checkTransition} from './validation';
export async function readPortfolio(owner:string){return await env.DB!.prepare('SELECT data,revision FROM portfolios WHERE owner=?').bind(owner).first<{data:string;revision:number}>();}
export async function commitPortfolio(owner:string,value:unknown,revision:number,action:string,restore=false){
 if(!Number.isInteger(revision)||revision<0)throw Error('Versão inválida.');
 const data=checkPortfolio(value),previous=await readPortfolio(owner);const previousData=previous?JSON.parse(previous.data):empty;
 if(previous?.revision!==revision&&!(revision===0&&!previous)){
 if(previous&&JSON.stringify(data)===previous.data)return {revision:previous.revision};
 throw Error('CONFLICT: A carteira mudou em outra aba. Recarregue para continuar.');}
 if(!restore)checkTransition(previousData,data);
 const json=JSON.stringify(data);if(json.length>12000000)throw Error('Carteira muito grande. Exporte um backup e procure suporte.');
 const id=crypto.randomUUID(),key=`${owner}/backups/${id}.json`,created=new Date().toISOString();
 if(previous)await env.BUCKET!.put(key,previous.data,{httpMetadata:{contentType:'application/json'}});
 const queries=[];
 if(previous)queries.push(env.DB!.prepare('INSERT INTO backups(id,owner,revision,key,created_at,action) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM portfolios WHERE owner=? AND revision=?)').bind(id,owner,revision,key,created,action,owner,revision));
 queries.push(revision===0?env.DB!.prepare('INSERT OR IGNORE INTO portfolios(owner,data,revision) VALUES(?,?,1)').bind(owner,json):env.DB!.prepare('UPDATE portfolios SET data=?,revision=revision+1 WHERE owner=? AND revision=?').bind(json,owner,revision));
 const result=await env.DB!.batch(queries);if(result.at(-1)!.meta.changes===0){if(previous)await env.BUCKET!.delete(key);throw Error('CONFLICT: Outra alteração foi salva. Recarregue sua carteira.');}
 return {revision:revision+1};
}
