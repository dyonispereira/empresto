import {getUser} from '../../auth';
import {autoChargeSettings,setAutoCharge,setConnection,autoChargeLog} from '../../../lib/auto-charge';
import {isPartnerConfigured,createInstance,pairingCode,whatsappStatus,whatsappQr,disconnectWhatsApp,sendWhatsApp} from '../../../lib/whatsapp';
import {readPortfolio} from '../../../lib/persistence';
import {pixPayload,chargeMessage} from '../../../lib/pix';
import {today,type Portfolio} from '../../../lib/model';
import {admin} from '../../../lib/billing';
import {env} from 'cloudflare:workers';
// Without a partner account, the admin can test with a single Z-API instance whose credentials live only in Cloudflare secrets.
const ownInstance=(email:string)=>admin(email)&&env.ZAPI_INSTANCE_ID&&env.ZAPI_INSTANCE_TOKEN?{instanceId:env.ZAPI_INSTANCE_ID,token:env.ZAPI_INSTANCE_TOKEN,clientToken:null}:null;
const headers={'Cache-Control':'no-store'};
// The Z-API token never goes back to the browser; only whether a connection exists and its WhatsApp status.
async function state(owner:string,email:string){const s=await autoChargeSettings(owner);let connected=false;if(s.connection)connected=await whatsappStatus(s.connection).catch(()=>false);return {enabled:s.enabled,available:isPartnerConfigured()||!!s.connection||!!ownInstance(email),hasConnection:!!s.connection,connected,log:await autoChargeLog(owner)};}
export async function GET(){const u=await getUser();if(!u)return Response.json({error:'Não autorizado'},{status:401});return Response.json(await state(u.userId,u.email),{headers})}
export async function POST(req:Request){
 const u=await getUser();if(!u)return Response.json({error:'Não autorizado'},{status:401});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origem inválida'},{status:403});
 try{
  const input=await req.json() as {action?:string;enabled?:unknown;phone?:unknown};
  let {connection}=await autoChargeSettings(u.userId);
  if(input.action==='toggle'){if(typeof input.enabled!=='boolean')throw Error('Dados inválidos.');if(input.enabled&&!(connection&&await whatsappStatus(connection).catch(()=>false)))throw Error('Conecte seu WhatsApp antes de ativar.');await setAutoCharge(u.userId,input.enabled);}
  else if(input.action==='pair'){
   if(!connection&&ownInstance(u.email)){connection=ownInstance(u.email)!;await setConnection(u.userId,connection);}
   if(!connection){if(!isPartnerConfigured())throw Error('A conexão de WhatsApp ainda está sendo ativada pelo Emprestô.');connection=await createInstance('Emprestô '+u.email);await setConnection(u.userId,connection);}
   return Response.json({...await state(u.userId,u.email),code:await pairingCode(connection,String(input.phone||''))},{headers});
  }
  else if(input.action==='qr'){if(!connection)throw Error('Gere o código de conexão primeiro.');return Response.json({...await state(u.userId,u.email),qr:await whatsappQr(connection)},{headers});}
  else if(input.action==='status'){}
  else if(input.action==='disconnect'){if(connection)await disconnectWhatsApp(connection);await setAutoCharge(u.userId,false);}
  else if(input.action==='test'){if(!connection)throw Error('Conecte seu WhatsApp primeiro.');const row=await readPortfolio(u.userId);const pix=row?(JSON.parse(row.data) as Portfolio).pixSettings:undefined;if(!pix?.key)throw Error('Cadastre sua chave em Meu Pix para testar a mensagem de cobrança.');await sendWhatsApp(connection,String(input.phone||''),'[Teste] '+chargeMessage(pix,'Cliente teste',1000,today(),pixPayload(pix,1000)));}
  else throw Error('Ação inválida.');
  return Response.json(await state(u.userId,u.email),{headers});
 }catch(e){return Response.json({error:(e as Error).message},{status:400,headers})}
}
