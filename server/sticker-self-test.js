import {analyzeText} from '../src/visualEngine.js';
import {getStickerMeta, selectStickerPlans, STICKERS} from '../src/stickerEngine.js';

function scene(text,index){return {id:`s${index}`,index,start:index*1.5,end:index*1.5+1.35,text,semantic:analyzeText(text,text),layoutMode:index%2?'split-left':'split-right',stickerId:'none',stickerLocked:false};}
const input=[
  scene('Views aa rahe hain but followers nahi badh rahe, problem yahi hai.',0),
  scene('CTR is 4.8 percent for this campaign.',1),
  scene('Ye galat mistake mat karna.',2),
  scene('Finally growth aayi, this worked!',3),
  scene('Scan this QR code and send it to your friend.',4),
];
const planned=selectStickerPlans(input,{mode:'balanced',seed:3,preserveLocked:true});
console.log(planned.map(s=>({text:s.text,sticker:s.stickerId,label:getStickerMeta(s.stickerId)?.label||'none',anim:s.stickerAnimation,placement:s.stickerPlacement,score:s.stickerScore})));
if(STICKERS.length!==72)throw new Error(`Expected 72 stickers, found ${STICKERS.length}`);
if(planned[0].stickerId==='none')throw new Error('Expected a reaction sticker for negative views/follower context');
if(planned[2].stickerId==='none')throw new Error('Expected a warning/reaction sticker for mistake context');
const off=selectStickerPlans(input,{mode:'off',seed:3});
if(off.some(s=>s.stickerId!=='none'))throw new Error('Off mode should disable all stickers');
console.log('Sticker self-test passed.');
