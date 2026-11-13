export type CategorySlug =
  | "men"
  | "women"
  | "kids"
  | "co-ord-sets"
  | "full-sleeve"
  | "new-arrivals";

export type ProductDetails = {
  category: string;
  style: string;
  pattern: string;
  type: string;
  fit: string;
  neck: string;
  bottom: string;
  material: string;
};

export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified?: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  priceMin: number;
  priceMax: number;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  colors: string[];
  sizes: string[];
  categories: CategorySlug[];
  badge?: "#1 Bestseller" | "NEW" | "Sale";
  description: string;
  details: ProductDetails;
  reviews: ProductReview[];
  bestseller?: boolean;
  newArrival?: boolean;
};

export const categories: {
  slug: CategorySlug;
  label: string;
  image: string;
  icon?: "flame";
}[] = [
  { slug: "men", label: "Men", image: "/images/products/cobra.webp" },
  { slug: "women", label: "Women", image: "/images/products/cheetah.webp" },
  {
    slug: "co-ord-sets",
    label: "Co-ord Sets",
    image: "/images/products/scarlet-macaw.webp",
  },
  {
    slug: "full-sleeve",
    label: "Full Sleeve",
    image: "/images/products/grizzly-bear.webp",
  },
  {
    slug: "new-arrivals",
    label: "New Arrivals",
    image: "/images/products/peacock.webp",
    icon: "flame",
  },
];

const baseDetails = (
  overrides: Partial<ProductDetails> & Pick<ProductDetails, "pattern" | "category">
): ProductDetails => ({
  style: "Casual / Fashion / Resort Wear",
  type: "Full Sleeve",
  fit: "Relaxed Fit",
  neck: "Cuban Collar",
  bottom: "Straight Fit Trousers",
  material: "Premium artificial silk blend",
  ...overrides,
});

