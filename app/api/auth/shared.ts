export const noStore={'Cache-Control':'no-store'};
export const sameOrigin=(req:Request)=>req.headers.get('origin')===new URL(req.url).origin;
export async function readBody(req:Request){const raw=await req.text();if(raw.length>5000)throw Error('Dados inválidos.');return JSON.parse(raw||'{}');}
