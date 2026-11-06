#!/usr/bin/env node
/**
 * One source of truth: school-ai-courses/data/tools-registry.json
 * Generate and validate BOTH course Tools pages and BOTH Groq indexes.
 * Node 22+, no external packages. Version 1.1.0 / 2026-11-06.
 */
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY='school-ai-courses/data/tools-registry.json';
const CONFIG={
  school:{
    page:'school-ai-courses/tools/index.html',
    index:'school-ai-courses/tools/search-index.json',
    card:'tool-card-v2',
    id:/^tool-s[0-9]{2}$/,
    href:/^\/school-ai-courses\/tools\/#tool-s[0-9]{2}$/,
    title:'Курс ИИ — школьный каталог',
  },
  adults:{
    page:'school-ai-courses/adults/tools/index.html',
    index:'school-ai-courses/adults/tools/search-index.json',
    card:'adult-tool-card',
    id:/^tool-a[0-9]{2}$/,
    href:/^\/school-ai-courses\/adults\/tools\/#tool-a[0-9]{2}$/,
    title:'Курс ИИ — взрослый каталог',
  },
};
const SCOPES=['school','adults'];
const START=scope=>'<!-- COURSE_TOOLS_REGISTRY_START '+scope+' -->';
const END=scope=>'<!-- COURSE_TOOLS_REGISTRY_END '+scope+' -->';

