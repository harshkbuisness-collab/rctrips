"""Builds the 'Subscription Band Karo' 30-day content sheet (topics + voice scripts)."""
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

OUT = "content/subscription-band-karo-30-days.xlsx"

# (day, topic, hook, tools, repo, replaces, keyword, script, catch, visual)
DAYS = [
 (1, "5 paid AI tools ka free version", "Bhai, tum abhi bhi in AI tools ke liye paise de rahe ho?",
  "Buzz, LanguageTool, Upscayl, ComfyUI, VoiceStudio", "chidiwilliams/buzz · languagetool-org/languagetool · upscayl/upscayl · comfyanonymous/ComfyUI · debpalash/OmniVoice-Studio",
  "Otter.ai, Grammarly Premium, Topaz Gigapixel, Midjourney, ElevenLabs", "TOOLS",
  "Bhai, tum abhi bhi in AI tools ke liye paise de rahe ho? Inke FREE versions exist karte hain! Aur number one dekh ke tum shock ho jaoge.\n\nNumber 5. Transcription ke paise? Buzz kisi bhi video ke subtitles bana deta hai, wo bhi bina internet ke. Tumhara data laptop se bahar hi nahi jaata.\n\nNumber 4. Grammarly Premium? Chhodo! LanguageTool pachchees se zyada languages mein tumhari grammar fix karta hai, aur ye open source hai.\n\nNumber 3. Photo blurry hai? Upscayl mein daalo, kuch seconds mein ekdum HD. GitHub pe pachaas hazaar se zyada logon ne isse star kiya hai.\n\nNumber 2. Midjourney har mahine paise kaat-ta hai. ComfyUI tumhare apne PC pe AI images banata hai. Na monthly bill, na koi tension.\n\nAur number 1. ElevenLabs ka bilkul free, open-source alternative! VoiceStudio voice clone karta hai, videos dub karta hai, audiobooks banata hai, sab tumhare computer pe.\n\nSaare links chahiye? Follow karo aur comment karo TOOLS. Main seedha DM kar dunga. Bye!",
  "Upscayl and ComfyUI need a graphics card; clone only voices you have permission for.",
  "Already built (5-paid-ai-tools example)."),
 (2, "Free AI software engineer", "Ek AI engineer jo tumhare liye poora app likh de, aur ek rupaya bhi na le?",
  "OpenHands", "OpenHands/OpenHands", "Devin", "ENGINEER",
  "Ek AI engineer jo tumhare liye poora app likh de, aur ek rupaya bhi na le? Haan, ye sach hai.\n\nSubscription Band Karo, Day 2.\n\nDevin jaise AI software engineers ke liye companies hazaaron rupaye har mahine deti hain. Lekin OpenHands bilkul free aur open source hai.\n\nTum bas likho ki kya banana hai. Ye khud code likhta hai, commands chalata hai, errors dhoondh ke fix karta hai, aur zarurat pade toh internet pe research bhi karta hai. Jaise ek junior developer tumhare saath baitha ho.\n\nBas ek baat, isko chalane ke liye ek AI model chahiye. Apni API key lagao, ya local model use karo.\n\nLink chahiye? Follow karo aur comment karo ENGINEER. Kal Day 3 mein, sirf bol ke poori website banao. Bye!",
  "Needs an LLM: API key (paid usage) or a local model on a strong PC.",
  "Mascot c3-shocked hook · tool scene: Paid Devin vs Free OpenHands · demo: nodes PROMPT → CODE → APP · GitHub zoom"),
 (3, "Bol ke website/app banao", "Sirf ek line likho, aur poori website ready. Bina coding.",
  "bolt.diy, Dyad", "stackblitz-labs/bolt.diy · dyad-sh/dyad", "Lovable, Bolt.new, v0", "APP",
  "Sirf ek line likho, aur poori website ready. Bina coding.\n\nSubscription Band Karo, Day 3.\n\nLovable aur Bolt jaise app builders credits khatam hote hi paise maangte hain. Inke do free, open-source versions hain.\n\nPehla, bolt dot diy. Prompt likho, aur ye full-stack app banata hai, chalata hai, aur tum usse edit aur deploy bhi kar sakte ho. Aur kisi bhi AI model ke saath chalta hai.\n\nDusra, Dyad. Ye tumhare computer pe chalne waala app builder hai, toh tumhara code tumhare paas rehta hai.\n\nAI model ki API key lagti hai, par kuch models ka free limit bhi hota hai.\n\nDono ke links chahiye? Comment karo APP. Kal Day 4 mein, Cursor ke paise bachao. Bye!",
  "Needs an AI model API key; some providers have free limits.",
  "Hook text + mascot c2-hello · Paid Lovable vs Free bolt.diy · demo: text \"1 LINE = 1 APP\" · two GitHub cards (bolt.diy, Dyad)"),
 (4, "Cursor ke free alternatives", "Coding ke liye Cursor ka subscription? Ruk jao.",
  "Void Editor, OpenCode", "voideditor/void · anomalyco/opencode", "Cursor Pro", "CODE",
  "Coding ke liye Cursor ka subscription? Ruk jao.\n\nSubscription Band Karo, Day 4.\n\nCursor bahut popular hai, par har mahine paise leta hai. Do free, open-source options dekho.\n\nPehla, Void. Ye bilkul Cursor jaisa AI code editor hai, aur tum apna pasandida AI model, ya local model, isme laga sakte ho.\n\nDusra, OpenCode. Ye terminal mein chalne waala AI coding agent hai. Code likhta hai, files edit karta hai, aur poore project ko samajhta hai. GitHub pe do lakh se zyada developers isse star kar chuke hain.\n\nAI model ka kharcha tumhare choice pe depend karta hai. Local model ho toh bilkul free.\n\nLinks chahiye? Comment karo CODE. Kal Day 5 mein, Google ka free AI agent. Bye!",
  "Free tools; cost depends on the AI model you plug in.",
  "Mascot c6-thinking · Paid Cursor vs Free Void · demo: checklist (Edit code · Fix bugs · Explain project) · two GitHub cards"),
 (5, "Google ka free AI agent (Gemini CLI)", "Google ne apna AI agent free mein de diya, aur bahut kam log jaante hain.",
  "Gemini CLI", "google-gemini/gemini-cli", "Paid AI coding agents", "GEMINI",
  "Google ne apna AI agent free mein de diya, aur bahut kam log jaante hain.\n\nSubscription Band Karo, Day 5.\n\nIska naam hai Gemini CLI. Ye open source hai, aur tumhare computer ke terminal mein chalta hai.\n\nIsse bolo, aur ye files padhta hai, code likhta hai, bugs fix karta hai, web search karta hai, aur tumhare kaam automate karta hai. Sirf coding nahi, notes aur research ke liye bhi kaam aata hai.\n\nAur sabse achhi baat, Google account se login karo aur free limit ke saath shuru ho jao.\n\nFree limit ki ek daily seema hoti hai, uske baad paise lag sakte hain.\n\nSetup steps chahiye? Comment karo GEMINI. Kal Day 6 mein, ek photo se talking video. Bye!",
  "Free tier has daily limits; check Google's current limits before posting.",
  "Hook text + mascot c3-shocked · tool scene (no Paid card) · demo: checklist (Code · Research · Automate) · GitHub zoom"),
 (6, "Ek photo se talking video", "Ek photo do, aur wo bolne lagegi.",
  "SadTalker, LatentSync", "OpenTalker/SadTalker · bytedance/LatentSync", "HeyGen, D-ID", "AVATAR",
  "Ek photo do, aur wo bolne lagegi.\n\nSubscription Band Karo, Day 6.\n\nHeyGen aur D-ID jaise talking avatar tools har minute ke paise lete hain. Inke free, open-source versions hain.\n\nSadTalker mein ek photo aur ek audio do, aur ye photo ko bolta hua video bana deta hai, head movement ke saath.\n\nAur LatentSync, jo ByteDance ka hai, kisi bhi video ke honth audio ke saath perfectly sync karta hai.\n\nFaceless creators ke liye ye game changer hai.\n\nBas yaad rakho, sirf apni ya permission waali photo use karna, aur inke liye achha graphics card chahiye.\n\nLinks chahiye? Comment karo AVATAR. Kal Day 7 mein, is hafte ka recap. Bye!",
  "Strong GPU needed; only use faces with consent; never impersonate anyone.",
  "Hook: mascot c1-talk · Paid HeyGen vs Free SadTalker · demo: voice/checklist (Photo + Audio = Video) · two GitHub cards"),
 (7, "Week 1 recap", "Ek hafte mein maine tumhe paanch mehenge AI tools ka free version dikhaya.",
  "OpenHands, bolt.diy, OpenCode, Gemini CLI, SadTalker", "(recap, no new repo)", "Devin, Lovable, Cursor, HeyGen", "RECAP",
  "Ek hafte mein maine tumhe paanch mehenge AI tools ka free version dikhaya. Kitne yaad hain?\n\nSubscription Band Karo, Day 7. Fatafat recap.\n\nAI engineer ke liye OpenHands. Bol ke app banane ke liye bolt dot diy. Cursor ki jagah OpenCode. Google ka free agent, Gemini CLI. Aur photo se talking video ke liye SadTalker.\n\nSab free, sab open source.\n\nAgle hafte? AI gaane, Hindi dubbing, aur photo se 3D model.\n\nSaare links ek saath chahiye? Follow karo aur comment karo RECAP. Bye!",
  "",
  "Fast countdown of 5 tool scenes (no GitHub cards) · mascot c8-celebrate on the end"),
 (8, "Free AI gaane, lyrics ke saath", "Suno ke paise mat do. Free mein poora gaana banao, vocals ke saath.",
  "YuE, ACE-Step", "multimodal-art-projection/YuE · ace-step/ACE-Step", "Suno, Udio", "MUSIC",
  "Suno ke paise mat do. Free mein poora gaana banao, vocals ke saath.\n\nSubscription Band Karo, Day 8.\n\nSuno aur Udio AI music ke liye subscription lete hain. Lekin YuE aur ACE-Step open-source music models hain.\n\nApne lyrics likho, genre batao, jaise pop ya rock, aur ye gaane jaisa track banate hain, music aur vocals dono ke saath.\n\nReels ke liye background music, ya apne gaane ka demo, sab ban sakta hai.\n\nInke liye powerful graphics card chahiye, aur commercial use se pehle license zaroor padhna.\n\nLinks chahiye? Comment karo MUSIC. Kal Day 9 mein, ElevenLabs ka free version. Bye!",
  "Powerful GPU needed; check each model's license before commercial use.",
  "Mascot c8-celebrate · Paid Suno vs Free YuE · demo: wave (pill \"LYRICS → SONG\") · two GitHub cards"),
 (9, "Free ElevenLabs alternative", "AI voiceover ke liye har mahine paise de rahe ho?",
  "VoiceStudio", "debpalash/OmniVoice-Studio", "ElevenLabs", "VOICE",
  "AI voiceover ke liye har mahine paise de rahe ho?\n\nSubscription Band Karo, Day 9.\n\nElevenLabs bahut achha hai, par mehenga hai. VoiceStudio uska free, open-source alternative hai, jo pura tumhare computer pe chalta hai.\n\nVoice clone karo, kisi bhi video ko dub karo, audiobooks banao, aur ye sau se bhi zyada languages support karta hai. Aur tumhari awaaz kisi server pe nahi jaati.\n\nEk zaroori baat, sirf apni awaaz ya permission waali awaaz hi clone karna. Aur fast results ke liye achha graphics card madad karta hai.\n\nLink chahiye? Comment karo VOICE. Kal Day 10 mein, English video ko Hindi mein dub karo. Bye!",
  "Clone only voices you have permission to use; slower without a GPU.",
  "Mascot c1-talk · Paid ElevenLabs vs Free VoiceStudio · demo: voice checklist (Clone · Dub · Audiobooks) · GitHub zoom"),
 (10, "English video → Hindi dubbing", "Koi bhi English video, Hindi mein dub. Automatic.",
  "VideoLingo", "Huanshere/VideoLingo", "HeyGen Translate, Rask AI", "DUB",
  "Koi bhi English video, Hindi mein dub. Automatic.\n\nSubscription Band Karo, Day 10.\n\nVideo translate aur dub karne waale tools har minute ke paise lete hain. VideoLingo open source hai.\n\nVideo daalo, aur ye subtitles nikalta hai, unhe translate karta hai, timing perfect align karta hai, aur chaaho toh poori video ko nayi language mein dub bhi kar deta hai. Netflix jaise subtitles, ek click mein.\n\nApni videos ko doosri languages mein le jaane ke liye, ye bahut kaam ka hai.\n\nTranslation aur awaaz ke liye AI model ya API key lagti hai.\n\nLink chahiye? Comment karo DUB. Kal Day 11 mein, sirf likh ke video banao. Bye!",
  "Needs LLM / TTS API keys or local models; only dub content you have rights to.",
  "Mascot c7-phone · Paid Rask vs Free VideoLingo · demo: nodes (ENGLISH → AI → HINDI) · GitHub zoom"),
 (11, "Text se video, free", "Sirf likho, aur AI video bana dega.",
  "Wan, LTX-Video", "Wan-Video/Wan2.1 · Lightricks/LTX-Video", "Runway, Pika, Kling", "VIDEO",
  "Sirf likho, aur AI video bana dega.\n\nSubscription Band Karo, Day 11.\n\nRunway, Pika aur Kling har video ke credits lete hain. Lekin Wan aur LTX Video open-source video models hain.\n\nPrompt likho, ya ek image do, aur ye kuch seconds ka realistic AI video clip bana dete hain. Shots, b-roll, aur creative ideas ke liye kamaal.\n\nSach bataun toh, inke liye powerful graphics card chahiye. Isliye ye advanced users ke liye hai.\n\nLinks chahiye? Comment karo VIDEO. Kal Day 12 mein, ek photo se 3D model. Bye!",
  "Needs a powerful GPU.",
  "Mascot c6-thinking · Paid Runway vs Free Wan · demo: text \"TEXT → VIDEO\" · two GitHub cards"),
 (12, "Photo se 3D model", "Ek photo do, aur uska 3D model ready.",
  "TRELLIS (Microsoft), Hunyuan3D (Tencent)", "microsoft/TRELLIS · Tencent-Hunyuan/Hunyuan3D-2", "Meshy, Tripo", "3D",
  "Ek photo do, aur uska 3D model ready.\n\nSubscription Band Karo, Day 12.\n\nMeshy jaise 3D AI tools credits ke paise lete hain. Lekin Microsoft ka TRELLIS aur Tencent ka Hunyuan3D, dono open source hain.\n\nKisi bhi cheez ki photo daalo, aur ye uska 3D model bana dete hain, jise tum games, animation ya 3D printing mein use kar sakte ho.\n\nItni badi companies ke models, bilkul free.\n\nInke liye bhi powerful graphics card chahiye.\n\nLinks chahiye? Comment karo 3D. Kal Day 13 mein, Midjourney level images, free. Bye!",
  "Powerful GPU needed.",
  "Hook + mascot c3-shocked · Paid Meshy vs Free TRELLIS · demo: nodes (PHOTO → AI → 3D) · two GitHub cards"),
 (13, "Midjourney level images, free", "Midjourney level AI images, zero rupaye mein.",
  "FLUX (via ComfyUI)", "black-forest-labs/flux · comfyanonymous/ComfyUI", "Midjourney", "IMAGE",
  "Midjourney level AI images, zero rupaye mein.\n\nSubscription Band Karo, Day 13.\n\nMidjourney har mahine paise kaat-ta hai. Lekin FLUX ek open AI image model hai, jiski quality kamaal ki hai.\n\nIse ComfyUI mein chalao, prompt likho, aur realistic photos, posters aur thumbnails banao. Jitni chaaho utni.\n\nFLUX ka Schnell version commercial use ke liye bhi open hai, baaki versions ka license check karna.\n\nAur haan, iske liye achha graphics card chahiye.\n\nLinks chahiye? Comment karo IMAGE. Kal Day 14 mein, ek topic se poori faceless video. Bye!",
  "GPU needed; FLUX.1 schnell is Apache-2.0, other FLUX versions have other licenses.",
  "Mascot c5-point-right · Paid Midjourney vs Free FLUX · demo: nodes (PROMPT → FLUX → IMAGE, big ₹0) · GitHub zoom"),
 (14, "Ek topic se faceless video", "Sirf ek topic do, aur AI poori faceless video bana deta hai.",
  "MoneyPrinterTurbo", "harry0703/MoneyPrinterTurbo", "InVideo AI, Pictory", "FACELESS",
  "Sirf ek topic do, aur AI poori faceless video bana deta hai.\n\nSubscription Band Karo, Day 14.\n\nInVideo aur Pictory jaise tools har mahine paise lete hain. MoneyPrinterTurbo free aur open source hai, aur GitHub pe ek lakh se zyada logon ne isse star kiya hai.\n\nTopic do, aur ye script likhta hai, stock videos dhoondhta hai, voiceover, subtitles aur music lagata hai, aur short video ready.\n\nScript ke liye AI model ki API key chahiye, aur kuch free options bhi hain.\n\nLink chahiye? Comment karo FACELESS. Kal Day 15 mein, ChatGPT ka Deep Research, free. Bye!",
  "Needs an LLM API key (some free tiers exist); stock footage via free Pexels key.",
  "Mascot c8-celebrate · Paid InVideo vs Free MoneyPrinterTurbo · demo: nodes (TOPIC → SCRIPT → VIDEO) · GitHub zoom"),
 (15, "Free Deep Research agent", "ChatGPT ka Deep Research mehenga hai. Ye free version dekho.",
  "GPT Researcher", "assafelovic/gpt-researcher", "ChatGPT Pro Deep Research", "RESEARCH",
  "ChatGPT ka Deep Research mehenga hai. Ye free version dekho.\n\nSubscription Band Karo, Day 15.\n\nGPT Researcher ek open-source AI research agent hai.\n\nTum ek sawaal do, aur ye khud internet pe dozens of sources padhta hai, notes banata hai, aur sources ke saath poori detailed report likh deta hai. Assignments, business research, ya kisi bhi topic ki gehri jaankari ke liye.\n\nIsme AI model aur search ki API key lagti hai, aur dono ke free plans bhi milte hain.\n\nLink chahiye? Comment karo RESEARCH. Kal Day 16 mein, kisi bhi article se podcast. Bye!",
  "Needs LLM + search API keys (free tiers available).",
  "Mascot c6-thinking · Paid ChatGPT Pro vs Free GPT Researcher · demo: checklist (Search · Read · Report) · GitHub zoom"),
 (16, "Kisi bhi article se podcast", "Koi bhi article, notes ya YouTube video, aur do AI hosts uspe podcast karenge.",
  "Podcastfy", "souzatharsis/podcastfy", "NotebookLM Audio Overviews", "PODCAST",
  "Koi bhi article, notes ya YouTube video, aur do AI hosts uspe podcast karenge.\n\nSubscription Band Karo, Day 16.\n\nNotebookLM ka podcast feature sabko pasand aaya. Podcastfy uska open-source version hai.\n\nArticle, notes, ya YouTube video do, aur ye do logon ki natural baatcheet waala podcast bana deta hai. Padhai karte hue suno, ya apne content ko audio mein badlo.\n\nAur kyunki ye open source hai, tum awaaz, style aur language khud choose kar sakte ho.\n\nAI model aur voice ke liye API key ya local model lagta hai.\n\nLink chahiye? Comment karo PODCAST. Kal Day 17 mein, apna ChatGPT, bina internet. Bye!",
  "Needs LLM + TTS (API keys or local models).",
  "Mascot c1-talk · tool scene (Paid NotebookLM Plus vs Free Podcastfy) · demo: wave (pill \"ARTICLE → PODCAST\") · GitHub zoom"),
 (17, "Apna ChatGPT, bina internet", "ChatGPT bina internet ke chalega, wo bhi bilkul free?",
  "Ollama + Open WebUI", "ollama/ollama · open-webui/open-webui", "ChatGPT Plus", "OFFLINE",
  "ChatGPT bina internet ke chalega, wo bhi bilkul free?\n\nSubscription Band Karo, Day 17.\n\nChatGPT Plus har mahine paise leta hai. Lekin Ollama se tum DeepSeek, Qwen aur Gemma jaise AI models apne laptop pe chala sakte ho.\n\nAur Open WebUI lagao, toh bilkul ChatGPT jaisa chat screen mil jaata hai, documents upload ke saath. Model ek baar download karo, phir internet ki zarurat nahi. Tumhara data tumhare paas.\n\nBas laptop mein thodi achhi RAM honi chahiye.\n\nSetup ke links chahiye? Comment karo OFFLINE. Kal Day 18 mein, Google se smart AI search. Bye!",
  "Needs good RAM; bigger models need a GPU.",
  "Mascot c7-phone · Paid ChatGPT Plus vs Free Ollama · demo: text \"NO INTERNET ✓\" · two GitHub cards"),
 (18, "Free AI search engine", "Google se smart search, jo seedha jawab de, sources ke saath.",
  "Vane (formerly Perplexica)", "ItzCrazyKns/Vane", "Perplexity Pro", "SEARCH",
  "Google se smart search, jo seedha jawab de, sources ke saath. Aur free.\n\nSubscription Band Karo, Day 18.\n\nPerplexity Pro ke paise kyun dene? Vane, jiska pehle naam Perplexica tha, ek open-source AI answering engine hai.\n\nSawaal pucho, ye internet search karta hai aur sources ke saath seedha jawab deta hai. Aur tum isse apne local AI model ke saath bhi chala sakte ho, toh tumhari searches private rehti hain.\n\nIsse setup karne mein thoda time lagta hai, par ek baar ho gaya toh bas.\n\nLink chahiye? Comment karo SEARCH. Kal Day 19 mein, Manus AI ka free version. Bye!",
  "Self-hosted setup (Docker); needs a local model or API key.",
  "Mascot c6-thinking · Paid Perplexity Pro vs Free Vane · demo: checklist (Search · Sources · Answer) · GitHub zoom"),
 (19, "Manus AI ka free version", "Manus AI ka waitlist bhool jao. Iska open-source version yahan hai.",
  "OpenManus", "FoundationAgents/OpenManus", "Manus", "MANUS",
  "Manus AI ka waitlist aur credits bhool jao. Iska open-source version yahan hai.\n\nSubscription Band Karo, Day 19.\n\nManus ek general AI agent hai jo poore task khud karta hai. OpenManus uska free, open-source version hai.\n\nTum ek goal do, jaise ek topic pe research karke report banao, aur ye khud plan banata hai, tools use karta hai, aur step by step kaam pura karta hai.\n\nIsme AI model ki API key lagti hai, aur ye thoda technical setup hai.\n\nLink chahiye? Comment karo MANUS. Kal Day 20 mein, AI jo tumhara computer chalata hai. Bye!",
  "Needs an LLM API key; technical setup.",
  "Hook + mascot c3-shocked · Paid Manus vs Free OpenManus · demo: nodes (GOAL → PLAN → DONE) · GitHub zoom"),
 (20, "AI jo tumhara computer chalata hai", "Ye AI tumhara mouse aur keyboard khud chalata hai.",
  "UI-TARS Desktop (ByteDance)", "bytedance/UI-TARS-desktop", "Paid computer-use agents", "AGENT",
  "Ye AI tumhara mouse aur keyboard khud chalata hai.\n\nSubscription Band Karo, Day 20.\n\nUI-TARS Desktop, ByteDance ka open-source AI agent hai.\n\nTum normal bhasha mein bolo, jaise ek folder bana ke usme files arrange karo, aur ye screen dekh ke khud click aur type karke kaam karta hai. Bilkul jaise koi insaan computer chala raha ho.\n\nAI ko computer ka control dene se pehle dhyaan rakhna, important ya private kaam ke liye mat chalana.\n\nLink chahiye? Comment karo AGENT. Kal Day 21 mein, AI jo browser khud chalata hai. Bye!",
  "Gives an AI control of your computer: test carefully, avoid sensitive accounts.",
  "Mascot c4-point-left · tool scene (no Paid card) · demo: checklist (See screen · Click · Type) · GitHub zoom"),
 (21, "AI jo browser khud chalata hai", "Ye AI tumhare liye websites pe khud kaam karta hai.",
  "Browser Use", "browser-use/browser-use", "ChatGPT Operator / Agent mode", "BROWSER",
  "Ye AI tumhare liye websites pe khud kaam karta hai.\n\nSubscription Band Karo, Day 21.\n\nBrowser Use ek open-source tool hai jo AI ko browser chalana sikhaata hai, aur GitHub pe ek lakh se zyada logon ne isse star kiya hai.\n\nTum bolo, do websites pe price compare karo, ya ek form bhar do, aur AI khud website kholta hai, click karta hai, type karta hai, aur result batata hai.\n\nIska library version free hai, unka cloud service paid hai. Aur AI model ki API key lagti hai.\n\nLink chahiye? Comment karo BROWSER. Kal Day 22 mein, AI agent jo 24 ghante kaam kare. Bye!",
  "Library free, cloud paid; needs an LLM; respect each website's terms.",
  "Mascot c7-phone · Paid Operator vs Free Browser Use · demo: checklist (Open · Click · Compare) · GitHub zoom"),
 (22, "AI agent jo 24/7 kaam kare", "Ek AI employee, jo kabhi chhutti nahi leta.",
  "n8n AI agents", "n8n-io/n8n", "Zapier AI, Make", "AUTOMATE",
  "Ek AI employee, jo kabhi chhutti nahi leta.\n\nSubscription Band Karo, Day 22.\n\nZapier har task ke paise leta hai. n8n self-host karo, toh free hai, aur isme AI agents bhi bana sakte ho.\n\nJaise, email aaya, AI ne padha, jawab draft kiya, aur sheet mein entry kar di. Ya roz subah news ki summary tumhe Telegram pe. Sab drag and drop se, sainkdo apps ke saath.\n\nFree waala version apne computer ya server pe chalana padta hai.\n\nReady-made workflows chahiye? Comment karo AUTOMATE. Kal Day 23 mein, Claude ki free superpowers. Bye!",
  "Self-hosted community edition is free (fair-code license); cloud is paid.",
  "Mascot c8-celebrate · Paid Zapier vs Free n8n · demo: nodes (EMAIL → AI → SHEET) · GitHub zoom"),
 (23, "Claude ki free superpowers: Skills", "Claude ko ek click mein naye skills sikhao, free mein.",
  "Anthropic Skills", "anthropics/skills", "Paid prompt packs", "SKILLS",
  "Claude ko ek click mein naye skills sikhao, free mein.\n\nSubscription Band Karo, Day 23.\n\nAnthropic ne skills ki ek free, public library banayi hai. Skill matlab ready-made instructions aur tools, jo Claude ko ek kaam mein expert bana dete hain.\n\nJaise PowerPoint banana, Excel sheets, documents, designs, aur bahut kuch. Aur tum apni khud ki skill bhi bana sakte ho, jaise main apni videos banane ke liye use karta hoon.\n\nPrompt packs ke paise dene ki zarurat nahi.\n\nSkills ki list chahiye? Comment karo SKILLS. Kal Day 24 mein, AI ko apps se jodo. Bye!",
  "Skills are free; using them needs a Claude plan that supports skills.",
  "Mascot c2-hello · tool scene (no Paid card) · demo: checklist (PPT · Excel · Docs · Design) · GitHub zoom"),
 (24, "AI ko apps se connect karo: MCP", "AI ko GitHub, files aur apps ka access do, ek standard tareeke se.",
  "MCP servers", "modelcontextprotocol/servers", "Paid AI integrations", "MCP",
  "AI ko apni files, GitHub aur apps se jodo, ek standard tareeke se.\n\nSubscription Band Karo, Day 24.\n\nIska naam hai MCP, matlab Model Context Protocol. Ye ek open standard hai jisse AI assistants doosre tools se baat kar sakte hain.\n\nIs official repository mein free MCP servers hain, jaise files, Git, web fetch aur memory. Inhe lagao, aur tumhara AI sirf baat nahi karta, kaam bhi karta hai.\n\nYe thoda technical hai, par AI ka future yahi hai.\n\nSetup guide chahiye? Comment karo MCP. Kal Day 25 mein, bina coding apna AI chatbot. Bye!",
  "Technical; only connect accounts and folders you trust.",
  "Mascot c6-thinking · tool scene (no Paid card) · demo: nodes (AI → MCP → APPS) · GitHub zoom"),
 (25, "Bina coding apna AI chatbot", "Bina coding apna ChatGPT jaisa chatbot banao.",
  "Dify", "langgenius/dify", "Chatbase", "BOT",
  "Bina coding apna ChatGPT jaisa chatbot banao.\n\nSubscription Band Karo, Day 25.\n\nChatbase jaise tools har mahine paise lete hain. Dify open source hai, aur drag and drop se AI apps aur agents banane deta hai.\n\nApne documents daalo, aur ek chatbot ready, jo tumhari website pe customers ke sawaalon ka jawab de. Aur workflows bana ke poore kaam automate karo.\n\nSelf-host karna padta hai, aur AI model ka kharcha alag ho sakta hai.\n\nLink chahiye? Comment karo BOT. Kal Day 26 mein, ek video se das viral Reels. Bye!",
  "Self-hosted community edition is free; model usage may cost.",
  "Mascot c1-talk · Paid Chatbase vs Free Dify · demo: nodes (DOCS → AI → BOT) · GitHub zoom"),
 (26, "1 video se 10 viral Reels", "Ek podcast se das Reels, automatic.",
  "SupoClip", "FujiwaraChoki/supoclip", "OpusClip", "CLIPS",
  "Ek podcast se das Reels, automatic.\n\nSubscription Band Karo, Day 26.\n\nOpusClip limit ke baad paise maangta hai aur watermark lagata hai. SupoClip uska open-source alternative hai.\n\nLambi video daalo, ye best moments dhoondhta hai, face ke hisaab se vertical clips banata hai, aur word by word subtitles bhi lagata hai.\n\nApne computer pe chalane ke liye thoda setup aur API keys lagti hain, aur unki hosted app bhi hai.\n\nLink chahiye? Comment karo CLIPS. Kal Day 27 mein, purani video ko 4K banao. Bye!",
  "Self-hosting needs Docker + API keys.",
  "Mascot c5-point-right · Paid OpusClip vs Free SupoClip · demo: text \"1 VIDEO → 10 REELS\" · GitHub zoom"),
 (27, "Purani video ko 4K banao", "Purani blurry video ko 4K mein badlo, free.",
  "Video2X", "k4yt3x/video2x", "Topaz Video AI", "4K",
  "Purani blurry video ko 4K mein badlo, free.\n\nSubscription Band Karo, Day 27.\n\nTopaz Video AI bahut mehenga hai. Video2X ek free, open-source tool hai.\n\nYe AI se video ki quality badhata hai, aur frame interpolation se video ko smooth bhi kar deta hai. Purani family videos, anime, ya low quality clips, sab ko naya jaisa bana do.\n\nIske liye achha graphics card chahiye, aur lambi video mein time lagta hai.\n\nLink chahiye? Comment karo 4K. Kal Day 28 mein, poori series ka recap. Bye!",
  "GPU needed; long processing time.",
  "Mascot c3-shocked · Paid Topaz Video vs Free Video2X · demo: upscale before/after · GitHub zoom"),
 (28, "Weeks 2–4 recap", "Teen hafton mein paid AI tools ke itne free versions. Kitne yaad hain?",
  "YuE, VideoLingo, Wan, TRELLIS, GPT Researcher, OpenManus, n8n, Dify", "(recap, no new repo)", "Suno, Rask, Runway, Meshy, Manus, Zapier", "LIST",
  "Teen hafton mein paid AI tools ke itne free versions. Kitne yaad hain?\n\nSubscription Band Karo, Day 28. Fatafat recap.\n\nGaane ke liye YuE. Hindi dubbing ke liye VideoLingo. Text se video ke liye Wan. Photo se 3D ke liye TRELLIS. Deep research ke liye GPT Researcher. Manus ki jagah OpenManus. Aur automation ke liye n8n aur Dify.\n\nSab free, sab open source.\n\nPoori list chahiye? Comment karo LIST. Kal Day 29 mein, free AI tools ka ek kadwa sach. Bye!",
  "",
  "Fast countdown of tool scenes, no GitHub cards · mascot c8-celebrate"),
 (29, "\"Free\" AI tools ka kadwa sach", "Ye free AI tools sach mein free hain? Ek kadwa sach sun lo.",
  "(talk)", "(none)", "-", "TRUTH",
  "Ye free AI tools sach mein free hain? Ek kadwa sach sun lo.\n\nSubscription Band Karo, Day 29.\n\nOpen-source tools free hote hain, par kuch ko achha graphics card chahiye, aur kuch ko AI API key, jiske paise lagte hain. Isliye main har video mein catch batata hoon.\n\nAur ek zaroori warning. Kabhi bhi cracked pro apps download mat karna. Unmein virus ho sakta hai, aur tumhara data aur account dono khatre mein.\n\nAsli free tools, sahi tareeke se. Yahi is series ka maksad hai.\n\nAgree karte ho? Comment karo TRUTH. Kal Day 30 mein, sabse bada surprise. Bye!",
  "",
  "Talk scenes: mascot c12-annoyed style (c1-talk), checklist (GPU · API cost · Cracked apps ✗)"),
 (30, "30 days recap + free PDF launch", "Tees din, tees free AI tools. Aur aaj ek gift.",
  "All 30 tools", "(recap)", "-", "FREE",
  "Tees din, tees free AI tools. Aur aaj ek gift.\n\nSubscription Band Karo, Day 30.\n\nIs series mein humne AI engineer, app builder, AI gaane, Hindi dubbing, text se video, 3D models, research agents aur automation, sab ke paid tools ka free version dekha.\n\nMaine saare tools ki ek PDF banayi hai. Har tool kya karta hai, kiske liye hai, aur uska catch kya hai.\n\nWo PDF bilkul free hai. Follow karo aur comment karo FREE, main seedha DM kar dunga.\n\nThank you is safar ke liye. Bye!",
  "",
  "Fast countdown of 8–10 tools · mascot c8-celebrate · CTA banner \"FREE\" · outro"),
]

