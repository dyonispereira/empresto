import {env} from 'cloudflare:workers';
// Encrypts third-party tokens kept in D1 with AES-GCM, keyed by the DATA_ENCRYPTION_KEY secret.
// Without the secret, values are stored as before; with it, old plain values still read and are re-sealed on the next save.
const PREFIX='enc1:';
const enc=new TextEncoder(),dec=new TextDecoder();
const b64=(b:ArrayBuffer|Uint8Array)=>btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
let cached:{secret:string;key:Promise<CryptoKey>}|null=null;
function key(){const secret=env.DATA_ENCRYPTION_KEY;if(!secret)return null;if(cached?.secret!==secret)cached={secret,key:crypto.subtle.digest('SHA-256',enc.encode(secret)).then(raw=>crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']))};return cached.key;}
export const isSealed=(value:string)=>value.startsWith(PREFIX);
export const canSeal=()=>!!env.DATA_ENCRYPTION_KEY;
export async function seal(value:string|null){const k=key();if(value===null||!k)return value;const iv=crypto.getRandomValues(new Uint8Array(12));return PREFIX+b64(iv)+'.'+b64(await crypto.subtle.encrypt({name:'AES-GCM',iv},await k,enc.encode(value)));}
export async function open(value:string|null){if(value===null||!isSealed(value))return value;const k=key();if(!k)throw Error('Chave de criptografia ausente: configure DATA_ENCRYPTION_KEY.');const [iv,data]=value.slice(PREFIX.length).split('.');return dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(iv)},await k,unb64(data)));}
