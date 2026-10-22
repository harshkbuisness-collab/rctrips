import visualData from './visualLibraryData.js';

export const THEMES = [
  {name:'Ivory',bg:'#F3EEE4',fg:'#1C1B19',muted:'#6B6459',accent:'#C1443A',accent2:'#E0897E'},
  {name:'Blackout',bg:'#0A0A0B',fg:'#FAFAF8',muted:'#9A9A9E',accent:'#E8362B',accent2:'#FF7A6E'},
  {name:'Slate',bg:'#1B2733',fg:'#F5F7FA',muted:'#9FB0BF',accent:'#E8EEF5',accent2:'#B9CBDC'},
  {name:'Cream',bg:'#F0EBE0',fg:'#1D1D1D',muted:'#6E6A61',accent:'#2C4E9E',accent2:'#6C87C9'},
  {name:'Charcoal',bg:'#141414',fg:'#F6F3EC',muted:'#A8A49B',accent:'#F0C24B',accent2:'#F7DA8C'},
  {name:'Paper',bg:'#FFFFFF',fg:'#14161A',muted:'#6B7280',accent:'#2F63E8',accent2:'#7B9BF2'},
  {name:'Electric Blue',bg:'#071425',fg:'#F7FBFF',muted:'#9EB8D2',accent:'#55B8FF',accent2:'#7B61FF'},
  {name:'Neon Purple',bg:'#170B2E',fg:'#FFF8FF',muted:'#BCA7D5',accent:'#D96BFF',accent2:'#7D5CFF'},
  {name:'Cyber Lime',bg:'#0C180E',fg:'#F7FFE9',muted:'#A9B99A',accent:'#B9FF42',accent2:'#39E69C'},
  {name:'Hot Pink',bg:'#24091B',fg:'#FFF7FC',muted:'#C7A4B8',accent:'#FF4BB2',accent2:'#FF7A43'},
  {name:'Cyan Night',bg:'#061B20',fg:'#F4FFFF',muted:'#8DB8BA',accent:'#34E6E2',accent2:'#4C8DFF'},
  {name:'Orange Pulse',bg:'#251005',fg:'#FFF9F2',muted:'#C8AA92',accent:'#FF8B2F',accent2:'#FFD84D'},
];

export const FONT_OPTIONS = [
  {key:'body', label:'Clean Sans'},
  {key:'bold', label:'Bold Sans'},
  {key:'impact', label:'Impact Display'},
  {key:'condensed', label:'Condensed Poster'},
  {key:'editorial', label:'Editorial Serif'},
  {key:'rounded', label:'Rounded Modern'},
  {key:'script', label:'Handwritten Script'},
  {key:'mono', label:'Numeric / Mono'},
  {key:'poster', label:'Poster Black'},
  {key:'marker', label:'Marker / Doodle'},
  {key:'slab', label:'Slab Serif'},
  {key:'tech', label:'Tech Condensed'},
  {key:'elegant', label:'Elegant Serif'},
];

export const FONTS = {
  body:'"Inter", Arial, Helvetica, sans-serif',
  bold:'"Inter", Arial, Helvetica, sans-serif',
  impact:'"Anton", Impact, "Arial Black", sans-serif',
  condensed:'"Oswald", "Arial Narrow", Impact, sans-serif',
  editorial:'"DM Sans", "Inter", Arial, sans-serif',
  rounded:'"DM Sans", "Inter", Arial, sans-serif',
  script:'"Caveat", "Segoe Script", cursive',
  mono:'"Courier New", Consolas, monospace',
  poster:'"Anton", Impact, "Arial Black", sans-serif',
  marker:'"Caveat", "Segoe Print", cursive',
  slab:'"Oswald", Georgia, serif',
  tech:'"Oswald", "Inter", Arial, sans-serif',
  elegant:'"DM Sans", "Inter", Arial, sans-serif',
};

const FULL_BLEED_TYPES = new Set(['appCard','socialPost','product','phone','device','qrScan','map','beforeAfter']);
const DETAILED_TYPES = new Set(['barChart','lineChart','pieChart','kpiCard','statGrid','compareTable','timeline','progressSteps','socialPost','appCard','product','device']);
const QUICK_TYPES = new Set(['hook','statSingle','ring','counterUp','currencyStat','trend','cta','emojiPop','burst','sparkle','countdown','toggle']);
// These can safely become illustrative without fabricating a factual number.
const NO_DATA_OK = new Set([
  'views','retention','watch','youtube','instagram','growth','publish','progressBar','goalProgressBar',
  'phoneMockup','laptopMockup','tabletMockup','smartwatchMockup','browserMockup','wifiConnectedCard',
  'bluetoothPairCard','cloudSyncCard','downloadProgressCard','qrScanCard','twitterPost','linkedinPost',
  'facebookPost','tiktokCaption','pinterestPin','telegramMessage','mapPin','arrowCallout'
]);

const STOPWORDS = new Set(('a an the is are am was were be been being to of in on at for from with and or but if then so as this that these those it its you your we our they their i me my he she them do does did done can could should would will just only very more most much some any all about into over after before than when while because agar aap aapko apko hai hain ho hoga hote ki ka ke ko se mein main par pe aur ya to toh bhi sirf zyada kam phir baaki asli fark padta log rahe raha rahi kare kar karna karke liye wala wali ek ye yeh wo woh nahi nhi mat').split(/\s+/));

