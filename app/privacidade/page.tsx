import LegalPage from '../legal-page';
import {COMPANY,supportEmail} from '../../lib/legal';
export const dynamic='force-dynamic';
export const metadata={title:'Política de Privacidade — Emprestô'};
export default function PrivacyPage(){
 const email=supportEmail();
 return <LegalPage title="Política de Privacidade">
  <p>Esta Política explica como o <strong>Emprestô</strong>, oferecido por {COMPANY}, trata dados pessoais, conforme a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).</p>

  <h2>1. Dois tipos de dados</h2>
  <ul>
   <li><strong>Seus dados de assinante</strong> (nome, e-mail, pagamentos). Para eles, o Emprestô é o <strong>controlador</strong>.</li>
   <li><strong>Dados dos seus clientes</strong> que você cadastra (nome, telefone, CPF, endereço, documentos anexados, valores e histórico de empréstimos). Para eles, <strong>você</strong> é o controlador e o Emprestô é o <strong>operador</strong>: guardamos e processamos esses dados só para prestar o serviço a você, seguindo suas instruções. Você deve ter base legal para registrá-los (normalmente a execução do contrato de empréstimo e o exercício regular de direitos) e informar seus clientes sobre isso.</li>
  </ul>

  <h2>2. Quais dados tratamos e por quê</h2>
  <ul>
   <li><strong>Cadastro:</strong> nome, e-mail e senha (guardada só de forma criptografada, sem possibilidade de leitura). Finalidade: criar e proteger sua conta. Base legal: execução de contrato.</li>
   <li><strong>Assinatura:</strong> plano, valores, datas e situação das cobranças, além do CPF/CNPJ e dados informados na tela de pagamento da Asaas. Finalidade: cobrar e liberar o acesso. Base legal: execução de contrato e obrigações legais e fiscais.</li>
   <li><strong>Uso do aplicativo:</strong> data do último acesso, situação online e contagem de uso, sessões de login e tentativas de senha. Finalidade: segurança, suporte e melhoria do serviço. Base legal: legítimo interesse.</li>
   <li><strong>Carteira:</strong> clientes, empréstimos, parcelas, recebimentos, anexos e sua chave Pix. Finalidade: funcionamento do aplicativo. Base legal: execução de contrato (você é o controlador dos dados dos seus clientes).</li>
   <li><strong>WhatsApp:</strong> se você ativar a cobrança automática, o número conectado e as mensagens enviadas aos seus clientes. Finalidade: enviar os lembretes que você configurou.</li>
  </ul>
  <p>Não vendemos dados e não os usamos para publicidade de terceiros.</p>

  <h2>3. Com quem compartilhamos</h2>
  <ul>
   <li><strong>Cloudflare:</strong> hospedagem do aplicativo, banco de dados e arquivos anexados.</li>
   <li><strong>Asaas:</strong> processamento dos pagamentos da assinatura (Pix e cartão).</li>
   <li><strong>Z-API:</strong> envio das mensagens de WhatsApp, só quando você ativa a cobrança automática.</li>
   <li><strong>Autoridades:</strong> quando houver obrigação legal ou ordem judicial.</li>
  </ul>
  <p>Alguns desses fornecedores podem guardar dados fora do Brasil, com as garantias previstas na LGPD.</p>

  <h2>4. Acesso do suporte à sua conta</h2>
  <p>Para resolver problemas e fazer treinamento guiado, a equipe do Emprestô pode abrir sua conta pela função “Inspecionar conta” e ver todos os dados dela, inclusive os dados dos seus clientes. Esse acesso:</p>
  <ul>
   <li>é registrado com quem acessou, quando e em qual modo;</li>
   <li>começa em modo somente leitura e só permite alterações quando o suporte habilita esse modo de forma expressa;</li>
   <li>dura no máximo 2 horas por vez;</li>
   <li>é usado apenas para suporte, treinamento, segurança e cumprimento destes Termos.</li>
  </ul>
  <p>Você pode pedir ao suporte a lista de acessos feitos à sua conta.</p>

  <h2>5. Cookies</h2>
  <p>Usamos apenas cookies essenciais: um cookie de sessão para manter você conectado (até 30 dias) e, durante um atendimento de suporte, um cookie temporário de inspeção. Não usamos cookies de publicidade nem de rastreamento.</p>

  <h2>6. Por quanto tempo guardamos</h2>
  <p>Guardamos seus dados enquanto sua conta existir, inclusive se a assinatura estiver vencida, para que você não perca sua carteira ao renovar. Se você pedir a exclusão da conta, apagamos os dados da carteira e as cópias de segurança, mantendo apenas o que a lei exige (como registros de pagamento para fins fiscais) pelo prazo legal.</p>

  <h2>7. Segurança</h2>
  <p>Usamos conexão criptografada (HTTPS), senhas com hash, bloqueio após tentativas erradas de login, cookies protegidos e cópias de segurança automáticas. Nenhum sistema é totalmente imune a falhas; se houver um incidente que possa causar risco relevante, avisaremos você e a ANPD conforme a lei.</p>

  <h2>8. Seus direitos</h2>
  <p>Você pode pedir a qualquer momento: confirmação e acesso aos seus dados, correção, portabilidade (o próprio aplicativo permite exportar backup), anonimização, bloqueio ou exclusão, informação sobre compartilhamentos e revogação de consentimento quando ele for a base legal. Se um cliente seu nos procurar, encaminharemos o pedido a você, que é o controlador desses dados.</p>

  <h2>9. Contato</h2>
  <p>Encarregado de dados e suporte: {email?<a href={'mailto:'+email}>{email}</a>:'suporte do Emprestô'}. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>

  <h2>10. Mudanças</h2>
  <p>Podemos atualizar esta Política. A data no topo indica a última versão, e mudanças importantes serão avisadas no aplicativo.</p>
 </LegalPage>;
}
