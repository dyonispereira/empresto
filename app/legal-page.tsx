import {Wallet} from 'lucide-react';
import {LEGAL_DATE} from '../lib/legal';
// Shared shell for /termos and /privacidade.
export default function LegalPage({title,children}:{title:string;children:React.ReactNode}){
 return <div className="legal">
  <header className="legal-head"><nav className="lp-nav"><span className="lp-logo"><span className="brand-icon"><Wallet size={20}/></span><span>Emprestô<span className="brand-dot">.</span></span></span><a className="lp-nav-link" href="/entrar">Entrar</a></nav></header>
  <article className="legal-body"><h1>{title}</h1><p className="legal-date">Última atualização: {LEGAL_DATE}</p>{children}</article>
  <footer className="lp-footer"><span><a href="/termos">Termos de Uso</a> · <a href="/privacidade">Política de Privacidade</a></span><span>O Emprestô é uma ferramenta de organização. Não oferece crédito nem intermedeia empréstimos.</span></footer>
 </div>;
}
