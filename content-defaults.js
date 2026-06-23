/* ============================================================
   KAMAL JEWELLERS — default content (single source of truth)
   Loaded by BOTH index.html (the site) and admin.html (editor).
   The admin panel saves overrides to Supabase; the site merges
   those over these defaults. To change the live site, use the
   admin panel — not this file.
   ============================================================ */
window.KAMAL_DEFAULTS = {
  // SEO — what Google & social shares show
  seo:{
    title:"Kamal Jewellers — Bridal, Kundan & Polki Jewellery · Sadar Bazar, Delhi",
    description:"Kamal Jewellers, Sadar Bazar, Delhi. Handcrafted bridal, kundan & polki, statement earrings and the viral pieces breaking the internet — made to bring out your inner radiance."
  },
  // Top announcement strip — flip on for launches, festivals, offers
  announcement:{
    enabled:false,
    text:"✦ Now open in Sadar Bazar — visit us for the new bridal season",
    link:""
  },
  hero:{
    eyebrow:"Est. in the heart of Old Delhi",
    title:"Worn like water,",
    titleEm:"treasured like time.",
    sub:"Handcrafted bridal, kundan & polki, and the pieces breaking the internet — each one made to bring out your inner radiance."
  },
  intro:{
    text:"We believe jewellery should move with you — catching light like ripples on still water, alive against the skin, never static, never ordinary.",
    highlight:"move with you"
  },
  instagram:"https://linktr.ee/kamaljewellers_instagram",
  contact:{
    addressHtml:"132, Main Road, Sadar Bazar,<br/>Delhi — 110006",
    phone1:"+91 99999 25670",
    phone2:"+91 98119 07365",
    whatsapp:"+91 99999 25670",
    hours:"Mon – Sat · 11 AM – 8 PM",
    instaLabel:"@kamaljewellers · Instagram ↗",
    mapUrl:"https://www.google.com/maps/search/Kamal+Jewellers/@28.6531,77.2095,17z",
    footerBrand:"Where heritage craftsmanship meets the pieces everyone's saving on their feeds. Crafted from fine materials to bring out your inner radiance."
  },
  reviews:[
    {t:"The quality and creativity are flawless — one can see the care and detail in every part.", w:"Verified Customer"},
    {t:"Excellent quality and an incredibly wide variety of beautiful imitation jewellery.", w:"Verified Customer"},
    {t:"Such an enjoyable shopping experience with wonderful customer service.", w:"Verified Customer"}
  ],
  // Each collection's `images` entries are objects: { url, title, text, side }
  // (side: "" auto-alternate | "left" | "right" — which side the text sits on).
  // Plain URL strings from older saves are still accepted and auto-upgraded.
  collections:[
    {id:"western", name:"Western Jewellery", tag:"Effortless modern lines",
     desc:"Sleek, contemporary silhouettes for the everyday icon.",
     lede:"Minimal yet magnetic — pieces designed for boardrooms, brunches and the long way home. Crafted from fine materials to bring out your inner radiance, every line is drawn to flatter the modern silhouette.",
     c1:"#2a2e33",c2:"#0d0f12",images:[]},
    {id:"bridal", name:"Bridal Elegance", tag:"For the day you remember forever",
     desc:"Heirloom-worthy sets that carry a lifetime of meaning.",
     lede:"The weight of tradition, the lightness of love. Each bridal suite is layered like a ceremony itself — gold upon gold, pearl upon pearl — built to be photographed, remembered, and passed down.",
     c1:"#5a1626",c2:"#1a0a0e",images:[]},
    {id:"kundan", name:"Kundan & Polki Sets", tag:"Uncut brilliance",
     desc:"The ancient art of glass-set gold, reborn.",
     lede:"Polki keeps the diamond raw and honest; kundan frames it in mirror-bright gold. Together they hold light the way still water holds the sky — quietly, completely.",
     c1:"#6b5418",c2:"#19130a",images:[]},
    {id:"earrings", name:"Statement Earrings", tag:"Let them do the talking",
     desc:"Chandbalis, jhumkas and sculptural drops.",
     lede:"From a whisper of a stud to a cascade that grazes the shoulder — earrings that frame the face and finish the story. Movement is the point: they sway, they catch, they shimmer.",
     c1:"#33491f",c2:"#0f150a",images:[]},
    {id:"rings", name:"Royal Rings", tag:"Worn like a crown, for the hand",
     desc:"Cocktail stones and regal bands.",
     lede:"A single ring can change a posture. These are made to be noticed across a room — generous stones, architectural settings, and gold with the depth of late-afternoon sun.",
     c1:"#4a2f12",c2:"#160d06",images:[]},
    {id:"bracelets", name:"Antique Bracelets", tag:"Time-worn warmth",
     desc:"Hand-finished kadas with old-world soul.",
     lede:"Oxidised, textured, deliberately imperfect — antique finishes that feel inherited, not bought. They stack, they layer, they tell the kind of story that takes generations to write.",
     c1:"#3d3322",c2:"#13100a",images:[]},
    {id:"viral", name:"Viral Reel Looks", tag:"The ones you keep saving",
     desc:"Curated trending pieces, straight off the feed.",
     lede:"The exact looks lighting up your reels — hand-picked, in stock, and ready before the trend fades. If it's everywhere right now, it's probably here, waiting.",
     c1:"#5a2348",c2:"#160a13",images:[]},
    {id:"popculture", name:"Pop-Culture Inspired", tag:"Screen to skin",
     desc:"Pieces echoing the moments everyone's talking about.",
     lede:"Inspired by the films, the music, the moments — wearable nods to the culture you love, reinterpreted in gold and stone with a wink and a whole lot of craft.",
     c1:"#1f3d4a",c2:"#0a1316",images:[]},
    {id:"mangalsutra", name:"Designer Mangalsutras", tag:"Sacred, reimagined",
     desc:"Tradition rewritten for the modern wearer.",
     lede:"The thread that binds, drawn anew — slimmer chains, contemporary pendants, everyday-wearable sanctity. A vow you'll actually want to wear, every single day.",
     c1:"#2a1633",c2:"#0d0712",images:[]},
    {id:"hair", name:"Luxury Hair Accessories", tag:"Crown the look",
     desc:"Maang tikkas, pins and bridal headpieces.",
     lede:"The finishing flourish — pieces that turn an updo into an entrance. Light enough to forget, brilliant enough to remember, made to catch the light with every turn of the head.",
     c1:"#4a3a12",c2:"#161106",images:[]}
  ]
};
