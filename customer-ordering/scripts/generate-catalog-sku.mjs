#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const app=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const repo=resolve(app,'..');
const out=resolve(app,'lib/adapters/mock/generated-catalog.json');
const sources=['BANG_GIA_CHUAN_HOA_CAP_NHAT_DS_SP_23.07.26.xlsx','BANG_GIA_KENH_QUAN_THEM_NHOM_CHI_TIET.xlsx'];
const categoryMeta={
  'milk-tea':['Trà sữa','sugar'],'spicy-noodle':['Mỳ cay','wheat'],frozen:['Đông lạnh','starch'],
  snacks:['Ăn vặt','sugar'],packaging:['Bao bì','additive'],'sauce-seasoning':['Gia vị & sốt','additive'],other:['Khác','additive'],
};
const aliases={
  retailSku:['sku le','sku don vi','ma sku cua san pham don vi','ma sku san pham don vi'],
  caseSku:['sku quy doi','sku thung','ma sku cua san pham quy doi','ma sku san pham quy doi'],
  sku:['sku','ma sku','ma hang','ma hang hoa','ma hh','ma vat tu','ma vt','ma mat hang','ma sp','ma san pham','item code','product code','code'],
  retailName:['ten san pham chuan','ten sp chuan hoa','ten chuan hoa'],caseName:['ten san pham quy doi','ten sp quy doi'],
  name:['ten san pham','ten sp','ten hang','ten hang hoa','ten hh','ten vat tu','ten vt','ten mat hang','item name','product name','dien giai','mo ta san pham','san pham'],
  category:['nhom chinh','nhom chuan','nganh hang','nganh','nhom san pham','nhom sp','phan nhom','nhom hang','nhom'],
  productType:['nhom chi tiet','nhom cap 2','loai san pham','loai sp','chung loai','phan loai','loai'],
  brand:['thuong hieu','nhan hieu','hang sx','hang san xuat','brand'],flavor:['huong vi','mui vi','flavor','vi'],
  size:['kich thuoc','khoi luong','trong luong','dung tich','quy cach size','size'],
  retailPackaging:['quy cach le'],packaging:['quy cach dong goi','quy cach','dong goi','packaging'],casePackaging:['quy cach quy doi','quy cach thung','dong goi thung','quy cach si'],
  retailUnit:['dvt le'],caseUnit:['dvt quy doi','don vi quy doi'],unit:['don vi tinh','dvt chuan','dvt khoi luong','dvt','unit','don vi'],
  caseQuantity:['sl quy doi','so luong quy doi','sl thung','so luong thung','quy doi thung','sl/thung','cay thung'],
};
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const sku=v=>clean(v).toUpperCase().replace(/\s+/g,'');
const xmlDecode=v=>v.replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&apos;',"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
const money=v=>{const d=clean(v).replace(/[^0-9-]/g,'');if(!d)return null;const n=parseInt(d,10);return Number.isFinite(n)&&n>=0?n:null;};
const positive=v=>{const m=clean(v).match(/\d+/);const n=m?parseInt(m[0],10):0;return n>0?n:null;};

