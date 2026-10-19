import {getRealUser as getUser} from '../../../auth';
import {admin} from '../../../../lib/billing';
import {listSubscribers} from '../../../../lib/admin';
export async function GET(){const u=await getUser();if(!u||!admin(u.email))return Response.json({error:'Acesso restrito ao administrador.'},{status:403});return Response.json({users:await listSubscribers()},{headers:{'Cache-Control':'no-store'}})}
