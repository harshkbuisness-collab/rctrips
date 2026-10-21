# ChatGPT prompts for the 30 scripts

## How to use (simple steps)
1. Open ChatGPT with **web search ON** (or "Deep research"), so it can check facts and find real pages.
2. Paste the **MASTER PROMPT** below (one time per chat).
3. Then paste **one day block** from the bottom (for example "DAY 2").
4. If the script is too short or has fewer than 20 SCREEN lines, say:
   "Make it 2,100 spoken words and add more SCREEN lines from real pages."
5. Check: does every VISUAL line name 4–6 codes, and does every SCREEN line have the page's exact words in "quotes"? If not, ask ChatGPT to fix that.
6. Save the answer as `scripts/dayNN_<short_name>.md`, for example `scripts/day02_us_debt.md`.
   Upload it to the repo in the `scripts/` folder.
   Voice: save as `voices/day02.mp3` (same day number) and upload it to the `voices/` folder.
7. Before recording, open a few SCREEN links yourself to make sure they work, and look at the lines marked VERIFY.

Already done (don't write these again): Days 1, 11, 14, 20, 29.

---

## MASTER PROMPT (copy everything inside the box)

```
You write scripts for a calm, animated "doodle" finance YouTube channel for US viewers. I record the voice myself.

STORY RULES
- Calm, simple storytelling, like a friend telling a true story. 8th-grade English, short sentences, one idea per sentence.
- ONE thread from the first line to the last: follow one person, one company, one dollar or one question, and come back to it in every chapter.
- No shock tricks ("you won't believe"), no random jokes, no fake drama, no topic jumps.
- Start inside the story in the first 10 seconds. No "hey guys, welcome back".
- HOOK (first 60 seconds): open with ONE striking real chart or number comparison (e.g. "these 3 companies are worth more than every tech IPO since 1980 combined"), show it with a SCREEN cue, then ask the simple question the video answers, then say why the real answer is simpler or different than people think.
- Keep sentences short (about 10-12 words) so the voice can be read at about 175 words per minute.
- Every chapter ends with a bridge sentence that leads into the next chapter. If you open a question, answer it later.
- Explain every money word the first time, with a one-sentence everyday example.
- End with a calm takeaway and one line that leads into the next video.
- Length: 2,050 to 2,250 SPOKEN words (count spoken lines only), 6 to 8 chapters.
- Spoken lines must be easy to read aloud: write numbers in words ("thirty-eight trillion dollars"). No symbols, brackets or markdown inside spoken lines.
- An optional emotion tag at the start of a line, only these: [calm] [serious] [sarcastic] [dramatic] [excited]. Mostly [calm].

FACTS
- Use web search to check EVERY number, date and quote against trusted sources. Use the newest figures (today is October 2026).
- If you cannot confirm something, say it more softly in the script and write (VERIFY) next to it in SOURCES. Never invent numbers, quotes or URLs.

SCREENSHOTS (proof shown on screen)
- At least 22 lines starting with "> SCREEN:". The first one goes under the FIRST spoken line (first 15 seconds), then about one every 30 to 40 seconds.
- Trusted sources only: .gov sites, the Federal Reserve/FRED and other central banks, SEC/DOJ/court documents, company filings and investor pages, major newspapers (NYT, WSJ, Washington Post, Reuters, AP, BBC, NPR, Guardian, FT, Bloomberg, CNBC), and Wikimedia Commons archive photos.
- Each URL must be a real page that you actually opened. Say exactly what to highlight on it, and put the exact words from the page in "double quotes" (our tool finds them and highlights them).

VISUAL NOTES (fast like my reference videos)
- Under every spoken line, write "> VISUAL:" with 6 to 10 small changes in order, so something changes every 0.5 to 1 second.
- Name 4 to 6 drawing codes in every VISUAL line, so the screen is never empty. Keep the story's main person in most lines.
- For words on a sign, write the code and the word right after it, like: H18 sign drops in "SALE". Other short words in "quotes" become red notes.
- Every item moves in: slides in from the left or right, drops in from the top, pops in, walks in, is drawn on, red circle, yellow highlight, zoom, a number counting up, a calendar flipping.
- Use ONLY these drawing codes (no new drawings, no image prompts). Blank props H15-H18 can have words written on them. Red arrows, circles, X marks and the real screenshots are also allowed:
A01_narrator_neutral A02_narrator_happy A03_narrator_laugh A04_narrator_smug A05_narrator_suspicious A06_narrator_thinking A07_narrator_confused A08_narrator_shocked A09_narrator_scared A10_narrator_panic_run A11_narrator_crying A12_narrator_angry A13_narrator_facepalm A14_narrator_shrug A15_narrator_point_right A16_narrator_point_left A17_narrator_point_up A18_narrator_present_right A19_narrator_hand_out_empty A20_narrator_two_hands_empty A21_narrator_thumbs_up A22_narrator_thumbs_down A23_narrator_wave A24_narrator_desk_laptop A25_narrator_couch A26_narrator_sleeping A27_narrator_newspaper A28_narrator_phone A29_narrator_coffee A30_narrator_counting_money A31_narrator_throwing_money A32_narrator_empty_pockets A33_narrator_walking A34_narrator_celebrate_jump A35_narrator_sweating A36_narrator_mind_blown A37_narrator_whisper A38_narrator_teacher_pointer A39_narrator_magnifying A40_narrator_microphone A41_narrator_sitting_sad A42_narrator_lying_defeated A43_narrator_peek_left A44_narrator_head_neutral A45_narrator_head_shocked A46_narrator_head_smug A47_narrator_head_dead_inside A48_narrator_stop_hand A49_narrator_bow_tie_fancy A50_narrator_superhero B01_penny_happy B02_penny_worried B03_penny_crying B04_penny_angry B05_penny_shocked B06_penny_sleeping B07_penny_sunglasses B08_penny_cracked B09_penny_upside_down_empty B10_penny_overflowing B11_penny_tiny B12_penny_running C01_banker_neutral C02_banker_greedy C03_banker_shocked C04_banker_money_bag C05_politician_podium C06_politician_nervous C07_politician_lying C08_politician_shrug C09_worker_woman_neutral C10_worker_woman_stressed C11_worker_woman_happy C12_worker_woman_shocked C13_retiree_neutral C14_retiree_worried C15_retiree_happy C16_retiree_angry C17_robot_neutral C18_robot_evil C19_robot_broken C20_robot_money C21_billionaire_neutral C22_billionaire_rocket C23_billionaire_laughing C24_billionaire_shocked C25_central_banker_printer C26_central_banker_worried C27_kid_curious C28_crowd_small D01_dollar_happy D02_dollar_sad D03_dollar_melting D04_dollar_running D05_dollar_wings D06_coin_happy D07_gold_bar_smug D08_bitcoin_nervous D09_house_happy D10_house_sad D11_house_expensive D12_house_cracked D13_chart_arrow_up D14_chart_arrow_down D15_bank_building D16_bank_building_scared D17_oil_barrel D18_credit_card D19_money_printer D20_globe_worried D21_factory_sad D22_car_character D23_ai_chip D24_bond_document D25_retirement_document D26_tax_form_evil D27_calculator_shocked D28_debt_monster D29_bubble_character D30_shopping_bag_sad E01_cash_stack E02_money_bag E03_money_rain E04_coin_pile E05_gold_bars E06_briefcase E07_laptop E08_phone E09_newspaper E10_chalkboard E11_corkboard E12_easel_board E13_tv_screen E14_podium E15_desk E16_magnifying_glass E17_light_bulb E18_bomb E19_fire E20_trash_can E21_safe_vault E22_scale E23_hourglass E24_clock E25_calendar E26_rocket E27_crown E28_trophy E29_ladder E30_broken_bridge E31_cargo_ship E32_oil_rig E33_factory E34_skyscraper E35_small_house E36_cart_full E37_cart_prices_up E38_cart_almost_empty E39_grocery_bag E40_coffee_cup E41_car E42_airplane E43_globe E44_warning_sign E45_arrow_up_big E46_arrow_down_big E47_explosion E48_question_marks E49_exclamation_marks E50_sweat_drops E51_speech_bubble E52_thought_bubble E53_money_printer_machine E54_snail E55_handcuffs_chain F01_bg_living_room F02_bg_office F03_bg_bank_lobby F04_bg_city_street F05_bg_trading_floor F06_bg_classroom F07_bg_city_night F08_bg_supermarket G01_bull_happy G02_bear_angry G03_bull_vs_bear G04_percent_happy G05_percent_angry G06_euro_coin G07_yen_coin G08_yuan_coin G09_capitol_building G10_central_bank_building G11_stock_exchange G12_ipo_bell G13_map_usa_grey G14_map_china G15_map_japan G16_map_europe G17_map_india G18_army_tank G19_tariff_wall G20_loan_shark G21_landlord G22_for_rent_sign G23_credit_meter G24_storm_cloud H01_narrator_point_viewer H02_narrator_heart_eyes H03_narrator_victory_dance H04_narrator_peek_bottom H05_narrator_reading_book H06_narrator_reading_paper H07_narrator_closeup_bill H08_narrator_armchair H09_guy_curly_neutral H10_guy_curly_talking H11_woman_shorthair_neutral H12_woman_shorthair_shocked H13_bowtie_man_smug H14_bowtie_man_worried H15_paper_note_blank H16_sticky_note_blank H17_price_tag_blank H18_sign_blank H19_box_closed H20_box_open H21_flat_tv_blank H22_book_open H23_apartment_building H24_bricks_stack H25_armchair_red H26_gold_medal H27_heart H28_paper_stack

OUTPUT FORMAT (follow it exactly, in one markdown code block)
# Day NN: <working title>
TITLES: <option 1> | <option 2> | <option 3>
THUMBNAIL: <2-4 word text> — <what the picture shows>
THREAD: <the one person or thing we follow>

## CHAPTER 1: <name>
[calm] <spoken line, 1 to 3 sentences>
> VISUAL: <A15 slides in from the right; then E09 drops in; ...>
> SCREEN: <source name> | <URL> | <what to highlight>
<next spoken line>
> VISUAL: ...

## CHAPTER 2: <name>
...

## SOURCES
- <claim> — <source name> — <URL>

Reply "Ready" and wait for the topic.
```

---

## CONVERT PROMPT (for scripts you already wrote as plain text)

Steps: new ChatGPT chat, web search ON. Paste the MASTER PROMPT, wait for "Ready", then paste the box below
with your script under it. If the answer stops in the middle, type "continue". Save the full answer as
`scripts/dayNN_<short_name>.md` (example: `scripts/day02_who_america_owes.md`). Check 4-6 screenshot links open.
Skip Days 11, 14, 20 and 29: those are already done in this format.

```
Below is a finished narration script for Day NN. Turn it into the OUTPUT FORMAT from my master prompt.
Keep my story, my words and my order as much as you can. Only change these things:
1. HOOK: if it starts with "Imagine..." (or any slow opening), rewrite only the first 4-6 lines so it opens with
   ONE striking real number or chart comparison, with a SCREEN cue under the first line, then the simple question
   the video answers. Don't use "Imagine" anywhere in the first minute.
2. FACTS: web-search every number, date, name and quote. Fix wrong ones to the newest real figure (today is
   October 2026). If the title and the script disagree on a number, use the true one in both. If you can't confirm
   something, say it more softly and mark it (VERIFY) in SOURCES. Never invent numbers, quotes or URLs.
3. Split it into 6-8 chapters ("## CHAPTER n: name"), each ending with a bridge line into the next.
4. Spoken lines of 1-3 sentences. Add an emotion tag only where it helps, mostly [calm].
5. Under every spoken line add "> VISUAL:" with 4-6 drawing codes from my list, moving in one by one.
6. At least 22 "> SCREEN:" lines from trusted sources (real pages you opened, exact page words in "double quotes"),
   the first in the first 15 seconds, then about one every 30-40 seconds.
7. Keep 2,050-2,250 spoken words. Numbers in words. Add TITLES, THUMBNAIL, THREAD and SOURCES.
If it is too long for one reply, stop after Chapter 4 and write CONTINUE; I will say "continue".

SCRIPT:
<paste the script here>
```

---

## DAY BLOCKS (paste one after the master prompt)

### DAY 2
```
Write Day 02.
Working title: Who Does America Owe $38 Trillion?
Other title ideas: Who Owns America's Debt? | America Owes Itself (Mostly)
Thumbnail text: Who Do We Owe?
Type: Explainer
Hook idea: America owes more money than any country in history. So who exactly is it borrowing from?
Outline:
1) How big the debt is (per person, vs GDP)
2) How borrowing works: Treasury bonds, auctions
3) Who holds it: the public, the Fed, Social Security & other trust funds, foreign countries
4) Japan and China: why they buy
5) The real problem: interest now costs more than defense
6) What happens if buyers step back
7) What it means for your mortgage & taxes
Facts to check: Total debt (check TreasuryDirect 'Debt to the Penny' on the day); interest cost vs defense (CBO); top foreign holders (Treasury TIC data)
Evidence ideas: TreasuryDirect debt counter; Treasury TIC 'Major Foreign Holders' table; CBO budget outlook; FRED debt-to-GDP chart
The last line leads into the next video: "The Real Wolf of Wall Street Was Worse"
```

### DAY 3
```
Write Day 03.
Working title: The Real Wolf of Wall Street Was Worse
Other title ideas: Jordan Belfort: The Scam Behind the Movie | How a Boiler Room Stole $200 Million
Thumbnail text: They Cheered For Him.
Type: Story
Hook idea: He sold worthless stocks to retirees, spent 22 months in prison, and then Hollywood made him a hero.
Outline:
1) Who Belfort was before Wall Street
2) Black Monday 1987 and penny stocks
3) Stratton Oakmont: the boiler room, the sales script
4) Pump and dump explained with stickmen
5) The excess (kept PG)
6) The FBI case and the wire
7) The victims and unpaid restitution
8) Why we cheer for villains
Facts to check: Sentence length; restitution ordered vs paid (court records/DOJ); size of investor losses
Evidence ideas: SEC/DOJ press releases; court filings; FINRA BrokerCheck page for Stratton Oakmont; NYT/WSJ archive headlines
The last line leads into the next video: "Why $100 Doesn't Buy What It Used To"
```

### DAY 4
```
Write Day 04.
Working title: Why $100 Doesn't Buy What It Used To
Other title ideas: Inflation: The Tax Nobody Voted For | Where Did Your Money Go?
Thumbnail text: Your Money Is Shrinking.
Type: Explainer
Hook idea: Your bank balance never goes down. But what it buys does, every single year.
Outline:
1) What $100 bought in 2020 vs today (BLS/FRED)
2) What inflation actually is
3) Demand-pull vs cost-push vs printing money
4) 2021-22: the spike to 9.1%
5) Who loses (savers, renters) and who wins (borrowers, government)
6) What the Fed does about it
7) What you can do (not financial advice)
Facts to check: Latest CPI (BLS release on the day); June 2022 9.1% peak; $100 2020 purchasing power
Evidence ideas: BLS CPI release; FRED CPI chart; NPR/AP inflation headlines
The last line leads into the next video: "How Your Neighbor's Mortgage Broke the World"
```

### DAY 5
```
Write Day 05.
Working title: How Your Neighbor's Mortgage Broke the World
Other title ideas: 2008 Explained Like a Story | The Lie That Fit on a Billboard
Thumbnail text: They Knew.
Type: Story
Hook idea: In September 2008, a 158-year-old bank disappeared over a weekend. It started with a house nobody could afford.
Outline:
1) Cheap money after 2001
2) Subprime and 'NINJA' loans
3) Mortgage bonds and AAA ratings
4) CDOs and credit default swaps (the bet)
5) The crack: falling home prices
6) Lehman Brothers weekend
7) Bailouts and TARP
8) Who paid, who went to jail (nobody)
Facts to check: Lehman size & date; TARP $700B; foreclosures and job losses (BLS/Fed); unemployment peak 10%
Evidence ideas: Lehman bankruptcy filing headline; Fed/Treasury press releases; Financial Crisis Inquiry Report (govinfo.gov); FRED unemployment & home price charts
The last line leads into the next video: "Why Can't the Government Just Print More Money?"
```

### DAY 6
```
Write Day 06.
Working title: Why Can't the Government Just Print More Money?
Other title ideas: The Money Printer Problem | What Happens When Countries Print Cash
Thumbnail text: Just Print It?
Type: Explainer
Hook idea: If the government can print money, why are there still poor people? Here's what happens when you try.
Outline:
1) The bread-loaf thought experiment
2) Weimar Germany 1923
3) Zimbabwe 2008
4) Venezuela 2016-18
5) So how does the US 'print' money today? (QE)
6) When printing works and when it breaks
Facts to check: Weimar bread prices; Zimbabwe 2008 inflation figure; Venezuela inflation (IMF)
Evidence ideas: Archive photos of Weimar banknotes (public domain); IMF data pages; Fed explainer on QE
The last line leads into the next video: "The AI Bubble Has One Weak Spot"
```

### DAY 7
```
Write Day 07.
Working title: The AI Bubble Has One Weak Spot
Other title ideas: Is AI a Bubble? Follow the Debt | The $1 Trillion Bet on AI
Thumbnail text: Follow The Money.
Type: Current
Hook idea: Tech companies are spending more on AI than America spent on its highways. And a lot of it is borrowed.
Outline:
1) How much is being spent (capex)
2) Who pays: cash vs bonds vs private credit
3) The circular deals (chips↔cloud↔labs)
4) Revenue vs spending gap
5) The dot-com parallel (and where it breaks)
6) What a pop would hit: index funds, jobs, power bills
Facts to check: Capex numbers from company filings (10-Q/10-K); AI revenue figures; bond issuance (company announcements)
Evidence ideas: SEC EDGAR filings screenshots; company earnings slides; FRED/BEA investment data
The last line leads into the next video: "Nobody Can Buy a House… Even When Prices Should Fall"
```

### DAY 8
```
Write Day 08.
Working title: Nobody Can Buy a House… Even When Prices Should Fall
Other title ideas: Why Houses Got So Expensive | The Housing Trap
Thumbnail text: Locked Out.
Type: Current
Hook idea: There are more sellers than buyers. Prices still won't fall. Here's why.
Outline:
1) Prices vs incomes (then vs now)
2) The rate lock: why owners won't sell
3) Builders and supply
4) Zoning and why we don't build
5) Investors and the 'Bank of Mom and Dad'
6) What would actually fix it
Facts to check: Median home price & income (Census/NAR); share of mortgages under 4%/5% (FHFA); first-time buyer age (NAR)
Evidence ideas: Census/HUD new home data; FHFA house price index; Redfin/NAR reports; FRED mortgage rate chart
The last line leads into the next video: "Rockefeller: How the First Billionaire Actually Did It"
```

### DAY 9
```
Write Day 09.
Working title: Rockefeller: How the First Billionaire Actually Did It
Other title ideas: The Man Who Owned 90% of Oil | Why Breaking Up His Company Made Him Richer
Thumbnail text: Too Big To Stop.
Type: Story
Hook idea: When the government broke up his company, John D. Rockefeller didn't get poorer. He doubled his money.
Outline:
1) Childhood and the con-man father
2) Bookkeeper to refiner
3) Railroad rebates
4) Swallowing Cleveland
5) The Standard Oil Trust
6) Ida Tarbell's investigation
7) The 1911 breakup and the windfall
8) Philanthropy and legacy
Facts to check: 90% market share; 1911 Supreme Court ruling; first billionaire (1916)
Evidence ideas: Supreme Court 1911 decision text; McClure's/Tarbell pages (public domain); archive photos
The last line leads into the next video: "Enron: The $63 Billion Company That Sold Nothing"
```

### DAY 10
```
Write Day 10.
Working title: Enron: The $63 Billion Company That Sold Nothing
Other title ideas: How Enron Faked It | The Smartest Guys in the Room
Thumbnail text: It Was All Fake.
Type: Story
Hook idea: America's seventh-biggest company went bankrupt in weeks. Nobody could explain what it actually did.
Outline:
1) Pipelines to 'energy trading'
2) Mark-to-market accounting
3) Fastow's hidden partnerships
4) California blackouts
5) The collapse and the shredding
6) Arthur Andersen dies too
7) Workers' 401(k)s wiped out
8) Sarbanes-Oxley
Facts to check: Enron size & bankruptcy date (Dec 2001); sentences; employee losses
Evidence ideas: SEC complaint documents; DOJ press releases; Powers Report; archive headlines
The last line leads into the next video: "How Credit Card Companies Make Money Off You"
```

### DAY 12
```
Write Day 12.
Working title: How the Rich Pay Less Tax Than You (Legally)
Other title ideas: Buy, Borrow, Die | Why Billionaires Have Low Tax Bills
Thumbnail text: Totally Legal.
Type: Explainer
Hook idea: A billionaire can live on hundreds of millions of dollars a year and pay almost no income tax. Here's how.
Outline:
1) Income vs wealth
2) Capital gains vs wages
3) Borrowing against stock
4) Step-up in basis at death
5) Real reported examples
6) Why it's legal and the debate
Facts to check: Capital gains vs top income tax rates (IRS); ProPublica 'true tax rate' figures
Evidence ideas: IRS rate tables; ProPublica 2021 report pages; Congressional Budget Office notes
The last line leads into the next video: "Tariffs: Who Really Pays?"
```

### DAY 13
```
Write Day 13.
Working title: Tariffs: Who Really Pays?
Other title ideas: The Truth About Tariffs | Import Taxes Explained
Thumbnail text: You Pay It.
Type: Explainer
Hook idea: When America puts a tariff on another country, that country doesn't send a check. Someone else does.
Outline:
1) What a tariff is
2) Who writes the check (importer)
3) How it reaches your cart
4) Retaliation and trade wars
5) 1930 Smoot-Hawley lesson
6) When tariffs can help
Facts to check: Customs revenue figures (Treasury); studies on price pass-through (Fed/NBER)
Evidence ideas: Treasury monthly statement; Fed research notes; Smoot-Hawley archive pages
The last line leads into the next video: "Why $1 Isn't Worth €1 or ¥1"
```

### DAY 15
```
Write Day 15.
Working title: The 1973 Crash Everyone Forgot
Other title ideas: The Nifty Fifty Bubble | When 'Safe' Stocks Lost 70%
Thumbnail text: It Happened Before.
Type: Story/Current
Hook idea: In 1972, everyone agreed you could buy 50 stocks and never sell. Two years later, they'd lost half.
Outline:
1) The Nifty Fifty idea
2) Crazy valuations
3) Oil shock, inflation, Nixon
4) The crash 1973-74
5) The 8-year recovery
6) Then vs the 'Magnificent 7' today
Facts to check: 1973-74 S&P drawdown; Nifty Fifty P/E examples; today's top-7 share of S&P (index provider)
Evidence ideas: FRED/S&P charts; archive news pages; index provider fact sheets
The last line leads into the next video: "NVIDIA: From a Denny's Booth to the World's Biggest Company"
```

### DAY 16
```
Write Day 16.
Working title: NVIDIA: From a Denny's Booth to the World's Biggest Company
Other title ideas: How NVIDIA Almost Died Three Times | The Chip Company That Bet Everything
Thumbnail text: They Almost Died.
Type: Story
Hook idea: In 1996, NVIDIA had one month of cash left. Today it's worth more than most countries' economies.
Outline:
1) Founding at Denny's
2) The NV1 flop and Sega's lifeline
3) RIVA 128 and the GPU
4) The CUDA bet
5) AlexNet 2012
6) Export bans and China
7) The AI gold rush
Facts to check: Founding 1993; market cap milestones (exchange data); export rules (Commerce Dept)
Evidence ideas: NVIDIA filings/IR pages; Commerce/BIS export rule notices; archive press releases
The last line leads into the next video: "Every Level of Wealth in America"
```

### DAY 17
```
Write Day 17.
Working title: Every Level of Wealth in America
Other title ideas: What Life Looks Like at Every Income | Broke to Billionaire
Thumbnail text: Where Are You?
Type: Comedy explainer
Hook idea: Your income doesn't just decide what you can buy. It decides what your whole life looks like.
Outline:
1) Broke
2) Paycheck to paycheck
3) Middle class
4) Comfortable
5) The top 1%
6) Ultra-rich
7) Billionaires
8) Does money buy happiness?
Facts to check: Median household income (Census); top 1% income & wealth thresholds (Fed SCF)
Evidence ideas: Census income report; Fed Survey of Consumer Finances tables
The last line leads into the next video: "Money Basics Nobody Taught You in School"
```

### DAY 18
```
Write Day 18.
Working title: Money Basics Nobody Taught You in School
Other title ideas: 10 Money Rules You Should Know | The Financial Class You Missed
Thumbnail text: Nobody Told You.
Type: List
Hook idea: School taught you the Pythagorean theorem. It didn't teach you how a credit score works.
Outline:
1) Taxes
2) Banks
3) Interest & compounding
4) Inflation
5) Credit scores
6) Debt
7) Investing basics
8) Index funds
9) Emergency fund
10) Time
Facts to check: FDIC limit; credit score ranges (FICO); historical market returns (with source)
Evidence ideas: FDIC; CFPB; FICO; FRED
The last line leads into the next video: "Japan Was the World's ATM. Now It's Closing."
```

### DAY 19
```
Write Day 19.
Working title: Japan Was the World's ATM. Now It's Closing.
Other title ideas: The Yen Carry Trade Explained | Why Japan Matters to Your Mortgage
Thumbnail text: The Money Is Leaving.
Type: Current
Hook idea: For 30 years, Japan lent the world almost free money. That's ending, and America feels it first.
Outline:
1) Japan's lost decades
2) Zero and negative rates
3) The carry trade (Bob example, our own)
4) Japan as top holder of US Treasuries
5) Rate hikes and Aug 2024 market drop
6) What it means for long-term US rates
Facts to check: BoJ rate decisions; Japan Treasury holdings (TIC); Aug 2024 Nikkei drop
Evidence ideas: Bank of Japan statements; Treasury TIC table; news headlines
The last line leads into the next video: "Every Financial Bubble in History Explained"
```

### DAY 21
```
Write Day 21.
Working title: Where Does Money Actually Come From?
Other title ideas: How Banks Create Money | The Money Myth
Thumbnail text: Banks Make It Up.
Type: Explainer
Hook idea: Most of the money in America was never printed. It was typed into existence by a bank.
Outline:
1) Cash vs bank money
2) Loans create deposits
3) The Fed's role
4) Reserves and rates
5) Why it matters (credit booms)
Facts to check: M2 vs currency in circulation (Fed H.6)
Evidence ideas: Fed H.6 release; Bank of England 'Money creation' paper (2014)
The last line leads into the next video: "Bitcoin, Honestly Explained"
```

### DAY 22
```
Write Day 22.
Working title: Bitcoin, Honestly Explained
Other title ideas: What Bitcoin Actually Is | No Hype Bitcoin Guide
Thumbnail text: What Is It Really?
Type: Explainer
Hook idea: Bitcoin is either the future of money or digital tulips. Let's look at what it actually is.
Outline:
1) The 2008 white paper
2) Blockchain in plain English
3) Mining
4) Why the price swings
5) ETFs and Wall Street
6) Scams and FTX
7) The honest bull and bear case
Facts to check: 21M supply cap; ETF approval date (SEC Jan 2024); FTX facts (DOJ)
Evidence ideas: Bitcoin white paper PDF; SEC approval order; DOJ FTX press release
The last line leads into the next video: "Theranos: The $9 Billion Blood Test That Didn't Work"
```

### DAY 23
```
Write Day 23.
Working title: Theranos: The $9 Billion Blood Test That Didn't Work
Other title ideas: Elizabeth Holmes Explained | Fake It Till You Make It
Thumbnail text: It Never Worked.
Type: Story
Hook idea: She convinced generals, presidents and billionaires that one drop of blood could run hundreds of tests. It couldn't.
Outline:
1) Stanford dropout
2) The pitch
3) The board of famous names
4) The machine that didn't work
5) The whistleblowers
6) WSJ exposé
7) Trial and prison
Facts to check: Peak valuation $9B; sentence length; investor losses
Evidence ideas: SEC complaint; DOJ press releases; court documents
The last line leads into the next video: "How Tiny Countries Got Insanely Rich"
```

### DAY 24
```
Write Day 24.
Working title: How Tiny Countries Got Insanely Rich
Other title ideas: Singapore, Switzerland, Dubai | Small Countries, Big Money
Thumbnail text: No Resources. Rich Anyway.
Type: Story
Hook idea: Singapore has no oil, no farmland and barely any water. Its people are richer than Americans.
Outline:
1) Singapore's crisis in 1965
2) Lee Kuan Yew's playbook
3) Switzerland: banking and neutrality
4) Dubai: from pearls to hub
5) What they have in common
6) The trade-offs
Facts to check: GDP per capita comparisons (World Bank)
Evidence ideas: World Bank data pages; archive photos (public domain)
The last line leads into the next video: "'Entry Level, 5 Years Experience': Why You Can't Get Hired"
```

### DAY 25
```
Write Day 25.
Working title: 'Entry Level, 5 Years Experience': Why You Can't Get Hired
Other title ideas: The Job Market Makes No Sense | Ghost Jobs Explained
Thumbnail text: Nobody's Hiring?
Type: Current
Hook idea: Companies say they can't find workers. Workers say they can't find jobs. Both are telling the truth.
Outline:
1) The numbers: openings vs hires (JOLTS)
2) Ghost job postings
3) Entry-level squeeze
4) AI as excuse vs reality
5) What actually gets people hired
Facts to check: JOLTS openings/hires (BLS); unemployment for recent grads (NY Fed)
Evidence ideas: BLS JOLTS release; NY Fed labor market for recent grads page
The last line leads into the next video: "The Stock Market Explained for People Who Think It's Gambling"
```

### DAY 26
```
Write Day 26.
Working title: The Stock Market Explained for People Who Think It's Gambling
Other title ideas: How the Stock Market Actually Works | Investing vs Gambling
Thumbnail text: It's Not a Casino.
Type: Explainer
Hook idea: Most people think the stock market is a casino. For some people, it is. Here's the difference.
Outline:
1) What a share is
2) Who's trading (types of players)
3) Index funds
4) Long-term returns vs timing
5) Common traps
6) How to start (not advice)
Facts to check: Long-run S&P returns (source); index fund share of market
Evidence ideas: SEC investor.gov pages; S&P fact sheets; FRED
The last line leads into the next video: "Palantir: The Company That Watches Everything"
```

### DAY 27
```
Write Day 27.
Working title: Palantir: The Company That Watches Everything
Other title ideas: How Palantir Works | The CIA-Funded Data Company
Thumbnail text: It Sees Everything.
Type: Story
Hook idea: It started after 9/11 with money from the CIA. Now it helps run armies, hospitals and corporations.
Outline:
1) Founded after 9/11, In-Q-Tel money
2) Gotham for war zones
3) Suing the Army and winning
4) ICE and the privacy fight
5) Foundry for companies
6) Going public
7) AI and the questions
Facts to check: In-Q-Tel investment; Army lawsuit (Court of Federal Claims 2016); IPO date
Evidence ideas: Court opinion; SEC S-1 filing; government contract records
The last line leads into the next video: "How Jeff Bezos Actually Built Amazon"
```

### DAY 28
```
Write Day 28.
Working title: How Jeff Bezos Actually Built Amazon
Other title ideas: From a Garage to Everything | The Amazon Story
Thumbnail text: He Lost Money for Years.
Type: Story
Hook idea: Amazon lost money for years on purpose. Wall Street called it 'Amazon.toast'. Then it ate retail.
Outline:
1) Leaving a hedge fund
2) The garage and 'get big fast'
3) The dot-com crash
4) Prime and Marketplace
5) AWS by accident
6) Warehouses and criticism
7) Stepping down
Facts to check: IPO 1997; stock fall in 2000-01; AWS launch 2006
Evidence ideas: SEC S-1 (1997); Amazon shareholder letters (1997 letter); archive headlines
The last line leads into the next video: "Your Retirement Is About to Buy the AI Giants"
```

### DAY 30
```
Write Day 30.
Working title: How Money Laundering Actually Works
Other title ideas: Dirty Money Explained | How Criminals Clean Cash
Thumbnail text: Clean Money, Dirty Past.
Type: Explainer
Hook idea: Criminals can't just put a million dollars in cash into a bank. So they wash it, in three steps.
Outline:
1) Placement
2) Layering
3) Integration
4) Famous real cases (HSBC, Danske)
5) How banks catch it
6) Why it still works
Facts to check: HSBC 2012 settlement ($1.9B, DOJ); Danske Bank figures (DOJ 2022)
Evidence ideas: DOJ press releases; FinCEN pages
The last line leads into the next video: "(last video of the series: point to the channel's next videos)"
```
