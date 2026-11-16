const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = __dirname;
const pageFiles = fs.readdirSync(root).filter(name => name.endsWith(".html"));
const assetRef = /<img\b[^>]*\bsrc="([^"]+)"|<a\b[^>]*\bhref="([^"]+\.svg)"/gi;
let images = 0, technicalLinks = 0, checked = 0;
for (const page of pageFiles) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  for (const match of html.matchAll(assetRef)) {
    const image = !!match[1], ref = (match[1] || match[2]).split("?")[0].split("#")[0];
    if (/^(https?:|data:|\/\/)/.test(ref)) continue;
    const relative = ref.replace(/^\/+/, "");
    assert(!relative.includes(".."), page + ": unsafe image path " + ref);
    assert(fs.existsSync(path.join(root, relative)), page + ": missing " + ref);
    if (image) {
      images++;
      assert(!/\.svg$/i.test(ref), page + ": inline technical SVG should be linked, not shown as portfolio rendering");
    } else technicalLinks++;
    checked++;
  }
}
const src = fs.readFileSync(path.join(root, "projects.js"), "utf8");
const match = src.match(/window\.NJGD_PROJECTS\s*=\s*(\[[\s\S]*?\]);/);
assert(match, "Projects data missing");
const projects = JSON.parse(match[1]);
assert.equal(projects.length, 26, "Expected 26 project studies");
let projectAssets = 0;
for (const project of projects) {
  assert(fs.existsSync(path.join(root, "project-" + String(project.id).padStart(2, "0") + ".html")));
  const assets = [project.photo, project.exterior, project.interior, project.board, project.approach,
    ...(project.gallery || []).map(item => item.src), ...Object.values(project.drawings || {})];
  for (const asset of assets.filter(Boolean)) {
    assert(fs.existsSync(path.join(root, asset)), "Missing project " + project.id + " asset " + asset);
    projectAssets++;
  }
}
console.log("Passed: " + pageFiles.length + " HTML pages, " + images + " image tags, " +
  technicalLinks + " technical links, " + projectAssets + " project image references. No inline SVG portfolio images or missing local assets.");


const newsPage=fs.readFileSync(path.join(root,"news.html"),"utf8");
const newsScript=fs.readFileSync(path.join(root,"news.js"),"utf8");
const newsCache=JSON.parse(fs.readFileSync(path.join(root,"news-cache.json"),"utf8"));
assert(newsPage.includes('id="news-grid"'),"News page must have headline container");
assert(newsScript.includes("news-cache.json"),"News page must support static fallback");
assert(newsScript.includes("/api/news"),"News page must support live headlines");
assert(fs.existsSync(path.join(root,"news-feed-fetch.js")),"Scheduled RSS fetcher missing");
assert(fs.existsSync(path.join(root,".github/workflows/refresh-news.yml")),"Scheduled refresh workflow missing");
assert(fs.readFileSync(path.join(root,"sitemap.xml"),"utf8").includes("/news.html"),"Sitemap missing news page");
for(const category of ["cannabis","psychedelics"]){
 assert(newsCache.topics?.[category],"Missing cache topic "+category);
 for(const article of newsCache.topics[category].articles){
  assert(article.title&&/^https:\/\//.test(article.link)&&!Number.isNaN(Date.parse(article.published)),"Invalid cached news article");
 }
}
for(const page of pageFiles){
 if(page==="news.html")continue;
 const html=fs.readFileSync(path.join(root,page),"utf8");
 assert(html.includes('href="news.html"'),page+": missing Industry News navigation");
}
console.log("Passed: news links on every HTML page, valid news snapshots, scheduled refresh, and live/static fallback.");
