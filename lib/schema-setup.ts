// Creates the tables on first use, so a new Cloudflare D1 database needs no manual migration step.
// Keep in sync with db/schema.ts and the drizzle/ migrations.
const STATEMENTS=[
 "CREATE TABLE IF NOT EXISTS portfolios(owner TEXT PRIMARY KEY NOT NULL,data TEXT NOT NULL,revision INTEGER DEFAULT 1 NOT NULL)",
 "CREATE TABLE IF NOT EXISTS backups(id TEXT PRIMARY KEY NOT NULL,owner TEXT NOT NULL,revision INTEGER NOT NULL,key TEXT NOT NULL,created_at TEXT NOT NULL,action TEXT NOT NULL)",
 "CREATE TABLE IF NOT EXISTS subscriptions(owner TEXT PRIMARY KEY NOT NULL,reference TEXT NOT NULL,customer_id TEXT,subscription_id TEXT,status TEXT DEFAULT 'unconfigured' NOT NULL,method TEXT,payments TEXT DEFAULT '[]' NOT NULL,updated_at TEXT NOT NULL,lock TEXT)",
 "CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY NOT NULL,email TEXT NOT NULL,name TEXT NOT NULL,password_hash TEXT NOT NULL,created_at TEXT NOT NULL,failed_logins INTEGER DEFAULT 0 NOT NULL,locked_until TEXT)",
 "CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email)",
 "CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY NOT NULL,user_id TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL)",
 "CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id)",
 "CREATE INDEX IF NOT EXISTS backups_owner_idx ON backups(owner)",
 "CREATE INDEX IF NOT EXISTS subscriptions_subscription_idx ON subscriptions(subscription_id)",
 "CREATE TABLE IF NOT EXISTS courtesies(user_id TEXT PRIMARY KEY NOT NULL,until TEXT NOT NULL,note TEXT,granted_at TEXT NOT NULL)",
];
let ready:Promise<unknown>|null=null;
export function ensureSchema(db:D1Database|undefined){
 if(!db)return Promise.resolve();
 ready??=db.batch(STATEMENTS.map(s=>db.prepare(s))).catch(e=>{ready=null;throw e;});
 return ready;
}
