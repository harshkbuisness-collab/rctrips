const visualData = [
  {
    "kind": "hook",
    "label": "Hook Card",
    "section": "core",
    "type": "hook",
    "rendererFamily": "typography",
    "alternativeGroup": null,
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "headline",
        "label": "Headline",
        "text": "2 SEC HOOK"
      }
    ]
  },
  {
    "kind": "views",
    "label": "Views Stat",
    "section": "core",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "social-count-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "VIEWS"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "12.8K"
      }
    ]
  },
  {
    "kind": "retention",
    "label": "Retention Ring",
    "section": "core",
    "type": "ring",
    "rendererFamily": "progress",
    "alternativeGroup": "retention-watchtime",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "ringPct": 0.68,
    "tier": "core",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "RETENTION"
      }
    ]
  },
  {
    "kind": "watch",
    "label": "Watch Ring",
    "section": "core",
    "type": "ring",
    "rendererFamily": "progress",
    "alternativeGroup": "retention-watchtime",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "ringPct": 0.82,
    "tier": "core",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "WATCH TIME"
      }
    ]
  },
  {
    "kind": "youtube",
    "label": "YouTube Card",
    "section": "core",
    "type": "appCard",
    "rendererFamily": "social-ui",
    "alternativeGroup": "app-showcase-card",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "YOUTUBE"
      },
      {
        "key": "subtitle",
        "label": "Subtitle",
        "text": "Creator Studio"
      },
      {
        "key": "footer",
        "label": "Footer",
        "text": "UPLOAD • WATCH • GROW"
      }
    ]
  },
  {
    "kind": "whatsapp",
    "label": "Chat Card",
    "section": "core",
    "type": "appCard",
    "rendererFamily": "social-ui",
    "alternativeGroup": "chat-notification",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "WhatsApp"
      },
      {
        "key": "message",
        "label": "Message",
        "text": "Reply fast →"
      }
    ]
  },
  {
    "kind": "instagram",
    "label": "Reel Card",
    "section": "core",
    "type": "appCard",
    "rendererFamily": "social-ui",
    "alternativeGroup": "app-showcase-card",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "REEL"
      },
      {
        "key": "subtitle",
        "label": "Subtitle",
        "text": "creative card"
      }
    ]
  },
  {
    "kind": "content",
    "label": "Content Stack",
    "section": "core",
    "type": "stack",
    "rendererFamily": "decorative",
    "alternativeGroup": null,
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "CONTENT"
      }
    ]
  },
  {
    "kind": "format",
    "label": "4-Step Grid",
    "section": "core",
    "type": "grid4",
    "rendererFamily": "process",
    "alternativeGroup": "grid-2x2-generic",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "a",
        "label": "A",
        "text": "HOOK"
      },
      {
        "key": "b",
        "label": "B",
        "text": "VALUE"
      },
      {
        "key": "c",
        "label": "C",
        "text": "PROOF"
      },
      {
        "key": "d",
        "label": "D",
        "text": "CTA"
      }
    ]
  },
  {
    "kind": "growth",
    "label": "Growth Bars",
    "section": "core",
    "type": "bars",
    "rendererFamily": "chart",
    "alternativeGroup": null,
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": []
  },
  {
    "kind": "publish",
    "label": "Publish Ring",
    "section": "core",
    "type": "ring",
    "rendererFamily": "progress",
    "alternativeGroup": "publish-complete",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "ringPct": 1,
    "tier": "core",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "PUBLISH"
      }
    ]
  },
  {
    "kind": "cta",
    "label": "CTA Accent",
    "section": "core",
    "type": "cta",
    "rendererFamily": "cta",
    "alternativeGroup": null,
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "COMMENT ↓"
      }
    ]
  },
  {
    "kind": "checklist",
    "label": "Checklist",
    "section": "v11",
    "type": "checklist",
    "rendererFamily": "process",
    "alternativeGroup": "checklist-steps",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "item1",
        "label": "Item1",
        "text": "Hook first"
      },
      {
        "key": "item2",
        "label": "Item2",
        "text": "Show value"
      },
      {
        "key": "item3",
        "label": "Item3",
        "text": "Clear CTA"
      }
    ]
  },
  {
    "kind": "comparison",
    "label": "Don't / Do",
    "section": "v11",
    "type": "comparison",
    "rendererFamily": "comparison",
    "alternativeGroup": "compare-vs",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "bad",
        "label": "Bad",
        "text": "Random posting"
      },
      {
        "key": "good",
        "label": "Good",
        "text": "Plan every hook"
      }
    ]
  },
  {
    "kind": "priceTag",
    "label": "Price / Offer",
    "section": "v11",
    "type": "priceTag",
    "rendererFamily": "offer",
    "alternativeGroup": "offer-price",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "LIMITED OFFER"
      },
      {
        "key": "was",
        "label": "Was",
        "text": "₹49,999"
      },
      {
        "key": "now",
        "label": "Now",
        "text": "₹19,999"
      },
      {
        "key": "badge",
        "label": "Badge",
        "text": "BEST DEAL"
      }
    ]
  },
  {
    "kind": "emojiPop",
    "label": "Emoji Pop",
    "section": "v11",
    "type": "emojiPop",
    "rendererFamily": "decorative",
    "alternativeGroup": "reaction-emoji-pop",
    "dataMode": "sample",
    "requiresRealData": false,
    "iconName": "rocket",
    "tier": "core",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "LET'S GO"
      }
    ]
  },
  {
    "kind": "arrowCallout",
    "label": "Screen Callout",
    "section": "v11",
    "type": "callout",
    "rendererFamily": "device-ui",
    "alternativeGroup": null,
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "Settings"
      },
      {
        "key": "note",
        "label": "Note",
        "text": "Tap here"
      }
    ]
  },
  {
    "kind": "stripCarousel",
    "label": "Category Strip",
    "section": "v11",
    "type": "strip",
    "rendererFamily": "process",
    "alternativeGroup": null,
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "a",
        "label": "A",
        "text": "HOOK"
      },
      {
        "key": "b",
        "label": "B",
        "text": "VALUE"
      },
      {
        "key": "c",
        "label": "C",
        "text": "PROOF"
      },
      {
        "key": "d",
        "label": "D",
        "text": "CTA"
      },
      {
        "key": "caption",
        "label": "Caption",
        "text": "4-STEP FORMAT"
      }
    ]
  },
  {
    "kind": "quoteCard",
    "label": "Quote Card",
    "section": "v11",
    "type": "quote",
    "rendererFamily": "editorial",
    "alternativeGroup": "testimonial-quote",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "quote",
        "label": "Quote",
        "text": "Hook is everything"
      },
      {
        "key": "author",
        "label": "Author",
        "text": "GROWTH 101"
      }
    ]
  },
  {
    "kind": "countdown",
    "label": "Countdown",
    "section": "v11",
    "type": "countdown",
    "rendererFamily": "decorative",
    "alternativeGroup": null,
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "number",
        "label": "Number",
        "text": "3"
      },
      {
        "key": "label",
        "label": "Label",
        "text": "SECONDS LEFT"
      }
    ]
  },
  {
    "kind": "sparkle",
    "label": "Sparkle Accent",
    "section": "v11",
    "type": "sparkle",
    "rendererFamily": "decorative",
    "alternativeGroup": "celebration-burst",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": []
  },
  {
    "kind": "barChart",
    "label": "Bar Chart",
    "section": "v12",
    "type": "barChart",
    "rendererFamily": "chart",
    "alternativeGroup": "bar-chart-metric",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "MONTHLY GROWTH"
      }
    ]
  },
  {
    "kind": "lineChart",
    "label": "Line Chart",
    "section": "v12",
    "type": "lineChart",
    "rendererFamily": "chart",
    "alternativeGroup": "line-chart-trend",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "ENGAGEMENT TREND"
      }
    ]
  },
  {
    "kind": "pieChart",
    "label": "Pie / Donut Chart",
    "section": "v12",
    "type": "pieChart",
    "rendererFamily": "chart",
    "alternativeGroup": "pie-donut",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": []
  },
  {
    "kind": "progressBar",
    "label": "Progress Bar",
    "section": "v12",
    "type": "progressBar",
    "rendererFamily": "progress",
    "alternativeGroup": null,
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "PROFILE SETUP"
      }
    ]
  },
  {
    "kind": "counterUp",
    "label": "Counter Up",
    "section": "v12",
    "type": "counterUp",
    "rendererFamily": "stat-card",
    "alternativeGroup": "counter-milestone",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "NEW FOLLOWERS"
      }
    ]
  },
  {
    "kind": "kpiCard",
    "label": "KPI Card",
    "section": "v12",
    "type": "kpiCard",
    "rendererFamily": "stat-card",
    "alternativeGroup": "kpi-tile",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "REACH THIS WEEK"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "48.2K"
      },
      {
        "key": "change",
        "label": "Change",
        "text": "18%"
      }
    ]
  },
  {
    "kind": "statGrid",
    "label": "Stat Grid",
    "section": "v12",
    "type": "statGrid",
    "rendererFamily": "stat-card",
    "alternativeGroup": "stat-grid-4up",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "v1",
        "label": "V1",
        "text": "2.4M"
      },
      {
        "key": "v2",
        "label": "V2",
        "text": "184K"
      },
      {
        "key": "v3",
        "label": "V3",
        "text": "9.1K"
      },
      {
        "key": "v4",
        "label": "V4",
        "text": "620"
      }
    ]
  },
  {
    "kind": "badgeStamp",
    "label": "Badge / Stamp",
    "section": "v12",
    "type": "badgeStamp",
    "rendererFamily": "badge",
    "alternativeGroup": "badge-trust-stamp",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "text",
        "label": "Text",
        "text": "VERIFIED"
      }
    ]
  },
  {
    "kind": "notificationToast",
    "label": "Notification",
    "section": "v12",
    "type": "toast",
    "rendererFamily": "social-ui",
    "alternativeGroup": "chat-notification",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "Instagram"
      },
      {
        "key": "message",
        "label": "Message",
        "text": "Your reel just crossed 10K views"
      }
    ]
  },
  {
    "kind": "toggleSwitch",
    "label": "Toggle Switch",
    "section": "v12",
    "type": "toggle",
    "rendererFamily": "toggle",
    "alternativeGroup": "toggle-state",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "AUTOMATION: ON"
      }
    ]
  },
  {
    "kind": "phoneMockup",
    "label": "Phone Mockup",
    "section": "v12",
    "type": "phone",
    "rendererFamily": "device-ui",
    "alternativeGroup": "device-mockup",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "Works on any device"
      }
    ]
  },
  {
    "kind": "arrowFlow",
    "label": "Arrow Flow",
    "section": "v12",
    "type": "flow",
    "rendererFamily": "process",
    "alternativeGroup": null,
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "Every action moves you forward"
      }
    ]
  },
  {
    "kind": "trendArrow",
    "label": "Trend Arrow",
    "section": "v12",
    "type": "trend",
    "rendererFamily": "chart",
    "alternativeGroup": null,
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "value",
        "label": "Value",
        "text": "+42%"
      },
      {
        "key": "label",
        "label": "Label",
        "text": "ENGAGEMENT"
      }
    ]
  },
  {
    "kind": "iconBurst",
    "label": "Icon Burst",
    "section": "v12",
    "type": "burst",
    "rendererFamily": "decorative",
    "alternativeGroup": "celebration-burst",
    "dataMode": "sample",
    "requiresRealData": false,
    "iconName": "bulb",
    "tier": "core",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "IDEA"
      }
    ]
  },
  {
    "kind": "card3D",
    "label": "3D Card",
    "section": "v12",
    "type": "card3d",
    "rendererFamily": "offer",
    "alternativeGroup": null,
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "Pro Access"
      },
      {
        "key": "subtitle",
        "label": "Subtitle",
        "text": "All features unlocked"
      }
    ]
  },
  {
    "kind": "mapPin",
    "label": "Map Pin",
    "section": "v12",
    "type": "map",
    "rendererFamily": "device-ui",
    "alternativeGroup": null,
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "NEW DELHI"
      }
    ]
  },
  {
    "kind": "timelineSteps",
    "label": "Timeline",
    "section": "v12",
    "type": "timeline",
    "rendererFamily": "process",
    "alternativeGroup": "vertical-timeline",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "a",
        "label": "A",
        "text": "Plan"
      },
      {
        "key": "b",
        "label": "B",
        "text": "Shoot"
      },
      {
        "key": "c",
        "label": "C",
        "text": "Edit"
      },
      {
        "key": "d",
        "label": "D",
        "text": "Post"
      }
    ]
  },
  {
    "kind": "splitCompare",
    "label": "Split Compare (VS)",
    "section": "v12",
    "type": "split",
    "rendererFamily": "comparison",
    "alternativeGroup": "compare-vs",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "left",
        "label": "Left",
        "text": "Posting daily"
      },
      {
        "key": "right",
        "label": "Right",
        "text": "Planned hooks"
      }
    ]
  },
  {
    "kind": "beforeAfter",
    "label": "Before / After",
    "section": "v12",
    "type": "beforeAfter",
    "rendererFamily": "comparison",
    "alternativeGroup": null,
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": []
  },
  {
    "kind": "productShowcase",
    "label": "Product Showcase",
    "section": "v12",
    "type": "product",
    "rendererFamily": "offer",
    "alternativeGroup": null,
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "Growth Bundle"
      },
      {
        "key": "tag",
        "label": "Tag",
        "text": "NEW"
      }
    ]
  },
  {
    "kind": "twitterPost",
    "label": "X / Twitter Post",
    "section": "v13a",
    "type": "socialPost",
    "rendererFamily": "social-ui",
    "alternativeGroup": "social-post-card",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "send",
    "platformColor": "#1d9bf0",
    "tier": "core",
    "fields": [
      {
        "key": "handle",
        "label": "Handle",
        "text": "@rctrips"
      },
      {
        "key": "text",
        "label": "Text",
        "text": "Just hit 50K followers! Thank you for trusting us with your trips."
      }
    ]
  },
  {
    "kind": "linkedinPost",
    "label": "LinkedIn Post",
    "section": "v13a",
    "type": "socialPost",
    "rendererFamily": "social-ui",
    "alternativeGroup": "social-post-card",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "bag",
    "platformColor": "#0a66c2",
    "tier": "extended",
    "fields": [
      {
        "key": "handle",
        "label": "Handle",
        "text": "RC Trips"
      },
      {
        "key": "text",
        "label": "Text",
        "text": "Excited to announce our new Canton Fair delegation packages for 2026."
      }
    ]
  },
  {
    "kind": "facebookPost",
    "label": "Facebook Post",
    "section": "v13a",
    "type": "socialPost",
    "rendererFamily": "social-ui",
    "alternativeGroup": "social-post-card",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "send",
    "platformColor": "#1877f2",
    "tier": "extended",
    "fields": [
      {
        "key": "handle",
        "label": "Handle",
        "text": "RC Trips"
      },
      {
        "key": "text",
        "label": "Text",
        "text": "New tour packages are live now — link in bio!"
      }
    ]
  },
  {
    "kind": "tiktokCaption",
    "label": "TikTok Caption Card",
    "section": "v13a",
    "type": "socialPost",
    "rendererFamily": "social-ui",
    "alternativeGroup": "social-post-card",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "play",
    "platformColor": "#111111",
    "tier": "extended",
    "fields": [
      {
        "key": "handle",
        "label": "Handle",
        "text": "@rctrips"
      },
      {
        "key": "text",
        "label": "Text",
        "text": "POV: your first Canton Fair trip with us"
      }
    ]
  },
  {
    "kind": "pinterestPin",
    "label": "Pinterest Pin Card",
    "section": "v13a",
    "type": "socialPost",
    "rendererFamily": "social-ui",
    "alternativeGroup": "social-post-card",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "pin",
    "platformColor": "#e60023",
    "tier": "extended",
    "fields": [
      {
        "key": "handle",
        "label": "Handle",
        "text": "Travel Ideas"
      },
      {
        "key": "text",
        "label": "Text",
        "text": "Save this for your next Europe trip"
      }
    ]
  },
  {
    "kind": "telegramMessage",
    "label": "Telegram Message",
    "section": "v13a",
    "type": "toast",
    "rendererFamily": "social-ui",
    "alternativeGroup": "chat-notification",
    "dataMode": "sample",
    "requiresRealData": false,
    "iconName": "send",
    "tier": "extended",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "Telegram"
      },
      {
        "key": "message",
        "label": "Message",
        "text": "Your itinerary PDF has been sent"
      }
    ]
  },
  {
    "kind": "followerCount",
    "label": "Follower Count",
    "section": "v13a",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "social-count-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "target",
    "tier": "core",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "FOLLOWERS"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "24.5K"
      }
    ]
  },
  {
    "kind": "likeCount",
    "label": "Like Count",
    "section": "v13a",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "social-count-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "heart",
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "LIKES"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "8,412"
      }
    ]
  },
  {
    "kind": "shareCount",
    "label": "Share Count",
    "section": "v13a",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "social-count-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "share",
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "SHARES"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "1,204"
      }
    ]
  },
  {
    "kind": "saveCount",
    "label": "Save Count",
    "section": "v13a",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "social-count-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "bookmark",
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "SAVES"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "3,050"
      }
    ]
  },
  {
    "kind": "commentCount",
    "label": "Comment Count",
    "section": "v13a",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "social-count-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "comment",
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "COMMENTS"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "642"
      }
    ]
  },
  {
    "kind": "avatarGroupProof",
    "label": "Social Proof Avatars",
    "section": "v13a",
    "type": "avatarGroup",
    "rendererFamily": "trust",
    "alternativeGroup": "social-proof-avatars",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "12,000+ creators trust this"
      }
    ]
  },
  {
    "kind": "liveViewers",
    "label": "Live Viewers",
    "section": "v13a",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "social-count-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "bolt",
    "live": true,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "WATCHING NOW"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "1.2K"
      }
    ]
  },
  {
    "kind": "flashSale",
    "label": "Flash Sale",
    "section": "v13b",
    "type": "priceTag",
    "rendererFamily": "offer",
    "alternativeGroup": "offer-price",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "FLASH SALE"
      },
      {
        "key": "was",
        "label": "Was",
        "text": "₹35,000"
      },
      {
        "key": "now",
        "label": "Now",
        "text": "₹21,000"
      },
      {
        "key": "badge",
        "label": "Badge",
        "text": "24H ONLY"
      }
    ]
  },
  {
    "kind": "bundleDeal",
    "label": "Bundle Deal",
    "section": "v13b",
    "type": "priceTag",
    "rendererFamily": "offer",
    "alternativeGroup": "offer-price",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "BUNDLE DEAL"
      },
      {
        "key": "was",
        "label": "Was",
        "text": "₹64,000"
      },
      {
        "key": "now",
        "label": "Now",
        "text": "₹44,000"
      },
      {
        "key": "badge",
        "label": "Badge",
        "text": "SAVE 30%"
      }
    ]
  },
  {
    "kind": "freeShipping",
    "label": "Free Shipping Badge",
    "section": "v13b",
    "type": "badgeStamp",
    "rendererFamily": "badge",
    "alternativeGroup": "badge-trust-stamp",
    "dataMode": "sample",
    "requiresRealData": false,
    "badgeIcon": "truck",
    "tier": "extended",
    "fields": [
      {
        "key": "text",
        "label": "Text",
        "text": "FREE SHIPPING"
      }
    ]
  },
  {
    "kind": "bestSeller",
    "label": "Best Seller Badge",
    "section": "v13b",
    "type": "badgeStamp",
    "rendererFamily": "badge",
    "alternativeGroup": "badge-trust-stamp",
    "dataMode": "sample",
    "requiresRealData": false,
    "badgeIcon": "star",
    "tier": "extended",
    "fields": [
      {
        "key": "text",
        "label": "Text",
        "text": "BEST SELLER"
      }
    ]
  },
  {
    "kind": "limitedStock",
    "label": "Limited Stock",
    "section": "v13b",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "urgency-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "bolt",
    "live": true,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "ONLY LEFT"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "7 units"
      }
    ]
  },
  {
    "kind": "newArrival",
    "label": "New Arrival Badge",
    "section": "v13b",
    "type": "badgeStamp",
    "rendererFamily": "badge",
    "alternativeGroup": "badge-trust-stamp",
    "dataMode": "sample",
    "requiresRealData": false,
    "badgeIcon": "star",
    "tier": "extended",
    "fields": [
      {
        "key": "text",
        "label": "Text",
        "text": "NEW ARRIVAL"
      }
    ]
  },
  {
    "kind": "moneyBackGuarantee",
    "label": "Money Back Guarantee",
    "section": "v13b",
    "type": "badgeStamp",
    "rendererFamily": "badge",
    "alternativeGroup": "badge-trust-stamp",
    "dataMode": "sample",
    "requiresRealData": false,
    "badgeIcon": "shield",
    "tier": "extended",
    "fields": [
      {
        "key": "text",
        "label": "Text",
        "text": "MONEY BACK"
      }
    ]
  },
  {
    "kind": "freeTrialCard",
    "label": "Free Trial Card",
    "section": "v13b",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "urgency-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "target",
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "FREE TRIAL"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "14 DAYS"
      }
    ]
  },
  {
    "kind": "planComparison",
    "label": "Plan Comparison (Free vs Pro)",
    "section": "v13b",
    "type": "compareTable",
    "rendererFamily": "comparison",
    "alternativeGroup": null,
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "colA",
        "label": "Col A",
        "text": "Free"
      },
      {
        "key": "colB",
        "label": "Col B",
        "text": "Pro"
      },
      {
        "key": "f1",
        "label": "F1",
        "text": "Basic access"
      },
      {
        "key": "f2",
        "label": "F2",
        "text": "Priority support"
      },
      {
        "key": "f3",
        "label": "F3",
        "text": "Unlimited exports"
      }
    ]
  },
  {
    "kind": "cartSummary",
    "label": "Cart Summary Grid",
    "section": "v13b",
    "type": "statGrid",
    "rendererFamily": "stat-card",
    "alternativeGroup": "stat-grid-4up",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "gridIcons": [
      "bag",
      "chart",
      "target",
      "truck"
    ],
    "gridLabels": [
      "ITEMS",
      "TOTAL",
      "DISCOUNT",
      "DELIVERY"
    ],
    "gridVals": [
      3,
      8400,
      15,
      2
    ],
    "gridSuf": [
      "",
      "",
      "%",
      " days"
    ],
    "tier": "extended",
    "fields": [
      {
        "key": "v1",
        "label": "V1",
        "text": "3"
      },
      {
        "key": "v2",
        "label": "V2",
        "text": "₹8,400"
      },
      {
        "key": "v3",
        "label": "V3",
        "text": "15%"
      },
      {
        "key": "v4",
        "label": "V4",
        "text": "2 days"
      }
    ]
  },
  {
    "kind": "orderConfirmed",
    "label": "Order Confirmed Badge",
    "section": "v13b",
    "type": "badgeStamp",
    "rendererFamily": "badge",
    "alternativeGroup": "badge-trust-stamp",
    "dataMode": "sample",
    "requiresRealData": false,
    "badgeIcon": "check",
    "tier": "extended",
    "fields": [
      {
        "key": "text",
        "label": "Text",
        "text": "ORDER CONFIRMED"
      }
    ]
  },
  {
    "kind": "couponCode",
    "label": "Coupon Code Card",
    "section": "v13b",
    "type": "priceTag",
    "rendererFamily": "offer",
    "alternativeGroup": "offer-price",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "USE CODE"
      },
      {
        "key": "was",
        "label": "Was",
        "text": "Regular price"
      },
      {
        "key": "now",
        "label": "Now",
        "text": "SAVE20"
      },
      {
        "key": "badge",
        "label": "Badge",
        "text": "20% OFF"
      }
    ]
  },
  {
    "kind": "revenueGrowthChart",
    "label": "Revenue Growth Chart",
    "section": "v13b",
    "type": "barChart",
    "rendererFamily": "chart",
    "alternativeGroup": "bar-chart-metric",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "extended",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "QUARTERLY REVENUE"
      }
    ]
  },
  {
    "kind": "cpuUsageRing",
    "label": "CPU Usage Ring",
    "section": "v13c",
    "type": "ring",
    "rendererFamily": "progress",
    "alternativeGroup": "system-health-ring",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "ringPct": 0.45,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "CPU USAGE"
      }
    ]
  },
  {
    "kind": "batteryRing",
    "label": "Battery Ring",
    "section": "v13c",
    "type": "ring",
    "rendererFamily": "progress",
    "alternativeGroup": "system-health-ring",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "ringPct": 0.76,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "BATTERY"
      }
    ]
  },
  {
    "kind": "satisfactionRing",
    "label": "Satisfaction Ring",
    "section": "v13c",
    "type": "ring",
    "rendererFamily": "progress",
    "alternativeGroup": "quality-score-ring",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "ringPct": 0.91,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "SATISFACTION"
      }
    ]
  },
  {
    "kind": "npsScoreRing",
    "label": "NPS Score Ring",
    "section": "v13c",
    "type": "ring",
    "rendererFamily": "progress",
    "alternativeGroup": "quality-score-ring",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "ringPct": 0.72,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "NPS SCORE"
      }
    ]
  },
  {
    "kind": "accuracyRing",
    "label": "Accuracy Ring",
    "section": "v13c",
    "type": "ring",
    "rendererFamily": "progress",
    "alternativeGroup": "quality-score-ring",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "ringPct": 0.97,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "ACCURACY"
      }
    ]
  },
  {
    "kind": "uptimeRing",
    "label": "Uptime Ring",
    "section": "v13c",
    "type": "ring",
    "rendererFamily": "progress",
    "alternativeGroup": "system-health-ring",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "ringPct": 0.99,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "UPTIME"
      }
    ]
  },
  {
    "kind": "conversionRateStat",
    "label": "Conversion Rate Stat",
    "section": "v13c",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "performance-metric-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "target",
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "CONVERSION RATE"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "4.8%"
      }
    ]
  },
  {
    "kind": "bounceRateStat",
    "label": "Bounce Rate Stat",
    "section": "v13c",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "performance-metric-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "chart",
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "BOUNCE RATE"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "38%"
      }
    ]
  },
  {
    "kind": "sessionsLineChart",
    "label": "Sessions Line Chart",
    "section": "v13c",
    "type": "lineChart",
    "rendererFamily": "chart",
    "alternativeGroup": "line-chart-trend",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "WEEKLY SESSIONS"
      }
    ]
  },
  {
    "kind": "clicksBarChart",
    "label": "Ad Clicks Bar Chart",
    "section": "v13c",
    "type": "barChart",
    "rendererFamily": "chart",
    "alternativeGroup": "bar-chart-metric",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "core",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "AD CLICKS"
      }
    ]
  },
  {
    "kind": "impressionsKpi",
    "label": "Impressions KPI",
    "section": "v13c",
    "type": "kpiCard",
    "rendererFamily": "stat-card",
    "alternativeGroup": "kpi-tile",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "chart",
    "target": 1.2,
    "suffix": "M",
    "decimals": 1,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "IMPRESSIONS"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "1.2M"
      },
      {
        "key": "change",
        "label": "Change",
        "text": "24%"
      }
    ]
  },
  {
    "kind": "ctrStatGrid",
    "label": "CTR Stat Grid",
    "section": "v13c",
    "type": "statGrid",
    "rendererFamily": "stat-card",
    "alternativeGroup": "stat-grid-4up",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "gridIcons": [
      "target",
      "chart",
      "trend",
      "bag"
    ],
    "gridLabels": [
      "CLICKS",
      "IMPR.",
      "CTR",
      "SPEND"
    ],
    "gridVals": [
      4.2,
      88,
      4.8,
      12500
    ],
    "gridSuf": [
      "K",
      "K",
      "%",
      ""
    ],
    "tier": "extended",
    "fields": [
      {
        "key": "v1",
        "label": "V1",
        "text": "4.2K"
      },
      {
        "key": "v2",
        "label": "V2",
        "text": "88K"
      },
      {
        "key": "v3",
        "label": "V3",
        "text": "4.8%"
      },
      {
        "key": "v4",
        "label": "V4",
        "text": "₹12,500"
      }
    ]
  },
  {
    "kind": "performanceScoreBadge",
    "label": "Performance Score Badge",
    "section": "v13c",
    "type": "badgeStamp",
    "rendererFamily": "badge",
    "alternativeGroup": "badge-trust-stamp",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "badgeIcon": "star",
    "tier": "extended",
    "fields": [
      {
        "key": "text",
        "label": "Text",
        "text": "TOP 1%"
      }
    ]
  },
  {
    "kind": "revenueCounter",
    "label": "Revenue Counter",
    "section": "v13d",
    "type": "currencyStat",
    "rendererFamily": "stat-card",
    "alternativeGroup": "currency-counter",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "bag",
    "target": 284500,
    "prefix": "₹",
    "tier": "core",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "TOTAL REVENUE"
      }
    ]
  },
  {
    "kind": "profitMarginStat",
    "label": "Profit Margin Stat",
    "section": "v13d",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "money-value-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "trend",
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "PROFIT MARGIN"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "32%"
      }
    ]
  },
  {
    "kind": "roiCounter",
    "label": "ROI Counter",
    "section": "v13d",
    "type": "currencyStat",
    "rendererFamily": "stat-card",
    "alternativeGroup": "currency-counter",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "trend",
    "target": 3.4,
    "suffix": "x",
    "decimals": 1,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "ROI"
      }
    ]
  },
  {
    "kind": "savingsCounter",
    "label": "Savings Counter",
    "section": "v13d",
    "type": "currencyStat",
    "rendererFamily": "stat-card",
    "alternativeGroup": "currency-counter",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "bag",
    "target": 12000,
    "prefix": "₹",
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "YOU SAVED"
      }
    ]
  },
  {
    "kind": "investmentGrowthChart",
    "label": "Investment Growth Chart",
    "section": "v13d",
    "type": "lineChart",
    "rendererFamily": "chart",
    "alternativeGroup": "line-chart-trend",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "extended",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "PORTFOLIO GROWTH"
      }
    ]
  },
  {
    "kind": "walletBalance",
    "label": "Wallet Balance",
    "section": "v13d",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "money-value-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "bag",
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "WALLET BALANCE"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "₹8,240"
      }
    ]
  },
  {
    "kind": "invoicePaidNotice",
    "label": "Invoice Paid Notice",
    "section": "v13d",
    "type": "toast",
    "rendererFamily": "social-ui",
    "alternativeGroup": "chat-notification",
    "dataMode": "sample",
    "requiresRealData": false,
    "iconName": "check",
    "tier": "extended",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "Invoice #1042"
      },
      {
        "key": "message",
        "label": "Message",
        "text": "Payment received in full"
      }
    ]
  },
  {
    "kind": "emiCard",
    "label": "EMI Card",
    "section": "v13d",
    "type": "kpiCard",
    "rendererFamily": "stat-card",
    "alternativeGroup": "kpi-tile",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "bag",
    "target": 4250,
    "prefix": "₹",
    "suffix": "",
    "decimals": 0,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "MONTHLY EMI"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "₹4,250"
      },
      {
        "key": "change",
        "label": "Change",
        "text": ""
      }
    ]
  },
  {
    "kind": "expenseBreakdownPie",
    "label": "Expense Breakdown Pie",
    "section": "v13d",
    "type": "pieChart",
    "rendererFamily": "chart",
    "alternativeGroup": "pie-donut",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "legendA": "Expenses",
    "legendB": "Savings",
    "pctA": 70,
    "tier": "extended",
    "fields": []
  },
  {
    "kind": "discountCalculator",
    "label": "Discount Calculator",
    "section": "v13d",
    "type": "priceTag",
    "rendererFamily": "offer",
    "alternativeGroup": "offer-price",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "YOU SAVE"
      },
      {
        "key": "was",
        "label": "Was",
        "text": "₹15,000"
      },
      {
        "key": "now",
        "label": "Now",
        "text": "₹6,000"
      },
      {
        "key": "badge",
        "label": "Badge",
        "text": "60% OFF"
      }
    ]
  },
  {
    "kind": "cryptoTicker",
    "label": "Crypto Price Ticker",
    "section": "v13d",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "money-value-stat",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "trend",
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "BTC/INR"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "₹58.2L"
      }
    ]
  },
  {
    "kind": "taxBreakdownChart",
    "label": "Tax Breakdown Chart",
    "section": "v13d",
    "type": "barChart",
    "rendererFamily": "chart",
    "alternativeGroup": "bar-chart-metric",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "extended",
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "text": "TAX BREAKDOWN"
      }
    ]
  },
  {
    "kind": "orderTrackingSteps",
    "label": "Order Tracking Steps",
    "section": "v13e",
    "type": "timeline",
    "rendererFamily": "process",
    "alternativeGroup": "vertical-timeline",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "a",
        "label": "A",
        "text": "Placed"
      },
      {
        "key": "b",
        "label": "B",
        "text": "Packed"
      },
      {
        "key": "c",
        "label": "C",
        "text": "Shipped"
      },
      {
        "key": "d",
        "label": "D",
        "text": "Delivered"
      }
    ]
  },
  {
    "kind": "funnelSteps",
    "label": "Marketing Funnel Steps",
    "section": "v13e",
    "type": "timeline",
    "rendererFamily": "process",
    "alternativeGroup": "vertical-timeline",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "a",
        "label": "A",
        "text": "Awareness"
      },
      {
        "key": "b",
        "label": "B",
        "text": "Interest"
      },
      {
        "key": "c",
        "label": "C",
        "text": "Decision"
      },
      {
        "key": "d",
        "label": "D",
        "text": "Action"
      }
    ]
  },
  {
    "kind": "onboardingSteps",
    "label": "Onboarding Steps",
    "section": "v13e",
    "type": "timeline",
    "rendererFamily": "process",
    "alternativeGroup": "vertical-timeline",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "a",
        "label": "A",
        "text": "Sign up"
      },
      {
        "key": "b",
        "label": "B",
        "text": "Verify"
      },
      {
        "key": "c",
        "label": "C",
        "text": "Setup"
      },
      {
        "key": "d",
        "label": "D",
        "text": "Launch"
      }
    ]
  },
  {
    "kind": "recipeSteps",
    "label": "Recipe Steps",
    "section": "v13e",
    "type": "timeline",
    "rendererFamily": "process",
    "alternativeGroup": "vertical-timeline",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "a",
        "label": "A",
        "text": "Prep"
      },
      {
        "key": "b",
        "label": "B",
        "text": "Cook"
      },
      {
        "key": "c",
        "label": "C",
        "text": "Plate"
      },
      {
        "key": "d",
        "label": "D",
        "text": "Serve"
      }
    ]
  },
  {
    "kind": "workoutSteps",
    "label": "Workout Steps",
    "section": "v13e",
    "type": "timeline",
    "rendererFamily": "process",
    "alternativeGroup": "vertical-timeline",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "a",
        "label": "A",
        "text": "Warm-up"
      },
      {
        "key": "b",
        "label": "B",
        "text": "Main set"
      },
      {
        "key": "c",
        "label": "C",
        "text": "Cooldown"
      },
      {
        "key": "d",
        "label": "D",
        "text": "Stretch"
      }
    ]
  },
  {
    "kind": "hiringSteps",
    "label": "Hiring Process Steps",
    "section": "v13e",
    "type": "timeline",
    "rendererFamily": "process",
    "alternativeGroup": "vertical-timeline",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "a",
        "label": "A",
        "text": "Apply"
      },
      {
        "key": "b",
        "label": "B",
        "text": "Interview"
      },
      {
        "key": "c",
        "label": "C",
        "text": "Offer"
      },
      {
        "key": "d",
        "label": "D",
        "text": "Onboard"
      }
    ]
  },
  {
    "kind": "orderTrackingHorizontal",
    "label": "Order Tracking (Horizontal)",
    "section": "v13e",
    "type": "progressSteps",
    "rendererFamily": "process",
    "alternativeGroup": "horizontal-stepper",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "a",
        "label": "A",
        "text": "Ordered"
      },
      {
        "key": "b",
        "label": "B",
        "text": "Packed"
      },
      {
        "key": "c",
        "label": "C",
        "text": "Out for delivery"
      },
      {
        "key": "d",
        "label": "D",
        "text": "Delivered"
      }
    ]
  },
  {
    "kind": "courseProgressSteps",
    "label": "Course Progress (Horizontal)",
    "section": "v13e",
    "type": "progressSteps",
    "rendererFamily": "process",
    "alternativeGroup": "horizontal-stepper",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "a",
        "label": "A",
        "text": "Module 1"
      },
      {
        "key": "b",
        "label": "B",
        "text": "Module 2"
      },
      {
        "key": "c",
        "label": "C",
        "text": "Module 3"
      },
      {
        "key": "d",
        "label": "D",
        "text": "Module 4"
      }
    ]
  },
  {
    "kind": "checklistLaunch",
    "label": "Launch Checklist",
    "section": "v13e",
    "type": "checklist",
    "rendererFamily": "process",
    "alternativeGroup": "checklist-steps",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "item1",
        "label": "Item1",
        "text": "Domain ready"
      },
      {
        "key": "item2",
        "label": "Item2",
        "text": "Content uploaded"
      },
      {
        "key": "item3",
        "label": "Item3",
        "text": "Payment tested"
      }
    ]
  },
  {
    "kind": "checklistTravel",
    "label": "Travel Checklist",
    "section": "v13e",
    "type": "checklist",
    "rendererFamily": "process",
    "alternativeGroup": "checklist-steps",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "item1",
        "label": "Item1",
        "text": "Passport"
      },
      {
        "key": "item2",
        "label": "Item2",
        "text": "Tickets"
      },
      {
        "key": "item3",
        "label": "Item3",
        "text": "Hotel booked"
      }
    ]
  },
  {
    "kind": "dailyRoutineChecklist",
    "label": "Daily Routine Checklist",
    "section": "v13e",
    "type": "checklist",
    "rendererFamily": "process",
    "alternativeGroup": "checklist-steps",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "item1",
        "label": "Item1",
        "text": "Post reel"
      },
      {
        "key": "item2",
        "label": "Item2",
        "text": "Reply DMs"
      },
      {
        "key": "item3",
        "label": "Item3",
        "text": "Check analytics"
      }
    ]
  },
  {
    "kind": "goalProgressBar",
    "label": "Monthly Goal Progress",
    "section": "v13e",
    "type": "progressBar",
    "rendererFamily": "progress",
    "alternativeGroup": "device-status",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "MONTHLY GOAL"
      }
    ]
  },
  {
    "kind": "laptopMockup",
    "label": "Laptop Mockup",
    "section": "v13f",
    "type": "device",
    "rendererFamily": "device-ui",
    "alternativeGroup": "device-mockup",
    "dataMode": "sample",
    "requiresRealData": false,
    "deviceShape": "laptop",
    "tier": "core",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "Manage from desktop too"
      }
    ]
  },
  {
    "kind": "tabletMockup",
    "label": "Tablet Mockup",
    "section": "v13f",
    "type": "device",
    "rendererFamily": "device-ui",
    "alternativeGroup": "device-mockup",
    "dataMode": "sample",
    "requiresRealData": false,
    "deviceShape": "tablet",
    "tier": "extended",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "Optimized for tablets"
      }
    ]
  },
  {
    "kind": "smartwatchMockup",
    "label": "Smartwatch Mockup",
    "section": "v13f",
    "type": "device",
    "rendererFamily": "device-ui",
    "alternativeGroup": "device-mockup",
    "dataMode": "sample",
    "requiresRealData": false,
    "deviceShape": "watch",
    "tier": "extended",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "Track on your wrist"
      }
    ]
  },
  {
    "kind": "browserMockup",
    "label": "Browser Window Mockup",
    "section": "v13f",
    "type": "device",
    "rendererFamily": "device-ui",
    "alternativeGroup": "device-mockup",
    "dataMode": "sample",
    "requiresRealData": false,
    "deviceShape": "browser",
    "tier": "extended",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "Works in any browser"
      }
    ]
  },
  {
    "kind": "qrScanCard",
    "label": "QR Code Card",
    "section": "v13f",
    "type": "qrScan",
    "rendererFamily": "device-ui",
    "alternativeGroup": null,
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "Scan to open"
      }
    ]
  },
  {
    "kind": "wifiConnectedCard",
    "label": "Wi-Fi Connected",
    "section": "v13f",
    "type": "statSingle",
    "rendererFamily": "stat-card",
    "alternativeGroup": "device-status",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "wifi",
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "WI-FI CONNECTED"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "Strong"
      }
    ]
  },
  {
    "kind": "bluetoothPairCard",
    "label": "Bluetooth Paired",
    "section": "v13f",
    "type": "toggle",
    "rendererFamily": "toggle",
    "alternativeGroup": "toggle-state",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "BLUETOOTH: PAIRED"
      }
    ]
  },
  {
    "kind": "cloudSyncCard",
    "label": "Cloud Synced Ring",
    "section": "v13f",
    "type": "ring",
    "rendererFamily": "progress",
    "alternativeGroup": "publish-complete",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "ringPct": 1,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "SYNCED"
      }
    ]
  },
  {
    "kind": "downloadProgressCard",
    "label": "Download Progress",
    "section": "v13f",
    "type": "progressBar",
    "rendererFamily": "progress",
    "alternativeGroup": "device-status",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "DOWNLOADING UPDATE"
      }
    ]
  },
  {
    "kind": "appIconGrid",
    "label": "App Icon Grid",
    "section": "v13f",
    "type": "grid4",
    "rendererFamily": "process",
    "alternativeGroup": "grid-2x2-generic",
    "dataMode": "sample",
    "requiresRealData": false,
    "gridIcons": [
      "grid",
      "bag",
      "chat",
      "target"
    ],
    "tier": "extended",
    "fields": [
      {
        "key": "a",
        "label": "A",
        "text": "App 1"
      },
      {
        "key": "b",
        "label": "B",
        "text": "App 2"
      },
      {
        "key": "c",
        "label": "C",
        "text": "App 3"
      },
      {
        "key": "d",
        "label": "D",
        "text": "App 4"
      }
    ]
  },
  {
    "kind": "darkModeToggle",
    "label": "Dark Mode Toggle",
    "section": "v13f",
    "type": "toggle",
    "rendererFamily": "toggle",
    "alternativeGroup": "toggle-state",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "DARK MODE: ON"
      }
    ]
  },
  {
    "kind": "notificationsToggle",
    "label": "Notifications Toggle",
    "section": "v13f",
    "type": "toggle",
    "rendererFamily": "toggle",
    "alternativeGroup": "toggle-state",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "NOTIFICATIONS: ON"
      }
    ]
  },
  {
    "kind": "customerTestimonial1",
    "label": "Customer Testimonial #1",
    "section": "v13g",
    "type": "quote",
    "rendererFamily": "editorial",
    "alternativeGroup": "testimonial-quote",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "showStars": true,
    "tier": "extended",
    "fields": [
      {
        "key": "quote",
        "label": "Quote",
        "text": "This tool saved me hours every single week."
      },
      {
        "key": "author",
        "label": "Author",
        "text": "VERIFIED CUSTOMER"
      }
    ]
  },
  {
    "kind": "customerTestimonial2",
    "label": "Customer Testimonial #2",
    "section": "v13g",
    "type": "quote",
    "rendererFamily": "editorial",
    "alternativeGroup": "testimonial-quote",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "showStars": true,
    "tier": "extended",
    "fields": [
      {
        "key": "quote",
        "label": "Quote",
        "text": "Our bookings doubled within a month."
      },
      {
        "key": "author",
        "label": "Author",
        "text": "RC TRIPS CLIENT"
      }
    ]
  },
  {
    "kind": "founderQuote",
    "label": "Founder Quote",
    "section": "v13g",
    "type": "quote",
    "rendererFamily": "editorial",
    "alternativeGroup": "brand-voice-quote",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "quote",
        "label": "Quote",
        "text": "We built this so every small team could travel like a pro."
      },
      {
        "key": "author",
        "label": "Author",
        "text": "FOUNDER, RC TRIPS"
      }
    ]
  },
  {
    "kind": "caseStudyResult",
    "label": "Case Study Result",
    "section": "v13g",
    "type": "kpiCard",
    "rendererFamily": "stat-card",
    "alternativeGroup": "kpi-tile",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "trend",
    "target": 186,
    "suffix": "%",
    "decimals": 0,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "CLIENT RESULT"
      },
      {
        "key": "value",
        "label": "Value",
        "text": "+186%"
      },
      {
        "key": "change",
        "label": "Change",
        "text": "in 30 days"
      }
    ]
  },
  {
    "kind": "starRatingBig",
    "label": "Big Star Rating",
    "section": "v13g",
    "type": "starRatingCard",
    "rendererFamily": "trust",
    "alternativeGroup": "star-rating",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "extended",
    "fields": [
      {
        "key": "value",
        "label": "Value",
        "text": "4.9"
      },
      {
        "key": "sub",
        "label": "Sub",
        "text": "based on 2,300 reviews"
      }
    ]
  },
  {
    "kind": "trustedByRow",
    "label": "Trusted By Row",
    "section": "v13g",
    "type": "avatarGroup",
    "rendererFamily": "trust",
    "alternativeGroup": "social-proof-avatars",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "extended",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "Trusted by 500+ businesses"
      }
    ]
  },
  {
    "kind": "verifiedReviewBadge",
    "label": "Verified Review Badge",
    "section": "v13g",
    "type": "badgeStamp",
    "rendererFamily": "badge",
    "alternativeGroup": "badge-trust-stamp",
    "dataMode": "sample",
    "requiresRealData": false,
    "badgeIcon": "check",
    "tier": "extended",
    "fields": [
      {
        "key": "text",
        "label": "Text",
        "text": "VERIFIED REVIEW"
      }
    ]
  },
  {
    "kind": "expertApprovedBadge",
    "label": "Expert Approved Badge",
    "section": "v13g",
    "type": "badgeStamp",
    "rendererFamily": "badge",
    "alternativeGroup": "badge-trust-stamp",
    "dataMode": "sample",
    "requiresRealData": false,
    "badgeIcon": "star",
    "tier": "extended",
    "fields": [
      {
        "key": "text",
        "label": "Text",
        "text": "EXPERT APPROVED"
      }
    ]
  },
  {
    "kind": "teamMemberBio",
    "label": "Team Member Bio",
    "section": "v13g",
    "type": "quote",
    "rendererFamily": "editorial",
    "alternativeGroup": "brand-voice-quote",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "quote",
        "label": "Quote",
        "text": "Head of Operations, 6 years in trade-fair travel"
      },
      {
        "key": "author",
        "label": "Author",
        "text": "PRIYA SHARMA"
      }
    ]
  },
  {
    "kind": "clientLogosGrid",
    "label": "Client Logos Grid",
    "section": "v13g",
    "type": "grid4",
    "rendererFamily": "process",
    "alternativeGroup": "grid-2x2-generic",
    "dataMode": "sample",
    "requiresRealData": false,
    "gridIcons": [
      "bag",
      "shield",
      "target",
      "grid"
    ],
    "tier": "extended",
    "fields": [
      {
        "key": "a",
        "label": "A",
        "text": "Brand A"
      },
      {
        "key": "b",
        "label": "B",
        "text": "Brand B"
      },
      {
        "key": "c",
        "label": "C",
        "text": "Brand C"
      },
      {
        "key": "d",
        "label": "D",
        "text": "Brand D"
      }
    ]
  },
  {
    "kind": "fiveStarUnboxing",
    "label": "5-Star Unboxing Quote",
    "section": "v13g",
    "type": "starRatingCard",
    "rendererFamily": "trust",
    "alternativeGroup": "star-rating",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "tier": "extended",
    "fields": [
      {
        "key": "value",
        "label": "Value",
        "text": "5.0"
      },
      {
        "key": "sub",
        "label": "Sub",
        "text": "\"Exceeded expectations\""
      }
    ]
  },
  {
    "kind": "warrantyBadge",
    "label": "Warranty Badge",
    "section": "v13g",
    "type": "badgeStamp",
    "rendererFamily": "badge",
    "alternativeGroup": "badge-trust-stamp",
    "dataMode": "sample",
    "requiresRealData": false,
    "badgeIcon": "shield",
    "tier": "extended",
    "fields": [
      {
        "key": "text",
        "label": "Text",
        "text": "2 YEAR WARRANTY"
      }
    ]
  },
  {
    "kind": "confettiBurst",
    "label": "Confetti Burst",
    "section": "v13h",
    "type": "confettiBurst",
    "rendererFamily": "decorative",
    "alternativeGroup": "celebration-burst",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "CONGRATULATIONS"
      }
    ]
  },
  {
    "kind": "fireStreak",
    "label": "Fire Streak",
    "section": "v13h",
    "type": "emojiPop",
    "rendererFamily": "decorative",
    "alternativeGroup": "reaction-emoji-pop",
    "dataMode": "sample",
    "requiresRealData": false,
    "iconName": "fire",
    "tier": "extended",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "ON FIRE"
      }
    ]
  },
  {
    "kind": "trophyPop",
    "label": "Trophy Pop",
    "section": "v13h",
    "type": "emojiPop",
    "rendererFamily": "decorative",
    "alternativeGroup": "reaction-emoji-pop",
    "dataMode": "sample",
    "requiresRealData": false,
    "iconName": "trophy",
    "tier": "extended",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "YOU DID IT"
      }
    ]
  },
  {
    "kind": "heartReact",
    "label": "Heart Reaction",
    "section": "v13h",
    "type": "emojiPop",
    "rendererFamily": "decorative",
    "alternativeGroup": "reaction-emoji-pop",
    "dataMode": "sample",
    "requiresRealData": false,
    "iconName": "heart",
    "tier": "extended",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "LOVED BY FANS"
      }
    ]
  },
  {
    "kind": "thumbsUpPop",
    "label": "Thumbs Up Pop",
    "section": "v13h",
    "type": "emojiPop",
    "rendererFamily": "decorative",
    "alternativeGroup": "reaction-emoji-pop",
    "dataMode": "sample",
    "requiresRealData": false,
    "iconName": "thumbsUp",
    "tier": "extended",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "APPROVED"
      }
    ]
  },
  {
    "kind": "clapPop",
    "label": "Clap Pop",
    "section": "v13h",
    "type": "emojiPop",
    "rendererFamily": "decorative",
    "alternativeGroup": "reaction-emoji-pop",
    "dataMode": "sample",
    "requiresRealData": false,
    "iconName": "clap",
    "tier": "extended",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "WELL DONE"
      }
    ]
  },
  {
    "kind": "fireworksBurst",
    "label": "Fireworks Burst",
    "section": "v13h",
    "type": "burst",
    "rendererFamily": "decorative",
    "alternativeGroup": "celebration-burst",
    "dataMode": "sample",
    "requiresRealData": false,
    "iconName": "star",
    "tier": "extended",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "CELEBRATE"
      }
    ]
  },
  {
    "kind": "giftReveal",
    "label": "Gift Reveal",
    "section": "v13h",
    "type": "emojiPop",
    "rendererFamily": "decorative",
    "alternativeGroup": "reaction-emoji-pop",
    "dataMode": "sample",
    "requiresRealData": false,
    "iconName": "gift",
    "tier": "extended",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "SPECIAL GIFT"
      }
    ]
  },
  {
    "kind": "milestoneSparkle",
    "label": "Milestone Sparkle",
    "section": "v13h",
    "type": "sparkle",
    "rendererFamily": "decorative",
    "alternativeGroup": "celebration-burst",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": []
  },
  {
    "kind": "sweepBanner",
    "label": "Light Sweep Banner",
    "section": "v13h",
    "type": "sweepBanner",
    "rendererFamily": "typography",
    "alternativeGroup": "title-card-statement",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "extended",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "GO VIRAL"
      }
    ]
  },
  {
    "kind": "neonGlowText",
    "label": "Bold Statement Text",
    "section": "v13h",
    "type": "neonGlowText",
    "rendererFamily": "typography",
    "alternativeGroup": "title-card-statement",
    "dataMode": "sample",
    "requiresRealData": false,
    "tier": "core",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "TRENDING NOW"
      }
    ]
  },
  {
    "kind": "milestoneCountUp",
    "label": "Milestone Count-Up",
    "section": "v13h",
    "type": "counterUp",
    "rendererFamily": "stat-card",
    "alternativeGroup": "counter-milestone",
    "dataMode": "requires-script-data",
    "requiresRealData": true,
    "iconName": "star",
    "target": 100000,
    "tier": "extended",
    "fields": [
      {
        "key": "label",
        "label": "Label",
        "text": "MILESTONE REACHED"
      }
    ]
  },
  {
    "kind": "thankYouCard",
    "label": "Thank You Card",
    "section": "v13h",
    "type": "emojiPop",
    "rendererFamily": "decorative",
    "alternativeGroup": "reaction-emoji-pop",
    "dataMode": "sample",
    "requiresRealData": false,
    "iconName": "pray",
    "tier": "extended",
    "fields": [
      {
        "key": "caption",
        "label": "Caption",
        "text": "THANK YOU"
      }
    ]
  }
];
export default visualData;
