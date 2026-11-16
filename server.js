const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.pdf':'application/pdf','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const categories = {
  cannabis: 'cannabis marijuana legalization regulation industry when:7d',
  psychedelics: 'psychedelic psilocybin MDMA research policy when:7d'
};
const cache = new Map();
const TTL = 30 * 60 * 1000;
function unescapeXML(s) {
  return String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
    .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,v)=>{const n=v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):Number(v);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';})
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '}[m]))
    .replace(/<[^>]+>/g,'').trim();
}
function tag(block,name) { const m = block.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>','i'));return m ? unescapeXML(m[1]):''; }
function requestRSS(query) {
  const uri = 'https://news.google.com/rss/search?q='+encodeURIComponent(query)+'&hl=en-US&gl=US&ceid=US:en';
  return new Promise((resolve,reject)=>{
    https.get(uri,{headers:{'User-Agent':'NJGreenDashNews/1.0 (RSS reader)','Accept':'application/rss+xml, application/xml'}},res=>{
      if(res.statusCode!==200){res.resume();return reject(new Error('RSS status '+res.statusCode));}
      let data='';res.setEncoding('utf8');
      res.on('data',chunk=>{data+=chunk;if(data.length>1200000)res.destroy(new Error('Feed too large'));});
      res.on('end',()=>resolve(data));res.on('error',reject);
    }).on('error',reject).setTimeout(8000,function(){this.destroy(new Error('Feed timed out'));});
  });
}
async function getNews(category) {
  const cached=cache.get(category);
  if(cached && Date.now()-cached.updated<TTL) return cached.payload;
  try {
    const xml=await requestRSS(categories[category]);
    const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(x=>{
      const b=x[1], title=tag(b,'title'),link=tag(b,'link'),published=tag(b,'pubDate'),source=tag(b,'source');
      return {title,link,published,source:source||'Google News'};
    }).filter(x=>x.title&&/^https:\/\//.test(x.link)&&!Number.isNaN(Date.parse(x.published)))
      .sort((a,b)=>Date.parse(b.published)-Date.parse(a.published)).slice(0,25);
    const payload={category,updatedAt:new Date().toISOString(),articles:items,attribution:'Headlines aggregated via Google News RSS; original publishers retain their content.'};
    cache.set(category,{updated:Date.now(),payload});
    return payload;
  } catch(err) {
    if(cached) return {...cached.payload,stale:true};
    throw err;
  }
}
http.createServer(async(req,res)=>{
  let pathname;
  try {pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);} catch {res.writeHead(400);return res.end('Bad request');}
  if(pathname==='/api/news'){
    const category=new URL(req.url,'http://localhost').searchParams.get('category')||'cannabis';
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=300');
    res.setHeader('X-Content-Type-Options','nosniff');
    if(!Object.hasOwn(categories,category)){res.writeHead(400);return res.end(JSON.stringify({error:'Unknown category'}));}
    try {
      const live=await getNews(category);
      if(live.articles.length)return res.end(JSON.stringify(live));
      throw new Error('Empty live feed');
    }catch(err){
      try {
        const snapshot=JSON.parse(fs.readFileSync(path.join(root,'news-cache.json'),'utf8'));
        const saved=snapshot.topics?.[category];
        if(saved && Array.isArray(saved.articles) && saved.articles.length)
          return res.end(JSON.stringify({category,updatedAt:saved.updatedAt,articles:saved.articles,stale:true,source:'saved'}));
      }catch(ignore){}
      res.writeHead(503);
      return res.end(JSON.stringify({error:'News temporarily unavailable; use the publisher search links on the news page.'}));
    }
  }
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(data);});
}).listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('NJ Green Dash site listening'));
