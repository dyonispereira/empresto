import {clearedInspectCookie} from '../../../../lib/auth';
import {sameOrigin} from '../../auth/shared';
// Ends the inspection and goes back to the admin panel.
export async function POST(req:Request){if(!sameOrigin(req))return new Response('Origem inválida',{status:403});return new Response(null,{status:303,headers:{Location:'/admin','Set-Cookie':clearedInspectCookie,'Cache-Control':'no-store'}})}
