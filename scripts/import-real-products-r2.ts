import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import fs from "node:fs/promises";
import { slugify } from "../src/lib/utils";

interface ProductSeedItem {
  name: string;
  categorySlug: string;
  subcategory: string;
  price: number;
  salePrice?: number | null;
  sku: string;
  stock: number;
  imageFilenames: string[];
  description: string;
  specifications: { key: string; value: string }[];
  tags: string[];
  isFeatured?: boolean;
}

const CATEGORY_DEFINITIONS = [
  {
    name: "Toys & Games",
    slug: "toys-games",
    description: "Fun, creative, and action-packed toys, vehicles, collectibles, and outdoor games for kids of all ages.",
    subcategories: [
      { name: "Action & Toy Vehicles", slug: "action-toy-vehicles", description: "Toy cars, stunt vehicles, racers, and play sets" },
      { name: "Outdoor & Bubble Play", slug: "outdoor-bubble-play", description: "Bubble wands, fan toys, and outdoor summer play" },
      { name: "Figures & Collectibles", slug: "figures-collectibles", description: "Designer art toys, novelty character clocks, and blind boxes" },
      { name: "Kids Activities & Games", slug: "kids-activities-games", description: "Traditional glass marbles, activity books, and games" },
    ],
  },
  {
    name: "Party & Celebrations",
    slug: "party-celebrations",
    description: "Everything you need for unforgettable birthdays, weddings, anniversaries, and festive celebrations.",
    subcategories: [
      { name: "Party Supplies & Effects", slug: "party-supplies-effects", description: "Balloon sprays, confetti poppers, snow sprays, hats, and pom poms" },
      { name: "Cake Accessories", slug: "cake-accessories", description: "Acrylic cake toppers, candles, and cake decoration accessories" },
    ],
  },
  {
    name: "Home & Living",
    slug: "home-living",
    description: "Quality tableware, storage solutions, furniture, and practical home accessories for modern living.",
    subcategories: [
      { name: "Dining & Tableware", slug: "dining-tableware", description: "Fine cup & saucer tea sets, serving trays, and platters" },
      { name: "Furniture & Storage", slug: "furniture-storage", description: "Foldable storage shelving racks, steel stools, and step ladders" },
      { name: "Clocks & Home Decor", slug: "clocks-home-decor", description: "Desk clocks, bedside clocks, and decorative home accents" },
    ],
  },
  {
    name: "Stationery & School",
    slug: "stationery-school",
    description: "Cute and functional stationery sets, pencil cases, and school supplies for kids and students.",
    subcategories: [
      { name: "Kids Stationery Sets", slug: "kids-stationery-sets", description: "Complete themed stationery gift sets, pencil boxes, and accessories" },
    ],
  },
  {
    name: "Electronics & Gadgets",
    slug: "electronics-gadgets",
    description: "Portable fans, personal cooling devices, and everyday smart gadgets.",
    subcategories: [
      { name: "Fans & Cooling", slug: "fans-cooling", description: "USB desktop fans, rechargeable handheld mini fans, and cooling accessories" },
    ],
  },
  {
    name: "Fashion & Accessories",
    slug: "fashion-accessories",
    description: "Trendy jewelry, stylish bracelets, and fashion accessories.",
    subcategories: [
      { name: "Jewelry & Accessories", slug: "jewelry-accessories", description: "Gold & silver plated charm bangles, bracelets, and fashion jewelry" },
    ],
  },
];

