import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {readCookie,userFromToken,userById,INSPECT_COOKIE,type User} from '../lib/auth';
import {admin} from '../lib/billing';
export type {User};
// The signed-in person, ignoring any inspection.
export async function getRealUser():Promise<User|null>{return userFromToken(readCookie((await headers()).get('cookie')));}
// While the administrator inspects an account, pages and APIs see that account, marked with `inspecting`.
export async function getUser():Promise<User|null>{
 const cookie=(await headers()).get('cookie');const real=await userFromToken(readCookie(cookie));if(!real)return null;
 const inspect=readCookie(cookie,INSPECT_COOKIE);if(!inspect||!admin(real.email))return real;
 const [id,mode]=inspect.split('.');const target=await userById(id);if(!target||admin(target.email))return real;
 return {...target,inspecting:{admin:real.email,readOnly:mode!=='rw'}};
}
export async function requireUser():Promise<User>{const user=await getUser();if(user)return user;redirect('/entrar');}
// Refusal for changes made while inspecting in read-only mode.
export const readOnlyBlock=(u:User)=>u.inspecting?.readOnly?Response.json({error:'Modo inspeção somente leitura. Toque em "Permitir alterações" para editar.'},{status:403}):null;
