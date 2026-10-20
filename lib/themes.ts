// Whole-app colour themes chosen in Ajustes › Cor do app: 8 gradients and 8 flat colours, plus the original look.
// Each theme is a set of CSS variables applied on .shell.themed (see the "Temas" block in globals.css).
export const themeIds=['padrao','grad-preto','grad-azul','grad-verde','grad-rosa','grad-roxo','grad-vermelho','grad-branco','grad-laranja','liso-preto','liso-azul','liso-verde','liso-rosa','liso-roxo','liso-vermelho','liso-branco','liso-laranja'] as const;
export type ThemeId=typeof themeIds[number];
// Values saved before the 16 themes existed (first "Cor do app" version) stay valid and map to the closest theme.
export const legacyThemes={verde:'padrao',azul:'liso-azul',roxo:'liso-roxo',grafite:'liso-preto',vinho:'liso-vermelho',dourado:'liso-laranja',rosa:'liso-rosa'} as const;
export const savedThemes=[...themeIds,...Object.keys(legacyThemes)] as [string,...string[]];
export const themeOf=(v?:string):ThemeId=>(themeIds as readonly string[]).includes(v||'')?v as ThemeId:legacyThemes[v as keyof typeof legacyThemes]||'padrao';

type Base={label:string;head:string;head2:string;bg:string;bg2:string;card:string;line:string;ink:string;muted:string;accent:string;accentInk:string;dark:boolean};
const base:Record<string,Base>={
 preto:{label:'Preto',head:'#2b2b2b',head2:'#000000',bg:'#141414',bg2:'#000000',card:'#1f1f1f',line:'#3a3a3a',ink:'#ffffff',muted:'#c4c4c4',accent:'#ffffff',accentInk:'#111111',dark:true},
 azul:{label:'Azul',head:'#1e88e5',head2:'#0047ab',bg:'#0a3a85',bg2:'#06224f',card:'#0e489e',line:'#3a73c9',ink:'#ffffff',muted:'#cfe2ff',accent:'#ffffff',accentInk:'#0047ab',dark:true},
 verde:{label:'Verde',head:'#43a047',head2:'#127812',bg:'#0f5c12',bg2:'#073609',card:'#156f18',line:'#3f9a42',ink:'#ffffff',muted:'#d6f5cc',accent:'#ffffff',accentInk:'#127812',dark:true},
 rosa:{label:'Rosa',head:'#ec407a',head2:'#c2185b',bg:'#f8bbd0',bg2:'#f48fb1',card:'#fbd3e1',line:'#e48aa9',ink:'#5c0d2e',muted:'#a3214f',accent:'#d81b60',accentInk:'#ffffff',dark:false},
 roxo:{label:'Roxo',head:'#9c27b0',head2:'#4a0072',bg:'#4f0070',bg2:'#2a003d',card:'#5f0a85',line:'#8a3bb0',ink:'#ffffff',muted:'#ead0f7',accent:'#ffffff',accentInk:'#7b00b0',dark:true},
 vermelho:{label:'Vermelho',head:'#e53935',head2:'#7f0000',bg:'#5c0000',bg2:'#330000',card:'#701010',line:'#a33a3a',ink:'#ffffff',muted:'#ffd3d3',accent:'#ffffff',accentInk:'#a00000',dark:true},
 branco:{label:'Branco',head:'#ffffff',head2:'#d9d9d9',bg:'#f2f2f2',bg2:'#dcdcdc',card:'#ffffff',line:'#d6d6d6',ink:'#1a1a1a',muted:'#5f5f5f',accent:'#1a1a1a',accentInk:'#ffffff',dark:false},
 laranja:{label:'Laranja',head:'#ffa726',head2:'#ef6c00',bg:'#c45a00',bg2:'#8a3a00',card:'#d06a0c',line:'#f5c518',ink:'#ffffff',muted:'#ffe066',accent:'#ffb300',accentInk:'#3a2000',dark:true},
};
export type Theme={id:ThemeId;label:string;kind:'gradiente'|'liso'|'padrao';swatch:string;vars:Record<string,string>};
function make(color:string,kind:'gradiente'|'liso'):Theme{
 const b=base[color],g=kind==='gradiente';
 const shade=b.dark?'#ffffff14':'#00000008';
 const flat=color==='branco'?'#ffffff':b.head2;
 return {id:`${g?'grad':'liso'}-${color}` as ThemeId,label:b.label,kind,
  swatch:g?`linear-gradient(180deg,${b.head},${b.head2})`:flat,
  vars:{'--t-headbg':g?`linear-gradient(180deg,${b.head},${b.head2})`:flat,'--t-headink':color==='branco'?b.ink:'#ffffff',
   '--t-bg':g?`linear-gradient(180deg,${b.bg},${b.bg2})`:b.bg,'--t-card':b.card,'--t-cardbg':g?`linear-gradient(180deg,${shade},transparent),${b.card}`:b.card,
   '--t-line':b.line,'--t-ink':b.ink,'--t-muted':b.muted,'--t-accent':b.accent,'--t-accentink':b.accentInk,
   '--t-good':b.dark?'#a5f3a0':'#1e7a3c','--t-bad':b.dark?'#ffb4a8':'#b3261e','--t-soft':b.dark?'#ffffff1f':'#0000000d'}};
}
const colours=['preto','azul','verde','rosa','roxo','vermelho','branco','laranja'];
export const gradientThemes=colours.map(c=>make(c,'gradiente'));
export const flatThemes=colours.map(c=>make(c,'liso'));
export const themes:Theme[]=[{id:'padrao',label:'Padrão Emprestô',kind:'padrao',swatch:'linear-gradient(135deg,#184f3e,#e3c167)',vars:{}},...gradientThemes,...flatThemes];
export const themeById=(id:ThemeId)=>themes.find(t=>t.id===id)!;
