import {env} from 'cloudflare:workers';
import {isBillingConfigured,sync,type SubscriptionRow} from '../../../../lib/billing';
import {safeEqual} from '../../../../lib/auth';
// Asaas calls this on payment events. The body is only a hint: the status is re-read from the Asaas API by sync().
export async function POST(req:Request){
 const expected=env.ASAAS_WEBHOOK_TOKEN,received=req.headers.get('asaas-access-token');
 if(!expected||!received||!safeEqual(received,expected))return Response.json({error:'Não autorizado'},{status:401});
 let event:{payment?:{subscription?:unknown};subscription?:{id?:unknown}};try{event=await req.json()}catch{return Response.json({error:'Evento inválido'},{status:400})}
 const subscriptionId=event?.payment?.subscription||event?.subscription?.id;
 if(!isBillingConfigured()||typeof subscriptionId!=='string')return Response.json({received:true});
 const current=await env.DB!.prepare('SELECT * FROM subscriptions WHERE subscription_id=?').bind(subscriptionId).first<SubscriptionRow>();
 // A failure here returns 500 so Asaas retries the event later.
 if(current)await sync(current);
 return Response.json({received:true});
}
