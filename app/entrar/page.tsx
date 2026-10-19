import {redirect} from 'next/navigation';
import {getUser} from '../auth';
import LoginForm from './login-form';
export const dynamic='force-dynamic';
export const metadata={title:'Entrar — Emprestô'};
export default async function SignInPage(){if(await getUser())redirect('/');return <LoginForm/>}
