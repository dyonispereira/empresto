import {Wallet,BellRing,MessageCircle,LineChart,CalendarClock,ShieldCheck,Smartphone,ClipboardList,UserPlus,HandCoins,Check,ArrowRight,NotebookPen,AlarmClockOff,Frown,CircleDollarSign} from 'lucide-react';
import PremiumBg from './premium-bg';
const SIGNUP='/entrar?modo=cadastrar';
const PAINS:[typeof Wallet,string,string][]=[
 [NotebookPen,'Tudo no caderno','Você não sabe ao certo quanto tem na rua nem quanto já recebeu.'],
 [AlarmClockOff,'Vencimento esquecido','O atraso só aparece semanas depois, quando já virou dor de cabeça.'],
 [Frown,'Cobrar dá vergonha','Mandar mensagem para amigo ou parente cobrando é sempre desconfortável.'],
 [CircleDollarSign,'"Eu já te paguei"','Sem registro, fica a sua palavra contra a do cliente.'],
];
const FEATURES:[typeof Wallet,string,string][]=[
 [LineChart,'Indicadores claros','Capital emprestado, a receber, em atraso e juros recebidos em um só painel.'],
 [CalendarClock,'Agenda de parcelas','Veja quem vence hoje, nesta semana e quem está atrasado.'],
 [MessageCircle,'Cobrança no WhatsApp','Mensagem educada e pronta, com valor e Pix copia e cola. É só enviar.'],
 [ClipboardList,'Histórico de cada cliente','Todo pagamento registrado, para nunca mais discutir valor.'],
 [ShieldCheck,'Seus dados protegidos','Acesso com e-mail e senha e cópias de segurança na nuvem.'],
 [Smartphone,'Tudo pelo celular','Abre no navegador do celular, sem instalar nada.'],
];
const STEPS:[typeof Wallet,string,string][]=[
 [UserPlus,'Crie sua conta','Grátis, em menos de 1 minuto, só com e-mail e senha.'],
 [HandCoins,'Cadastre os empréstimos','Cliente, valor, juros e parcelas. O Emprestô calcula o resto.'],
 [BellRing,'Receba no dia certo','Acompanhe os vencimentos e cobre pelo WhatsApp com um toque.'],
];
const FAQ:[string,string][]=[
 ['Preciso instalar algum aplicativo?','Não. O Emprestô abre no navegador do celular ou do computador. Você pode adicionar um atalho na tela inicial.'],
 ['É grátis mesmo?','Sim. Você usa todos os recursos de graça com até 5 clientes. A partir do 6º cliente, a assinatura custa R$ 29,90 por mês.'],
 ['Como funciona a cobrança pelo WhatsApp?','No dia do vencimento, o Emprestô mostra quem precisa pagar e monta a mensagem com o valor e o seu Pix. Você toca em enviar e pronto.'],
 ['Meus clientes veem alguma coisa?','Não. Só você acessa a sua carteira. Seus clientes recebem apenas as mensagens que você enviar.'],
 ['Posso cancelar quando quiser?','Pode. Não há fidelidade nem multa.'],
];
export default function Landing(){
 return <div className="lp">
  <header className="lp-hero">
   <PremiumBg/>
   <nav className="lp-nav"><span className="lp-logo"><span className="brand-icon"><Wallet size={20}/></span><span>Emprestô<span className="brand-dot">.</span></span></span><a className="lp-nav-link" href="/entrar">Entrar</a></nav>
   <div className="lp-hero-grid">
    <div className="lp-hero-copy">
     <span className="lp-pill">Controle de empréstimos pessoais</span>
     <h1>Seu dinheiro emprestado sob controle, direto do celular.</h1>
     <p>Saiba quem deve, quanto e quando. O Emprestô organiza seus empréstimos, mostra seus resultados e deixa a cobrança pronta no WhatsApp no dia certo.</p>
     <div className="lp-cta"><a className="lp-btn" href={SIGNUP}>Começar grátis<ArrowRight size={18}/></a><a className="lp-btn ghost" href="/entrar">Já tenho conta</a></div>
     <small className="lp-hint">Grátis até 5 clientes. Sem cartão de crédito.</small>
    </div>
    <div className="lp-phone" aria-hidden="true"><div className="lp-screen">
     <div className="lp-screen-top"><span>Visão geral</span><b>Outubro</b></div>
     <div className="lp-stat lp-stat-main"><span>Capital emprestado</span><strong>R$ 24.800,00</strong></div>
     <div className="lp-stat-row"><div className="lp-stat"><span>A receber</span><strong>R$ 29.150</strong></div><div className="lp-stat"><span>Juros recebidos</span><strong className="gold">R$ 3.420</strong></div></div>
     <div className="lp-list-title">Vencem hoje</div>
     {[['Carlos M.','R$ 450,00'],['Fernanda R.','R$ 320,00'],['Paulo S.','R$ 780,00']].map(([n,v])=><div className="lp-due" key={n}><span className="lp-avatar">{n[0]}</span><span>{n}<small>{v}</small></span><span className="lp-wa"><MessageCircle size={14}/>Cobrar</span></div>)}
    </div></div>
   </div>
  </header>

  <section className="lp-section">
   <h2>Emprestar é fácil. Difícil é controlar.</h2>
   <p className="lp-lead">Se você empresta para amigos, vizinhos ou clientes, provavelmente já passou por isso:</p>
   <div className="lp-cards four">{PAINS.map(([Icon,t,d])=><div className="lp-card pain" key={t}><Icon size={22}/><h3>{t}</h3><p>{d}</p></div>)}</div>
  </section>

  <section className="lp-section alt">
   <h2>Tranquilidade para emprestar, organização para receber.</h2>
   <div className="lp-cards">{FEATURES.map(([Icon,t,d])=><div className="lp-card" key={t}><span className="lp-icon"><Icon size={20}/></span><h3>{t}</h3><p>{d}</p></div>)}</div>
  </section>

  <section className="lp-section">
   <h2>Comece em 3 passos</h2>
   <ol className="lp-steps">{STEPS.map(([Icon,t,d],i)=><li key={t}><span className="lp-step-n">{i+1}</span><Icon size={22}/><h3>{t}</h3><p>{d}</p></li>)}</ol>
  </section>

  <section className="lp-section dark">
   <div className="lp-wa-grid">
    <div><h2>Cobrança no WhatsApp, sem constrangimento.</h2><p className="lp-lead">No dia do vencimento, a mensagem já está pronta, com o valor da parcela e o seu Pix copia e cola. Você só toca em enviar.</p><a className="lp-btn" href={SIGNUP}>Quero organizar meus empréstimos<ArrowRight size={18}/></a></div>
    <div className="lp-bubble" aria-hidden="true"><p>Olá, Carlos! Tudo bem? Passando para lembrar da parcela 3 de 6, no valor de <b>R$ 450,00</b>, que vence hoje.</p><p>Pix copia e cola:<br/><code>00020126580014BR.GOV.BCB.PIX…</code></p><small>09:00 ✓✓</small></div>
   </div>
  </section>

  <section className="lp-section" id="planos">
   <h2>Preço simples</h2>
   <div className="lp-plans">
    <div className="lp-plan"><h3>Grátis</h3><strong>R$ 0</strong><span>para sempre</span><ul>{['Até 5 clientes','Todos os indicadores','Cobrança pelo WhatsApp','Histórico completo'].map(x=><li key={x}><Check size={16}/>{x}</li>)}</ul><a className="lp-btn ghost dark-text" href={SIGNUP}>Começar grátis</a></div>
    <div className="lp-plan featured"><span className="lp-badge">Mais completo</span><h3>Emprestô Completo</h3><strong>R$ 29,90</strong><span>por mês</span><ul>{['Clientes ilimitados','Tudo do plano grátis','Pagamento por Pix, boleto ou cartão','Cancele quando quiser'].map(x=><li key={x}><Check size={16}/>{x}</li>)}</ul><a className="lp-btn" href={SIGNUP}>Assinar depois de testar</a></div>
   </div>
  </section>

  <section className="lp-section alt">
   <h2>Perguntas frequentes</h2>
   <div className="lp-faq">{FAQ.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
  </section>

  <section className="lp-final">
   <PremiumBg/>
   <h2>Seu dinheiro trabalhando, e você no controle.</h2>
   <a className="lp-btn" href={SIGNUP}>Criar minha conta grátis<ArrowRight size={18}/></a>
  </section>

  <footer className="lp-footer"><span>© {new Date().getFullYear()} Emprestô · seu app de gestão de empréstimos</span><span>O Emprestô é uma ferramenta de organização. Não oferece crédito nem intermedeia empréstimos.</span></footer>
 </div>;
}