function unzip(buf){
  let e=-1;for(let i=buf.length-22;i>=Math.max(0,buf.length-65557);i--){if(buf.readUInt32LE(i)===0x06054b50){e=i;break;}}if(e<0)throw new Error('XLSX thiếu EOCD');
  const count=buf.readUInt16LE(e+10);let p=buf.readUInt32LE(e+16);const map=new Map();
  for(let i=0;i<count;i++){
    if(buf.readUInt32LE(p)!==0x02014b50)throw new Error('Central directory XLSX lỗi');
    const method=buf.readUInt16LE(p+10),size=buf.readUInt32LE(p+20),nl=buf.readUInt16LE(p+28),xl=buf.readUInt16LE(p+30),cl=buf.readUInt16LE(p+32),lo=buf.readUInt32LE(p+42);
    const name=buf.subarray(p+46,p+46+nl).toString('utf8');if(buf.readUInt32LE(lo)!==0x04034b50)throw new Error(`Local header lỗi: ${name}`);
    const lnl=buf.readUInt16LE(lo+26),lxl=buf.readUInt16LE(lo+28),start=lo+30+lnl+lxl,raw=buf.subarray(start,start+size);
    map.set(name,method===0?raw:method===8?inflateRawSync(raw):(()=>{throw new Error(`Compression ${method} chưa hỗ trợ`);})());p+=46+nl+xl+cl;
  }return map;
}
function shared(xml=''){const a=[];for(const m of xml.matchAll(/<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)){a.push([...m[1].matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)].map(x=>xmlDecode(x[1])).join(''));}return a;}
function col(ref){let n=0;for(const c of ref.replace(/\d+/g,'').toUpperCase())n=n*26+c.charCodeAt(0)-64;return n-1;}
function rows(xml,ss){
  const out=[];for(const rm of xml.matchAll(/<(?:\w+:)?row\b[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g)){
    const r=[];for(const cm of rm[1].matchAll(/<(?:\w+:)?c\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?c>/g)){
      const ref=cm[1].match(/\br=["']([A-Z]+\d+)["']/)?.[1];if(!ref)continue;const t=cm[1].match(/\bt=["']([^"']+)["']/)?.[1]??'';let v='';
      if(t==='inlineStr')v=[...cm[2].matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)].map(x=>xmlDecode(x[1])).join('');
      else{const raw=cm[2].match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/)?.[1]??'';v=t==='s'?(ss[parseInt(raw,10)]??''):xmlDecode(raw);}r[col(ref)]=clean(v);
    }out.push(r);
  }return out;
}
function field(h){
  const n=norm(h);if(!n)return null;let best=null;
  for(const [f,list] of Object.entries(aliases))for(const av of list){const a=norm(av),ok=n===a||(a.length>=4&&(n.startsWith(a+' ')||n.endsWith(' '+a)||n.includes(' '+a+' ')));if(ok&&(!best||a.length>best.len))best={f,len:a.length};}
  if(best)return best.f;if(/\bsku\b|\b(item|product) code\b/.test(n))return 'sku';
  if(/\bma\b/.test(n)&&/(hang|hang hoa|vat tu|san pham|mat hang|sp|hh|vt)/.test(n))return 'sku';
  if(/\bten\b/.test(n)&&/(hang|hang hoa|vat tu|san pham|mat hang|sp|hh|vt)/.test(n))return 'name';
  if(/(dien giai|mo ta)/.test(n)&&!/(ghi chu|note)/.test(n))return 'name';return null;
}
function priceField(h){const n=norm(h);if(!n.includes('gia')||/(gia von|gia nhap|gia mua|cost)/.test(n))return null;if(/(thung|case|si)/.test(n))return 'casePrice';if(/(gia le|ban le|kenh quan|gia ban|don gia)/.test(n))return 'retailPrice';return 'genericPrice';}
function mapHeaders(h){const c={};let score=0;h.forEach((v,i)=>{const f=field(v);if(f&&c[f]===undefined){c[f]=i;score+=f==='sku'||f==='name'?5:1;}const p=priceField(v);if(p&&c[p]===undefined){c[p]=i;score++;}});return{columns:c,score};}
function mergedHeader(rs,start,span){const w=Math.max(...rs.slice(start,start+span).map(r=>r.length),0);return Array.from({length:w},(_,i)=>clean(rs.slice(start,start+span).map(r=>r[i]??'').filter(Boolean).join(' ')));}
function validSku(v){const x=clean(v),n=norm(x);return !!x&&x.length<=48&&!/\s/.test(x)&&/^[\p{L}0-9._/+\-]+$/u.test(x)&&! /^(stt|sku|ma|mahang|masanpham|tong|total)$/i.test(n.replace(/ /g,''));}
function inferSku(v){const x=clean(v);return validSku(x)&&/[\p{L}]/u.test(x);}
function nameLike(v){const x=clean(v),n=norm(x);return x.length>=3&&x.length<=220&&!/^[-+]?\d[\d.,% -]*$/.test(x)&&/[a-z]/.test(n)&&n.replace(/[^a-z]/g,'').length>=3&&!/^(ten|ten hang|ten san pham|dien giai|mo ta|ghi chu)$/.test(n);}
function evidence(rs,dataStart,c){const sc=[c.retailSku,c.caseSku,c.sku].filter(v=>v!==undefined),nc=[c.retailName,c.caseName,c.name].filter(v=>v!==undefined);let hits=0;for(let i=dataStart;i<Math.min(rs.length,dataStart+100);i++){if(sc.some(k=>validSku(rs[i][k]??''))&&nc.some(k=>nameLike(rs[i][k]??'')))hits++;}return hits;}
function infer(rs){
  const lim=Math.min(rs.length,1500),w=Math.min(Math.max(...rs.slice(0,lim).map(r=>r.length),0),80);let best=null;
  for(let sc=0;sc<w;sc++)for(let nc=0;nc<w;nc++){if(sc===nc)continue;let matched=0,first=-1,cases=0;const vals=new Set();
    for(let i=0;i<lim;i++){const raw=clean(rs[i][sc]??''),n=clean(rs[i][nc]??'');if(!inferSku(raw)||!nameLike(n))continue;const s=sku(raw);if(first<0)first=i;matched++;vals.add(s);if(s.endsWith('T'))cases++;}
    if(matched<5)continue;let pairs=0;for(const s of vals)if(s.endsWith('T')&&vals.has(s.slice(0,-1)))pairs++;const score=matched*12+pairs*20+cases*2+(vals.size/matched)*20+Math.max(0,4-Math.abs(nc-sc));if(!best||score>best.score)best={sc,nc,first,matched,score};
  }if(!best)return null;const hs=Math.max(0,best.first-8),headers=Array.from({length:w},(_,i)=>clean(rs.slice(hs,best.first).map(r=>r[i]??'').filter(Boolean).join(' '))),m=mapHeaders(headers);m.columns.sku=best.sc;m.columns.name=best.nc;return{dataStart:best.first,columns:m.columns,mode:'inferred',score:best.score,matched:best.matched};
}
function header(rs){let best=null,lim=Math.min(rs.length,40);for(let i=0;i<lim;i++)for(const span of [1,2,3]){if(i+span>lim)continue;const m=mapHeaders(mergedHeader(rs,i,span)),hasSku=[m.columns.retailSku,m.columns.caseSku,m.columns.sku].some(v=>v!==undefined),hasName=[m.columns.retailName,m.columns.caseName,m.columns.name].some(v=>v!==undefined);if(!hasSku||!hasName)continue;const hits=evidence(rs,i+span,m.columns);if(hits<5)continue;const x={dataStart:i+span,columns:m.columns,mode:span===1?'header':'multi-row-header',score:m.score+hits+(span===1?2:0)};if(!best||x.score>best.score)best=x;}return best??infer(rs);}
function sample(rs){return rs.map((r,i)=>({row:i,values:r.filter(Boolean).slice(0,10)})).filter(x=>x.values.length).slice(0,6);}
function category(r){const t=norm([r.category,r.productType,r.name,r.brand].filter(Boolean).join(' '));if(/(bao bi|ly nhua|ly giay|nap ly|ong hut|tui |hop |muong|dia |khay)/.test(t))return'packaging';if(/(my cay|mi cay|ramen|my han|mi han)/.test(t))return'spicy-noodle';if(/(dong lanh|vien |pho mai que|khoai tay|xuc xich|ca vien|bo vien|tom vien|ga vien)/.test(t))return'frozen';if(/(an vat|snack|banh trang|rong bien|kho bo|hat |keo )/.test(t))return'snacks';if(/(gia vi|sot |tuong|sa te|nuoc cham|dau hao)/.test(t))return'sauce-seasoning';if(/(tra sua|pha che|topping|tran chau|thach|siro|syrup|tra |bot beo|bot kem|pudding|duong den|mut |puree)/.test(t))return'milk-tea';return'other';}
function records(r,c,source){
  const get=f=>c[f]===undefined?'':clean(r[c[f]]??''),common={category:get('category'),productType:get('productType'),brand:get('brand'),flavor:get('flavor'),size:get('size'),packaging:get('retailPackaging')||get('packaging'),casePackaging:get('casePackaging'),unit:get('retailUnit')||get('unit'),caseUnit:get('caseUnit'),caseQuantity:positive(get('caseQuantity')),retailPrice:money(get('retailPrice')),casePrice:money(get('casePrice')),genericPrice:money(get('genericPrice')),source},out=[];
  const retailRaw=get('retailSku'),caseRaw=get('caseSku'),genericRaw=get('sku'),retailName=get('retailName')||get('name'),caseName=get('caseName')||retailName;
  if(validSku(retailRaw)&&retailName)out.push({...common,sku:sku(retailRaw),name:retailName,purchaseMode:'retail'});
  if(validSku(caseRaw)&&caseName)out.push({...common,sku:sku(caseRaw),name:caseName,purchaseMode:'case',retailPrice:null,genericPrice:null,unit:get('caseUnit')||get('unit')||'thùng'});
  if(!retailRaw&&!caseRaw&&validSku(genericRaw)){const s=sku(genericRaw),name=get('name')||get('retailName')||get('caseName');if(name){const mode=s.endsWith('T')?'case':'retail';out.push({...common,sku:s,name,purchaseMode:mode,retailPrice:mode==='case'?null:common.retailPrice,casePrice:mode==='case'?(common.casePrice??common.genericPrice):common.casePrice,genericPrice:mode==='case'?null:common.genericPrice});}}
  if(out.length===1&&out[0].purchaseMode==='retail'&&common.casePrice!==null&&!caseRaw)out.push({...out[0],sku:`${out[0].sku}T`,name:`${out[0].name} - THÙNG`,purchaseMode:'case',retailPrice:null,genericPrice:null,unit:get('caseUnit')||'thùng'});
  return out;
}

const merge=(a,b)=>{if(!a)return b;const x={...a};for(const[k,v]of Object.entries(b))if(v!==''&&v!==null&&v!==undefined)x[k]=v;return x;};
function product(r){const s=sku(r.sku),mode=r.purchaseMode==='case'||s.endsWith('T')?'case':'retail',family=mode==='case'&&s.endsWith('T')?s.slice(0,-1):s,cat=category(r),amount=mode==='case'?r.casePrice:(r.retailPrice??r.genericPrice);return{sku:s,familySku:family,categoryId:cat,name:clean(r.name),aliases:[],brand:clean(r.brand)||'Hưng Phát',productType:clean(r.productType)||clean(r.category)||'Sản phẩm',flavor:clean(r.flavor)||null,size:clean(r.size)||clean(r.packaging)||'',purchaseMode:mode,caseQuantity:mode==='case'?(r.caseQuantity??null):null,packaging:mode==='case'&&r.casePackaging?r.casePackaging:(r.packaging||(mode==='case'?'Thùng':r.unit||'Đơn vị')),unit:clean(r.unit)||(mode==='case'?'thùng':'đơn vị'),description:[r.brand,r.productType,r.flavor,r.size].map(clean).filter(Boolean).join(' · '),availability:'available',price:{amount,currency:'VND',status:amount===null?'customer_price_pending':'available'},visualTone:categoryMeta[cat][1]};}
async function workbook(path){const e=unzip(await readFile(path)),ss=shared(e.get('xl/sharedStrings.xml')?.toString('utf8')??''),names=[...e.keys()].filter(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort(),all=[],diag=[];for(const n of names){const rs=rows(e.get(n).toString('utf8'),ss),h=header(rs);if(!h){diag.push({sheet:n,rows:rs.length,mapped:0,mode:'unmapped',sample:sample(rs)});continue;}let mapped=0;for(let i=h.dataStart;i<rs.length;i++){const x=records(rs[i],h.columns,path.split('/').pop());mapped+=x.length;all.push(...x);}diag.push({sheet:n,rows:rs.length,mapped,mode:h.mode,fields:Object.keys(h.columns),sample:sample(rs)});}return{all,diag};}

async function main(){const missing=sources.filter(n=>!existsSync(resolve(repo,n)));if(missing.length)throw new Error(`Thiếu bảng giá: ${missing.join(', ')}`);const map=new Map(),diagnostics=[];for(const source of sources){const w=await workbook(resolve(repo,source));diagnostics.push({source,sheets:w.diag});for(const r of w.all)map.set(sku(r.sku),merge(map.get(sku(r.sku)),r));}
  const products=[...map.values()].map(product).filter(p=>p.sku&&p.name).sort((a,b)=>a.name.localeCompare(b.name,'vi')||a.sku.localeCompare(b.sku));if(products.length<=14)throw new Error(`Catalog chỉ map được ${products.length} SKU. Diagnostics=${JSON.stringify(diagnostics)}`);if(new Set(products.map(p=>p.sku)).size!==products.length)throw new Error('SKU trùng sau khi map');
  const used=new Set(products.map(p=>p.categoryId)),categories=Object.entries(categoryMeta).filter(([id])=>used.has(id)).map(([id,[name]])=>({id,name,shortName:name}));await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify({categories,products,meta:{sourceFiles:sources,productCount:products.length}},null,2)+'\n');console.log(`[catalog] generated ${products.length} unique SKU from ${sources.length} workbooks`);for(const d of diagnostics)console.log(`[catalog] ${d.source}: ${JSON.stringify(d.sheets)}`);}
main().catch(e=>{console.error(`[catalog] ${e instanceof Error?e.message:String(e)}`);process.exitCode=1;});
