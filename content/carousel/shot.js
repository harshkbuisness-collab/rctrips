const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350}});
await p.goto('file://'+process.argv[2]);await p.waitForSelector('body[data-ready]');await p.waitForTimeout(600);
const n=+process.argv[4];for(let i=1;i<=n;i++){const el=await p.$('#s'+i);await el.scrollIntoViewIfNeeded();await p.waitForTimeout(120);await el.screenshot({path:process.argv[3]+'/slide-'+i+'.png'});}
await b.close();})();
