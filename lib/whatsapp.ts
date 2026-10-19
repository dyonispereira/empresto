import {env} from 'cloudflare:workers';
// Z-API: sends from the user's own WhatsApp. Emprestô's partner account creates one instance per user, and the user
// links it by typing an 8-character code in WhatsApp (Linked devices → Link with phone number), so no QR scan is needed.
export type ZapiConnection={instanceId:string;token:string;clientToken:string|null};
const BASE='https://api.z-api.io/instances/';
export const isPartnerConfigured=()=>!!env.ZAPI_PARTNER_TOKEN;
async function call<T>(url:string,init:{method?:string;headers?:Record<string,string>;body?:unknown}={}):Promise<T>{
 const r=await fetch(url,{method:init.method||(init.body===undefined?'GET':'POST'),headers:{'Content-Type':'application/json',...init.headers},body:init.body===undefined?undefined:JSON.stringify(init.body),signal:AbortSignal.timeout(15000)});
 const j=await r.json().catch(()=>({})) as T&{error?:string;message?:string};
 if(!r.ok||j.error)throw Error(j.message||j.error||'O serviço de WhatsApp não respondeu. Tente de novo em instantes.');
 return j;
}
const zapi=<T>(c:ZapiConnection,path:string,body?:unknown)=>{const client=c.clientToken||env.ZAPI_CLIENT_TOKEN;return call<T>(`${BASE}${encodeURIComponent(c.instanceId)}/token/${encodeURIComponent(c.token)}/${path}`,{headers:client?{'Client-Token':client}:{},body});};
const partner={Authorization:'Bearer '+(env.ZAPI_PARTNER_TOKEN||'')};
// Creates and activates a new instance on Emprestô's partner account.
export async function createInstance(name:string):Promise<ZapiConnection>{
 const created=await call<{id?:string;token?:string}>(BASE+'integrator/on-demand',{headers:partner,body:{name:name.slice(0,60)}});
 if(!created.id||!created.token)throw Error('Não foi possível preparar seu WhatsApp. Tente de novo em instantes.');
 const c={instanceId:created.id,token:created.token,clientToken:null};
 await call(`${BASE}${encodeURIComponent(c.instanceId)}/token/${encodeURIComponent(c.token)}/integrator/on-demand/subscription`,{headers:partner,body:{}});
 return c;
}
export const toWhatsAppNumber=(phone:string)=>{const d=phone.replace(/\D/g,'');const n=d.startsWith('55')?d:'55'+d;return /^55\d{10,11}$/.test(n)?n:null;};
export const whatsappStatus=(c:ZapiConnection)=>zapi<{connected?:boolean}>(c,'status').then(s=>!!s.connected);
export const whatsappQr=(c:ZapiConnection)=>zapi<{value?:string}>(c,'qr-code/image').then(q=>q.value||null);
export async function pairingCode(c:ZapiConnection,phone:string){
 const n=toWhatsAppNumber(phone);if(!n)throw Error('Informe seu celular com DDD.');
 const j=await zapi<{value?:string;challenge?:unknown}>(c,'phone-code/'+n);
 // WhatsApp accounts protected by a passkey get a WebAuthn challenge instead of a code; a website can't answer it.
 if(j.challenge)throw Error('Seu WhatsApp pede a chave de acesso (passkey). Use a opção do QR Code abaixo ou remova a chave de acesso em WhatsApp → Configurações → Conta → Chaves de acesso.');
 if(!j.value){console.log('zapi phone-code without value',Object.keys(j));throw Error('O WhatsApp não gerou o código. Tente de novo.');}
 return j.value;
}
export const disconnectWhatsApp=(c:ZapiConnection)=>zapi(c,'disconnect').catch(()=>null);
export async function sendWhatsApp(c:ZapiConnection,phone:string,message:string){
 const to=toWhatsAppNumber(phone);if(!to)throw Error('Celular inválido. Use DDD e número.');
 const j=await zapi<{zaapId?:string;messageId?:string}>(c,'send-text',{phone:to,message,delayMessage:5});
 return j.messageId||j.zaapId||'';
}
