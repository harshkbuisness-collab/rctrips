import {spawn} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['tools/server.mjs'],{env:{...process.env,PORT:process.env.REEL_TEST_PORT || '3012'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('is running'))resolve();});server.on('exit',c=>reject(Error('server exited '+c)));});
const port=process.env.REEL_TEST_PORT || '3012';
const call=async(p,data)=>{const r=await fetch(`http://localhost:${port}`+p,{method:data===undefined?'GET':'POST',...(data===undefined?{}:{body:typeof data==='string'?data:JSON.stringify(data)})});return {status:r.status,body:await r.json()};};
let id,items=[];
try {
const plans=fs.readdirSync('examples/plans').sort().map(n=>fs.readFileSync('examples/plans/'+n,'utf8'));
const scripts=fs.readdirSync('examples/scripts').sort().map(n=>fs.readFileSync('examples/scripts/'+n,'utf8'));
id=(await call('/api/batches',{name:'audit_regression',items:scripts.map((script,k)=>({title:'audit_'+k,script}))})).body.id;
items=(await call('/api/batches/'+id)).body.items;
const prompt=(await call('/api/batches/'+id+'/prompt')).body.prompt;
for(const script of scripts)assert.ok(prompt.includes(script.trim()));
const answer=plans.map((p,k)=>`=== VIDEO ${k+1} ===\n\`\`\`json\n${p}\n\`\`\``).join('\n');
const imported=await call('/api/batches/'+id+'/plans',answer);
assert.equal(imported.status,200);assert.equal(imported.body.results.length,plans.length);
const read=()=>items.map(x=>fs.readFileSync('public/projects/'+x.project+'/timeline.json','utf8'));
const before=read();
const duplicate=await call('/api/batches/'+id+'/plans',`=== VIDEO 1 ===\n${plans[0]}\n=== VIDEO 1 ===\n${plans[1]}`);
assert.equal(duplicate.status,400);assert.match(duplicate.body.error,/Duplicate/);assert.deepEqual(read(),before);
console.log(`PASS: ${plans.length}-script prompt, fenced plan import, duplicate rejection with no mutations`);
}finally{
if(id)await call('/api/batches/'+id+'/delete',{});
for(const it of items)fs.rmSync('public/projects/'+it.project,{recursive:true,force:true});
server.kill();
}
