import {redirect} from 'next/navigation';
import {getUser} from '../auth';
import LoginForm from './login-form';
export const dynamic='force-dynamic';
export const metadata={title:'Entrar — Emprestô'};
export default async function SignInPage({searchParams}:{searchParams:Promise<{modo?:string}>}){if(await getUser())redirect('/');return <LoginForm initialMode={(await searchParams).modo==='cadastrar'?'cadastrar':'entrar'}/>}
