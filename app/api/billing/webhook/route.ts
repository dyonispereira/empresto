import {env} from 'cloudflare:workers';
import {isBillingConfigured,sync,refreshPayment,type SubscriptionRow} from '../../../../lib/billing';
import {safeEqual} from '../../../../lib/auth';
// Asaas calls this on payment events. The body is only a hint: the status is re-read from the Asaas API by sync().
export async function POST(req:Request){
 const expected=env.ASAAS_WEBHOOK_TOKEN,received=req.headers.get('asaas-access-token');
 if(!expected||!received||!safeEqual(received,expected))return Response.json({error:'Não autorizado'},{status:401});
 let event:{payment?:{id?:unknown;customer?:unknown;subscription?:unknown};subscription?:{id?:unknown;customer?:unknown}};try{event=await req.json()}catch{return Response.json({error:'Evento inválido'},{status:400})}
 const str=(v:unknown)=>typeof v==='string'&&v.length<=100?v:null;
 const subscriptionId=str(event?.payment?.subscription)||str(event?.subscription?.id),paymentId=str(event?.payment?.id),customerId=str(event?.payment?.customer)||str(event?.subscription?.customer);
 if(!isBillingConfigured()||(!subscriptionId&&!paymentId))return Response.json({received:true});
 let current=subscriptionId?await env.DB!.prepare('SELECT * FROM subscriptions WHERE subscription_id=?').bind(subscriptionId).first<SubscriptionRow>():null;
 // Charges of an ended subscription (plan switched, or cancelled and signed again) are found through the Asaas customer.
 if(!current&&customerId)current=await env.DB!.prepare('SELECT * FROM subscriptions WHERE customer_id=?').bind(customerId).first<SubscriptionRow>();
 // A failure here returns 500 so Asaas retries the event later.
 if(current){if(subscriptionId&&current.subscription_id===subscriptionId)await sync(current);else if(paymentId)await refreshPayment(current,paymentId);}
 return Response.json({received:true});
}