function check(ok,why){if(!ok)throw Error('COURSE_TOOLS_SYNC: '+why);}
function clean(value){
 return String(value||'').replace(/<[^>]*>/g,' ')
 .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
 .replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
}
function attr(html,name){
 const opening=html.match(/^\s*<article\b[^>]*>/i)?.[0]||'';
 return opening.match(new RegExp('\\b'+name+'="([^"]*)"'))?.[1]||'';
}
function readCard(view,service,scope){
 const conf=CONFIG[scope];
 check(view&&typeof view==='object','missing view for '+service.key+'/'+scope);
 const id=view.id;
 check(typeof id==='string'&&conf.id.test(id),'invalid stable id for '+service.key+'/'+scope);
 check(Number.isInteger(view.order)&&view.order>0,'invalid order for '+service.key+'/'+scope);
 check(typeof view.html==='string'&&view.html.startsWith('<article')&&view.html.trimEnd().endsWith('</article>'),'invalid HTML for '+id);
 check((view.html.match(/<article\b/gi)||[]).length===1,'nested or multiple cards in '+id);
 check(attr(view.html,'id')===id,'HTML id differs from registry id '+id);
 check(attr(view.html,'data-ai-id')===id,'HTML data-ai-id differs from registry id '+id);
 check(attr(view.html,'class').split(/\s+/).includes(conf.card),'wrong card class for '+id);
 const title=clean(view.html.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1]);
 check(title===service.title,'card title differs from registry title '+id);
 const description=clean(view.html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]);
 check(description.length>0,'card description is empty for '+id);
 check(typeof view.category==='string'&&view.category.trim(),'missing category for '+id);
 check(typeof view.keywords==='string','missing keywords for '+id);
 const href=(scope==='school'?'/school-ai-courses/tools/#':'/school-ai-courses/adults/tools/#')+id;
 check(conf.href.test(href),'invalid href '+href);
 return {id,title,href,category:view.category,description,keywords:view.keywords};
}
function validateRegistry(registry){
 check(registry?.schema===1&&Array.isArray(registry.services),'invalid registry schema');
 check(/^\d{4}-\d{2}-\d{2}$/.test(registry.updated_at||''),'missing release date');
 check(typeof registry.release==='string'&&/^V\d+\.\d+\.\d+$/.test(registry.release),'missing release version');
 check(registry.services.length>0&&registry.services.length<=120,'registry size out of bounds');
 const keys=new Set(),titles=new Set(),data={school:[],adults:[]};
 const seenIds={school:new Set(),adults:new Set()},seenOrders={school:new Set(),adults:new Set()};
 for(const service of registry.services){
  check(service&&typeof service.key==='string'&&/^[a-z0-9а-яё-]+$/iu.test(service.key),'invalid service key');
  check(!keys.has(service.key),'duplicate service key '+service.key);keys.add(service.key);
  check(typeof service.title==='string'&&service.title.trim(),'missing service title '+service.key);
  check(!titles.has(service.title),'duplicate service title '+service.title);titles.add(service.title);
  check(service.views&&typeof service.views==='object','missing views for '+service.key);
  let hasView=false;
  for(const scope of SCOPES){
   const view=service.views[scope];if(!view)continue;hasView=true;
   const indexEntry=readCard(view,service,scope);
   check(!seenIds[scope].has(view.id),'duplicate card id '+view.id);seenIds[scope].add(view.id);
   check(!seenOrders[scope].has(view.order),'duplicate order '+scope+'/'+view.order);seenOrders[scope].add(view.order);
   data[scope].push({order:view.order,html:view.html,product:indexEntry});
  }
  check(hasView,'service has neither school nor adults view: '+service.key);
 }
 for(const scope of SCOPES){
  check(data[scope].length>=10&&data[scope].length<=120,'invalid catalog length '+scope);
  data[scope].sort((a,b)=>a.order-b.order);
 }
 return data;
}
function blockInPage(original,scope,items){
 const start=START(scope),end=END(scope);
 const i=original.indexOf(start),j=original.indexOf(end);
 check(i>=0&&j>i,'missing registry block markers in '+CONFIG[scope].page);
 check(original.indexOf(start,i+start.length)<0&&original.indexOf(end,j+end.length)<0,'duplicate registry block markers '+scope);
 const html=items.map(x=>x.html).join(scope==='school'?'\n\n':'\n');
 let result=original.slice(0,i)+start+'\n'+html+'\n'+end+original.slice(j+end.length);
 const meta='<meta name="course-search-release" content="'+registryRelease+'">';
 const old=/<meta name="course-search-release" content="[^"]+">/g;
 check((result.match(old)||[]).length===1,'missing/multiple release metadata '+scope);
 result=result.replace(old,meta);
 const cardRe=new RegExp('<article\\b(?=[^>]*class="[^"]*\\b'+CONFIG[scope].card+'\\b)[^>]*>[\\s\\S]*?<\\/article>','g');
 check((result.match(cardRe)||[]).length===items.length,'untracked card outside generated region '+scope);
 return result;
}
let registryRelease='';
function renderAll(registry,pages){
 const data=validateRegistry(registry);
 registryRelease=registry.release+' · '+registry.updated_at;
 const output={};
 for(const scope of SCOPES){
  const items=data[scope];
  output[CONFIG[scope].page]=blockInPage(pages[scope],scope,items);
  output[CONFIG[scope].index]=JSON.stringify({
   schema:1,brand:CONFIG[scope].title,updated_at:registry.updated_at,
   scope,products:items.map(x=>x.product)
  },null,2)+'\n';
 }
 return {output,counts:Object.fromEntries(SCOPES.map(x=>[x,data[x].length])),unique:registry.services.length};
}
async function main(){
 const mode=process.argv[2]||'--check';
 check(['--check','--write'].includes(mode),'use --check or --write');
 const read=async p=>readFile(resolve(ROOT,p),'utf8');
 const registry=JSON.parse(await read(REGISTRY));
 const pages={};
 for(const scope of SCOPES)pages[scope]=await read(CONFIG[scope].page);
 const rendered=renderAll(registry,pages);
 const changed=[];
 for(const [path,expected] of Object.entries(rendered.output)){
  const previous=await read(path);
  if(previous!==expected){
   changed.push(path);
   if(mode==='--write')await writeFile(resolve(ROOT,path),expected,'utf8');
  }
 }
 console.log(JSON.stringify({mode,unique:rendered.unique,counts:rendered.counts,changed},null,2));
 if(mode==='--check'&&changed.length)process.exitCode=1;
}
export {renderAll, validateRegistry};
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(err=>{console.error(err.stack||String(err));process.exitCode=1});
}
