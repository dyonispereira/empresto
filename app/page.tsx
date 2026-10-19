import PortfolioApp from './portfolio';
import {requireChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Home(){const user=await requireChatGPTUser('/');return <PortfolioApp userName={user.displayName}/>}
