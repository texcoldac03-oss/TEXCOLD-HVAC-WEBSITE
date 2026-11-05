const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {renderPage,services}=require('./site');
const {chat}=require('./lib/assistant');
const port=Number(process.env.PORT)||Number(process.argv[process.argv.indexOf('--port')+1])||3000;
const publicDir=path.join(__dirname,'public');
const password=process.env.PREVIEW_PASSWORD||'';
const localPreview=process.env.LOCAL_PREVIEW==='1'&&!process.env.RAILWAY_ENVIRONMENT_ID;
const contact={phone:process.env.CONTACT_PHONE||'+12812236761',displayPhone:process.env.CONTACT_PHONE_DISPLAY||'(281) 223-6761',email:process.env.CONTACT_EMAIL||'texcold@hotmail.com'};
const maxBody=12000;
const cookieName='texcold_preview';
const sessionLifetime=12*60*60*1000;
const sessionKey=crypto.createHash('sha256').update('texcold-preview-v1:'+password).digest();
const safeEqual=(a,b)=>{const x=crypto.createHash('sha256').update(String(a)).digest(),y=crypto.createHash('sha256').update(String(b)).digest();return crypto.timingSafeEqual(x,y);};
const sign=expires=>crypto.createHmac('sha256',sessionKey).update(expires).digest('base64url');
const validSession=req=>{
  if(!password)return localPreview;
  const cookie=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='));
  if(!cookie)return false;const token=cookie.slice(cookieName.length+1),[expires,signature]=token.split('.');
  return /^\d{13}$/.test(expires||'')&&Number(expires)>Date.now()&&Number(expires)<=Date.now()+sessionLifetime+1000&&safeEqual(signature||'',sign(expires));
};
const headers={'x-content-type-options':'nosniff','referrer-policy':'same-origin','x-robots-tag':'noindex, nofollow, noarchive','x-frame-options':localPreview?'SAMEORIGIN':'DENY','permissions-policy':'camera=(), microphone=(), geolocation=()','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-src 'self'; frame-ancestors "+(localPreview?"'self'":"'none'")+"; form-action 'self'"};
const json=(res,status,data)=>{res.writeHead(status,{...headers,'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));};
const hits=new Map();
function allowed(ip,limit=12,windowMs=60000){const now=Date.now();const entry=hits.get(ip)||[];const recent=entry.filter(t=>now-t<windowMs);if(recent.length>=limit)return false;recent.push(now);hits.set(ip,recent);if(hits.size>2000)hits.clear();return true;}
const previewRoutes=new Set(['/', '/index.html', '/our-work', '/about', '/contact', ...Object.keys(services).map(name=>'/'+name)]);
function previewReturnPath(value){
  if(typeof value!=='string'||value.length>1000||!value.startsWith('/')||value.startsWith('//')||/[\\\x00-\x1f]/.test(value))return '/';
  try{const target=new URL(value,'http://localhost');return target.origin==='http://localhost'&&previewRoutes.has(target.pathname)?target.pathname+target.search+target.hash:'/';}catch{return '/';}
}
const htmlAttribute=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const loginPage=(error,returnTo='/')=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Texcold — Private Preview</title><link rel="stylesheet" href="/styles.css?v=${require('./package.json').version}"><link rel="icon" href="/favicon.svg"></head><body class="auth-body"><main class="auth-card"><img class="auth-logo" src="/assets/texcold-logo.webp" alt="Texcold Heating and A/C Services" width="1774" height="887"><p class="eyebrow">TEXCOLD · STAGING</p><h1>Private website preview</h1><p class="muted">Enter your preview key to see the updated website.<br>Ingresa tu clave para ver la página actualizada.</p>${error?'<p class="auth-error" role="alert">'+error+'</p>':''}<form method="post" action="/preview-access"><input type="hidden" name="returnTo" value="${htmlAttribute(previewReturnPath(returnTo))}"><label for="preview-key">Preview key / Clave de acceso<input id="preview-key" name="password" type="password" autocomplete="current-password" required autofocus maxlength="200"></label><button class="btn" type="submit">Open preview / Abrir página →</button></form></main></body></html>`;
const sendHtml=(req,res,status,html)=>{res.writeHead(status,{...headers,'content-type':'text/html; charset=utf-8','cache-control':'no-store'});if(req.method==='HEAD')return res.end();res.end(html);};
async function readBody(req){let body='';for await(const chunk of req){body+=chunk;if(body.length>maxBody)throw new Error('BODY_TOO_LARGE');}return body;}
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(localPreview&&url.pathname==='/__qa/mobile')return sendHtml(req,res,200,'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Texcold mobile QA</title><link rel="stylesheet" href="/styles.css"></head><body class="qa-body"><iframe class="qa-mobile" src="/" title="Mobile preview"></iframe></body></html>');
    if((req.method==='GET'||req.method==='HEAD')&&url.pathname==='/health')return json(res,200,{ok:true,version:require('./package.json').version,privatePreview:!localPreview});
    if(url.pathname==='/robots.txt'){res.writeHead(200,{...headers,'content-type':'text/plain'});return res.end('User-agent: *\nDisallow: /\n');}
    if(req.method==='POST'&&url.pathname==='/preview-access'){
      if(!password)return sendHtml(req,res,503,loginPage('Preview access is not configured.'));
      const ip='login:'+(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown');
      if(!allowed(ip,10,15*60000))return sendHtml(req,res,429,loginPage('Please try again later. / Intenta más tarde.'));
      const values=new URLSearchParams(await readBody(req));
      if(!safeEqual(values.get('password')||'',password))return sendHtml(req,res,401,loginPage('Incorrect preview key. / Clave incorrecta.',values.get('returnTo')));
      const expires=String(Date.now()+sessionLifetime);const secure=(req.headers['x-forwarded-proto']==='https'||Boolean(process.env.RAILWAY_ENVIRONMENT_ID))?'; Secure':'';
      res.writeHead(303,{...headers,'cache-control':'no-store','set-cookie':`${cookieName}=${expires}.${sign(expires)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sessionLifetime/1000}${secure}`,'location':previewReturnPath(values.get('returnTo'))});return res.end();
    }
    if(req.method==='POST'&&url.pathname==='/logout'){res.writeHead(303,{...headers,'cache-control':'no-store','set-cookie':`${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,'location':'/'});return res.end();}
    const loginAsset=['/styles.css','/favicon.svg','/assets/texcold-logo.webp'].includes(url.pathname);
    if(!loginAsset&&!validSession(req)){
      if(!password&&!localPreview)return sendHtml(req,res,503,loginPage('Private preview is being configured.'));
      if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/assets/'))return json(res,401,{error:'PREVIEW_ACCESS_REQUIRED'});
      return sendHtml(req,res,200,loginPage(undefined,url.pathname+url.search));
    }
    if(req.method==='POST'&&url.pathname==='/api/chat')return chat(req,res,{json,allowed,maxBody});
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{...headers,'allow':'GET, HEAD'});return res.end('Method not allowed');}
    const pathname=url.pathname==='/index.html'?'/':url.pathname.replace(/\/$/,'')||'/';
    const html=renderPage(pathname,url.searchParams.get('lang')==='es'?'es':'en',contact);
    if(html!==null)return sendHtml(req,res,200,html);
    if(!/^\/(?:styles\.css|app\.js|favicon\.svg|assets\/[a-z0-9_./-]+)$/.test(url.pathname)||url.pathname.includes('..')){
      res.writeHead(404,{...headers,'content-type':'text/plain; charset=utf-8'});return res.end('Page not found.');
    }
    const file=path.resolve(publicDir,'.'+url.pathname);
    if(!file.startsWith(publicDir+path.sep)){res.writeHead(404,headers);return res.end('Not found');}
    let stat;try{stat=fs.statSync(file);}catch{res.writeHead(404,headers);return res.end('Not found');}
    if(!stat.isFile()){res.writeHead(404,headers);return res.end('Not found');}
    const mime={'.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp'}[path.extname(file)];
    res.writeHead(200,{...headers,'content-type':mime||'application/octet-stream','content-length':stat.size,'cache-control':'private, max-age=3600'});
    if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res);
  }catch(error){if(!res.headersSent)json(res,error.message==='BODY_TOO_LARGE'?413:500,{error:error.message==='BODY_TOO_LARGE'?'Request too large':'Server error'});else res.end();}
});
server.listen(port,'0.0.0.0',()=>console.log('Texcold staging listening on '+port));
