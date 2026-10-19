import {env} from 'cloudflare:workers';
export type User={userId:string;email:string;displayName:string;inspecting?:{admin:string;readOnly:boolean}};
export const SESSION_COOKIE='__Host-empresto_session';
// Set while the administrator inspects a subscriber's account: `<userId>.ro` (read only) or `<userId>.rw`.
export const INSPECT_COOKIE='__Host-empresto_inspect';
export const inspectCookie=(userId:string,mode:'ro'|'rw')=>`${INSPECT_COOKIE}=${userId}.${mode}; Path=/; Max-Age=7200; HttpOnly; Secure; SameSite=Lax`;
export const clearedInspectCookie=`${INSPECT_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
export const SESSION_DAYS=30;
// Cloudflare Workers caps PBKDF2 at 100k iterations.
const ITERATIONS=100000,MAX_FAILURES=5,LOCK_MINUTES=15;
const enc=new TextEncoder();
const b64=(b:ArrayBuffer|Uint8Array)=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=(s:string):Uint8Array<ArrayBuffer>=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export function safeEqual(a:string,b:string){const x=enc.encode(a),y=enc.encode(b);let diff=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)diff|=(x[i]??0)^(y[i]??0);return diff===0;}
export const normalizeEmail=(email:string)=>String(email||'').trim().toLowerCase();
export const validEmail=(email:string)=>email.length<=200&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export function passwordProblem(password:string){if(typeof password!=='string'||password.length<8)return 'A senha precisa ter pelo menos 8 caracteres.';if(password.length>200)return 'Senha longa demais.';return null;}
async function derive(password:string,salt:Uint8Array<ArrayBuffer>,iterations:number){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);return crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256);}
export async function hashPassword(password:string){const salt=crypto.getRandomValues(new Uint8Array(16));return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(await derive(password,salt,ITERATIONS))}`;}
export async function verifyPassword(password:string,stored:string){const [kind,iterations,salt,hash]=stored.split('$');if(kind!=='pbkdf2'||!salt||!hash)return false;return safeEqual(b64(await derive(password,unb64(salt),Number(iterations))),hash);}
async function sha256(value:string){return b64(await crypto.subtle.digest('SHA-256',enc.encode(value)));}
// A fixed hash so unknown e-mails cost the same time as wrong passwords.
const DUMMY_HASH='pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
type UserRow={id:string;email:string;name:string;password_hash:string;failed_logins:number;locked_until:string|null};
async function createSession(userId:string){const token=b64(crypto.getRandomValues(new Uint8Array(32)));const now=new Date();const expires=new Date(now.getTime()+SESSION_DAYS*864e5);await env.DB!.prepare('INSERT INTO sessions(id,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(await sha256(token),userId,expires.toISOString(),now.toISOString()).run();return token;}
export async function signUp(input:{name:string;email:string;password:string}){
 const name=String(input.name||'').trim().slice(0,120),email=normalizeEmail(input.email);
 if(!name)throw Error('Informe seu nome.');if(!validEmail(email))throw Error('Informe um e-mail válido.');const problem=passwordProblem(input.password);if(problem)throw Error(problem);
 const id=crypto.randomUUID();const r=await env.DB!.prepare('INSERT OR IGNORE INTO users(id,email,name,password_hash,created_at) VALUES(?,?,?,?,?)').bind(id,email,name,await hashPassword(input.password),new Date().toISOString()).run();
 if(r.meta.changes!==1)throw Error('Este e-mail já tem cadastro. Use "Entrar".');
 return createSession(id);
}
export async function signIn(input:{email:string;password:string}){
 const email=normalizeEmail(input.email);const user=await env.DB!.prepare('SELECT * FROM users WHERE email=?').bind(email).first<UserRow>();
 if(user?.locked_until&&new Date(user.locked_until).getTime()>Date.now())throw Error(`Muitas tentativas. Tente de novo em ${LOCK_MINUTES} minutos.`);
 const ok=await verifyPassword(String(input.password||''),user?.password_hash||DUMMY_HASH);
 if(!user||!ok){if(user){const fails=user.failed_logins+1;await env.DB!.prepare('UPDATE users SET failed_logins=?,locked_until=? WHERE id=?').bind(fails>=MAX_FAILURES?0:fails,fails>=MAX_FAILURES?new Date(Date.now()+LOCK_MINUTES*6e4).toISOString():null,user.id).run();}throw Error('E-mail ou senha incorretos.');}
 if(user.failed_logins||user.locked_until)await env.DB!.prepare('UPDATE users SET failed_logins=0,locked_until=NULL WHERE id=?').bind(user.id).run();
 return createSession(user.id);
}
export async function userFromToken(token:string|null|undefined):Promise<User|null>{
 if(!token||token.length>100)return null;
 const row=await env.DB!.prepare('SELECT u.id,u.email,u.name,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=?').bind(await sha256(token)).first<{id:string;email:string;name:string;expires_at:string}>();
 if(!row||new Date(row.expires_at).getTime()<=Date.now())return null;
 return {userId:row.id,email:row.email,displayName:row.name||row.email};
}
export async function userById(id:string):Promise<User|null>{const row=await env.DB!.prepare('SELECT id,email,name FROM users WHERE id=?').bind(id).first<{id:string;email:string;name:string}>();return row?{userId:row.id,email:row.email,displayName:row.name||row.email}:null;}
// Temporary password the administrator hands to a subscriber who lost theirs; it signs them out everywhere.
export async function resetPassword(userId:string){const alphabet='abcdefghjkmnpqrstuvwxyz23456789';const bytes=crypto.getRandomValues(new Uint8Array(10));const password=Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');const r=await env.DB!.prepare('UPDATE users SET password_hash=?,failed_logins=0,locked_until=NULL WHERE id=?').bind(await hashPassword(password),userId).run();if(r.meta.changes!==1)throw Error('Assinante não encontrado.');await env.DB!.prepare('DELETE FROM sessions WHERE user_id=?').bind(userId).run();return password;}
export async function signOut(token:string|null|undefined){if(token)await env.DB!.prepare('DELETE FROM sessions WHERE id=?').bind(await sha256(token)).run();}
export function readCookie(header:string|null,name=SESSION_COOKIE){for(const part of (header||'').split(';')){const i=part.indexOf('=');if(i>0&&part.slice(0,i).trim()===name)return part.slice(i+1).trim();}return null;}
export function sessionCookie(token:string){return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_DAYS*86400}; HttpOnly; Secure; SameSite=Lax`;}
export const clearedCookie=`${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