wb = Workbook()
ws = wb.active
ws.title = "30-Day Plan"
headers = ["Day", "Week", "Post Title", "Hook (first line)", "Free Tool(s)", "GitHub Repo", "Replaces (Paid)",
           "Comment Keyword", "Voice Script (Hinglish)", "Honest Catch", "Visual Notes", "Status"]
widths = [6, 8, 34, 34, 22, 30, 22, 12, 80, 32, 36, 12]
F = "Arial"
head_fill = PatternFill("solid", fgColor="111111")
week_fills = ["FFF8C4", "FFFFFF", "FFF8C4", "FFFFFF"]
thin = Side(style="thin", color="D9D9D9")

ws.append(headers)
for i, h in enumerate(headers, 1):
    c = ws.cell(row=1, column=i)
    c.font = Font(name=F, bold=True, color="FFE500", size=11)
    c.fill = head_fill
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.column_dimensions[c.column_letter].width = widths[i - 1]
ws.row_dimensions[1].height = 28

for d in DAYS:
    day, topic, hook, tools, repo, repl, kw, script, catch, visual = d
    week = (day - 1) // 7 + 1 if day <= 28 else 4
    title = f"Day ({day}/30) Subscription Band Karo: {topic}"
    status = "Recorded" if day == 1 else "To do"
    ws.append([day, f"Week {week}", title, hook, tools, repo, repl, kw, script, catch, visual, status])
    r = ws.max_row
    fill = PatternFill("solid", fgColor=week_fills[(week - 1) % 4])
    for col in range(1, len(headers) + 1):
        c = ws.cell(row=r, column=col)
        c.font = Font(name=F, size=10, bold=(col in (3, 8)))
        c.alignment = Alignment(vertical="top", wrap_text=True, horizontal="center" if col in (1, 2, 8, 12) else "left")
        c.fill = fill
        c.border = Border(top=thin, bottom=thin, left=thin, right=thin)
    lines = script.count("\n") + len(script) // 95 + 2
    ws.row_dimensions[r].height = min(409, 15 * lines)

