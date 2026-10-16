const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+process.argv[2]);await p.waitForSelector('body[data-ready]');await p.waitForTimeout(800);
const days=process.argv.slice(4).length?process.argv.slice(4):[...Array(30).keys()].map(i=>i+1);
for(const d of days){const el=await p.$('#d'+d);await el.scrollIntoViewIfNeeded();await p.waitForTimeout(150);await el.screenshot({path:process.argv[3]+'/cover-day'+String(d).padStart(2,'0')+'.png'});}
await b.close();})();