// Phrase rules are intentionally redundant. The selector is local/offline, so broad English + Hinglish
// coverage is more useful than an ultra-small dictionary.
const RULES = {
  hook:['hook','hooks','opening','intro','first second','first seconds','first few second','first few seconds','first 3 second','first 3 seconds','first three seconds','stop scroll','scroll stop','attention','pehle kuch second','pehle 3 second','starting seconds','rukte','ruko'],
  views:['view','views','reach','impression','impressions','dekha','dekhe','dekho'],
  retention:['retention','audience retention','drop off','dropoff','stay watching','keep watching','people stay','watch till','completion rate','rukte','ruke','ruka','end tak'],
  watch:['watch time','watchtime','view duration','average view duration','avg view duration','duration dekho','watch duration'],
  growth:['growth','grow','grows','grew','grown','growing','increase','increased','increasing','improve','improved','improvement','boost','scale','scaled','viral','smart growth','badhe','badha','badhi','badhna','badh','grow kar'],
  decline:['drop','dropped','decline','declined','decrease','decreased','down','lower','reduced','kam hua','kam ho','gir','gira','giri','fall','fell'],
  content:['content','script','video','videos','reel','reels','short','shorts','post','posting','creative','caption','story','stories'],
  format:['format','framework','structure','formula','template','system','strategy','pattern'],
  publish:['publish','published','publishing','upload','uploaded','post kar','posted','live kar','go live'],
  cta:['comment','follow','save','share','subscribe','dm','message me','click','tap','call to action','cta','link in bio','book now','contact us'],
  comparison:['versus',' vs ','instead','rather','better than','not only','dont only','do not only','compare','comparison','galat cheez','right way','wrong way','before and after','before after'],
  offer:['offer','discount','deal','price','pricing','cost','save money',' off','limited offer','coupon','sale','starting at','starts at','package price'],
  trust:['trust','trusted','review','reviews','testimonial','verified','rating','ratings','stars','client result','case study','proof','customers','clients'],
  chat:['whatsapp','message','reply','chat','dm','telegram','inbox'],
  social:['instagram','youtube','facebook','linkedin','tiktok','twitter','pinterest','telegram','x.com'],
  analytics:['analytics','metric','metrics','performance','insight','insights','data','report','dashboard','kpi','ctr','conversion','bounce rate','sessions','clicks','engagement rate'],
  finance:['revenue','profit','margin','roi','saving','savings','wallet','emi','invoice','tax','investment','crypto','spend','budget','income','sales'],
  device:['phone','mobile','laptop','desktop','tablet','browser','qr','wifi','wi-fi','bluetooth','app','software','screen','website'],
  location:['location','map','city','country','destination','travel','trip','route','delhi','mumbai','ahmedabad','chennai','bangalore','bengaluru','shanghai','beijing','guangzhou','dubai','germany','china','bali','maldives','singapore','thailand','turkey','georgia','vietnam','baku','mauritius','seychelles','moscow','st petersburg','st. petersburg'],
  process:['step','steps','first','second','third','then','next','finally','process','workflow','journey','checklist','plan','planning','stage','stages'],
  countdown:['countdown','seconds left','second left','time left','remaining','deadline','ends in'],
  achievement:['milestone','congrat','congratulations','success','successful','achieved','achievement','hit target','won','winner','top 1','record','goal reached'],
  warning:['warning','mistake','wrong','galat','ignore','weak','problem','avoid','dont','do not','not ','never','nahi','nhi','mat ','fail','failure'],
  question:['what','why','how','kya','kaise','kyun','?'],
  creator:['creator','audience','followers','follower','likes','like','comments','comment','shares','share','saves','save'],
  ecommerce:['cart','order','shipping','stock','trial','bundle','product','checkout','delivery','seller'],
};

const CONCEPT_PRIORITY = {
  comparison:12,hook:11,retention:11,watch:11,views:10,growth:10,decline:10,offer:10,trust:9,chat:9,
  analytics:9,finance:9,location:9,device:8,process:8,countdown:8,achievement:8,publish:7,format:7,cta:7,
  creator:6,ecommerce:6,content:5,social:4,warning:2,question:1
};

const EXACT_KIND_TRIGGERS = {
  cpuUsageRing:['cpu','processor usage'], batteryRing:['battery'], satisfactionRing:['satisfaction','csat'], npsScoreRing:['nps'], accuracyRing:['accuracy'], uptimeRing:['uptime','sla'],
  conversionRateStat:['conversion rate','conversion'], bounceRateStat:['bounce rate'], sessionsLineChart:['sessions'], clicksBarChart:['ad clicks','clicks'], impressionsKpi:['impressions'], ctrStatGrid:['ctr'],
  revenueCounter:['revenue','sales revenue'], profitMarginStat:['profit margin','margin'], roiCounter:['roi','return on investment'], savingsCounter:['you saved','saved','savings'], investmentGrowthChart:['investment','portfolio'], walletBalance:['wallet'], invoicePaidNotice:['invoice','payment received','paid'], emiCard:['emi'], expenseBreakdownPie:['expense','expenses'], cryptoTicker:['btc','bitcoin','crypto'], taxBreakdownChart:['tax'],
  orderTrackingSteps:['order tracking'], orderTrackingHorizontal:['out for delivery','delivered','shipped'], funnelSteps:['funnel','awareness','interest','decision'], onboardingSteps:['onboarding','sign up','verify','setup'], hiringSteps:['hiring','interview','offer letter'], checklistTravel:['passport','tickets','hotel booked','travel checklist'],
  wifiConnectedCard:['wifi','wi-fi'], bluetoothPairCard:['bluetooth'], cloudSyncCard:['cloud sync','synced'], downloadProgressCard:['download','downloading'], qrScanCard:['qr','scan code'], browserMockup:['browser','website'], tabletMockup:['tablet'], smartwatchMockup:['smartwatch','watch device'], laptopMockup:['laptop','desktop'], phoneMockup:['phone','mobile'],
  flashSale:['flash sale'], bundleDeal:['bundle deal','bundle'], freeShipping:['free shipping'], limitedStock:['limited stock','only left'], freeTrialCard:['free trial'], planComparison:['free vs pro','plan comparison'], couponCode:['coupon','promo code'], cartSummary:['cart','checkout'], orderConfirmed:['order confirmed','booking confirmed'],
  starRatingBig:['rating','reviews'], trustedByRow:['trusted by'], verifiedReviewBadge:['verified review'], warrantyBadge:['warranty'], caseStudyResult:['case study','client result'],
  confettiBurst:['congratulations','celebrate'], trophyPop:['trophy','won','winner'], thankYouCard:['thank you','thanks'], giftReveal:['gift','surprise'],
  mapPin:['location','map','destination'],
};

const PLATFORM_KIND = {
  youtube:'youtube',instagram:'instagram',whatsapp:'whatsapp',linkedin:'linkedinPost',facebook:'facebookPost',
  tiktok:'tiktokCaption',telegram:'telegramMessage',pinterest:'pinterestPin',twitter:'twitterPost'
};

