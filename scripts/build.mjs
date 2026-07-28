import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { VEHICLES } from "../src/content/catalog.mjs";
import { renderDocument } from "../src/templates/layout.mjs";
import { homePage,carsPage,vehiclePage,matchPage,comparePage,savedPage,financePage,testDrivePage,reservationsPage,safetyPage,aboutPage,privacyPage,adminOverviewPage,adminInventoryPage,adminTestDrivesPage,adminSettingsPage,notFoundPage } from "../src/templates/pages.mjs";
const root=fileURLToPath(new URL('../',import.meta.url)); const out=join(root,'dist');
const indexable=process.env.DRIVELENS_PUBLIC_INDEXING==='true' && Boolean(process.env.SITE_URL||process.env.VERCEL_PROJECT_PRODUCTION_URL);
await rm(out,{recursive:true,force:true}); await mkdir(out,{recursive:true}); await cp(join(root,'src/static/assets'),join(out,'assets'),{recursive:true}); await cp(join(root,'src/static/site.webmanifest'),join(out,'site.webmanifest'));
const interactive=['/assets/app.js'];
const routes=[
{path:'/',title:'DriveLens Market Lab',description:'AI-assisted fictional Canadian vehicle discovery, private shortlists and test-drive planning.',main:homePage(),scripts:interactive,bodyClass:'home-page'},
{path:'/cars/',title:'Browse vehicles',description:'Search and compare fictional Canadian vehicle inventory with transparent filters.',main:carsPage(),scripts:interactive,bodyClass:'cars-page'},
...VEHICLES.map(v=>({path:`/cars/${v.slug}/`,title:`${v.make} ${v.model}`,description:v.summary,main:vehiclePage(v),scripts:interactive,bodyClass:'vehicle-page'})),
{path:'/match/',title:'Smart Match',description:'Use explainable preference matching or optional server-side photo analysis.',main:matchPage(),scripts:interactive,bodyClass:'match-page',private:true},
{path:'/compare/',title:'Compare vehicles',description:'Compare up to three fictional vehicles privately in this browser.',main:comparePage(),scripts:interactive,bodyClass:'compare-page',private:true},
{path:'/saved/',title:'Saved vehicles',description:'Review a private browser-local vehicle shortlist.',main:savedPage(),scripts:interactive,bodyClass:'saved-page',private:true},
{path:'/finance/',title:'Finance estimator',description:'Explore an educational vehicle finance scenario without an application.',main:financePage(),scripts:interactive,bodyClass:'finance-page',private:true},
{path:'/test-drive/',title:'Plan a test drive',description:'Create a private browser-local test-drive reminder.',main:testDrivePage(),scripts:interactive,bodyClass:'test-drive-page',private:true},
{path:'/reservations/',title:'Test-drive plans',description:'Review browser-local fictional test-drive plans.',main:reservationsPage(),scripts:interactive,bodyClass:'reservations-page',private:true},
{path:'/safety/',title:'Marketplace safety',description:'Verification-first safety guidance for a real vehicle transaction.',main:safetyPage(),bodyClass:'safety-page'},
{path:'/about/',title:'Architecture',description:'Learn how the unsafe tutorial was redesigned as DriveLens Market Lab.',main:aboutPage(),bodyClass:'about-page'},
{path:'/privacy/',title:'Privacy',description:'Understand DriveLens browser-local data and optional AI photo analysis.',main:privacyPage(),bodyClass:'privacy-page'},
{path:'/admin/',title:'Admin overview',description:'Synthetic marketplace administration information architecture.',main:adminOverviewPage(),scripts:interactive,bodyClass:'admin-page',type:'admin',private:true},
{path:'/admin/inventory/',title:'Inventory admin',description:'Browser-local fictional inventory status management.',main:adminInventoryPage(),scripts:interactive,bodyClass:'admin-page',type:'admin',private:true},
{path:'/admin/test-drives/',title:'Test-drive admin',description:'Browser-local fictional test-drive operations.',main:adminTestDrivesPage(),scripts:interactive,bodyClass:'admin-page',type:'admin',private:true},
{path:'/admin/settings/',title:'Branch settings',description:'Fictional branch settings and operations notes.',main:adminSettingsPage(),scripts:interactive,bodyClass:'admin-page',type:'admin',private:true},
{path:'/404/',title:'Page not found',description:'The requested DriveLens page could not be found.',main:notFoundPage(),bodyClass:'not-found-page',private:true,status:404},
];
const fileFor=path=>path==='/'?join(out,'index.html'):join(out,path.replace(/^\//,''),'index.html');
for(const route of routes){ const robots=route.private?'noindex,nofollow':indexable?'index,follow':'noindex,follow'; const html=renderDocument({...route,robots}); const file=fileFor(route.path); await mkdir(dirname(file),{recursive:true}); await writeFile(file,html); if(route.path==='/404/')await writeFile(join(out,'404.html'),html); }
const origin=(process.env.SITE_URL||'').replace(/\/$/,'') || (process.env.VERCEL_PROJECT_PRODUCTION_URL?`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//,'').replace(/\/$/,'')}`:'');
const publicRoutes=routes.filter(r=>!r.private&&r.path!=='/404/'); await writeFile(join(out,'robots.txt'),indexable?`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
await writeFile(join(out,'sitemap.xml'),indexable?`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicRoutes.map(r=>`<url><loc>${origin}${r.path}</loc></url>`).join('')}</urlset>`:'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
await mkdir(join(out,'.well-known'),{recursive:true}); await writeFile(join(out,'.well-known/security.txt'),`Contact: mailto:royceinoba@gmail.com\nPreferred-Languages: en\nCanonical: ${origin?origin+'/.well-known/security.txt':''}\nExpires: 2027-07-27T00:00:00Z\n`);
const version=createHash('sha256').update(routes.map(r=>r.path).join('|')).digest('hex').slice(0,12); const precache=['/','/cars/','/match/','/compare/','/saved/','/finance/','/test-drive/','/reservations/','/safety/','/about/','/privacy/','/404/','/assets/site.css','/assets/site.js','/assets/app.js','/assets/icons/favicon.svg','/assets/icons/icon-192.png','/assets/icons/icon-512.png','/site.webmanifest'];
let sw=(await import('node:fs/promises')).readFile; const template=await sw(join(root,'src/static/sw.js'),'utf8'); await writeFile(join(out,'sw.js'),template.replace('__CACHE_VERSION__',version).replace('__PRECACHE__',JSON.stringify(precache)));
console.log(`Built ${routes.length} routes into dist.`);