const REAL_PRODUCTS: ProductSeedItem[] = [
  // 1. Fan Bubble Tube B
  {
    name: "Fan Bubble Tube B",
    categorySlug: "toys-games",
    subcategory: "Outdoor & Bubble Play",
    price: 455,
    sku: "TOY-BUB-001",
    stock: 48,
    imageFilenames: ["Colorful Twin Bubble Fan Toys.png"],
    description: "An exciting 2-in-1 summer novelty toy featuring a fully functioning hand-crank fan and a bubble wand tube built into the handle. Kids can blow thousands of shimmering bubbles through the multi-ring wand head, then use the colorful windmill fan blades to disperse bubbles high into the air. Crafted from lightweight, impact-resistant, non-toxic ABS plastic with an easy-grip textured handle tailored for small hands. Comes pre-filled with high-yield bubble solution. Safe for ages 3+, perfect for birthday parties, school celebrations, picnics, and outdoor park play.",
    specifications: [
      { key: "Type", value: "2-in-1 Fan & Bubble Tube" },
      { key: "Age Recommendation", value: "3+ Years" },
      { key: "Material", value: "Non-Toxic ABS Plastic" },
      { key: "Carton Quantity", value: "48 pcs" },
      { key: "Features", value: "Working Fan, Multi-Loop Bubble Wand, Ergonomic Grip" },
    ],
    tags: ["bubble toy", "fan toy", "outdoor play", "summer toy", "party gift"],
    isFeatured: true,
  },
  // 2. Bubble L Animal Wand Bubble Tube
  {
    name: "Bubble L Animal Wand Bubble Tube",
    categorySlug: "toys-games",
    subcategory: "Outdoor & Bubble Play",
    price: 95,
    sku: "TOY-BUB-002",
    stock: 144,
    imageFilenames: ["Colorful bubble wand toy set-16.png"],
    description: "A vibrant, extra-long bubble wand topped with charming cartoon animal figurines including pandas, ducklings, bears, and bunnies. Equipped with an elongated multi-loop wand designed to release continuous streams of giant and medium bubbles with just a gentle wave through the air—no vigorous blowing required. Made from certified non-toxic, skin-safe bubble solution that does not stain clothing. Its compact, leak-resistant tube design makes it an ideal return gift, carnival prize, or party favor for children's outdoor gatherings.",
    specifications: [
      { key: "Designs", value: "6 Cute Animal Characters" },
      { key: "Carton Quantity", value: "144 pcs" },
      { key: "Solution", value: "Non-toxic, safe bubble liquid" },
      { key: "Usage", value: "Wave wand or blow for bubble streams" },
    ],
    tags: ["bubble wand", "animal toy", "party favors", "return gifts"],
    isFeatured: false,
  },
  // 3. City Engineering Construction Truck Set
  {
    name: "City Engineering Construction Truck Set (098-2)",
    categorySlug: "toys-games",
    subcategory: "Action & Toy Vehicles",
    price: 925,
    sku: "TOY-VEH-001",
    stock: 56,
    imageFilenames: ["Construction Toy Vehicle Set.png"],
    description: "A heavy-duty 2-piece construction work set featuring a realistic Dump Truck with an openable tilting cargo bed and a Front Loader Excavator with a movable articulated scoop arm. Designed to foster hand-eye coordination, fine motor skills, and imaginative engineering role-play. Constructed from thick, child-safe, BPA-free durable plastic with rounded corners and oversized deep-groove rubberized wheels that glide smoothly across sandboxes, carpets, tiles, and outdoor dirt paths. Packaged in a transparent presentation bag with hang-tag.",
    specifications: [
      { key: "Set Includes", value: "Dump Truck & Front Loader Excavator" },
      { key: "Model Number", value: "098-2" },
      { key: "Material", value: "Heavy-Duty Child-Safe Plastic" },
      { key: "Carton Quantity", value: "56 sets" },
      { key: "Wheels", value: "All-terrain smooth rolling deep-tread wheels" },
    ],
    tags: ["construction toys", "truck set", "dump truck", "excavator", "sandbox toy"],
    isFeatured: true,
  },
  // 4. Double-Sided Stunt Car
  {
    name: "Double-Sided Stunt Car (360° Flip & Spin)",
    categorySlug: "toys-games",
    subcategory: "Action & Toy Vehicles",
    price: 245,
    sku: "TOY-VEH-002",
    stock: 1200,
    imageFilenames: ["Colorful RC Stunt Cars Collection.png"],
    description: "A high-octane acrobatic stunt vehicle engineered with dual-sided driving technology. When the vehicle collides with walls, stairs, or obstacles, it instantly flips over and continues driving forward without stopping. Features high-traction textured thermoplastic rubber tires, shock-absorbent composite bumpers, and internal high-speed gear inertia drive. Available in 4 high-contrast electric neon colors: Solar Orange, Cobalt Blue, Racing Red, and Lime Green. Compact 31cm counter display box holds 12 individually packed cars.",
    specifications: [
      { key: "Stunt Action", value: "360° Rotation & Double Sided Inversion" },
      { key: "Colors", value: "Orange, Blue, Red, Green" },
      { key: "Display Box", value: "12 pcs per counter display box" },
      { key: "Carton Quantity", value: "1,200 pcs" },
      { key: "Drive Mechanism", value: "Friction Inertia Drive" },
    ],
    tags: ["stunt car", "flip car", "toy vehicle", "friction car", "pocket racer"],
    isFeatured: true,
  },
  // 5. Spark Gun Toy
  {
    name: "Spark Gun Toy (Transparent Revolver with Spark Effects)",
    categorySlug: "toys-games",
    subcategory: "Action & Toy Vehicles",
    price: 325,
    sku: "TOY-VEH-003",
    stock: 60,
    imageFilenames: ["Spark Gun Toy Display Collection.png"],
    description: "A vintage-inspired mechanical flintlock spark blaster with a crystal-clear transparent chassis that lets children see the gears and flint wheel rotate in real time. Pulling the trigger generates a safe, battery-free shower of bright friction sparks inside the enclosed muzzle chamber accompanied by a satisfying click sound. 100% kid-safe with no open flame, smoke, or heat. Built from sturdy polycarbonate in 3 translucent tint finishes (Sapphire Blue, Ruby Red, and Gunmetal Smoke).",
    specifications: [
      { key: "Sparks Mechanism", value: "Friction Flintwheel (100% Battery-Free)" },
      { key: "Colors", value: "Transparent Blue, Red, Smoke Silver" },
      { key: "Safety", value: "Internal spark chamber, zero heat or smoke" },
      { key: "Carton Quantity", value: "60 pcs (12 pcs display box)" },
    ],
    tags: ["spark gun", "toy blaster", "action toy", "pretend play"],
    isFeatured: false,
  },
  // 6. 188 Plastic Car A - Mini 4WD Racer
  {
    name: "188 Plastic Car A - Mini 4WD Racing Car",
    categorySlug: "toys-games",
    subcategory: "Action & Toy Vehicles",
    price: 190,
    sku: "TOY-VEH-004",
    stock: 1200,
    imageFilenames: ["188-piece toy race car set-5.png"],
    description: "A sleek, aerodynamically styled high-speed friction racing car inspired by legendary Japanese mini 4WD tournament buggies like Buster Sonic and Max Breaker. Features an aggressive front splitter, side air-intake scoops, oversized rear downforce wing, and smooth low-friction spinning guide rollers. Built with impact-tolerant ABS chassis and colorful graphic decals in Yellow, Blue, Red, and White. Great for competitive carpet racing, tabletop tracks, and collecting.",
    specifications: [
      { key: "Model", value: "188 Plastic Car A" },
      { key: "Style", value: "Mini 4WD Racing Buggy" },
      { key: "Colors", value: "Sonic Yellow, Breaker Blue, Racing Red, White" },
      { key: "Carton Quantity", value: "1,200 pcs" },
      { key: "Features", value: "Downforce spoiler, bumper guide rollers" },
    ],
    tags: ["mini 4wd", "racing car", "toy car", "speed racer"],
    isFeatured: false,
  },
  // 7. Labubu Skateboard Cartoon Table Clock
  {
    name: "Labubu Skateboard Cartoon Table Clock",
    categorySlug: "toys-games",
    subcategory: "Figures & Collectibles",
    price: 700,
    sku: "TOY-FIG-001",
    stock: 240,
    imageFilenames: ["Cartoon Bunny Clock and Packaging.png"],
    description: "A delightful novelty table clock combining a decorative Labubu character mounted on a rolling mini skateboard base. Features an easy-to-read analog dial with bold Arabic numerals, precise quartz clock movement, and silent sweeping second hand that won't disrupt sleep or study. Operates on a single standard AA battery. Made from sturdy molded resin in sweet Pink and Warm Brown dungarees. An adorable centerpiece for bedside nightstands, study desks, and children's bedrooms.",
    specifications: [
      { key: "Movement", value: "Accurate Quartz Silent Sweep" },
      { key: "Power", value: "1x AA Battery (not included)" },
      { key: "Colors", value: "Warm Brown, Pastel Pink" },
      { key: "Carton Quantity", value: "240 pcs" },
      { key: "Design", value: "Labubu mascot on movable skateboard deck" },
    ],
    tags: ["labubu", "table clock", "desk decor", "cartoon clock", "kids clock"],
    isFeatured: true,
  },
  // 8. SQ Clock M (Square Animal Desk Clock)
  {
    name: "SQ Clock M (Square Animal Bedside & Desk Clock)",
    categorySlug: "home-living",
    subcategory: "Clocks & Home Decor",
    price: 625,
    sku: "HOM-CLK-001",
    stock: 100,
    imageFilenames: ["Cute Pastel Cartoon Clock Trio.png"],
    description: "A charming square analog desktop clock with a soft-touch matte pastel casing and rounded corners. Features hand-drawn Nordic animal illustrations in three soft colorways: Mint Green (Lovely Little Owl), Sky Blue (Lovely Little Fox), and Soft Peach Pink (Lovely Fawn). The crystal-clear front lens covers bold Arabic numerals with distinct hour, minute, and second hands driven by a silent quartz movement that operates without ticking noises. Compact footprint makes it ideal for study desks, nightstands, and bookshelf styling.",
    specifications: [
      { key: "Model", value: "SQ Clock M" },
      { key: "Designs", value: "Little Owl (Green), Little Fox (Blue), Fawn (Pink)" },
      { key: "Movement", value: "Silent non-ticking quartz" },
      { key: "Carton Quantity", value: "100 pcs" },
    ],
    tags: ["desk clock", "bedside clock", "animal clock", "study room decor"],
    isFeatured: false,
  },
  // 9. Glass Marbles Net Bag Pack
  {
    name: "Glass Marbles Net Bag Pack",
    categorySlug: "toys-games",
    subcategory: "Kids Activities & Games",
    price: 225,
    sku: "TOY-GAM-001",
    stock: 100,
    imageFilenames: ["Mesh sack of colorful glass marbles-1.png"],
    description: "A nostalgic collection of heavy, premium-grade solid glass playing marbles packaged in a durable reusable drawstring mesh net. Each marble features crystal clarity with vibrant internal tri-color cat-eye swirls in greens, blues, oranges, and yellows. Flawlessly polished surfaces ensure effortless rolling on smooth floors, marble tracks, and sand pits. Ideal for traditional marble games, marble run maze toys, board game replacement pieces, sensory bins, and decorative vase fillers.",
    specifications: [
      { key: "Material", value: "High-grade tempered solid glass" },
      { key: "Design", value: "Tri-Color Cat Eye Swirl" },
      { key: "Packaging", value: "Mesh Net Bag with hang tag" },
      { key: "Carton Quantity", value: "100 packs" },
    ],
    tags: ["marbles", "glass marbles", "classic games", "vintage toys"],
    isFeatured: false,
  },
  // 10. Glitter Balloon Shine Spray (450ml)
  {
    name: "Glitter Balloon Shine Spray (450ml)",
    categorySlug: "party-celebrations",
    subcategory: "Party Supplies & Effects",
    price: 750,
    sku: "PRT-EFF-001",
    stock: 48,
    imageFilenames: ["Glitter Balloon Shine Spray Cans.png"],
    description: "Professional-grade aerosol balloon polish formulated for event planners, balloon artists, and decorators. Instantly coats latex, foil, and bobo balloons with an ultra-high-gloss reflective sheen infused with fine sparkling shimmer particles. Acts as an antioxidant protective sealant that prevents balloon oxidation, cloudiness, and chalky fading caused by indoor lighting and outdoor sunlight. Fast-drying, non-sticky, odorless, and requires no wiping or rubbing—just spray evenly from 15–20cm away.",
    specifications: [
      { key: "Volume", value: "450ml Aerosol Can" },
      { key: "Finish", value: "High-Gloss with Shimmer Glitter Particles" },
      { key: "Protection", value: "Anti-oxidation sealant against dullness" },
      { key: "Carton Quantity", value: "48 cans" },
    ],
    tags: ["balloon spray", "balloon shine", "party decor", "glitter spray"],
    isFeatured: true,
  },
  // 11. Extra 88 Artificial Snow Spray Can
  {
    name: "Extra 88 Celebration Artificial Snow Spray Can",
    categorySlug: "party-celebrations",
    subcategory: "Party Supplies & Effects",
    price: 125,
    sku: "PRT-EFF-002",
    stock: 48,
    imageFilenames: ["Snow spray aerosol can set-13.png"],
    description: "A holiday celebration aerosol spray that shoots thick, realistic white artificial snow foam. Formulated with a safe, non-toxic, eco-friendly recipe suitable for decorating Christmas trees, shop front glass windows, nativity displays, holiday wreaths, and party photo booths. Leaves a clean frosty snowflake texture that easily wipes clean from non-porous surfaces with a damp cloth after festivities conclude.",
    specifications: [
      { key: "Model", value: "Extra 88 Snow Spray" },
      { key: "Effect", value: "Realistic White Snow Foam Texture" },
      { key: "Safety", value: "Non-toxic, safe aerosol formula" },
      { key: "Carton Quantity", value: "48 cans" },
      { key: "Cleanup", value: "Wipes clean with damp cloth" },
    ],
    tags: ["snow spray", "christmas decor", "party spray", "winter celebration"],
    isFeatured: false,
  },
  // 12. Rose Model Party Popper
  {
    name: "Rose Model Party Popper (Rose Petal Confetti Cannon)",
    categorySlug: "party-celebrations",
    subcategory: "Party Supplies & Effects",
    price: 250,
    sku: "PRT-EFF-003",
    stock: 100,
    imageFilenames: ["Rose Model party popper cutout-11.png"],
    description: "A celebratory spring-twist confetti cannon loaded with hundreds of deep crimson silk fabric rose petals. Operating without gunpowder, it uses a high-tension internal mechanical spring mechanism: simply hold the upper barrel firmly, twist the base counterclockwise, and watch a dramatic shower of romantic rose petals shoot 2 to 3 meters into the air. Specially designed for weddings, marriage proposals, anniversary dinners, birthday entries, and romantic photo shoots.",
    specifications: [
      { key: "Mechanism", value: "Twist Action Mechanical Spring (No Gunpowder)" },
      { key: "Contents", value: "Silken Crimson Red Rose Petals" },
      { key: "Shoot Height", value: "Approx. 2.5 to 3.5 meters" },
      { key: "Carton Quantity", value: "100 pcs" },
    ],
    tags: ["party popper", "confetti cannon", "rose petals", "wedding decor", "anniversary"],
    isFeatured: true,
  },
  // 13. Birthday Paper Cone Party Hats (12 Pcs Pack)
  {
    name: "Birthday Paper Cone Party Hats (12 Pcs Value Pack)",
    categorySlug: "party-celebrations",
    subcategory: "Party Supplies & Effects",
    price: 360,
    sku: "PRT-HAT-001",
    stock: 1200,
    imageFilenames: ["Packaged birthday party hat assortment-3.png"],
    description: "A festive 12-piece pack of classic conical birthday party hats made from glossy, heavy-cardboard stock. Printed in an assortment of vibrant party colors featuring cheerful 'Happy Birthday' typography, birthday cakes, balloons, and confetti motifs. Each hat is pre-fitted with a soft, durable white elastic chin cord that stays comfortably in place on both children and adults. Packaged flat in a clear protective polybag to prevent creasing.",
    specifications: [
      { key: "Pack Size", value: "12 Hats per retail pack" },
      { key: "Material", value: "Gloss-laminated stiff paperboard" },
      { key: "Fastener", value: "Elastic white chin string" },
      { key: "Carton Quantity", value: "100 Dozen (1,200 pcs)" },
    ],
    tags: ["party hats", "birthday hats", "cone hats", "party supplies"],
    isFeatured: false,
  },
  // 14. Pong Pung Cheering Pom Poms
  {
    name: "Pong Pung Cheering Pom Poms (With Finger Grip)",
    categorySlug: "party-celebrations",
    subcategory: "Party Supplies & Effects",
    price: 125,
    sku: "PRT-POM-001",
    stock: 600,
    imageFilenames: ["Pong Punch party popper cutout-10.png"],
    description: "High-density metallic foil tinsel pom poms designed for sports tournaments, cheerleading squads, school sports meets, carnivals, and cultural festival cheering. Features hundreds of shimmering metallic foil ribbons attached to an ergonomic white plastic two-finger baton handle for a non-slip, secure grip during vigorous choreography and cheer routines. Available in six electric metallic shades: Gold, Crimson Red, Magenta Pink, Silver, Emerald Green, and Royal Blue.",
    specifications: [
      { key: "Material", value: "Reflective Metallic Foil Ribbon" },
      { key: "Handle", value: "Molded Plastic Double-Finger Grip Baton" },
      { key: "Colors", value: "Gold, Red, Magenta, Silver, Green, Blue" },
      { key: "Carton Quantity", value: "600 pcs" },
    ],
    tags: ["cheerleading", "pom poms", "sports meet", "party cheer"],
    isFeatured: false,
  },
  // 15. Electric Balloon Pump Kit (Model 73005)
  {
    name: "Electric Balloon Pump Kit (Model 73005 - 600W Dual Nozzle)",
    categorySlug: "party-celebrations",
    subcategory: "Party Supplies & Effects",
    price: 2850,
    sku: "PRT-PMP-001",
    stock: 12,
    imageFilenames: ["Pink electric balloon pump kit-14.png"],
    description: "A professional-grade high-power electric balloon blower designed to inflate hundreds of latex party balloons in minutes. Powered by a heavy-duty 600W copper-wound motor delivering rapid high-pressure airflow. Features dual inflation ports: one blue push-down touch-activated switch nozzle for precise single-balloon control, and one continuous rocker-switch nozzle for high-volume rapid inflation. Comes complete with 2 blue and 2 magenta extension adapter tips for small 5-inch balloons and water balloons, plus an integrated cable hiding compartment.",
    specifications: [
      { key: "Model", value: "73005 Electric Balloon Pump" },
      { key: "Voltage / Power", value: "AC 220V–240V 50Hz, 600W High Efficiency" },
      { key: "Nozzles", value: "Dual Air Ports (Manual Press + Continuous Mode)" },
      { key: "Accessories", value: "4 Narrow Extension Adapter Tips Included" },
      { key: "Noise Level", value: "<=85dB with safety cooling vents" },
    ],
    tags: ["balloon pump", "electric inflator", "party equipment", "balloon kit"],
    isFeatured: true,
  },
  // 16. 12 PCS Cup & Saucer Set - Printed 2413 (Black & Gold Marble)
  {
    name: "12 PCS Cup & Saucer Set - Printed 2413 (Black & Gold Marble Ceramic)",
    categorySlug: "home-living",
    subcategory: "Dining & Tableware",
    price: 3600,
    sku: "HOM-DIN-001",
    stock: 12,
    imageFilenames: [
      "Marble Gold Espresso Set in Gift Box.png",
      "Boxed 12-piece tea cup and saucer set-18.png"
    ],
    description: "A 12-piece tea and espresso service set manufactured from high-fired, chip-resistant porcelain ceramic. Includes 6 coffee cups (approx. 180ml) and 6 matching circular saucers finished with an Italian Carrara-inspired black-and-gold marbleized glaze and delicate gold leaf rim detailing. Ergonomic loop handles provide balance when serving hot tea, cappuccino, or espresso. Presented in a luxury partitioned black marble presentation box with a clear display window, making it a high-end wedding, housewarming, or corporate gift.",
    specifications: [
      { key: "Set Composition", value: "6 Ceramic Cups + 6 Matching Saucers (12 Pieces Total)" },
      { key: "Model Number", value: "Printed 2413" },
      { key: "Finish", value: "Black & Gold Veined Marble Glaze with Gold Rims" },
      { key: "Packaging", value: "Custom Gold Foil Marble Gift Box with Clear Window" },
      { key: "Carton Quantity", value: "12 gift sets" },
    ],
    tags: ["cup and saucer", "tea set", "coffee cups", "ceramic tableware", "gift box"],
    isFeatured: true,
  },
  // 17. Exquisite Fruit Plate & Serving Tray Set 3 PCS
  {
    name: "Exquisite Fruit Plate & Serving Tray Set 3 PCS (Model 6890-1)",
    categorySlug: "home-living",
    subcategory: "Dining & Tableware",
    price: 3600,
    sku: "HOM-DIN-002",
    stock: 40,
    imageFilenames: ["Exquisite Fruit Plate Set.png"],
    description: "A set of 3 nesting round serving platters crafted from food-safe, high-grade melamine composite. Each tray is decorated with fine gold botanical butterfly and floral line art on high-gloss pastel bases (Midnight Black, Ivory White, and Powder Rose). Designed with integrated curved dual carry handles for safe, spill-free transport of fruits, desserts, pastries, mocktails, and appetizers. Easy to wipe clean, stain-resistant, and stacks compactly for space-saving kitchen storage.",
    specifications: [
      { key: "Model", value: "6890-1 Exquisite Fruit Plate" },
      { key: "Pieces", value: "3 Nesting Serving Trays with Integrated Handles" },
      { key: "Colors Included", value: "Midnight Black, Pure White, Rose Pink" },
      { key: "Design", value: "Gold Floral & Butterfly Filigree Border" },
      { key: "Carton Quantity", value: "40 sets" },
    ],
    tags: ["fruit plate", "serving tray", "tableware", "serving platter"],
    isFeatured: false,
  },
  // 18. DAD 5F 5-Tier Foldable Storage Rack with Wheels
  {
    name: "DAD 5F 5-Tier Foldable Carbon Steel Storage Rack with Wheels",
    categorySlug: "home-living",
    subcategory: "Furniture & Storage",
    price: 17080,
    sku: "HOM-STR-001",
    stock: 6,
    imageFilenames: ["Black Five-Tier Kitchen Rack with Appliances.png"],
    description: "A multi-purpose heavy-duty storage shelving unit built from commercial-grade carbon steel with an anti-rust matte black powder-coat finish. Features an accordion-folding frame that unfolds in under 20 seconds with zero tools required. Equipped with 5 reinforced perforated shelves (each supporting up to 40kg) and side cross-brace wire mesh to prevent items from falling. Rolls effortlessly on four 360-degree silent industrial caster wheels (2 with foot locks) for mobility. Ideal for kitchen appliances (microwaves, air fryers), pantry storage, garage tools, and retail merchandise displays.",
    specifications: [
      { key: "Model", value: "DAD 5F Folding Utility Rack" },
      { key: "Tiers", value: "5 Spacious Heavy-Duty Perforated Shelves" },
      { key: "Material", value: "Thickened Carbon Steel with Powder-Coat Finish" },
      { key: "Mobility", value: "4 Swivel Caster Wheels with 2 Foot Brakes" },
      { key: "Assembly", value: "Pre-assembled folding frame (under 1 minute setup)" },
      { key: "Carton Quantity", value: "6 units" },
    ],
    tags: ["storage rack", "kitchen rack", "bakers rack", "foldable shelf", "utility cart"],
    isFeatured: true,
  },
  // 19. Modern Industrial Steel Stool - Kayu Muda-Gold
  {
    name: "Modern Industrial Steel Stool - Kayu Muda-Gold",
    categorySlug: "home-living",
    subcategory: "Furniture & Storage",
    price: 2240,
    sku: "HOM-FUR-001",
    stock: 15,
    imageFilenames: ["Steel stool with wooden seat-4.png"],
    description: "A minimalist Scandinavian-style accent stool measuring 46cm high with a 35cm x 35cm footprint. Combines a warm natural oak-grain engineered timber seat with a heavy-gauge tubular steel frame powder-coated in a warm champagne gold lacquer. Welded lower perimeter square footrest bars provide structural stability and leg comfort. Fitted with non-marking white rubber floor glides to prevent scratching on tile or hardwood floors. Perfect for dining counters, breakfast bars, dressing tables, boutique retail seating, and balcony lounges.",
    specifications: [
      { key: "Dimensions", value: "46cm (Height) x 35cm (Width) x 35cm (Depth)" },
      { key: "Frame Finish", value: "Electrostatic Champagne Gold Powder Coating" },
      { key: "Seat Top", value: "Warm Oak Woodgrain Finish (Kayu Muda)" },
      { key: "Floor Protection", value: "Anti-Scratch Rubber Glides" },
      { key: "Carton Quantity", value: "15 stools" },
    ],
    tags: ["steel stool", "bar stool", "dining stool", "gold stool", "accent chair"],
    isFeatured: false,
  },
  // 20. Heavy Duty Foldable Step Ladder
  {
    name: "Heavy Duty Foldable Step Ladder (Model 8935)",
    categorySlug: "home-living",
    subcategory: "Furniture & Storage",
    price: 8935,
    sku: "HOM-LAD-001",
    stock: 6,
    imageFilenames: ["Leader.png"],
    description: "An industrial-strength A-frame home and office step ladder fabricated from cold-rolled carbon steel tubing in an eye-catching Crimson Red finish. Features extra-wide platform steps (18cm step rise) fitted with embossed, anti-slip ribbed rubber treads. The curved top safety handrail is cushioned with soft black EVA foam for comfortable leg bracing at high working levels. Solid metal locking hinges and flared non-slip rubber feet guarantee zero wobbling under loads up to 150kg. Folds ultra-slim (5cm flat) to slip easily behind doors or inside utility closets.",
    specifications: [
      { key: "Model", value: "Model 8935" },
      { key: "Steps", value: "4-Step / 5-Step Heavy Duty Configuration" },
      { key: "Treads", value: "Extra-Wide Embossed Anti-Slip Rubber Treads" },
      { key: "Handrail", value: "Cushioned EVA Foam Safety Arch Handrail" },
      { key: "Capacity", value: "Rated up to 150kg Working Load" },
      { key: "Carton Quantity", value: "6 units" },
    ],
    tags: ["step ladder", "folding ladder", "household ladder", "maintenance tools"],
    isFeatured: true,
  },
  // 21. Cartoon Stationery Gift Set No. 9921
  {
    name: "Cartoon Stationery Gift Set No. 9921 (Yellow Panda & Bear Theme)",
    categorySlug: "stationery-school",
    subcategory: "Kids Stationery Sets",
    price: 295,
    sku: "STN-SET-001",
    stock: 252,
    imageFilenames: ["Yellow stationery set No. 9916-18.png"],
    description: "A comprehensive 6-in-1 school gift set packaged in a bright yellow carrying case with a die-cut handle. Includes a durable dual-compartment printed tin pencil box with cartoon panda and teddy bear artwork, a standard HB wooden pencil, a 15cm ruler with metric markings, a rotary pencil sharpener with an enclosed shavings chamber, a soft vinyl eraser, and an ergonomic rubber pencil grip trainer to promote correct handwriting posture. Highly recommended as a primary school prize, birthday party favor, or back-to-school gift.",
    specifications: [
      { key: "Model", value: "No. 9921" },
      { key: "Set Contains", value: "Tin Pencil Box, HB Pencil, 15cm Ruler, Sharpener, Eraser, Finger Grip" },
      { key: "Theme", value: "Yellow Panda & Teddy Bear (FOR YOU)" },
      { key: "Packaging", value: "Hang-card with clear blister & carry handle" },
      { key: "Carton Quantity", value: "252 sets" },
    ],
    tags: ["stationery set", "pencil box", "panda theme", "school supplies", "return gift"],
    isFeatured: false,
  },
  // 22. Space Astronaut Stationery Set No. 907
  {
    name: "Space Astronaut Stationery Set No. 907 (Dream Space Edition)",
    categorySlug: "stationery-school",
    subcategory: "Kids Stationery Sets",
    price: 225,
    sku: "STN-SET-002",
    stock: 480,
    imageFilenames: ["Stationery Set No. 907 Product Cutout-20.png"],
    description: "An astronaut-themed blister-pack stationery kit featuring outer space cosmic graphics. Includes 2 HB graphite pencils with planetary wrap-around prints, a molded rocket astronaut rubber eraser that cleanly rubs out pencil marks without paper tearing, a compact blue pencil sharpener with carbon-steel blade, and a pocket box of 6 vibrant mini wax coloring crayons. Perfect for encouraging drawing, writing, and creative coloring for young boys and girls.",
    specifications: [
      { key: "Model", value: "No. 907 Dream Space" },
      { key: "Set Contains", value: "2x Pencils, 6-Color Crayon Pack, Astronaut Eraser, Sharpener" },
      { key: "Theme", value: "Space Galaxy & Astronaut" },
      { key: "Carton Quantity", value: "480 sets" },
    ],
    tags: ["space stationery", "astronaut pencil", "crayons", "school kit"],
    isFeatured: false,
  },
  // 23. Sweet Bunny Kids Stationery Set
  {
    name: "Sweet Bunny Kids Stationery Set with Coin Purse",
    categorySlug: "stationery-school",
    subcategory: "Kids Stationery Sets",
    price: 240,
    sku: "STN-SET-003",
    stock: 480,
    imageFilenames: ["Colorful stationery set No. 9916-17.png"],
    description: "An adorable pastel pink back-to-school gift set starring a sweet winged bunny character. Contains 4 pink HB graphic pencils with eraser toppers, a pink zip-around coin wallet pouch, a printed bunny vinyl eraser, a safety pencil sharpener, and a cute heart-shaped decorative sharpener. Designed for little girls as an irresistible party favor, prize, or daily school companion.",
    specifications: [
      { key: "Set Contains", value: "4x Eraser-Tip Pencils, Zipper Wallet Pouch, Eraser, 2x Sharpeners" },
      { key: "Theme", value: "Sweet Winged Bunny & Strawberries" },
      { key: "Color", value: "Soft Pastel Pink" },
      { key: "Carton Quantity", value: "480 sets" },
    ],
    tags: ["bunny stationery", "pink school kit", "pencil pouch", "kids gift"],
    isFeatured: false,
  },
  // 24. Portable Desktop Fan
  {
    name: "Portable Desktop Fan (Ultra-Thin Folding Stand)",
    categorySlug: "electronics-gadgets",
    subcategory: "Fans & Cooling",
    price: 475,
    sku: "ELC-FAN-001",
    stock: 100,
    imageFilenames: ["Pastel Lavender Portable Fan Cutout.png"],
    description: "A square personal cooling fan engineered for quiet, energy-efficient airflow. Powered directly via a 5V USB cable compatible with laptops, power banks, USB wall adapters, and car chargers. Features an aerodynamic multi-blade impeller encased behind a narrow-grille safety baffle, driven by a brushless DC motor that operates whisper-quiet under 30dB. Built with a 180-degree fold-out rear kickstand that allows multi-angle airflow on desks or folds flat into a backpack. Available in 4 soft matte pastel colors: Lilac Purple, Baby Pink, Clean White, and Mint Green.",
    specifications: [
      { key: "Power", value: "5V USB Cable Powered (Compatible with PC/Power Bank)" },
      { key: "Noise Level", value: "< 30dB Whisper-Quiet Operation" },
      { key: "Form Factor", value: "Ultra-Thin Square with 180° Foldable Kickstand" },
      { key: "Colors", value: "Lavender Purple, Pastel Pink, Pure White, Mint Green" },
      { key: "Carton Quantity", value: "100 pcs" },
    ],
    tags: ["desk fan", "usb fan", "mini fan", "quiet fan", "office cooling"],
    isFeatured: true,
  },
  // 25. Mini Handheld Fan (Daisy Flower Accent)
  {
    name: "Mini Handheld Fan (Daisy Flower Accent with Removable Stand)",
    categorySlug: "electronics-gadgets",
    subcategory: "Fans & Cooling",
    price: 450,
    sku: "ELC-FAN-002",
    stock: 100,
    imageFilenames: ["Bright Yellow and Green Mini Fan.png"],
    description: "A portable rechargeable pocket fan with a cheerful daisy flower center hub and two-tone color blocking. Powered by an integrated lithium-ion rechargeable battery chargeable via standard Micro-USB. Measures 15cm tall and weighs only 110 grams. Comes with a matching detachable desk dock base, allowing hands-free cooling on study desks, dining tables, or office workstations, as well as handheld cooling outdoors in warm weather. Available in Sunshine Yellow, Petal Pink, Leaf Green, and Soft Purple.",
    specifications: [
      { key: "Battery", value: "Built-In Rechargeable Lithium Battery" },
      { key: "Height", value: "15cm Compact Ergonomic Handle" },
      { key: "Docking", value: "Detachable Circular Desk Stand Base Included" },
      { key: "Colors", value: "Sunshine Yellow, Petal Pink, Forest Green, Pastel Purple" },
      { key: "Carton Quantity", value: "100 pcs" },
    ],
    tags: ["handheld fan", "pocket fan", "rechargeable fan", "flower fan", "portable cooler"],
    isFeatured: false,
  },
  // 26. Gold & Silver Plated Granted Charm Bracelet
  {
    name: "Gold & Silver Plated Granted Charm Bracelet (European Pandora Style)",
    categorySlug: "fashion-accessories",
    subcategory: "Jewelry & Accessories",
    price: 1250,
    sku: "FSH-JWL-001",
    stock: 240,
    imageFilenames: ["Gold and Silver Plated Bracelet Set-14.png"],
    description: "A European-inspired charm bracelet crafted around a flexible woven snake chain with a secure barrel clasp. Adorned with interchangeable charms including pavé-set sparkling cubic zirconia crystal hearts, enamel floral blossoms, dangling bees, and multifaceted glass beads. Electroplated with an anti-tarnish protective lacquer in both 18K Yellow Gold and Platinum Silver finishes. Hypoallergenic, nickel-free, and presented in a clear acrylic presentation jewelry box with velvet insert.",
    specifications: [
      { key: "Chain Style", value: "European Woven Snake Chain with Clip Clasp" },
      { key: "Charms", value: "Pave Crystal Hearts, Enamel Daisies, Sparkling Spacers" },
      { key: "Plating", value: "High-Luster Anti-Tarnish Gold & Silver Plating" },
      { key: "Presentation", value: "Individual Velvet Padded Acrylic Box" },
      { key: "Carton Quantity", value: "240 pcs" },
    ],
    tags: ["charm bracelet", "pandora style", "women jewelry", "bangle", "gift for her"],
    isFeatured: true,
  },
];

