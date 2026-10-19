import {redirect} from 'next/navigation';
import {getRealUser} from '../auth';
import {admin} from '../../lib/billing';
import AdminPanel from './admin-panel';
export const dynamic='force-dynamic';
export const metadata={title:'Painel administrativo — Emprestô'};
export default async function AdminPage(){const user=await getRealUser();if(!user)redirect('/entrar');if(!admin(user.email))redirect('/');return <AdminPanel/>}