ws.freeze_panes = "C2"
ws.auto_filter.ref = f"A1:{ws.cell(row=1, column=len(headers)).column_letter}{ws.max_row}"
dv = DataValidation(type="list", formula1='"To do,Script ready,Voice recorded,Video built,Posted"', allow_blank=True)
ws.add_data_validation(dv)
dv.add(f"L2:L{ws.max_row}")

g = wb.create_sheet("How to use")
rows = [
    ("Subscription Band Karo: 30-Day Series", ""),
    ("", ""),
    ("Edit only", "Column L (Status) on the 30-Day Plan tab: pick from the dropdown as you go."),
    ("Workflow", "1) Paste the Voice Script into your voice tool → 2) send me the audio → 3) the freestack-video skill builds the reel → 4) post with the Post Title + caption."),
    ("Post title", "Day (X/30) Subscription Band Karo: <topic>"),
    ("Caption", "Hook line · one line on the tool + its catch · Comment \"<KEYWORD>\" for the link · Follow @freestack.ai · 5–8 hashtags"),
    ("ManyChat", "Create one keyword automation per day (column H) that DMs that day's links."),
    ("Accuracy", "Repos were checked on GitHub on 15 Oct 2026. Star counts are not spoken; the video shows the live count."),
    ("Status values", "To do · Script ready · Voice recorded · Video built · Posted"),
]
for a, b in rows:
    g.append([a, b])
