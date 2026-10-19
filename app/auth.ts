import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {readCookie,userFromToken,type User} from '../lib/auth';
export type {User};
export async function getUser():Promise<User|null>{return userFromToken(readCookie((await headers()).get('cookie')));}
export async function requireUser():Promise<User>{const user=await getUser();if(user)return user;redirect('/entrar');}