const PREFERRED_KINDS = {
  hook:{hook:16,arrowCallout:3,countdown:3},
  views:{views:17,followerCount:2,kpiCard:1},
  retention:{retention:17,watch:5,progressBar:4,lineChart:2},
  watch:{watch:17,retention:5,progressBar:4},
  growth:{growth:15,trendArrow:14,lineChart:7,barChart:6,counterUp:4},
  decline:{lineChart:9,trendArrow:7,comparison:5},
  content:{content:10,format:3,iconBurst:2},
  format:{format:15,stripCarousel:11,timelineSteps:5,checklist:3},
  publish:{publish:15,notificationToast:4},
  cta:{cta:17,thankYouCard:5},
  comparison:{comparison:14,splitCompare:13,beforeAfter:10},
  offer:{priceTag:15,productShowcase:7,card3D:3},
  trust:{quoteCard:10,badgeStamp:8,avatarGroupProof:8,starRatingBig:7},
  chat:{whatsapp:16,notificationToast:9,telegramMessage:7},
  analytics:{kpiCard:9,statGrid:7,barChart:6,lineChart:6,pieChart:4},
  finance:{revenueCounter:9,kpiCard:5,lineChart:3},
  device:{phoneMockup:9,laptopMockup:6,arrowCallout:5,browserMockup:4},
  location:{mapPin:18,checklistTravel:4},
  process:{timelineSteps:10,arrowFlow:8,checklist:7,orderTrackingHorizontal:5},
  countdown:{countdown:18},achievement:{confettiBurst:10,trophyPop:9,badgeStamp:5},
  creator:{followerCount:7,views:4,statGrid:4},ecommerce:{productShowcase:7,orderTrackingHorizontal:5,priceTag:4}
};

const KIND_TAGS = {
  hook:['hook','warning'], views:['views','analytics'], retention:['retention','analytics'], watch:['watch','analytics'],
  youtube:['social','content'], whatsapp:['chat','social'], instagram:['social','content'], content:['content'], format:['format','process'], growth:['growth'], publish:['publish'], cta:['cta'],
  checklist:['process'], comparison:['comparison','warning'], priceTag:['offer'], emojiPop:['achievement'], arrowCallout:['device','process'], stripCarousel:['format','process'], quoteCard:['trust'], countdown:['countdown'],
  barChart:['analytics','growth'], lineChart:['analytics','growth','decline'], pieChart:['analytics'], progressBar:['process','analytics'], counterUp:['analytics','growth'], kpiCard:['analytics'], statGrid:['analytics'], badgeStamp:['trust'], notificationToast:['chat','social'], toggleSwitch:['device'], phoneMockup:['device'], arrowFlow:['process'], trendArrow:['growth','analytics','decline'], iconBurst:['content'], card3D:['offer'], mapPin:['location'], timelineSteps:['process'], splitCompare:['comparison'], beforeAfter:['comparison'], productShowcase:['ecommerce','offer'],
  twitterPost:['social'], linkedinPost:['social'], facebookPost:['social'], tiktokCaption:['social'], pinterestPin:['social'], telegramMessage:['chat','social'], followerCount:['creator','analytics'], likeCount:['creator','analytics'], shareCount:['creator','analytics'], saveCount:['creator','analytics'], commentCount:['creator','analytics'], avatarGroupProof:['trust','creator'], liveViewers:['creator','analytics'],
  flashSale:['offer'], bundleDeal:['offer'], freeShipping:['ecommerce'], bestSeller:['trust','ecommerce'], limitedStock:['ecommerce','warning'], newArrival:['ecommerce'], moneyBackGuarantee:['trust','ecommerce'], freeTrialCard:['offer'], planComparison:['comparison','ecommerce'], cartSummary:['ecommerce','analytics'], orderConfirmed:['ecommerce'], couponCode:['offer'], revenueGrowthChart:['finance','growth','analytics'],
  cpuUsageRing:['analytics','device'], batteryRing:['analytics','device'], satisfactionRing:['trust','analytics'], npsScoreRing:['trust','analytics'], accuracyRing:['analytics'], uptimeRing:['analytics'], conversionRateStat:['analytics'], bounceRateStat:['analytics','warning'], sessionsLineChart:['analytics'], clicksBarChart:['analytics'], impressionsKpi:['analytics'], ctrStatGrid:['analytics'], performanceScoreBadge:['achievement','analytics'],
  revenueCounter:['finance','analytics'], profitMarginStat:['finance','analytics'], roiCounter:['finance','growth'], savingsCounter:['finance'], investmentGrowthChart:['finance','growth'], walletBalance:['finance'], invoicePaidNotice:['finance','trust'], emiCard:['finance'], expenseBreakdownPie:['finance','analytics'], discountCalculator:['offer','finance'], cryptoTicker:['finance'], taxBreakdownChart:['finance','analytics'],
  orderTrackingSteps:['process','ecommerce'], funnelSteps:['process'], onboardingSteps:['process'], recipeSteps:['process'], workoutSteps:['process'], hiringSteps:['process'], orderTrackingHorizontal:['process','ecommerce'], courseProgressSteps:['process'], checklistLaunch:['process'], checklistTravel:['process','location'], dailyRoutineChecklist:['process'], goalProgressBar:['process','growth'],
  laptopMockup:['device'], tabletMockup:['device'], smartwatchMockup:['device'], browserMockup:['device'], qrScanCard:['device'], wifiConnectedCard:['device'], bluetoothPairCard:['device'], cloudSyncCard:['device','process'], downloadProgressCard:['device','process'], appIconGrid:['device'], darkModeToggle:['device'], notificationsToggle:['device'],
  customerTestimonial1:['trust'], customerTestimonial2:['trust'], founderQuote:['trust'], caseStudyResult:['trust','analytics','growth'], starRatingBig:['trust'], trustedByRow:['trust'], verifiedReviewBadge:['trust'], expertApprovedBadge:['trust'], teamMemberBio:['trust'], clientLogosGrid:['trust'], fiveStarUnboxing:['trust','ecommerce'], warrantyBadge:['trust','ecommerce'],
  confettiBurst:['achievement'], fireStreak:['achievement'], trophyPop:['achievement'], heartReact:['achievement','creator'], thumbsUpPop:['achievement'], clapPop:['achievement'], fireworksBurst:['achievement'], giftReveal:['achievement','offer'], milestoneSparkle:['achievement'], sweepBanner:['content'], neonGlowText:['content'], milestoneCountUp:['achievement','analytics'], thankYouCard:['cta','trust'],
};