async function runImport() {
  const { connectDB } = await import("../src/lib/db");
  const { Category } = await import("../src/models/Category");
  const { Product } = await import("../src/models/Product");
  const { uploadFile, isR2Configured } = await import("../src/lib/r2");

  console.log("=== STARTING IMPORT OF REAL PRODUCTS WITH CLOUDFLARE R2 ===");
  console.log(`Cloudflare R2 configured: ${isR2Configured ? "YES" : "NO (local fallback)"}`);

  await connectDB();
  console.log("Connected to MongoDB database.");

  // 1. Setup / Update Categories and their clean subcategories
  console.log("\n1. Ensuring Categories and Subcategories...");
  const categoryMap = new Map<string, mongoose.Types.ObjectId>();

  for (const catDef of CATEGORY_DEFINITIONS) {
    let category = await Category.findOne({ slug: catDef.slug });
    if (!category) {
      category = await Category.create({
        name: catDef.name,
        slug: catDef.slug,
        description: catDef.description,
        isActive: true,
        subcategories: catDef.subcategories,
      });
      console.log(`+ Created category: "${catDef.name}" (${catDef.slug})`);
    } else {
      category.name = catDef.name;
      category.description = catDef.description;
      category.isActive = true;
      category.subcategories = catDef.subcategories as any;
      await category.save();
      console.log(`✓ Updated category & subcategories: "${catDef.name}" (${catDef.slug})`);
    }
    categoryMap.set(catDef.slug, category._id as mongoose.Types.ObjectId);
  }

  // 2. Remove all existing demo products from MongoDB
  console.log("\n2. Removing existing demo products from MongoDB...");
  const deleteResult = await Product.deleteMany({});
  console.log(`✓ Removed ${deleteResult.deletedCount} old products.`);

  // 3. Upload images to R2 and insert each product
  console.log("\n3. Uploading images to Cloudflare R2 and creating products...");
  const oriImagesDir = path.join(process.cwd(), "OriImage");

  let createdCount = 0;
  for (const item of REAL_PRODUCTS) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) {
      console.error(`Error: Category not found for slug "${item.categorySlug}"`);
      continue;
    }

    const uploadedUrls: string[] = [];
    const uploadedKeys: string[] = [];

    for (const filename of item.imageFilenames) {
      const filePath = path.join(oriImagesDir, filename);
      try {
        const fileBuffer = await fs.readFile(filePath);
        const ext = path.extname(filename).toLowerCase();
        const contentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

        console.log(`  Uploading "${filename}" to R2...`);
        const uploadRes = await uploadFile(fileBuffer, filename, contentType, "products");
        uploadedUrls.push(uploadRes.url);
        uploadedKeys.push(uploadRes.key);
        console.log(`   -> Uploaded: ${uploadRes.url}`);
      } catch (err: any) {
        console.error(`   Failed to upload image "${filename}":`, err.message);
      }
    }

    const slug = slugify(item.name);

    await Product.create({
      name: item.name,
      slug,
      description: item.description,
      category: categoryId,
      subcategory: item.subcategory,
      price: item.price,
      salePrice: item.salePrice || null,
      sku: item.sku,
      images: uploadedUrls,
      imageKeys: uploadedKeys,
      specifications: item.specifications,
      tags: item.tags,
      stock: item.stock,
      lowStockThreshold: Math.min(10, Math.floor(item.stock * 0.2)),
      status: "active",
      isFeatured: Boolean(item.isFeatured),
      totalSold: 0,
    });

    createdCount++;
    console.log(`+ Added Product [${createdCount}/${REAL_PRODUCTS.length}]: ${item.name} (${item.sku}) - LKR ${item.price}`);
  }

  console.log(`\n========================================`);
  console.log(`SUCCESS! Inserted ${createdCount} real products into MongoDB.`);
  console.log(`========================================`);

  await mongoose.disconnect();
}

runImport().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
