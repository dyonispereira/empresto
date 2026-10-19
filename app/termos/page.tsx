import LegalPage from '../legal-page';
import {COMPANY,supportEmail} from '../../lib/legal';
import {getTiers,tierLabel,brlCents,getYearlyDiscount,CYCLES} from '../../lib/pricing';
export const dynamic='force-dynamic';
export const metadata={title:'Termos de Uso — Emprestô'};
export default async function TermsPage(){
 const [tiers,discount]=await Promise.all([getTiers(),getYearlyDiscount()]);const email=supportEmail();
 return <LegalPage title="Termos de Uso">
  <p>Estes Termos regem o uso do <strong>Emprestô</strong>, aplicativo de gestão de empréstimos pessoais oferecido por {COMPANY} (“Emprestô”, “nós”). Ao criar uma conta, você declara que leu e concorda com estes Termos e com a <a href="/privacidade">Política de Privacidade</a>.</p>

  <h2>1. O que é o Emprestô</h2>
  <p>O Emprestô é uma ferramenta de organização para quem empresta dinheiro a outras pessoas: registro de clientes, empréstimos, parcelas, recebimentos, indicadores e lembretes de cobrança.</p>
  <p>O Emprestô <strong>não</strong> é instituição financeira, <strong>não</strong> concede crédito, <strong>não</strong> intermedeia empréstimos e <strong>não</strong> recebe nem repassa os valores emprestados. O dinheiro dos seus empréstimos circula diretamente entre você e seus clientes, inclusive pela sua própria chave Pix cadastrada em “Meu Pix”.</p>

  <h2>2. Sua responsabilidade pelos empréstimos</h2>
  <p>Você é o único responsável pelos empréstimos que registra, pelas taxas que combina e pela forma como cobra. Você se compromete a cumprir a legislação brasileira, incluindo os limites legais de juros entre particulares (Código Civil e Lei da Usura, Decreto nº 22.626/1933), o Código de Defesa do Consumidor quando aplicável e a proibição de cobrança abusiva, vexatória ou com ameaça.</p>
  <p>É proibido usar o Emprestô para atividade ilícita, para cobrar juros acima do permitido em lei, para lavagem de dinheiro ou para constranger devedores. Podemos suspender a conta de quem fizer isso.</p>

  <h2>3. Conta e acesso</h2>
  <p>Você deve informar dados verdadeiros, manter sua senha em segredo e nos avisar se suspeitar de uso indevido. Sua senha é guardada de forma criptografada e nem nós conseguimos vê-la. Se você esquecer a senha, o suporte pode gerar uma senha provisória, que você deve trocar.</p>

  <h2>4. Planos e preços</h2>
  <p>O Emprestô é pago por assinatura, conforme a quantidade de clientes cadastrados na sua conta. Preços mensais vigentes:</p>
  <ul>{tiers.map(t=><li key={String(t.upTo)}>{tierLabel(tiers,t)}: <strong>{brlCents(t.price)}</strong> por mês</li>)}</ul>
  <p>Você pode pagar por período {Object.values(CYCLES).map(c=>c.label.toLowerCase()).join(', ').replace(/, ([^,]*)$/,' ou $1')}. O valor do período é o preço mensal multiplicado pelo número de meses{discount>0&&<>, com <strong>{discount}% de desconto no plano anual</strong></>}. O valor exato aparece na tela de pagamento antes de você confirmar. Condições especiais podem ser combinadas individualmente com o suporte.</p>
  <p>O pagamento é feito por Pix ou cartão de crédito, processado pela Asaas Gestão Financeira. Não guardamos dados do seu cartão.</p>

  <h2>5. Liberação, renovação e cancelamento</h2>
  <ul>
   <li>O acesso é liberado após a confirmação do pagamento e vale por 1, 3, 6 ou 12 meses, conforme o período escolhido, contados a partir do vencimento da cobrança paga.</li>
   <li>A assinatura é renovada automaticamente: ao fim de cada período, uma nova cobrança é gerada com o mesmo período. No plano anual, a nova cobrança vem após 12 meses.</li>
   <li>Se a nova cobrança não for paga, o acesso às funções do aplicativo é bloqueado até o pagamento. Seus dados continuam guardados conforme a Política de Privacidade.</li>
   <li>Você pode cancelar a renovação a qualquer momento pelo suporte. O cancelamento vale para as próximas cobranças; o período já pago continua liberado até o fim.</li>
   <li><strong>Direito de arrependimento:</strong> por ser contratação pela internet, você pode desistir em até 7 dias da primeira contratação e receber de volta o valor pago (art. 49 do Código de Defesa do Consumidor). Basta pedir ao suporte.</li>
   <li>Fora desse caso, não há reembolso proporcional de períodos já iniciados.</li>
  </ul>
  <p>Podemos alterar os preços. A mudança vale só para cobranças futuras e será informada com pelo menos 30 dias de antecedência.</p>

  <h2>6. Cobrança automática por WhatsApp</h2>
  <p>Quando você ativa a cobrança automática, o Emprestô envia, pelo seu número de WhatsApp conectado, mensagens de lembrete aos seus clientes com o valor devido e o código Pix da sua chave. O envio usa um serviço de terceiros (Z-API) que não é oficial do WhatsApp. Por isso existe risco de o WhatsApp restringir ou bloquear o número conectado, e não garantimos a entrega das mensagens. Você é responsável pelo conteúdo cobrado e deve enviar mensagens apenas a quem tem relação de empréstimo com você.</p>

  <h2>7. Suporte e acesso à sua conta</h2>
  <p>Para prestar suporte e fazer treinamento guiado, a equipe do Emprestô pode acessar sua conta pela função “Inspecionar conta”. Esse acesso é registrado (quem acessou, quando e em qual modo), começa somente leitura e só permite alterações quando o suporte habilita esse modo de forma expressa. Veja mais na <a href="/privacidade">Política de Privacidade</a>.</p>

  <h2>8. Disponibilidade e limitação de responsabilidade</h2>
  <p>Trabalhamos para manter o Emprestô no ar e seus dados seguros, com cópias de segurança automáticas, mas o serviço é fornecido como está e pode ter interrupções. Recomendamos exportar backups periodicamente. Não respondemos por perdas decorrentes de empréstimos não pagos, de decisões tomadas com base nos indicadores do aplicativo, de bloqueios do WhatsApp ou de falhas de serviços de terceiros, nos limites permitidos pela lei.</p>

  <h2>9. Mudanças nestes Termos</h2>
  <p>Podemos atualizar estes Termos. A data no topo indica a última versão. Mudanças importantes serão avisadas no aplicativo.</p>

  <h2>10. Contato e foro</h2>
  <p>Dúvidas, cancelamentos e pedidos: {email?<a href={'mailto:'+email}>{email}</a>:'pelo suporte do Emprestô'}. Fica eleito o foro do domicílio do consumidor para resolver qualquer questão sobre estes Termos, com aplicação da lei brasileira.</p>
 </LegalPage>;
}
