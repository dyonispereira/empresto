// Minimal .xlsx writer (no dependencies): sheets of text, numbers and money cells, packed in an uncompressed zip.
export type Cell=string|number|{money:number}|{bold:string}|null;
export type Sheet={name:string;rows:Cell[][];widths?:number[]};

const esc=(s:string)=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!)).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
const col=(i:number)=>(i>=26?String.fromCharCode(64+Math.floor(i/26)):'')+String.fromCharCode(65+i%26);
function cell(v:Cell,ref:string){
 if(v===null||v==='')return '';
 if(typeof v==='number')return `<c r="${ref}"><v>${v}</v></c>`;
 if(typeof v==='string')return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
 if('money' in v)return `<c r="${ref}" s="1"><v>${v.money/100}</v></c>`;
 return `<c r="${ref}" s="2" t="inlineStr"><is><t xml:space="preserve">${esc(v.bold)}</t></is></c>`;
}
function sheetXml(s:Sheet){
 const cols=s.widths?`<cols>${s.widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`:'';
 const rows=s.rows.map((r,i)=>`<row r="${i+1}">${r.map((v,j)=>cell(v,col(j)+(i+1))).join('')}</row>`).join('');
 return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${rows}</sheetData></worksheet>`;
}
const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const crc32=(b:Uint8Array)=>{let c=0xffffffff;for(const x of b)c=crcTable[(c^x)&0xff]^(c>>>8);return (c^0xffffffff)>>>0;};
function zip(files:[string,string][]){
 const enc=new TextEncoder(),parts:Uint8Array[]=[],central:Uint8Array[]=[];let offset=0;
 for(const [name,text] of files){
  const n=enc.encode(name),d=enc.encode(text),crc=crc32(d);
  const h=new DataView(new ArrayBuffer(30));
  [[0,0x04034b50,4],[4,20,2],[6,0x0800,2],[8,0,2],[10,0,2],[12,33,2],[14,crc,4],[18,d.length,4],[22,d.length,4],[26,n.length,2],[28,0,2]].forEach(([o,v,s])=>s===4?h.setUint32(o,v,true):h.setUint16(o,v,true));
  const c=new DataView(new ArrayBuffer(46));
  [[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x0800,2],[10,0,2],[12,0,2],[14,33,2],[16,crc,4],[20,d.length,4],[24,d.length,4],[28,n.length,2],[30,0,2],[32,0,2],[34,0,2],[36,0,2],[38,0,4],[42,offset,4]].forEach(([o,v,s])=>s===4?c.setUint32(o,v,true):c.setUint16(o,v,true));
  parts.push(new Uint8Array(h.buffer),n,d);central.push(new Uint8Array(c.buffer),n);offset+=30+n.length+d.length;
 }
 const size=central.reduce((s,b)=>s+b.length,0),e=new DataView(new ArrayBuffer(22));
 [[0,0x06054b50,4],[4,0,2],[6,0,2],[8,files.length,2],[10,files.length,2],[12,size,4],[16,offset,4],[20,0,2]].forEach(([o,v,s])=>s===4?e.setUint32(o,v,true):e.setUint16(o,v,true));
 return new Blob([...parts,...central,new Uint8Array(e.buffer)] as BlobPart[],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
export function workbook(sheets:Sheet[]){
 const ns='http://schemas.openxmlformats.org';
 return zip([
  ['[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="${ns}/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
  ['_rels/.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${ns}/package/2006/relationships"><Relationship Id="rId1" Type="${ns}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
  ['xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${ns}/spreadsheetml/2006/main" xmlns:r="${ns}/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${esc(s.name.slice(0,31))}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`],
  ['xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${ns}/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="${ns}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="${ns}/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
  ['xl/styles.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${ns}/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot;\\ #,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`],
  ...sheets.map((s,i)=>[`xl/worksheets/sheet${i+1}.xml`,sheetXml(s)] as [string,string]),
 ]);
}
