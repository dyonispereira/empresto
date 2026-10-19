# Emprestô

**Seu app de gestão de empréstimos.** Plano mensal definido no servidor: **R$ 29,90**.

Aplicação web em português, otimizada para Android e desktop. Gerencia clientes, aportes, capital em praça, parcelas, recebimentos, garantias, anexos privados e histórico financeiro.

## Dois fluxos financeiros

1. **Mensalidade do Emprestô:** paga pelo assinante ao fornecedor do software. Sem pagamento confirmado, o servidor não libera a carteira. A conta administradora é configurada por segredo de ambiente.
2. **Recebimentos dos empréstimos:** pagos pelos devedores ao próprio assinante. O cadastro **Meu Pix** gera código Pix Copia e Cola e mensagem preenchida para abrir no WhatsApp. Não há envio pelo servidor nem baixa bancária automática.

## Tecnologias

React 19, TypeScript, Vinext/Vite, Cloudflare Workers, D1/SQLite e R2. Autenticação fornecida pelo ambiente Sites; não existe login independente de e-mail/senha neste repositório. A publicação atual é privada. Hospedagem independente exige adaptação da autenticação e dos bindings; não confiar em cabeçalhos de identidade enviados diretamente pela internet.

## Executar e testar

Use Node.js 22.13 ou superior e pnpm compatível com o `packageManager` do projeto.

```sh
pnpm install
pnpm dev
node tests/model.test.mjs
node tests/web.test.mjs
node tests/payments.test.mjs
pnpm exec tsc --noEmit
pnpm build
```

Os testes web usam `node:sqlite`, disponível nas versões recentes do Node 22. Os scripts do starter usam a configuração do ambiente Sites. Consulte `OPERACAO_WEB.md` para os limites de homologação e recuperação de dados.

## Banco e arquivos

- `db/schema.ts`: esquema.
- `drizzle/`: migrações incrementais; nunca apagar migrações aplicadas.
- `lib/model.ts`: regras financeiras em centavos.
- `lib/validation.ts`: validação de dados e transições no servidor.
- `lib/persistence.ts`: revisão otimista e snapshots.
- `app/api/attachments/`: uploads e leitura autorizada de imagens privadas.
- `app/api/backups/` e `app/api/restore/`: consulta e restauração de versões por proprietário.
- Bindings esperados: `DB` (D1) e `BUCKET` (R2).

O export para GitHub não contém a identidade da publicação Sites, credenciais, banco de clientes ou documentos reais. A configuração `.openai/hosting.json`, quando presente no checkout hospedado, pertence àquela publicação e não deve ser reutilizada como identidade de outro site.

## Cobrança da mensalidade

A integração preparada usa a API Asaas para criar cliente e assinatura mensal de R$ 29,90 com fatura hospedada para Pix, boleto ou cartão. Nenhum número de cartão passa pelo formulário do Emprestô. Pix e boleto são cobranças mensais a pagar; Pix comum não é Pix Automático.

**Não há conta Asaas ou chave de produção conectada por padrão.** Sem a configuração, a interface informa a pendência e não cria cobranças fictícias. Não é possível afirmar homologação de pagamento real sem credenciais e transações de teste.

Configuração segura: veja `.env.example`. Em Sites, use os segredos do ambiente, nunca o manifest nem código cliente. Habilite `BILLING_ENABLED=true` e `ASAAS_ENVIRONMENT=production` somente depois da homologação. `REQUIRE_SUBSCRIPTION=true` bloqueia o acesso de não administradores sem pagamento real confirmado. A administradora é identificada por `EMPRESTO_ADMIN_EMAIL` autenticado pelo ambiente.

O status pode ser conciliado pela ação **Consultar pagamento**, com verificação direta na API do provedor. Abertura de checkout/retorno não libera acesso. Valores, estados pagos, estornos e expiração são verificados no servidor. O cancelamento impede novas recorrências; o período pago permanece válido.

### Notificações em segundo plano

A publicação privada exige autenticação antes das rotas e não oferece neste código um webhook público pronto para o provedor. Não publicar um endpoint que confie apenas no JSON recebido nem remover autenticação global para resolver isso. Para produção com notificações automáticas, hospedar um receptor de webhook autenticado compatível com a infraestrutura, verificar token/evento, consultar a cobrança na API, deduplicar eventos e atualizar a mesma base autorizada. Esse receptor e a homologação de produção permanecem pendentes. A consulta autenticada no provedor funciona sem depender de um retorno de checkout.

## Homologação necessária

- Teste real no Android de câmera, geolocalização, seleção de documentos e WhatsApp.
- Conta de pagamentos, habilitação dos meios na conta, cobrança de teste, cancelamento e reembolso.
- Acesso externo para assinantes e política de privacidade/termos do produto.
- Backup externo completo e restauração; snapshots locais são recuperação de estado, não cópia de desastre independente.
- A versão app/Play Store é etapa posterior à estabilização web.

Documentação oficial: https://docs.asaas.com/docs/assinaturas e https://www.bcb.gov.br/estabilidadefinanceira/pix-normas.
