import PortfolioApp from './portfolio';
import Landing from './landing';
import {getUser} from './auth';
import {admin} from '../lib/billing';
export const dynamic='force-dynamic';
// Visitors see the landing page; signed-in users go straight to their wallet.
export default async function Home(){const user=await getUser();if(!user)return <Landing/>;return <PortfolioApp userName={user.displayName} isAdmin={admin(user.email)} inspecting={user.inspecting?{userId:user.userId,name:user.displayName,email:user.email,readOnly:user.inspecting.readOnly}:undefined}/>}
