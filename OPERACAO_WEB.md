# Carteira Prime — operação web

## Canal de operação

Aplicação web responsiva. Acesso por navegador no computador ou Android. A primeira versão exige internet para gravar operações; não há fila financeira offline. Não há APK nesta fase.

A autenticação é a do ambiente Sites. A publicação é privada. Cada identidade possui sua carteira e anexos isolados; não existe carteira compartilhada de equipe, gestão de colaboradores ou assinatura comercial nesta versão. Não alterar o público do Site para contornar autenticação.

## Controles implementados

- Validação de esquema, datas, centavos, apropriação proporcional dos juros e IDs únicos no servidor.
- Impedimento de exclusão de contratos e sobrescrita de recebimentos/movimentações de capital.
- Conferência das alocações de novos pagamentos nas parcelas.
- Estorno do último recebimento, com motivo e histórico. Para registros antigos sem alocação, reconstrução somente quando não houve edição/reprogramação de parcelas; caso contrário, bloqueio explícito.
- Arquivos privados fora da linha principal do banco. Imagens antigas embutidas são migradas no próximo salvamento bem-sucedido.
- Controle otimista de versão para evitar sobrescrita entre abas.
- Repetição do mesmo estado já persistido devolve sua versão, sem duplicar operações.
- Versão anterior da carteira preservada em cada salvamento a partir desta implantação. Consulta das últimas 30 versões e restauração autorizada com motivo; a restauração também preserva a situação anterior.
- Indicador de falta de internet e bloqueio de novas gravações após conflito até recarregar.

## Limites que não devem ser omitidos

- As versões anteriores são recuperação de estado da carteira dentro do mesmo ambiente; não são backup externo completo contra perda do provedor/conta.
- O JSON exportado contém referências privadas aos anexos; não é um pacote portátil com todos os documentos.
- Não há estorno de recebimento arbitrário no meio da sequência: é necessário estornar do mais recente para o mais antigo.
- Não há integração com gateway de pagamentos, cobrança de assinatura ou mensagens automáticas.
- Câmera, localização, download e experiência visual precisam de teste em Android físico antes da homologação da operação do cliente.
- O fato de testes automatizados e build passarem não equivale a auditoria de segurança ou prontidão comercial definitiva.

## Verificações

```sh
node tests/model.test.mjs
node tests/web.test.mjs
node node_modules/typescript/bin/tsc --noEmit
```

A suíte web utiliza SQLite real em memória para testar gravação com revisão, snapshots e restauração, e adaptadores de armazenamento/autenticação para testar isolamento de anexos. O banco hospedado e o armazenamento hospedado devem ser observados após a implantação.

## Teste operacional guiado

Em uma carteira de homologação sem dados reais:

1. Criar aporte de R$ 20.000.
2. Cadastrar cliente ativo e contrato de R$ 2.000 + 10%.
3. Conferir aporte R$ 20.000, capital em praça R$ 2.000, disponível R$ 18.000.
4. Receber R$ 1.100 via Pix: principal recuperado R$ 1.000, juros R$ 100, disponível R$ 19.000.
5. Estornar o último recebimento com motivo: disponível retorna a R$ 18.000, recebimento aparece no histórico de estornos.
6. Editar parcela e conferir preservação do total.
7. Anexar documento legível e abrir novamente após recarregar.
8. Em Ajustes, consultar versões e restaurar uma versão de teste. Conferir que a situação anterior à restauração também foi preservada.
9. Abrir duas abas; salvar em uma e tentar salvar um estado antigo na outra. A segunda deve exigir recarga.
10. Desconectar a internet e confirmar que o aplicativo não informa gravação bem-sucedida.

## Próxima etapa comercial

Somente após homologação web: contas por empresa e permissões de equipe, domínio próprio, suporte, política de privacidade/retenção, backup externo com restauração, assinatura comercial e piloto acompanhado. A versão app deve reutilizar a mesma API e as mesmas regras após estabilização do produto web.
