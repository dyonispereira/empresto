import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=(p,envName)=>ts.transpile(fs.readFileSync(p,'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}).replace(/import \{ env \} from ['"]cloudflare:workers['"];?/,`const env=globalThis.${envName};`);
// CPF/CNPJ check digits used before creating an Asaas customer.
globalThis.__billingEnv={};const billing=await import(uri(compile('lib/billing.ts','__billingEnv')));
assert(billing.validDocument('52998224725'));assert(billing.validDocument('11222333000181'));assert(!billing.validDocument('52998224724'));assert(!billing.validDocument('11111111111'));assert(!billing.validDocument('11222333000182'));assert(!billing.validDocument('123'));
// Z-API tokens: sealed with the secret, plain values still readable, and nothing sealed without the secret.
globalThis.__boxEnv={};const box=await import(uri(compile('lib/secret-box.ts','__boxEnv')));
assert.equal(await box.seal('tok'),'tok');assert.equal(await box.open('tok'),'tok');
globalThis.__boxEnv.DATA_ENCRYPTION_KEY='segredo-de-teste';const sealed=await box.seal('tok');assert(box.isSealed(sealed));assert.notEqual(sealed,await box.seal('tok'));assert.equal(await box.open(sealed),'tok');assert.equal(await box.open('plain'),'plain');assert.equal(await box.seal(null),null);
globalThis.__boxEnv.DATA_ENCRYPTION_KEY='outra';await assert.rejects(()=>box.open(sealed));
// Fixed-window limiter on real SQLite.
const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE rate_limits(key TEXT PRIMARY KEY NOT NULL,count INTEGER NOT NULL,reset_at TEXT NOT NULL)');
const prep=sql=>{let args=[];return {bind(...v){args=v;return this},async first(){return db.prepare(sql).get(...args)||null},async run(){db.prepare(sql).run(...args);return {meta:{}}}}};
globalThis.__rlEnv={DB:{prepare:prep}};const rl=await import(uri(compile('lib/rate-limit.ts','__rlEnv')));
for(let i=0;i<3;i++)assert(await rl.allow('k',3,60));assert(!(await rl.allow('k',3,60)));assert(await rl.allow('other',3,60));assert(await rl.exhausted('k',3));assert(!(await rl.exhausted('other',3)));
db.prepare("UPDATE rate_limits SET reset_at='2000-01-01T00:00:00.000Z' WHERE key='k'").run();assert(!(await rl.exhausted('k',3)));assert(await rl.allow('k',3,60));assert.equal(db.prepare("SELECT count FROM rate_limits WHERE key='k'").get().count,1);
await rl.pruneRateLimits();assert.equal(db.prepare('SELECT COUNT(*) n FROM rate_limits').get().n,2);

// Webhook: a refund on a subscription that was already replaced still removes the paid months it gave.
const sdb=new DatabaseSync(':memory:');sdb.exec("CREATE TABLE subscriptions(owner TEXT PRIMARY KEY,reference TEXT,customer_id TEXT,subscription_id TEXT,status TEXT,method TEXT,payments TEXT,updated_at TEXT,lock TEXT,plan TEXT)");
const sprep=sql=>{let args=[];return {bind(...v){args=v;return this},async first(){return sdb.prepare(sql).get(...args)||null},async run(){sdb.prepare(sql).run(...args);return {meta:{changes:1}}}}};
const today=new Date().toISOString().slice(0,10);const oldPaid={id:'pay_old',status:'CONFIRMED',value:50.69,dueDate:today,subscription:'sub_old',tierPrice:497,months:12};
sdb.prepare("INSERT INTO subscriptions VALUES('u1','ref','cus_1','sub_new','pending','PIX',?,?,NULL,NULL)").run(JSON.stringify([oldPaid]),new Date().toISOString());
globalThis.__whEnv={DB:{prepare:sprep},ASAAS_API_KEY:'k',BILLING_ENABLED:'true',ASAAS_WEBHOOK_TOKEN:'tok'};
const calls=[];globalThis.fetch=async url=>{calls.push(String(url));return new Response(JSON.stringify({id:'pay_old',status:'REFUNDED',value:50.69}),{status:200})};
const billingWh=uri(compile('lib/billing.ts','__whEnv'));const authWh=uri('export function safeEqual(a,b){return a===b}');
const wh=await import(uri(compile('app/api/billing/webhook/route.ts','__whEnv').replace(/from ['"][./]+lib\/billing['"]/,'from '+JSON.stringify(billingWh)).replace(/from ['"][./]+lib\/auth['"]/,'from '+JSON.stringify(authWh))));
const hook=(body,token='tok')=>wh.POST(new Request('https://x/api/billing/webhook',{method:'POST',headers:{'asaas-access-token':token},body:JSON.stringify(body)}));
assert.equal((await hook({},'bad')).status,401);
const b=await import(billingWh);assert(b.paidUntil(JSON.parse(sdb.prepare("SELECT payments FROM subscriptions").get().payments))>Date.now());
assert.equal((await hook({event:'PAYMENT_REFUNDED',payment:{id:'pay_old',customer:'cus_1',subscription:'sub_old'}})).status,200);
assert.equal(calls.length,1);assert.match(calls[0],/\/payments\/pay_old$/);
const after=JSON.parse(sdb.prepare("SELECT payments FROM subscriptions").get().payments);assert.equal(after[0].status,'REFUNDED');assert.equal(b.paidUntil(after),0);
await hook({event:'PAYMENT_REFUNDED',payment:{id:'pay_x',customer:'cus_unknown',subscription:'sub_other'}});assert.equal(calls.length,1);
console.log('Passed: webhook refunds on replaced subscriptions, CPF/CNPJ check digits, sealed Z-API tokens with plain fallback and wrong-key rejection, rate limit windows, failure-only checks and pruning.');