const EXTRA_FIELDS_BY_TYPE = {
  ring:[{key:'value',label:'Metric Value',text:''}],
  progressBar:[{key:'value',label:'Progress Value',text:''}],
  counterUp:[{key:'value',label:'Counter Value',text:''}],
  currencyStat:[{key:'value',label:'Counter Value',text:''}],
  pieChart:[{key:'value',label:'Chart Value',text:''}],
  socialPost:[{key:'time',label:'Post Time',text:'2h ago'}],
  toast:[{key:'time',label:'Time',text:'now'}],
};
const EXTRA_FIELDS_BY_KIND = {
  whatsapp:[{key:'status',label:'Status',text:'online'},{key:'time',label:'Time',text:'10:41'}],
  youtube:[{key:'duration',label:'Video Duration',text:''}],
  avatarGroupProof:[{key:'count',label:'Extra Count',text:''}], trustedByRow:[{key:'count',label:'Extra Count',text:''}],
};

function normText(text='') { return String(text).toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9₹$€£%+\-?.\s]/g,' ').replace(/\s+/g,' ').trim(); }
function words(text=''){return normText(text).split(/\s+/).filter(Boolean)}
function containsPhrase(text, phrase){
  const p=normText(phrase);if(!p)return false;
  const esc=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+');
  return new RegExp(`(?:^|\\s)${esc}(?=\\s|$|[?.])`,'i').test(text);
}
function hashString(s=''){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function seededNoise(seed,key){const h=hashString(`${seed}|${key}`);return (h%10000)/10000}
function uniq(arr){return [...new Set(arr)]}
function titleCase(x=''){return String(x).replace(/[-_]/g,' ').replace(/\b\w/g,m=>m.toUpperCase())}

export function getThemeByName(name){return THEMES.find(t=>t.name===name)||THEMES[0]}
export function getThemeForSeed(seed=0){return THEMES[Math.abs(Number(seed)||0)%THEMES.length]}

function inferTags(v){
  const set=new Set(KIND_TAGS[v.kind]||[]);
  const hay=normText([v.kind,v.label,v.type,v.rendererFamily,v.alternativeGroup,v.section].filter(Boolean).join(' '));
  for(const [concept,phrases] of Object.entries(RULES)) if(phrases.some(p=>containsPhrase(hay,p))) set.add(concept);
  if(v.rendererFamily==='chart'||v.rendererFamily==='stat-card'||v.rendererFamily==='progress') set.add('analytics');
  if(v.rendererFamily==='process') set.add('process');
  if(v.rendererFamily==='comparison') set.add('comparison');
  if(v.rendererFamily==='offer') set.add('offer');
  if(v.rendererFamily==='trust'||v.rendererFamily==='badge'||v.rendererFamily==='editorial') set.add('trust');
  if(v.rendererFamily==='social-ui') set.add('social');
  if(v.rendererFamily==='device-ui'||v.rendererFamily==='toggle') set.add('device');
  if(v.rendererFamily==='cta') set.add('cta');
  return [...set];
}

export const VISUALS = visualData.map(v=>({...v,fullBleed:FULL_BLEED_TYPES.has(v.type),tags:inferTags(v)}));
export const VISUAL_BY_KIND = Object.fromEntries(VISUALS.map(v=>[v.kind,v]));
export const CORE_VISUALS = VISUALS.filter(v=>v.tier==='core');

function catalogIcon(v){const f=v.rendererFamily;return f==='chart'?'▥':f==='progress'?'◔':f==='social-ui'?'◉':f==='device-ui'?'▯':f==='offer'?'◇':f==='trust'||f==='badge'?'✓':f==='process'?'→':f==='comparison'?'⇄':f==='typography'?'T':f==='cta'?'↓':'◆'}
export function getVisualOption(kind){const v=VISUAL_BY_KIND[kind];return v?{kind:v.kind,label:v.label,icon:catalogIcon(v)}:{kind:'none',label:'No visual',icon:'—'}}
export function getVisualFields(kind){
  const v=VISUAL_BY_KIND[kind]; if(!v)return [];
  const base=(v.fields||[]).map(f=>({...f,label:f.label||titleCase(f.key)}));
  const extras=[...(EXTRA_FIELDS_BY_TYPE[v.type]||[]),...(EXTRA_FIELDS_BY_KIND[v.kind]||[])];
  const seen=new Set(base.map(f=>f.key));
  return [...base,...extras.filter(f=>!seen.has(f.key))];
}

export function extractSceneData(text=''){
  const raw=String(text),t=normText(raw);
  const percent=[...raw.matchAll(/([+-]?\d+(?:\.\d+)?)\s*%/g)].map(m=>m[0]);
  const currency=[...raw.matchAll(/(?:₹|Rs\.?|INR|\$|USD|€|EUR|£)\s*[\d,.]+(?:\s*(?:K|M|L|Cr))?/gi)].map(m=>m[0]);
  const compact=[...raw.matchAll(/\b[+-]?\d+(?:\.\d+)?\s*(?:K|M|L|Cr|x)\b/gi)].map(m=>m[0]);
  const rating=[...raw.matchAll(/\b([0-5](?:\.\d+)?)\s*(?:\/\s*5|stars?|rating)\b/gi)].map(m=>m[1]);
  const plain=[...raw.matchAll(/\b\d+(?:\.\d+)?\b/g)].map(m=>m[0]);
  const numbers=uniq([...percent,...currency,...compact,...rating,...plain]);
  const durations=[...raw.matchAll(/\b\d+(?:\.\d+)?\s*(?:sec(?:ond)?s?|min(?:ute)?s?|hours?|days?|weeks?|months?|years?)\b/gi)].map(m=>m[0]);
  const platform=['youtube','instagram','whatsapp','linkedin','facebook','tiktok','telegram','pinterest','twitter'].find(p=>containsPhrase(t,p))||'';
  const knownLocations=['new delhi','delhi','mumbai','ahmedabad','chennai','bangalore','bengaluru','shanghai','beijing','guangzhou','dubai','germany','china','bali','maldives','singapore','thailand','turkey','georgia','vietnam','baku','mauritius','seychelles','moscow','st petersburg','st. petersburg','milan','dusseldorf','düsseldorf'];
  const locations=knownLocations.filter(x=>containsPhrase(t,x));
  let primary=percent[0]||currency[0]||compact[0]||rating[0]||plain[0]||'';
  let dataType=percent[0]?'percent':currency[0]?'currency':rating[0]?'rating':durations[0]?'duration':numbers.length?'number':'none';
  return {numbers,percent,currency,compact,rating,durations,primary,platform,locations,location:(locations.length>1?locations[locations.length-1]:locations[0])||'',dataType};
}

function detectConcepts(t){
  const hits=[];
  for(const [concept,phrases] of Object.entries(RULES)){
    const matched=phrases.filter(p=>containsPhrase(t,p));
    if(matched.length) hits.push({concept,matched});
  }
  return hits;
}

function conceptTokenPositions(t, concept){
  const toks=t.replace(/[?.]/g,' ').split(/\s+/).filter(Boolean);const result=[];
  for(const phrase of RULES[concept]||[]){
    const pt=normText(phrase).split(/\s+/).filter(Boolean);if(!pt.length)continue;
    for(let i=0;i<=toks.length-pt.length;i++) if(pt.every((x,j)=>toks[i+j]===x)) result.push({start:i,end:i+pt.length-1,phrase});
  }
  return result;
}

function negationForConcept(t,concept){
  const toks=t.replace(/[?.]/g,' ').split(/\s+/).filter(Boolean);const neg=new Set(['no','not','never','dont',"don't",'nahi','nhi','mat','without']);
  const weak=new Set(['weak','wrong','galat','ignore','avoid','problem','bad','poor']);
  for(const p of conceptTokenPositions(t,concept)){
    const before=toks.slice(Math.max(0,p.start-4),p.start);const after=toks.slice(p.end+1,Math.min(toks.length,p.end+5));
    if(before.some(x=>neg.has(x))||after.some(x=>neg.has(x))||after.some(x=>weak.has(x))||before.slice(-2).some(x=>weak.has(x)))return true;
  }
  return false;
}

function affirmationForConcept(t,concept){
  const toks=t.replace(/[?.]/g,' ').split(/\s+/).filter(Boolean);const affirm=new Set(['focus','check','important','matter','matters','use','repeat','keep','best','better','strong','smart','good','sahi','dekho','karo','likho']);
  for(const p of conceptTokenPositions(t,concept)){
    const before=toks.slice(Math.max(0,p.start-4),p.start);const after=toks.slice(p.end+1,Math.min(toks.length,p.end+4));
    if(before.some(x=>affirm.has(x))||after.some(x=>affirm.has(x)))return true;
  }
  return false;
}

export function analyzeText(text='', contextText=''){
  const t=normText(text),c=normText(contextText||text);const hits=detectConcepts(t);const concepts=hits.map(h=>h.concept);
  const contextConcepts=detectConcepts(c).map(h=>h.concept).filter(x=>!concepts.includes(x));
  const toks=words(text),meaningful=toks.filter(w=>!STOPWORDS.has(w)&&w.length>1);
  const negatedConcepts=concepts.filter(cn=>!['warning','question','comparison'].includes(cn)&&negationForConcept(t,cn));
  const affirmedConcepts=concepts.filter(cn=>!['warning','question','comparison'].includes(cn)&&!negatedConcepts.includes(cn)&&affirmationForConcept(t,cn));
  const neg=concepts.includes('warning')||/\b(no|not|never|dont|don't|nahi|nhi|mat|without)\b/.test(t);
  const positive=/\b(good|great|best|strong|smart|success|successful|growth|grow|grew|grown|increase|increased|better|achha|sahi|badhiya)\b/.test(t);
  const data=extractSceneData(text);
  const contrast=concepts.includes('comparison')||(negatedConcepts.length>0&&(affirmedConcepts.length>0||contextConcepts.some(x=>['hook','views','retention','watch','growth','analytics','content','format'].includes(x))));
  let polarity=contrast?'contrast':neg?'negative':positive?'positive':'neutral';
  const rankedConcepts=concepts.filter(cn=>!['warning','question'].includes(cn)).sort((a,b)=>(CONCEPT_PRIORITY[b]||0)-(CONCEPT_PRIORITY[a]||0));
  let primaryConcept=rankedConcepts[0]||'';
  if(affirmedConcepts.length) primaryConcept=[...affirmedConcepts].sort((a,b)=>(CONCEPT_PRIORITY[b]||0)-(CONCEPT_PRIORITY[a]||0))[0];
  else if(negatedConcepts.length) primaryConcept=[...negatedConcepts].sort((a,b)=>(CONCEPT_PRIORITY[b]||0)-(CONCEPT_PRIORITY[a]||0))[0];
  return {text,t,concepts,contextConcepts,meaningful,data,polarity,question:t.includes('?')||concepts.includes('question'),negatedConcepts,affirmedConcepts,primaryConcept,contrast};
}

function dataRequirementSatisfied(v,a){
  if(!v.requiresRealData)return true;
  if(NO_DATA_OK.has(v.kind))return true;
  if(a.data.numbers.length)return true;
  if(['socialPost','appCard','toast','quote','product','device','phone','map','qrScan'].includes(v.type) && a.meaningful.length>=2)return true;
  return false;
}

function matchExactTrigger(v,a){return (EXACT_KIND_TRIGGERS[v.kind]||[]).some(p=>containsPhrase(a.t,p))}

function repetitionPenalty(list,value,weights){
  if(!value)return 0;const i=list.indexOf(value);if(i<0)return 0;return weights[Math.min(i,weights.length-1)]||0;
}

function semanticScore(v,a,ctx){
  let score=v.tier==='core'?3.2:-1.6;const tags=v.tags||[];
  const exactTriggerHit=matchExactTrigger(v,a);
  const platformExact=Boolean(a.data.platform&&PLATFORM_KIND[a.data.platform]===v.kind);

  // Primary meaning carries more weight than generic co-occurring words.
  for(const concept of a.concepts){
    const primary=concept===a.primaryConcept;
    if(tags.includes(concept)) score+=primary?10:5.8;
    score+=(PREFERRED_KINDS[concept]?.[v.kind]||0)*(primary?1:0.72);
  }
  for(const concept of a.contextConcepts) if(tags.includes(concept))score+=.9;

  if(platformExact)score+=35;
  else if(a.data.platform&&tags.includes('social'))score-=1; // don't let every social visual beat the exact platform card
  if(exactTriggerHit)score+=24;

  // Auto visuals should illustrate the narration rather than repeat the same sentence as a text card.
  const diagramFamilies=new Set(['chart','comparison','process','progress','device-ui','stat-card','toggle','decorative']);
  if(diagramFamilies.has(v.rendererFamily))score+=3.2;
  if(['typography','editorial','cta'].includes(v.rendererFamily))score-=6.5;
  if(v.rendererFamily==='social-ui'&&!platformExact)score-=5;
  if(v.kind==='hook')score-=7;

  // If this sentence expresses a real correction/pair ("not X, use Y", X vs Y, before/after),
  // comparison visuals are excellent. A vague phrase such as "galat cheez" alone should NOT
  // manufacture a meaningless Don't/Do card.
  const semanticSubjects=a.concepts.filter(c=>!['comparison','warning','question','content','social'].includes(c));
  const explicitPair=/\bvs\b|\bversus\b|\binstead\b|\brather\b|better than|before and after|before after/.test(a.t);
  const hasComparisonPair=(a.negatedConcepts.length>0&&(a.affirmedConcepts.length>0||a.contextConcepts.some(c=>['hook','views','retention','watch','growth','analytics','format','process','offer'].includes(c))))||semanticSubjects.length>=2||explicitPair;
  if(a.contrast&&v.rendererFamily==='comparison')score+=hasComparisonPair?12:-35;
  if(a.negatedConcepts.length&&a.affirmedConcepts.length){
    if(v.rendererFamily==='comparison')score+=22;
    else if(v.tags?.some(x=>a.negatedConcepts.includes(x)||a.affirmedConcepts.includes(x)))score-=3;
  }
  if(a.negatedConcepts.length&&tags.some(x=>a.negatedConcepts.includes(x)))score+=a.contrast?5:9;
  if(a.affirmedConcepts.length&&tags.some(x=>a.affirmedConcepts.includes(x)))score+=8;
  if(a.polarity==='negative'&&(tags.includes('achievement')||v.rendererFamily==='offer'))score-=8;
  if(a.polarity==='positive'&&(tags.includes('growth')||tags.includes('achievement')||v.rendererFamily==='trust'))score+=1.8;

  // Growth + numeric data should look like growth, not an arbitrary stat card.
  if(a.data.numbers.length&&a.concepts.includes('growth')){
    if(['trendArrow','lineChart','barChart','counterUp','revenueGrowthChart','investmentGrowthChart'].includes(v.kind))score+=8;
    if(v.kind==='views'&&!a.concepts.includes('views'))score-=12;
  }
  if(a.data.percent.length&&['ring','progressBar','trend'].includes(v.type))score+=2.5;
  if(a.data.currency.length&&(v.rendererFamily==='offer'||v.tags?.includes('finance')))score+=7;
  if(a.data.currency.length&&a.concepts.includes('offer')&&v.rendererFamily==='offer')score+=12;
  if(a.primaryConcept==='offer'&&v.kind==='mapPin')score-=12;
  if(a.data.rating.length&&(v.kind==='starRatingBig'||v.tags?.includes('trust')))score+=8;
  if(a.data.locations.length&&v.kind==='mapPin')score+=a.primaryConcept==='location'?14:6;

  // Avoid accidental domain jumps.
  const strong=a.concepts.filter(c=>!['warning','question','content','social'].includes(c));
  if(strong.length&&!strong.some(c=>tags.includes(c)||(PREFERRED_KINDS[c]?.[v.kind]||0)>0))score-=10;
  if(a.concepts.includes('location')&&!tags.includes('location')&&v.rendererFamily==='process')score-=5;
  if(a.concepts.includes('hook')&&v.kind==='instagram'&&!a.data.platform)score-=10;
  if(a.concepts.includes('content')&&v.rendererFamily==='social-ui'&&!a.data.platform)score-=4;

  const hay=normText([v.kind,v.label,v.alternativeGroup,...tags].filter(Boolean).join(' '));
  for(const w of a.meaningful)if(w.length>=4&&hay.includes(w))score+=.8;

  if(!dataRequirementSatisfied(v,a))score-=45;
  else if(v.requiresRealData&&a.data.numbers.length)score+=3;

  const duration=ctx.duration||1;
  if(duration<.9&&DETAILED_TYPES.has(v.type))score-=10;
  if(duration<.62&&v.fullBleed)score-=7;
  if(duration<.55&&!QUICK_TYPES.has(v.type))score-=4;

  // Strong repetition cooldowns: same exact visual > family > semantic alternative group.
  score-=repetitionPenalty(ctx.previousKinds||[],v.kind,[22,13,8,5,3]);
  score-=repetitionPenalty(ctx.previousFamilies||[],v.rendererFamily,[9,5,3,2]);
  score-=repetitionPenalty(ctx.previousGroups||[],v.alternativeGroup,[7,4,2]);
  if(platformExact||exactTriggerHit)score+=repetitionPenalty(ctx.previousKinds||[],v.kind,[12,8,4]); // exact context can override part of cooldown

  // Keep several equally-good reels possible while staying deterministic for a seed.
  score+=(seededNoise(ctx.seed||0,`${v.kind}|${ctx.index}`)-.5)*1.3;
  return score;
}

function shouldHaveVisual(a,index,ctx={}){
  const duration=ctx.duration||1;
  const cadence=ctx.cadence||'alternate';
  if(duration<.36)return false;

  // Reference rhythm: typography leads. A conceptual visual resets attention every 2–3 beats.
  // CTA scenes remain typography-first so the final instruction reads like a poster frame.
  if(cadence==='reference'){
    if(a.primaryConcept==='cta')return false;
    if(ctx.previousHadVisual)return false;
    const slot=(index%3===1)||(index>3&&index%5===2);
    if(!slot)return false;
  }
  if(cadence==='alternate' && index%2===1)return false;

  const strong=Boolean(a.data.platform||a.data.location||a.data.numbers.length||a.contrast||
    (a.primaryConcept&&['hook','views','retention','watch','growth','decline','comparison','offer','trust','chat','analytics','finance','device','location','process','countdown','achievement','publish','format','cta'].includes(a.primaryConcept)));

  if(cadence==='dense'){
    if(a.meaningful.length<=1&&!strong)return index%3===0;
    return strong||a.meaningful.length>=3||index%2===0;
  }

  if(strong)return true;
  if(a.meaningful.length<=1)return false;
  if(a.meaningful.length===2)return index%3===0;
  if(ctx.previousHadVisual&&a.meaningful.length<4)return false;
  return a.meaningful.length>=4&&index%2===0;
}

function conceptLabel(c){const map={views:'Views',retention:'Retention',watch:'Watch time',growth:'Growth',hook:'Hook',content:'Content',format:'Format',analytics:'Analytics',publish:'Publishing',cta:'CTA'};return map[c]||titleCase(c)}

function bindData(v,a){
  const out={},primary=a.data.primary;
  if(primary){
    for(const f of getVisualFields(v.kind)){
      if(['value','now','number','change','v1'].includes(f.key)){out[f.key]=primary;break;}
    }
  }
  if(a.data.percent[0])out.percent=a.data.percent[0];
  if(a.data.currency[0])out.currency=a.data.currency[0];
  if(a.data.durations[0])out.duration=a.data.durations[0];

  // Never copy the typography sentence into the visual. The visual should explain the idea,
  // not become a duplicate subtitle card. Use compact semantic/diagram labels instead.
  const concept=a.primaryConcept||a.concepts.find(c=>!['content','social','warning','question'].includes(c))||'content';
  const copy={
    hook:{headline:'STOP • SCROLL',title:'ATTENTION',label:'HOOK',message:'FIRST IMPRESSION'},
    views:{headline:'REACH SIGNAL',title:'AUDIENCE REACH',label:'REACH',message:'MORE EYES'},
    retention:{headline:'KEEP WATCHING',title:'WATCH FLOW',label:'STAY',message:'WATCH → STAY'},
    watch:{headline:'WATCH TIME',title:'VIEW DURATION',label:'TIME',message:'KEEP WATCHING'},
    growth:{headline:'UPWARD SIGNAL',title:'GROWTH TREND',label:'GROW',message:'MOMENTUM ↑'},
    decline:{headline:'DROP SIGNAL',title:'DECLINE',label:'DROP',message:'TREND ↓'},
    comparison:{headline:'A vs B',title:'COMPARE',label:'VS',message:'OLD → BETTER'},
    process:{headline:'STEP BY STEP',title:'PROCESS',label:'FLOW',message:'1 → 2 → 3'},
    format:{headline:'STRUCTURE',title:'CONTENT FLOW',label:'FORMAT',message:'HOOK → VALUE → CTA'},
    analytics:{headline:'SIGNAL CHECK',title:'PERFORMANCE',label:'DATA',message:'READ THE SIGNAL'},
    offer:{headline:'OFFER',title:'VALUE',label:'DEAL',message:'VALUE > PRICE'},
    trust:{headline:'PROOF',title:'TRUST SIGNAL',label:'TRUST',message:'SOCIAL PROOF'},
    chat:{headline:'NEW MESSAGE',title:'CONVERSATION',label:'CHAT',message:'TAP → REPLY'},
    device:{headline:'ON SCREEN',title:'DEVICE FLOW',label:'SCREEN',message:'OPEN → USE'},
    location:{headline:'DESTINATION',title:'LOCATION',label:'MAP',message:'YOU ARE HERE'},
    cta:{headline:'NEXT STEP',title:'ACTION',label:'GO',message:'TAP → ACT'},
    publish:{headline:'GO LIVE',title:'PUBLISH FLOW',label:'LIVE',message:'READY → PUBLISH'},
    achievement:{headline:'MILESTONE',title:'WIN',label:'DONE',message:'GOAL REACHED'},
    content:{headline:'CONTENT IDEA',title:'CONTENT SYSTEM',label:'IDEA',message:'HOOK → VALUE'},
  }[concept]||{headline:'VISUAL SIGNAL',title:'KEY IDEA',label:'FOCUS',message:'SEE THE IDEA'};

  for(const f of getVisualFields(v.kind)){
    if(out[f.key]!=null)continue;
    if(['headline','title','label','message','caption','quote','text','status'].includes(f.key)){
      const key=['headline','title','label','message'].includes(f.key)?f.key:'message';
      out[f.key]=copy[key]||copy.label;
    }
  }

  if(v.kind==='whatsapp')out.message='Tap → Reply';
  if(['notificationToast','telegramMessage'].includes(v.kind))out.message='New update';
  if(v.kind==='cta')out.label='NEXT STEP';
  if(v.kind==='mapPin'&&a.data.location)out.label=a.data.location.toUpperCase();

  if(v.rendererFamily==='comparison'){
    const bad=a.negatedConcepts[0]||'old way';
    const good=a.affirmedConcepts[0]||a.contextConcepts.find(c=>['hook','retention','watch','growth','content','format','analytics'].includes(c))||'better way';
    if(v.kind==='comparison'){out.bad=conceptLabel(bad);out.good=conceptLabel(good)}
    else if(v.kind==='splitCompare'){out.left=conceptLabel(bad);out.right=conceptLabel(good)}
  }
  if(['card3D','productShowcase'].includes(v.kind))out.title=copy.title;
  if(v.kind==='avatarGroupProof'||v.kind==='trustedByRow'){
    const n=a.data.numbers[0];if(n)out.count=n;
  }
  return out;
}

function visualStateFor(v,a){
  if(v.rendererFamily==='comparison')return 'contrast';
  if(a.negatedConcepts.some(c=>v.tags?.includes(c)))return 'negative';
  if(a.affirmedConcepts.some(c=>v.tags?.includes(c)))return 'positive';
  return a.polarity==='negative'?'neutral':a.polarity;
}

function bestLayout(v,index,previousLayout=''){
  if(v.fullBleed)return 'stacked';
  if(v.rendererFamily==='comparison'&&['beforeAfter','splitCompare'].includes(v.kind))return 'stacked';
  const next=index%2===0?'split-right':'split-left';
  if(previousLayout===next)return next==='split-right'?'split-left':'split-right';
  return next;
}

export function selectVisualPlans(baseScenes,{seed=0,preserveLocked=true,cadence='smart'}={}){
  const previousKinds=[],previousFamilies=[],previousGroups=[];let previousHadVisual=false,previousLayout='';
  return baseScenes.map((scene,index)=>{
    if(preserveLocked&&scene.visualLocked&&scene.visual&&VISUAL_BY_KIND[scene.visual]){
      const v=VISUAL_BY_KIND[scene.visual];previousKinds.unshift(v.kind);previousFamilies.unshift(v.rendererFamily);if(v.alternativeGroup)previousGroups.unshift(v.alternativeGroup);
      previousKinds.splice(5);previousFamilies.splice(4);previousGroups.splice(4);previousHadVisual=true;previousLayout=scene.layoutMode||previousLayout;return scene;
    }
    const context=[baseScenes[index-1]?.text,scene.text,baseScenes[index+1]?.text].filter(Boolean).join(' ');
    const a=analyzeText(scene.text,context);const duration=Math.max(.1,scene.end-scene.start);
    if(!shouldHaveVisual(a,index,{duration,previousHadVisual,cadence})){
      previousHadVisual=false;return {...scene,visual:'none',visualSource:'auto',semantic:a,visualBindings:{},visualState:'neutral',layoutMode:'text',visualScore:0};
    }
    const ctx={seed,index,duration,previousKinds,previousFamilies,previousGroups,previousHadVisual};
    const ranked=VISUALS.map(v=>({v,score:semanticScore(v,a,ctx)})).sort((x,y)=>y.score-x.score);
    let forcedKinds=[];
    if(a.data.platform&&PLATFORM_KIND[a.data.platform])forcedKinds=[PLATFORM_KIND[a.data.platform]];
    else if(a.negatedConcepts.length&&a.affirmedConcepts.length)forcedKinds=['comparison','splitCompare','beforeAfter'];
    else if(a.primaryConcept==='offer'&&a.data.currency.length)forcedKinds=['priceTag','productShowcase','discountCalculator','flashSale'];
    else if(a.primaryConcept==='location'&&a.data.location)forcedKinds=['mapPin'];
    const forced=forcedKinds.length?ranked.find(x=>forcedKinds.includes(x.v.kind)):null;
    let chosen=forced?.v||ranked[0]?.v;let score=forced?.score??ranked[0]?.score??-999;
    if(!chosen||score<2.2){
      chosen=a.primaryConcept==='content'&&index%2===0?VISUAL_BY_KIND.content:null;
      score=chosen?2.2:score;
    }
    if(!chosen){previousHadVisual=false;return {...scene,visual:'none',visualSource:'auto',semantic:a,visualBindings:{},visualState:'neutral',layoutMode:'text',visualScore:0};}
    previousKinds.unshift(chosen.kind);previousFamilies.unshift(chosen.rendererFamily);if(chosen.alternativeGroup)previousGroups.unshift(chosen.alternativeGroup);
    previousKinds.splice(5);previousFamilies.splice(4);previousGroups.splice(4);
    const layoutMode=bestLayout(chosen,index,previousLayout);previousLayout=layoutMode;previousHadVisual=true;
    return {...scene,visual:chosen.kind,visualSource:'auto',visualLocked:false,semantic:a,visualBindings:bindData(chosen,a),visualState:visualStateFor(chosen,a),layoutMode,visualScore:Number(score.toFixed(2))};
  });
}

export function getVisualAlternatives(kind,scene,{limit=6,seed=0}={}){
  const current=VISUAL_BY_KIND[kind];
  if(!current)return CORE_VISUALS.slice(0,limit).map(v=>v.kind);
  const a=scene?.semantic?.concepts?scene.semantic:analyzeText(scene?.text||'');
  const pool=VISUALS.filter(v=>v.kind!==kind).map(v=>{
    let score=semanticScore(v,a,{seed,index:scene?.index||0,duration:Math.max(.1,(scene?.end||1)-(scene?.start||0)),previousKinds:[],previousFamilies:[],previousGroups:[]});
    if(current.alternativeGroup&&v.alternativeGroup===current.alternativeGroup)score+=16;
    if(v.rendererFamily!==current.rendererFamily)score+=3;
    if(v.tier==='core')score+=2;
    return {v,score};
  }).sort((x,y)=>y.score-x.score);

  // Greedy diversity: first semantic matches, but avoid returning six copies of the same renderer.
  const picked=[kind],families=new Map([[current.rendererFamily,1]]),groups=new Set(current.alternativeGroup?[current.alternativeGroup]:[]);
  for(const {v} of pool){
    if(picked.length>=limit)break;
    const familyCount=families.get(v.rendererFamily)||0;
    const sameGroup=current.alternativeGroup&&v.alternativeGroup===current.alternativeGroup;
    if(familyCount>=2&&!sameGroup)continue;
    if(groups.has(v.alternativeGroup)&&v.alternativeGroup&&!sameGroup&&picked.length<limit-1)continue;
    picked.push(v.kind);families.set(v.rendererFamily,familyCount+1);if(v.alternativeGroup)groups.add(v.alternativeGroup);
  }
  if(picked.length<limit)for(const {v} of pool){if(picked.length>=limit)break;if(!picked.includes(v.kind))picked.push(v.kind)}
  return picked;
}

export function visualLabel(kind){return VISUAL_BY_KIND[kind]?.label||'No visual'}
export function getVisualMeta(kind){return VISUAL_BY_KIND[kind]||null}
