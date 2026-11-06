#!/usr/bin/env node
/* V1.1.0 · 2026-11-06. Non-destructive tests: no synthetic cards are published. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderAll, validateRegistry} from './sync-course-tools.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFile(resolve(ROOT,path),'utf8');
const paths={
 school:'school-ai-courses/tools/index.html',
 adults:'school-ai-courses/adults/tools/index.html',
 schoolIndex:'school-ai-courses/tools/search-index.json',
 adultIndex:'school-ai-courses/adults/tools/search-index.json',
};
const original=JSON.parse(await read('school-ai-courses/data/tools-registry.json'));
const pages={school:await read(paths.school),adults:await read(paths.adults)};
const base=renderAll(original,pages);
assert.ok(base.unique>=1);
assert.equal(base.counts.school,original.services.filter(x=>!!x.views.school).length);
assert.equal(base.counts.adults,original.services.filter(x=>!!x.views.adults).length);
assert.equal(base.output[paths.school],pages.school);
assert.equal(base.output[paths.adults],pages.adults);
assert.equal(base.output[paths.schoolIndex],await read(paths.schoolIndex));
assert.equal(base.output[paths.adultIndex],await read(paths.adultIndex));

function addSynthetic(scope){
 const registry=structuredClone(original);
 const view=registry.services.find(x=>x.views[scope])?.views[scope];
 assert.ok(view,'missing test fixture');
 const existing=new Set(registry.services.map(x=>x.views[scope]?.id));
 const prefix=scope==='school'?'tool-s':'tool-a';
 const id=Array.from({length:99},(_,i)=>prefix+String(i+1).padStart(2,'0')).find(x=>!existing.has(x));
 assert.ok(id,'no free two-digit ID for synthetic test');
 const name='Проверка новых сервисов';
 const maxOrder=Math.max(...registry.services.filter(x=>x.views[scope]).map(x=>x.views[scope].order));
 let html=view.html.split(view.id).join(id);
 html=html.replace(/(<h3[^>]*>)[\s\S]*?(<\/h3>)/,'$1'+name+'$2');
 registry.services.push({
   key:'synthetic-check-only-'+scope,
   title:name,
   views:{[scope]:{
     id,order:maxOrder+1,category:'Проверка автоматического индекса',
     keywords:'test synthetic',html
   }}
 });
 return renderAll(registry,pages);
}
for(const scope of ['school','adults']){
 const synthetic=addSynthetic(scope);
 const other=scope==='school'?'adults':'school';
 assert.equal(synthetic.unique,base.unique+1);
 assert.equal(synthetic.counts[scope],base.counts[scope]+1);
 assert.equal(synthetic.counts[other],base.counts[other]);
 assert.equal(synthetic.output[paths[other]],base.output[paths[other]]);
 const indexPath=scope==='school'?paths.schoolIndex:paths.adultIndex;
 const items=JSON.parse(synthetic.output[indexPath]).products;
 assert.equal(items.at(-1).title,'Проверка новых сервисов');
}
// Negative test: duplicate source key must never be published.
const invalid=structuredClone(original);
invalid.services.push(structuredClone(original.services[0]));
assert.throws(()=>validateRegistry(invalid),/duplicate service key/);

console.log(JSON.stringify({
 status:'PASS',baseline:base.counts,unique:base.unique,
 scenarios:['unchanged pages and indexes','school-only addition','adult-only addition','duplicate rejection']
}));
