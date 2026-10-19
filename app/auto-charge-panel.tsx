'use client';
import React,{useEffect,useState} from 'react';
import {MessageCircle,Send,Smartphone} from 'lucide-react';
type Entry={client:string;amount:number;due_date:string;status:string;error:string|null;sent_at:string};
type State={enabled:boolean;available:boolean;hasConnection:boolean;connected:boolean;statusError?:string;log:Entry[]};
const brl=(c:number)=>(c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const WARNING='A cobrança automática usa o seu próprio WhatsApp por um serviço que não é oficial do WhatsApp. Envios em grande quantidade podem levar o WhatsApp a bloquear o seu número. O Emprestô envia no máximo 40 cobranças por dia, com intervalo entre elas. Deseja ativar?';
// Settings card: links the user's own WhatsApp with an 8-character code typed in WhatsApp and turns the daily charge on or off.
export default function AutoChargePanel({hasPix,pixPhone,onToast}:{hasPix:boolean;pixPhone:string;onToast:(m:string)=>void}){
 const [state,setState]=useState<State|null>(null),[busy,setBusy]=useState(false),[code,setCode]=useState(''),[qr,setQr]=useState(''),[phone,setPhone]=useState(pixPhone),[testPhone,setTestPhone]=useState('');
 useEffect(()=>{fetch('/api/auto-charge',{cache:'no-store'}).then(r=>r.json() as Promise<State>).then(setState).catch(()=>{})},[]);
 async function act(body:Record<string,unknown>,done?:string){setBusy(true);try{const r=await fetch('/api/auto-charge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json() as State&{code?:string;qr?:string|null;error?:string};if(!r.ok)throw Error(j.error||'Não foi possível concluir.');setState(j);setCode(j.code||'');setQr(j.qr||'');if(body.action==='status'&&!j.connected)onToast(j.statusError?'A Z-API respondeu: '+j.statusError:'Ainda não conectado. Confira se digitou o código no WhatsApp.');else if(done)onToast(done)}catch(e){onToast((e as Error).message)}finally{setBusy(false)}}
 function toggle(){if(!state)return;if(!state.enabled&&!window.confirm(WARNING))return;act({action:'toggle',enabled:!state.enabled},state.enabled?'Cobrança automática desativada.':'Cobrança automática ativada.')}
 return <section className="panel settings auto-charge"><MessageCircle size={28}/><h2>Cobrança automática no WhatsApp</h2>
  <p>No dia do vencimento, às 9h, o Emprestô envia do <strong>seu WhatsApp</strong> a mensagem de cobrança de Meu Pix, com o valor e o Pix copia e cola.</p>
  {!state?<p className="form-note">Carregando…</p>:!state.available?<p className="billing-note">A cobrança automática está sendo ativada pelo Emprestô. Enquanto isso, use o botão “Enviar cobrança Pix” em cada empréstimo.</p>:!state.connected?<div className="auto-charge-pair">
   <strong><Smartphone size={16}/> Conectar meu WhatsApp</strong>
   {!code?<><label className="field"><span>Seu celular com DDD (o número do WhatsApp que vai cobrar)</span><input inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(65) 99999-9999"/></label><button className="btn" disabled={busy||!phone} onClick={()=>act({action:'pair',phone})}>{busy?'Gerando código…':'Gerar código de conexão'}</button></>:<>
    <div className="pair-code">{code}</div>
    <ol className="pair-steps"><li>Abra o <strong>WhatsApp</strong> neste celular.</li><li>Toque em <strong>⋮</strong> (Android) ou em <strong>Configurações</strong> (iPhone) e depois em <strong>Aparelhos conectados</strong>.</li><li>Toque em <strong>Conectar um aparelho</strong> e depois em <strong>Conectar com número de telefone</strong>.</li><li>Digite o código acima.</li></ol>
    <button className="btn" disabled={busy} onClick={()=>act({action:'status'},'WhatsApp conectado!')}>Já digitei o código</button>
    <button className="text-btn" disabled={busy} onClick={()=>act({action:'pair',phone})}>Gerar outro código</button>
   </>}
   {state.hasConnection&&!code&&<button className="btn secondary" disabled={busy} onClick={()=>act({action:'status'},'WhatsApp conectado!')}>Já conectei, verificar</button>}
   {state.hasConnection&&<button className="text-btn" disabled={busy} onClick={()=>act({action:'qr'})}>Prefiro ler um QR Code em outro aparelho</button>}
   {qr&&<div className="auto-charge-qr"><img src={qr} alt="QR Code para conectar o WhatsApp"/></div>}
  </div>:<>
   <p className="green-text"><strong>WhatsApp conectado</strong></p>
   <label className="switch-row"><span className={'switch'+(state.enabled?' on':'')}><input type="checkbox" role="switch" checked={state.enabled} disabled={busy} onChange={toggle}/><i/></span><strong>{state.enabled?'Cobrança automática ativada':'Cobrança automática desativada'}</strong></label>
   {!hasPix&&<p className="red-text">Cadastre sua chave em Meu Pix para as cobranças saírem.</p>}
   <div className="auto-charge-test"><input placeholder="Celular para teste, com DDD" inputMode="tel" value={testPhone} onChange={e=>setTestPhone(e.target.value)}/><button className="btn secondary" disabled={busy||!testPhone} onClick={()=>act({action:'test',phone:testPhone},'Mensagem de teste enviada.')}><Send size={15}/>Enviar teste</button></div>
   <button className="text-btn danger" disabled={busy} onClick={()=>act({action:'disconnect'},'WhatsApp desconectado do Emprestô.')}>Desconectar WhatsApp</button>
  </>}
  <p className="form-note">Envio de no máximo 40 cobranças por dia, com intervalo entre as mensagens. Os clientes precisam ter celular com DDD cadastrado. Avise seus clientes que eles vão receber lembretes pelo WhatsApp.</p>
  {!!state?.log.length&&<div className="auto-charge-log"><strong>Últimos envios</strong>{state.log.map(e=><div key={e.sent_at+e.client}><span>{e.client} · {brl(e.amount)} · {e.due_date.split('-').reverse().join('/')}</span><small className={e.status==='sent'?'green-text':'red-text'}>{e.status==='sent'?'Enviada':e.status==='failed'?'Falhou: '+(e.error||''):'Enviando'}</small></div>)}</div>}
 </section>;
}
