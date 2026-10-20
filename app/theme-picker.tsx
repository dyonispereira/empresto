'use client';
import {useState} from 'react';
import {Check,X} from 'lucide-react';
import {gradientThemes,flatThemes,themeById,type ThemeId,type Theme} from '../lib/themes';
// "Alterar cores" pop-up: gradient and flat swatches with a check on the chosen one. The app previews the pick live; Aplicar saves it.
export default function ThemePicker({value,onPreview,onApply,onClose,busy}:{value:ThemeId;onPreview:(id:ThemeId)=>void;onApply:(id:ThemeId)=>void;onClose:()=>void;busy:boolean}){
 const [pick,setPick]=useState<ThemeId>(value);
 const choose=(id:ThemeId)=>{setPick(id);onPreview(id)};
 const dot=(t:Theme)=><button key={t.id} type="button" className={'theme-dot'+(pick===t.id?' active':'')} style={{background:t.swatch}} aria-label={`${t.kind==='gradiente'?'Gradiente':'Lisa'} ${t.label}`} aria-pressed={pick===t.id} onClick={()=>choose(t.id)}>{pick===t.id&&<Check size={30} strokeWidth={3}/>}</button>;
 const padrao=themeById('padrao');
 return <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="theme-modal" role="dialog" aria-label="Alterar cores">
  <div className="theme-modal-head"><h2>Alterar cores</h2><button type="button" onClick={onClose} aria-label="Fechar"><X size={20}/></button></div>
  <h3>Cores gradientes</h3><div className="theme-grid">{gradientThemes.map(dot)}</div>
  <h3>Cores lisas</h3><div className="theme-grid">{flatThemes.map(dot)}</div>
  <button type="button" className={'theme-default'+(pick==='padrao'?' active':'')} onClick={()=>choose('padrao')}><i style={{background:padrao.swatch}}/>{padrao.label}{pick==='padrao'&&<Check size={16} strokeWidth={3}/>}</button>
  <button type="button" className="theme-apply" disabled={busy} onClick={()=>onApply(pick)}>{busy?'Salvando…':'Aplicar'}</button>
 </div></div>;
}