g.column_dimensions["A"].width = 18
g.column_dimensions["B"].width = 110
for r in range(1, g.max_row + 1):
    for col in (1, 2):
        c = g.cell(row=r, column=col)
        c.font = Font(name=F, size=11, bold=(col == 1 or r == 1))
        c.alignment = Alignment(wrap_text=True, vertical="top")
g["A1"].font = Font(name=F, size=16, bold=True)

wb.save(OUT)
print("saved", OUT, ws.max_row - 1, "days")

# Same plan as a readable Markdown file (kept in sync with the sheet).
MD = OUT.replace(".xlsx", ".md")
with open(MD, "w") as f:
    f.write("# Subscription Band Karo: 30-day plan\n\n"
            "Generated from `make_sheet.py` (same content as the .xlsx). Edit the script, not this file.\n\n")
    for day, topic, hook, tools, repo, replaces, kw, script, catch, visual in DAYS:
        f.write(f"## Day {day}/30: {topic}\n\n")
        f.write(f"**Tools:** {tools} · **Repo:** `{repo}` · **Replaces:** {replaces} · **Keyword:** {kw}\n\n")
        f.write(f"**Hook:** {hook}\n\n**Script:**\n\n")
        f.write("\n".join(f"> {l}" if l else ">" for l in script.split("\n")) + "\n\n")
        f.write(f"**Honest catch:** {catch}\n\n**Visual:** {visual}\n\n")
print("saved", MD)
