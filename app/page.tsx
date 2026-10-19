import PortfolioApp from './portfolio';
import {requireUser} from './auth';
import {admin} from '../lib/billing';
export const dynamic='force-dynamic';
export default async function Home(){const user=await requireUser();return <PortfolioApp userName={user.displayName} isAdmin={admin(user.email)}/>}
