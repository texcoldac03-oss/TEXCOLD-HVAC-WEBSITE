const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const {once}=require('node:events');
const {renderPage,services,projects}=require('../site');

test('all published routes, internal links, anchors and project images resolve in both languages',()=>{
  const routes=['/','/our-work','/contact',...Object.keys(services).map(s=>'/'+s)];
  for(const lang of ['en','es'])for(const route of routes){
    const html=renderPage(route,lang);assert.ok(html.includes(`<html lang="${lang}">`),route);
    assert.equal((html.match(/<h1>/g)||[]).length,1,route);
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,`duplicate id in ${route}`);
    for(const [,href] of html.matchAll(/href="([^"?]+)(?:\?[^"#]*)?(?:#[^"]*)?"/g)){
      if(href.startsWith('mailto:')||href.startsWith('tel:')||href.startsWith('?'))continue;
      if(href.startsWith('#')){assert.ok(ids.includes(href.slice(1)),`missing anchor ${href} on ${route}`);continue;}
      const pathname=href.split('#')[0];assert.ok(routes.includes(pathname)||fs.existsSync(path.join(__dirname,'../public',pathname)),`broken link ${href} on ${route}`);
    }
    for(const [,src] of html.matchAll(/(?:src|data-full)="([^"]+)"/g))assert.ok(fs.existsSync(path.join(__dirname,'../public',src)),`missing asset ${src}`);
    assert.doesNotMatch(html,/https:\/\/commons\.wikimedia|Photo coming soon|Demo assistant/);
  }
  assert.equal(projects.length,45);assert.equal(new Set(projects.map(p=>p.src)).size,45);
  for(const project of projects){assert.ok(project.tags.length);for(const prop of ['src','thumb'])assert.ok(fs.statSync(path.join(__dirname,'../public',project[prop])).size>1000);}
});

async function startServer(t,extra={}){
  const port=String(19000+Math.floor(Math.random()*10000));
  const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:port,PREVIEW_PASSWORD:'',LOCAL_PREVIEW:'',...extra},stdio:['ignore','pipe','pipe']});
  t.after(()=>child.kill());await once(child.stdout,'data');return 'http://127.0.0.1:'+port;
}
test('private staging protects pages and photos, rejects bad credentials and locks again after logout',async t=>{
  const base=await startServer(t,{PREVIEW_PASSWORD:'automated-test-only-password'});
  for(const p of ['/','/maintenance','/contact','/our-work','/index.html']){
    const response=await fetch(base+p);const html=await response.text();assert.ok(html.includes('Private website preview'));assert.ok(!html.includes('Reliable Comfort.'));assert.match(response.headers.get('cache-control'),/no-store/);
  }
  assert.equal((await fetch(base+projects[0].src)).status,401);
  const incorrect=await fetch(base+'/preview-access',{method:'POST',body:new URLSearchParams({password:'incorrect'}),redirect:'manual'});assert.equal(incorrect.status,401);
  const login=await fetch(base+'/preview-access',{method:'POST',headers:{'x-forwarded-proto':'https'},body:new URLSearchParams({password:'automated-test-only-password'}),redirect:'manual'});
  assert.equal(login.status,303);const cookie=login.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);assert.match(cookie,/Secure/);
  const auth={headers:{cookie:cookie.split(';')[0]}};
  assert.match(await (await fetch(base,auth)).text(),/Reliable Comfort\./);
  assert.equal((await fetch(base+projects[0].src,auth)).status,200);
  assert.equal((await fetch(base+'/server.js',auth)).status,404);
  assert.equal((await fetch(base+'/.env',auth)).status,404);
  const tampered={headers:{cookie:cookie.split(';')[0]+'x'}};assert.ok((await (await fetch(base,tampered)).text()).includes('Private website preview'));
  const api=await fetch(base+'/api/chat',{...auth,method:'POST',headers:{...auth.headers,'content-type':'application/json'},body:JSON.stringify({message:'Maintenance'})});assert.equal(api.status,503);assert.equal((await api.json()).error,'AI_NOT_CONFIGURED');
  const logout=await fetch(base+'/logout',{method:'POST',...auth,redirect:'manual'});assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
});
test('deployment fails closed if a preview password was omitted',async t=>{
  const base=await startServer(t);assert.equal((await fetch(base)).status,503);assert.equal((await fetch(base+'/health')).status,200);
});