export const products: Product[] = [
  {
    id: "1",
    slug: "indian-ringneck-parrot-set",
    name: "Indian Ringneck Parrot Set",
    priceMin: 51,
    priceMax: 140,
    rating: 4.8,
    reviewCount: 128,
    image: "/images/products/parrot.jpg",
    images: ["/images/products/parrot.jpg", "/images/products/african-grey.webp"],
    colors: ["#1a5c3a", "#c45c26", "#2c2c2c"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    categories: ["men", "co-ord-sets", "full-sleeve"],
    description:
      "Inspired by the vivid intelligence of the Indian Ringneck, this statement co-ord captures electric plumage energy in a refined, wearable silhouette. Feather-print panels and a striking hem graphic turn every step into a runway moment — cut in premium natural fabric for all-day ease. Built for the bold who refuse to blend in. Every Tigerteeh purchase helps fund animal rescue, care, and cage-free sanctuaries.",
    details: baseDetails({
      category: "Men’s Co-Ord Set",
      pattern: "Indian Ringneck Parrot Inspired Print",
      material: "Premium natural fabric blend",
    }),
    reviews: [
      {
        id: "r1-1",
        author: "Arjun M.",
        rating: 5,
        title: "Looks even better in person",
        body: "The print pops under daylight and the fabric feels expensive — soft with just enough structure. Wore it to a resort dinner and got stopped twice.",
        date: "2026-08-12",
        verified: true,
      },
      {
        id: "r1-2",
        author: "Priya K.",
        rating: 5,
        title: "Gift that landed hard",
        body: "Bought this for my partner. Fit runs true; L was perfect. The back feather graphic is the real showstopper.",
        date: "2026-07-28",
        verified: true,
      },
      {
        id: "r1-3",
        author: "Dev S.",
        rating: 4,
        title: "Premium street-resort energy",
        body: "Slightly heavier than expected (in a good way). Pair with clean sneakers and you’re set. Wish they had a short-sleeve option.",
        date: "2026-06-03",
        verified: true,
      },
    ],
  },
  {
    id: "2",
    slug: "african-grey-set",
    name: "African Grey Set",
    priceMin: 80,
    priceMax: 140,
    rating: 5,
    reviewCount: 86,
    image: "/images/products/african-grey.webp",
    images: ["/images/products/african-grey.webp", "/images/products/parrot.jpg"],
    colors: ["#6b6b6b", "#1a1a1a", "#e8e4dc"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    categories: ["men", "women", "co-ord-sets", "full-sleeve"],
    badge: "#1 Bestseller",
    bestseller: true,
    description:
      "Quiet power in charcoal plumage. The African Grey Set is our signature co-ord — silk-touch fabric, Cuban collar, and a print that reads intelligent rather than loud. Resort polish for city nights. Every purchase helps fund animal rescue and cage-free care.",
    details: baseDetails({
      category: "Unisex Co-Ord Set",
      pattern: "African Grey Inspired Print",
      material: "Luxurious artificial silk",
    }),
    reviews: [
      {
        id: "r2-1",
        author: "Nisha R.",
        rating: 5,
        title: "Quiet luxury, wild print",
        body: "The grey palette feels elevated — not costume-y. Cuban collar sits perfectly and the trousers drape clean.",
        date: "2026-08-30",
        verified: true,
      },
      {
        id: "r2-2",
        author: "Kabir T.",
        rating: 5,
        title: "Worth every rupee of the vibe",
        body: "Fabric is cool against skin in humidity. I’ve washed it twice; print held sharp. Instant confidence piece.",
        date: "2026-08-01",
        verified: true,
      },
      {
        id: "r2-3",
        author: "Elena V.",
        rating: 5,
        title: "Unisex stunner",
        body: "Ordered for myself — women’s M fit great. Feels like a designer co-ord without the pretension.",
        date: "2026-07-15",
        verified: true,
      },
    ],
  },
  {
    id: "3",
    slug: "worm-set",
    name: "Worm Set",
    priceMin: 51,
    priceMax: 140,
    rating: 4.6,
    reviewCount: 54,
    image: "/images/products/worm.webp",
    images: ["/images/products/worm.webp", "/images/products/goat.png"],
    colors: ["#2d4a3e", "#8b4513", "#f5f0e8"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    categories: ["men", "full-sleeve"],
    description:
      "Earthy, unexpected, and unapologetically bold — the Worm Set turns organic rhythm into wearable art. Undulating print lines wrap a relaxed full-sleeve co-ord built for movement from city streets to late-night decks. Soft hand-feel, structured enough to hold its shape, wild enough to start conversations. Made for the tribe that finds beauty in the overlooked.",
    details: baseDetails({
      category: "Men’s Co-Ord Set",
      pattern: "Organic Worm / Earth Rhythm Print",
      material: "Premium natural fabric blend",
    }),
    reviews: [
      {
        id: "r3-1",
        author: "Rohan P.",
        rating: 5,
        title: "Weird in the best way",
        body: "People either stare or ask where it’s from. Fabric is solid; sizing true. My new go-to travel set.",
        date: "2026-08-18",
        verified: true,
      },
      {
        id: "r3-2",
        author: "Samira H.",
        rating: 4,
        title: "Texture for days",
        body: "Print depth looks rich in photos and better IRL. Slightly long sleeves on S — still love it.",
        date: "2026-07-09",
        verified: true,
      },
      {
        id: "r3-3",
        author: "Marcus L.",
        rating: 5,
        title: "Unexpected favorite",
        body: "Didn’t think I’d reach for this as often as I do. Comfortable enough for flights, sharp enough for dinners.",
        date: "2026-05-22",
        verified: true,
      },
    ],
  },
  {
    id: "4",
    slug: "white-mouse-set",
    name: "White Mouse Set",
    priceMin: 51,
    priceMax: 140,
    rating: 5,
    reviewCount: 97,
    image: "/images/products/white-mouse.webp",
    images: ["/images/products/white-mouse.webp", "/images/products/panda.png"],
    colors: ["#f5f5f5", "#1a1a1a", "#c0c0c0"],
    sizes: ["S", "M", "L", "XL"],
    categories: ["women", "co-ord-sets"],
    description:
      "Clean lines, soft contrast, quiet mischief — the White Mouse Set is premium simplicity with a wild pulse underneath. Crisp tonal print on a fluid co-ord silhouette that moves from brunch to gallery night without forcing the outfit. Soft against skin, sharp in silhouette. For those who wear the wild lightly — and never forget it’s there.",
    details: baseDetails({
      category: "Women’s Co-Ord Set",
      pattern: "White Mouse Inspired Print",
      material: "Soft premium weave",
    }),
    reviews: [
      {
        id: "r4-1",
        author: "Aanya D.",
        rating: 5,
        title: "Soft but not fragile",
        body: "Washes well, doesn’t pill. The print is subtle enough for daily wear but still unmistakably Tigerteeh.",
        date: "2026-09-01",
        verified: true,
      },
      {
        id: "r4-2",
        author: "Jess W.",
        rating: 5,
        title: "Kids + adults energy",
        body: "Got matching vibes with my niece’s set. Quality feels consistent across the line. Obsessed.",
        date: "2026-08-14",
        verified: true,
      },
      {
        id: "r4-3",
        author: "Tara N.",
        rating: 5,
        title: "Minimal wild",
        body: "Exactly what I wanted — animal print without screaming. Fit is relaxed and flattering.",
        date: "2026-07-02",
        verified: true,
      },
    ],
  },
  {
    id: "5",
    slug: "sheep-set",
    name: "Sheep Set",
    priceMin: 51,
    priceMax: 140,
    rating: 4.7,
    reviewCount: 41,
    image: "/images/products/sheep.png",
    images: ["/images/products/sheep.png", "/images/products/donkey.png"],
    colors: ["#e8e0d4", "#3d3d3d", "#8b7355"],
    sizes: ["S", "M", "L", "XL"],
    categories: ["men", "women"],
    description:
      "Soft flock energy with a rebellious cut — the Sheep Set is for those who wear the wild quietly. Warm neutrals and tactile print detail wrap a relaxed co-ord built for golden-hour walks and slow weekends. Plush visual texture, easy drape, zero costume energy. Proof that gentle can still be fierce.",
    details: baseDetails({
      category: "Unisex Co-Ord Set",
      pattern: "Sheep Inspired Print",
      material: "Soft brushed premium blend",
    }),
    reviews: [
      {
        id: "r5-1",
        author: "Ishan B.",
        rating: 5,
        title: "Cozy without looking lazy",
        body: "Neutral tones pair with everything. Trousers length is spot on for my height (5'10\").",
        date: "2026-08-22",
        verified: true,
      },
      {
        id: "r5-2",
        author: "Maya C.",
        rating: 4,
        title: "Soft statement",
        body: "Love the print scale. Would buy again in a darker wash if they drop one.",
        date: "2026-07-30",
        verified: true,
      },
      {
        id: "r5-3",
        author: "Omar F.",
        rating: 5,
        title: "Weekend uniform",
        body: "Third wear in two weeks. Breathable and still looks pressed after a long day.",
        date: "2026-06-18",
        verified: true,
      },
    ],
  },
  {
    id: "6",
    slug: "donkey-set",
    name: "Donkey Set",
    priceMin: 51,
    priceMax: 140,
    rating: 4.5,
    reviewCount: 33,
    image: "/images/products/donkey.png",
    images: ["/images/products/donkey.png", "/images/products/sheep.png"],
    colors: ["#5c5346", "#2a2a2a", "#d4c4a8"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    categories: ["men", "full-sleeve"],
    description:
      "Stubborn style, refined execution. The Donkey Set brings rugged character into a full-sleeve co-ord with grounded earth tones and a silhouette that works as hard as you do. Built for long days, late nights, and the kind of confidence that doesn’t need to shout. Durable feel. Unmistakable presence.",
    details: baseDetails({
      category: "Men’s Co-Ord Set",
      pattern: "Donkey Inspired Print",
      material: "Durable premium natural blend",
    }),
    reviews: [
      {
        id: "r6-1",
        author: "Vikram J.",
        rating: 5,
        title: "Rugged and sharp",
        body: "Earth tones hide travel dust somehow — magic. Collar stays crisp. XXL actually fits like XXL.",
        date: "2026-08-05",
        verified: true,
      },
      {
        id: "r6-2",
        author: "Chris A.",
        rating: 4,
        title: "Solid everyday set",
        body: "Not as loud as the parrot sets — that’s the point. Quality stitching throughout.",
        date: "2026-07-11",
        verified: true,
      },
      {
        id: "r6-3",
        author: "Leila M.",
        rating: 4,
        title: "Character piece",
        body: "Print storytelling is fun without being cartoonish. Runs slightly roomy in the chest — size down if between.",
        date: "2026-05-29",
        verified: true,
      },
    ],
  },
  {
    id: "7",
    slug: "ocelot-set",
    name: "Ocelot Set",
    priceMin: 51,
    priceMax: 140,
    rating: 4.9,
    reviewCount: 112,
    image: "/images/products/ocelot.png",
    images: ["/images/products/ocelot.png", "/images/products/serval.png"],
    colors: ["#c45c26", "#1a1a1a", "#d4a574"],
    sizes: ["S", "M", "L", "XL"],
    categories: ["women", "co-ord-sets"],
    description:
      "Spotted for the unstoppable. The Ocelot Set channels nocturnal elegance — amber heat, ink contrast, and a co-ord cut that moves like it’s hunting compliments. Fluid fabric, fierce print placement, resort-ready polish. Made for nights that start early and don’t ask permission. Built for the bold.",
    details: baseDetails({
      category: "Women’s Co-Ord Set",
      pattern: "Ocelot Spot Inspired Print",
      material: "Fluid premium silk-touch blend",
    }),
    reviews: [
      {
        id: "r7-1",
        author: "Zara Q.",
        rating: 5,
        title: "Main-character energy",
        body: "The spotting is artful — not cheesy. Got so many DMs asking for the brand. Fit is chef’s kiss.",
        date: "2026-09-02",
        verified: true,
      },
      {
        id: "r7-2",
        author: "Hana S.",
        rating: 5,
        title: "Resort essential",
        body: "Packed this for Goa. Lightweight, photographs insanely well, and survives humidity.",
        date: "2026-08-08",
        verified: true,
      },
      {
        id: "r7-3",
        author: "Mia R.",
        rating: 4,
        title: "Fierce favorite",
        body: "Love everything except wishing for a cropped length option. Still wearing it weekly.",
        date: "2026-06-25",
        verified: true,
      },
    ],
  },
  {
    id: "8",
    slug: "serval-set",
    name: "Serval Set",
    priceMin: 51,
    priceMax: 140,
    rating: 4.8,
    reviewCount: 67,
    image: "/images/products/serval.png",
    images: ["/images/products/serval.png", "/images/products/ocelot.png"],
    colors: ["#d4a017", "#2c1810", "#f0e6d2"],
    sizes: ["S", "M", "L", "XL"],
    categories: ["men", "women", "co-ord-sets"],
    description:
      "Golden spots. Longer stride. The Serval Set translates savannah speed into sunlit co-ord luxury — warm golds against deep ground tones on premium natural fabric. Relaxed enough for daylight roaming, sharp enough for after-dark. Wear it like you own the horizon.",
    details: baseDetails({
      category: "Unisex Co-Ord Set",
      pattern: "Serval Spot Inspired Print",
      material: "Premium natural fabric blend",
    }),
    reviews: [
      {
        id: "r8-1",
        author: "Aditya G.",
        rating: 5,
        title: "Golden hour uniform",
        body: "Colors glow at sunset. Pair with loafers or sneakers — both work. Excellent construction.",
        date: "2026-08-27",
        verified: true,
      },
      {
        id: "r8-2",
        author: "Sofia L.",
        rating: 5,
        title: "Unisex win",
        body: "Shared sizing notes with my partner — both rock it. Soft hand-feel, zero itch.",
        date: "2026-07-19",
        verified: true,
      },
      {
        id: "r8-3",
        author: "Nate K.",
        rating: 4,
        title: "Standout print",
        body: "Slightly louder than I expected — which turned out great. Gets compliments constantly.",
        date: "2026-06-01",
        verified: true,
      },
    ],
  },
  {
    id: "9",
    slug: "platypus-set",
    name: "Platypus Set",
    priceMin: 51,
    priceMax: 140,
    rating: 4.4,
    reviewCount: 29,
    image: "/images/products/platypus.png",
    images: ["/images/products/platypus.png", "/images/products/panda.png"],
    colors: ["#4a6741", "#1a1a1a", "#a8c5a0"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    categories: ["co-ord-sets"],
    description:
      "Odd, iconic, impossible to ignore — just like its namesake. The Platypus Set brings playful wilderness into a family-friendly co-ord with fresh greens and character-forward print. Soft enough for all-day wear, bold enough for the kid (or kid-at-heart) who refuses boring. Wild style for every age.",
    details: baseDetails({
      category: "Kids Co-Ord Set",
      pattern: "Platypus Inspired Print",
      fit: "Easy Relaxed Fit",
      material: "Soft kid-friendly premium blend",
    }),
    reviews: [
      {
        id: "r9-1",
        author: "Neha P.",
        rating: 5,
        title: "Kid-approved, parent-approved",
        body: "Survived playground chaos and still looked cute for photos. Soft seams, no scratchy tags.",
        date: "2026-08-16",
        verified: true,
      },
      {
        id: "r9-2",
        author: "Tom H.",
        rating: 4,
        title: "Fun without being costume",
        body: "Print is playful but wearable to school events. Sizing chart was accurate.",
        date: "2026-07-07",
        verified: true,
      },
      {
        id: "r9-3",
        author: "Riya S.",
        rating: 4,
        title: "Conversation starter",
        body: "Teachers asked about the brand. Wash held up after three cycles so far.",
        date: "2026-05-14",
        verified: true,
      },
    ],
  },
  {
    id: "10",
    slug: "panda-set",
    name: "Panda Set",
    priceMin: 51,
    priceMax: 140,
    rating: 4.7,
    reviewCount: 58,
    image: "/images/products/panda.png",
    images: ["/images/products/panda.png", "/images/products/white-mouse.webp"],
    colors: ["#1a1a1a", "#f5f5f5", "#4a4a4a"],
    sizes: ["S", "M", "L", "XL"],
    categories: ["men", "women", "co-ord-sets"],
    description:
      "Black, white, and impossible to ignore. The Panda Set reworks iconic contrast into a modern streetwear co-ord — clean blocks of tone, soft structure, and a cut that reads contemporary rather than cute. From city sidewalks to family weekends, it’s classic wild with a sharper edge.",
    details: baseDetails({
      category: "Unisex Co-Ord Set",
      pattern: "Panda Inspired Print",
      material: "Modern streetwear cotton-silk blend",
    }),
    reviews: [
      {
        id: "r10-1",
        author: "Jordan E.",
        rating: 5,
        title: "Street-clean classic",
        body: "High contrast looks intentional under city lights. Trousers fit straight and honest.",
        date: "2026-08-29",
        verified: true,
      },
      {
        id: "r10-2",
        author: "Anika V.",
        rating: 5,
        title: "Works across ages",
        body: "Bought for myself and a mini version vibe for my son. Brand consistency is real.",
        date: "2026-07-21",
        verified: true,
      },
      {
        id: "r10-3",
        author: "Farah Z.",
        rating: 4,
        title: "Sharp everyday set",
        body: "Black sections don’t fade weirdly. Would love a hoodie collab next.",
        date: "2026-06-10",
        verified: true,
      },
    ],
  },
  {
    id: "11",
    slug: "goat-set",
    name: "Goat Set",
    priceMin: 51,
    priceMax: 140,
    rating: 5,
    reviewCount: 74,
    image: "/images/products/goat.png",
    images: ["/images/products/goat.png", "/images/products/worm.webp"],
    colors: ["#8b7355", "#2c1810", "#e8dcc8"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    categories: ["men", "full-sleeve"],
    description:
      "Climb higher. The Goat Set is mountain-minded swagger in a full-sleeve co-ord — rugged tonal print, sure-footed silhouette, and fabric that keeps up when the day doesn’t quit. For the tribe that treats every sidewalk like a summit and every outfit like a statement of intent.",
    details: baseDetails({
      category: "Men’s Co-Ord Set",
      pattern: "Mountain Goat Inspired Print",
      material: "Performance-feel premium blend",
    }),
    reviews: [
      {
        id: "r11-1",
        author: "Harsh M.",
        rating: 5,
        title: "G.O.A.T. literally",
        body: "Print storytelling + fit = automatic yes. Wore hiking-adjacent and to dinner. No wrinkles worth caring about.",
        date: "2026-09-03",
        verified: true,
      },
      {
        id: "r11-2",
        author: "Diego R.",
        rating: 5,
        title: "Tough softie",
        body: "Looks rugged, feels soft. Size XL chest room is generous in a good way.",
        date: "2026-08-11",
        verified: true,
      },
      {
        id: "r11-3",
        author: "Pauline Y.",
        rating: 5,
        title: "Gift hit",
        body: "Brother lives in this now. Packaging felt premium too — nice unboxing.",
        date: "2026-07-04",
        verified: true,
      },
    ],
  },
  {
    id: "12",
    slug: "cobra-set",
    name: "Cobra Set",
    priceMin: 80,
    priceMax: 140,
    rating: 4.9,
    reviewCount: 64,
    image: "/images/products/cobra.webp",
    images: ["/images/products/cobra.webp", "/images/products/african-grey.webp"],
    colors: ["#1a1a1a", "#2c1810", "#c4a574"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    categories: ["men", "co-ord-sets", "full-sleeve"],
    badge: "#1 Bestseller",
    bestseller: true,
    description:
      "Strike-ready silhouette. The Cobra Set wraps dark ground tones and scaled energy into a full-sleeve co-ord that moves with quiet menace — Cuban collar, relaxed trousers, silk-touch hand-feel. Built for nights that don’t ask permission.",
    details: baseDetails({
      category: "Men’s Co-Ord Set",
      pattern: "Cobra Inspired Print",
      material: "Luxurious artificial silk",
    }),
    reviews: [
      {
        id: "r12-1",
        author: "Reyansh K.",
        rating: 5,
        title: "Dark and lethal",
        body: "Print depth is insane under warm light. Fit true — L for 5'11\" / 78kg was perfect.",
        date: "2026-10-12",
        verified: true,
      },
      {
        id: "r12-2",
        author: "Amelia T.",
        rating: 5,
        title: "Unisex venom",
        body: "Ordered for my partner; stole it twice. Fabric cools in humidity.",
        date: "2026-09-28",
        verified: true,
      },
      {
        id: "r12-3",
        author: "Jay P.",
        rating: 4,
        title: "Signature energy",
        body: "Slightly heavier than the bird sets — in a good structured way. Gets stares.",
        date: "2026-09-04",
        verified: true,
      },
    ],
  },
  {
    id: "13",
    slug: "scarlet-macaw-set",
    name: "Scarlet Macaw Set",
    priceMin: 80,
    priceMax: 140,
    rating: 5,
    reviewCount: 91,
    image: "/images/products/scarlet-macaw.webp",
    images: [
      "/images/products/scarlet-macaw.webp",
      "/images/products/blue-gold-macaw.webp",
    ],
    colors: ["#c41e3a", "#1a5c3a", "#1a1a1a"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    categories: ["men", "women", "co-ord-sets"],
    badge: "#1 Bestseller",
    bestseller: true,
    description:
      "Primary-color thunder. Scarlet, emerald, and ink collide on a fluid co-ord cut for resort daylight and after-dark heat. Feather-forward print placement, Cuban collar, straight trousers — maximum plumage, zero costume.",
    details: baseDetails({
      category: "Unisex Co-Ord Set",
      pattern: "Scarlet Macaw Inspired Print",
      material: "Luxurious artificial silk",
    }),
    reviews: [
      {
        id: "r13-1",
        author: "Sana M.",
        rating: 5,
        title: "Color that photographs",
        body: "Every shot looks editorial. Soft against skin, holds shape after a wash.",
        date: "2026-10-20",
        verified: true,
      },
      {
        id: "r13-2",
        author: "Leo G.",
        rating: 5,
        title: "Main character print",
        body: "Louder than the Grey — that’s the point. XXL chest room honest.",
        date: "2026-10-02",
        verified: true,
      },
      {
        id: "r13-3",
        author: "Priya N.",
        rating: 5,
        title: "Gift that landed",
        body: "Bought for anniversary trip. Packaging + set felt premium end-to-end.",
        date: "2026-09-15",
        verified: true,
      },
    ],
  },
  {
    id: "14",
    slug: "sun-conure-set",
    name: "Sun Conure Set",
    priceMin: 80,
    priceMax: 140,
    rating: 4.8,
    reviewCount: 57,
    image: "/images/products/sun-conure.webp",
    images: [
      "/images/products/sun-conure.webp",
      "/images/products/scarlet-macaw.webp",
    ],
    colors: ["#f38120", "#f5c518", "#1a1a1a"],
    sizes: ["S", "M", "L", "XL"],
    categories: ["men", "women", "co-ord-sets"],
    badge: "#1 Bestseller",
    bestseller: true,
    description:
      "Golden-hour volume. The Sun Conure Set floods citrus heat across a relaxed silk-touch co-ord — sunrise oranges, lemon flash, ink contrast. Built for daylight roaming and the kind of confidence that doesn’t whisper.",
    details: baseDetails({
      category: "Unisex Co-Ord Set",
      pattern: "Sun Conure Inspired Print",
      material: "Luxurious artificial silk",
    }),
    reviews: [
      {
        id: "r14-1",
        author: "Ira D.",
        rating: 5,
        title: "Sunrise on fabric",
        body: "Colors glow outdoors. Collar sits clean; trousers length spot on.",
        date: "2026-10-18",
        verified: true,
      },
      {
        id: "r14-2",
        author: "Noah W.",
        rating: 5,
        title: "Happy loud",
        body: "Not subtle — and that’s why I bought it. Breathable in Goa heat.",
        date: "2026-09-30",
        verified: true,
      },
      {
        id: "r14-3",
        author: "Meera S.",
        rating: 4,
        title: "Joy set",
        body: "Wish for a cropped option. Still wearing weekly.",
        date: "2026-09-08",
        verified: true,
      },
    ],
  },
  {
    id: "15",
    slug: "blue-gold-macaw-set",
    name: "Blue & Gold Macaw Set",
    priceMin: 80,
    priceMax: 140,
    rating: 4.9,
    reviewCount: 48,
    image: "/images/products/blue-gold-macaw.webp",
    images: [
      "/images/products/blue-gold-macaw.webp",
      "/images/products/scarlet-macaw.webp",
    ],
    colors: ["#1e4d8c", "#d4a017", "#faf9f7"],
    sizes: ["S", "M", "L", "XL"],
    categories: ["women", "co-ord-sets", "new-arrivals"],
    badge: "NEW",
    newArrival: true,
    description:
      "Ocean blue meets molten gold. A newly landed macaw co-ord with fluid drape, Cuban collar, and print placement that reads couture jungle — not novelty. Soft structure for brunch-to-beach days.",
    details: baseDetails({
      category: "Women’s Co-Ord Set",
      pattern: "Blue & Gold Macaw Inspired Print",
      material: "Luxurious artificial silk",
    }),
    reviews: [
      {
        id: "r15-1",
        author: "Kavya R.",
        rating: 5,
        title: "Just landed, already obsessed",
        body: "Blue/gold balance is perfect — not cartoonish. M fit flattering.",
        date: "2026-10-28",
        verified: true,
      },
      {
        id: "r15-2",
        author: "Elena B.",
        rating: 5,
        title: "Resort essential",
        body: "Packed light; this did all the talking. Wash held sharp.",
        date: "2026-10-21",
        verified: true,
      },
      {
        id: "r15-3",
        author: "Tara J.",
        rating: 4,
        title: "Luxe plumage",
        body: "Slightly sheer in bright sun on white panels — layer or own it.",
        date: "2026-10-14",
        verified: true,
      },
    ],
  },
  {
    id: "16",
    slug: "alexandrine-parrot-set",
    name: "Alexandrine Parrot Set",
    priceMin: 80,
    priceMax: 140,
    rating: 4.8,
    reviewCount: 39,
    image: "/images/products/alexandrine-parrot.webp",
    images: [
      "/images/products/alexandrine-parrot.webp",
      "/images/products/parrot.jpg",
    ],
    colors: ["#2d6a4f", "#c41e3a", "#1a1a1a"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    categories: ["men", "co-ord-sets", "new-arrivals"],
    badge: "NEW",
    newArrival: true,
    description:
      "Regal green with a crimson flash. The Alexandrine Set translates ringneck nobility into a fresh co-ord drop — longer visual line, refined collar, trousers that move. For the bold who still want polish.",
    details: baseDetails({
      category: "Men’s Co-Ord Set",
      pattern: "Alexandrine Parrot Inspired Print",
      material: "Premium natural fabric blend",
    }),
    reviews: [
      {
        id: "r16-1",
        author: "Arjun V.",
        rating: 5,
        title: "Cleaner than the Ringneck",
        body: "More refined print scale. Feels elevated for dinners.",
        date: "2026-10-26",
        verified: true,
      },
      {
        id: "r16-2",
        author: "Samira L.",
        rating: 5,
        title: "Fresh drop energy",
        body: "Got compliments the first wear. Soft hand-feel, zero itch.",
        date: "2026-10-17",
        verified: true,
      },
      {
        id: "r16-3",
        author: "Dev K.",
        rating: 4,
        title: "Solid new arrival",
        body: "Runs true. Would love short-sleeve next season.",
        date: "2026-10-09",
        verified: true,
      },
    ],
  },
  {
    id: "17",
    slug: "peacock-set",
    name: "Peacock Set",
    priceMin: 80,
    priceMax: 140,
    rating: 5,
    reviewCount: 72,
    image: "/images/products/peacock.webp",
    images: ["/images/products/peacock.webp", "/images/products/ocelot.png"],
    colors: ["#0b3d5c", "#1a7a4c", "#d4a017"],
    sizes: ["S", "M", "L", "XL"],
    categories: ["men", "women", "co-ord-sets", "new-arrivals"],
    badge: "NEW",
    newArrival: true,
    description:
      "Iridescent theater without the costume. Deep teal eyespots fan across silk-touch fabric on a co-ord cut for presence — Cuban collar, easy trousers, night-ready sheen. Wear the train. Own the room.",
    details: baseDetails({
      category: "Unisex Co-Ord Set",
      pattern: "Peacock Inspired Print",
      material: "Luxurious artificial silk",
    }),
    reviews: [
      {
        id: "r17-1",
        author: "Zoya A.",
        rating: 5,
        title: "Showstopper",
        body: "Print is art. Photographs like a campaign. Fit is relaxed-luxe.",
        date: "2026-10-29",
        verified: true,
      },
      {
        id: "r17-2",
        author: "Marcus H.",
        rating: 5,
        title: "Wedding guest weapon",
        body: "Wore to a destination wedding — endless compliments.",
        date: "2026-10-19",
        verified: true,
      },
      {
        id: "r17-3",
        author: "Naina P.",
        rating: 5,
        title: "Worth the drop",
        body: "Richer in person than online. Soft structure holds all day.",
        date: "2026-10-11",
        verified: true,
      },
    ],
  },
  {
    id: "18",
    slug: "leopard-set",
    name: "Leopard Set",
    priceMin: 80,
    priceMax: 140,
    rating: 4.9,
    reviewCount: 105,
    image: "/images/products/leopard.webp",
    images: ["/images/products/leopard.webp", "/images/products/cheetah.webp"],
    colors: ["#c45c26", "#2c1810", "#1a1a1a"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    categories: ["men", "women", "co-ord-sets", "new-arrivals"],
    badge: "NEW",
    newArrival: true,
    description:
      "Spotted for the unstoppable. Amber heat and ink contrast on a co-ord that hunts compliments — fluid fabric, fierce placement, resort polish. Built for nights that start early.",
    details: baseDetails({
      category: "Unisex Co-Ord Set",
      pattern: "Leopard Spot Inspired Print",
      material: "Fluid premium silk-touch blend",
    }),
    reviews: [
      {
        id: "r18-1",
        author: "Hana K.",
        rating: 5,
        title: "Not cheesy leopard",
        body: "Scale and color are fashion, not costume. Instant yes.",
        date: "2026-10-27",
        verified: true,
      },
      {
        id: "r18-2",
        author: "Omar F.",
        rating: 5,
        title: "Street + resort",
        body: "Works with sneakers or loafers. Construction is tight.",
        date: "2026-10-16",
        verified: true,
      },
      {
        id: "r18-3",
        author: "Lia R.",
        rating: 4,
        title: "Fierce favorite",
        body: "Runs slightly long in sleeve on S — still love it.",
        date: "2026-10-05",
        verified: true,
      },
    ],
  },
  {
    id: "19",
    slug: "womens-cheetah-set",
    name: "Women’s Cheetah Set",
    priceMin: 80,
    priceMax: 140,
    rating: 4.8,
    reviewCount: 61,
    image: "/images/products/cheetah.webp",
    images: ["/images/products/cheetah.webp", "/images/products/leopard.webp"],
    colors: ["#d4a574", "#2c1810", "#faf9f7"],
    sizes: ["S", "M", "L", "XL"],
    categories: ["women", "co-ord-sets", "new-arrivals"],
    badge: "NEW",
    newArrival: true,
    description:
      "Speed in soft gold. The Women’s Cheetah Set is cut for stride — lighter spotting, warmer ground, a silhouette that feels athletic without trying. Daylight roaming, golden-hour proof.",
    details: baseDetails({
      category: "Women’s Co-Ord Set",
      pattern: "Cheetah Spot Inspired Print",
      fit: "Relaxed Tailored Fit",
      material: "Fluid premium silk-touch blend",
    }),
    reviews: [
      {
        id: "r19-1",
        author: "Aisha M.",
        rating: 5,
        title: "Made for women",
        body: "Shoulder and hip balance finally right. Soft, not clingy.",
        date: "2026-10-25",
        verified: true,
      },
      {
        id: "r19-2",
        author: "Jess C.",
        rating: 5,
        title: "Travel uniform",
        body: "Packed wrinkled; hung out fine. Print scale is chic.",
        date: "2026-10-13",
        verified: true,
      },
      {
        id: "r19-3",
        author: "Rhea T.",
        rating: 4,
        title: "Golden everyday",
        body: "Want a darker wash next. This one still lives in rotation.",
        date: "2026-10-03",
        verified: true,
      },
    ],
  },
  {
    id: "20",
    slug: "zebra-set",
    name: "Zebra Set",
    priceMin: 80,
    priceMax: 140,
    rating: 4.7,
    reviewCount: 44,
    image: "/images/products/zebra.webp",
    images: ["/images/products/zebra.webp", "/images/products/panda.png"],
    colors: ["#1a1a1a", "#faf9f7", "#6b6560"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    categories: ["men", "women", "co-ord-sets", "new-arrivals"],
    badge: "NEW",
    newArrival: true,
    description:
      "Graphic stripe, modern cut. The Zebra Set reworks high contrast into street-clean co-ord energy — no costume, just rhythm. Black/white that reads intentional under city light.",
    details: baseDetails({
      category: "Unisex Co-Ord Set",
      pattern: "Zebra Stripe Inspired Print",
      material: "Modern streetwear cotton-silk blend",
    }),
    reviews: [
      {
        id: "r20-1",
        author: "Jordan E.",
        rating: 5,
        title: "Sharp contrast",
        body: "Looks expensive at night. Trousers straight and honest.",
        date: "2026-10-24",
        verified: true,
      },
      {
        id: "r20-2",
        author: "Anika V.",
        rating: 4,
        title: "Clean wild",
        body: "Less loud than bird sets — perfect daily wild.",
        date: "2026-10-10",
        verified: true,
      },
      {
        id: "r20-3",
        author: "Chris A.",
        rating: 5,
        title: "Instant rotate",
        body: "Third wear in a week. No weird fade on black.",
        date: "2026-09-29",
        verified: true,
      },
    ],
  },
  {
    id: "21",
    slug: "grizzly-bear-set",
    name: "Grizzly Bear Set",
    priceMin: 80,
    priceMax: 140,
    rating: 4.8,
    reviewCount: 36,
    image: "/images/products/grizzly-bear.webp",
    images: ["/images/products/grizzly-bear.webp", "/images/products/goat.png"],
    colors: ["#5c4033", "#2c1810", "#d4c4a8"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    categories: ["men", "full-sleeve", "new-arrivals"],
    badge: "NEW",
    newArrival: true,
    description:
      "Mountain weight, soft hand. The Grizzly Set brings rugged tonal print into a full-sleeve co-ord that works as hard as you do — grounded browns, sure-footed silhouette, zero shout.",
    details: baseDetails({
      category: "Men’s Co-Ord Set",
      pattern: "Grizzly Bear Inspired Print",
      material: "Durable premium natural blend",
    }),
    reviews: [
      {
        id: "r21-1",
        author: "Vikram J.",
        rating: 5,
        title: "Rugged polish",
        body: "Earth tones hide travel dust. Collar stays crisp. XXL fits.",
        date: "2026-10-22",
        verified: true,
      },
      {
        id: "r21-2",
        author: "Pauline Y.",
        rating: 5,
        title: "Gift hit",
        body: "Brother lives in this. Unboxing felt premium.",
        date: "2026-10-08",
        verified: true,
      },
      {
        id: "r21-3",
        author: "Diego R.",
        rating: 4,
        title: "Tough softie",
        body: "Looks heavy, feels soft. Chest room generous.",
        date: "2026-09-27",
        verified: true,
      },
    ],
  },
  {
    id: "22",
    slug: "giraffe-set",
    name: "Giraffe Set",
    priceMin: 80,
    priceMax: 140,
    rating: 4.9,
    reviewCount: 52,
    image: "/images/products/giraffe.webp",
    images: ["/images/products/giraffe.webp", "/images/products/leopard.webp"],
    colors: ["#c4a574", "#8b5a2b", "#faf9f7"],
    sizes: ["S", "M", "L", "XL"],
    categories: ["men", "women", "co-ord-sets", "new-arrivals"],
    badge: "NEW",
    newArrival: true,
    description:
      "Tall energy, warm lattice. The Giraffe Set stretches savannah geometry across a fluid co-ord — sand golds, bark contrast, easy drape. Horizon-minded style for slow weekends and sharp nights.",
    details: baseDetails({
      category: "Unisex Co-Ord Set",
      pattern: "Giraffe Lattice Inspired Print",
      material: "Premium natural fabric blend",
    }),
    reviews: [
      {
        id: "r22-1",
        author: "Sofia L.",
        rating: 5,
        title: "Warm and elevated",
        body: "Pattern scale is perfect — not busy. Soft hand-feel.",
        date: "2026-10-23",
        verified: true,
      },
      {
        id: "r22-2",
        author: "Aditya G.",
        rating: 5,
        title: "Golden hour set",
        body: "Colors glow at sunset. Loafers or sneakers both work.",
        date: "2026-10-12",
        verified: true,
      },
      {
        id: "r22-3",
        author: "Maya C.",
        rating: 4,
        title: "Standout soft",
        body: "Slightly louder than expected — turned out great.",
        date: "2026-10-01",
        verified: true,
      },
    ],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: CategorySlug) {
  if (category === "new-arrivals") {
    return products.filter((p) => p.newArrival);
  }
  return products.filter((p) => p.categories.includes(category));
}

export function getBestsellers() {
  return products.filter((p) => p.bestseller);
}

export function getNewArrivals() {
  return products.filter((p) => p.newArrival);
}

export function searchProducts(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return products;

  const tokens = q.split(/\s+/).filter(Boolean);

  const score = (p: (typeof products)[number]) => {
    const name = p.name.toLowerCase();
    const hay = [
      name,
      p.description.toLowerCase(),
      p.details.pattern.toLowerCase(),
      p.details.category.toLowerCase(),
      ...p.categories,
    ].join(" ");

    let s = 0;
    if (name.startsWith(q)) s += 40;
    if (name.includes(q)) s += 24;
    for (const t of tokens) {
      if (name.includes(t)) s += 12;
      if (hay.includes(t)) s += 4;
    }
    if (p.bestseller) s += 2;
    if (p.newArrival) s += 1;
    return s;
  };

  return products
    .map((p) => ({ p, s: score(p) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .map(({ p }) => p);
}

export {
  formatMoney as formatPrice,
  formatMoneyRange as formatPriceRange,
} from "@/lib/currency";
