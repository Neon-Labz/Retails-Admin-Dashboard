import "dotenv/config";
import mongoose from "mongoose";
import { slugify, generateSku } from "../src/lib/utils";

const MONGODB_URI = process.env.DATABASE_URL!;

// ---------------------------------------------------------------------------
// Inline minimal models (avoid Next.js server-only imports)
// ---------------------------------------------------------------------------
const categorySchema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    description: String,
    image: String,
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } },
);

const productSchema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    description: String,
    shortDescription: String,
    price: String,
    compareAtPrice: String,
    categoryId: mongoose.Types.ObjectId,
    images: [String],
    stock: Number,
    sku: { type: String, unique: true },
    brand: String,
    featured: { type: Boolean, default: false },
    rating: String,
    reviewCount: Number,
    tags: [String],
    attributes: { type: Map, of: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
type SeedProduct = {
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  stock: number;
  brand: string;
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  attributes?: Record<string, string>;
};

type SeedCategory = {
  name: string;
  description: string;
  image: string;
  products: SeedProduct[];
};

const PX = (id: string) =>
  `https://images.pexels.com/photos/${id}?auto=compress&cs=tinysrgb&dpr=2&h=900&w=900`;

const SEED: SeedCategory[] = [
  {
    name: "Electronics",
    description: "Bulk-priced gadgets, audio gear and cameras sourced directly from manufacturers.",
    image: PX("3394653"),
    products: [
      {
        name: "AeroSound Wireless Headphones",
        shortDescription: "Over-ear wireless headphones with 30-hour battery life.",
        description: "AeroSound Wireless Headphones deliver crisp, immersive audio with active noise cancellation and plush memory-foam ear cushions. Bought in bulk directly from the manufacturer, we pass the wholesale savings on to you. Includes USB-C fast charging and a 30-hour battery life for all-day listening.",
        price: 59.99, compareAtPrice: 89.99,
        images: [PX("3394653"), PX("3394651")], stock: 140, brand: "AeroSound",
        featured: true, rating: 4.7, reviewCount: 212,
        tags: ["audio", "wireless", "bestseller"],
        attributes: { Color: "White", Connectivity: "Bluetooth 5.3", Warranty: "1 year" },
      },
      {
        name: "AeroSound Studio Headphone Case Bundle",
        shortDescription: "Wireless headphones bundled with a protective hard case.",
        description: "The complete bundle for audio enthusiasts — our best-selling wireless headphones paired with a rugged hard-shell carrying case.",
        price: 69.99, compareAtPrice: 94.99,
        images: [PX("3394651"), PX("3394653")], stock: 95, brand: "AeroSound",
        rating: 4.6, reviewCount: 98, tags: ["audio", "bundle"],
        attributes: { Color: "White", Includes: "Carrying case" },
      },
      {
        name: "DataVault 128GB USB-C Flash Drive",
        shortDescription: "High-speed USB-C flash drive for backups and transfers.",
        description: "Transfer files at blazing speeds with the DataVault 128GB flash drive.",
        price: 14.99, images: [PX("18641665")], stock: 320, brand: "DataVault",
        rating: 4.4, reviewCount: 156, tags: ["storage", "accessories"],
        attributes: { Capacity: "128GB", Interface: "USB-C 3.2" },
      },
      {
        name: "SnapShot Instant Print Camera",
        shortDescription: "Retro-style instant camera that prints photos in seconds.",
        description: "Capture and print memories instantly with the SnapShot Instant Print Camera.",
        price: 54.5, compareAtPrice: 69.99, images: [PX("16045125")], stock: 60, brand: "SnapShot",
        featured: true, rating: 4.5, reviewCount: 74, tags: ["camera", "gift"],
        attributes: { "Film Type": "Instax Mini", Flash: "Automatic" },
      },
      {
        name: "TrailWatch Outdoor Motion Camera",
        shortDescription: "Weatherproof trail camera with motion detection.",
        description: "Monitor wildlife or secure your property with the TrailWatch Outdoor Motion Camera.",
        price: 89.0, images: [PX("821653")], stock: 40, brand: "TrailWatch",
        rating: 4.3, reviewCount: 41, tags: ["outdoor", "security"],
        attributes: { "Night Vision": "Infrared", "Water Resistance": "IP66" },
      },
      {
        name: "ProLens DSLR Camera Body",
        shortDescription: "Entry-level DSLR camera body for aspiring photographers.",
        description: "Step up your photography game with the ProLens DSLR Camera Body.",
        price: 349.0, compareAtPrice: 429.0, images: [PX("37428369"), PX("1203819")], stock: 18, brand: "ProLens",
        rating: 4.8, reviewCount: 63, tags: ["camera", "photography"],
        attributes: { Sensor: "APS-C 24MP", Mount: "Standard EF" },
      },
    ],
  },
  {
    name: "Home & Kitchen",
    description: "Appliances and kitchenware bought bulk from trusted suppliers.",
    image: PX("36573009"),
    products: [
      {
        name: "BrewCraft Espresso Machine",
        shortDescription: "15-bar espresso machine with milk frother.",
        description: "Brew café-quality espresso at home with the BrewCraft Espresso Machine.",
        price: 189.99, compareAtPrice: 249.99, images: [PX("36573009")], stock: 35, brand: "BrewCraft",
        featured: true, rating: 4.6, reviewCount: 120, tags: ["kitchen", "coffee"],
        attributes: { Pressure: "15 bar", Capacity: "1.2L" },
      },
      {
        name: "Nordic Ceramic Serving Tray Set",
        shortDescription: "Set of 3 minimalist ceramic serving trays.",
        description: "Elevate your table setting with this set of 3 Nordic-inspired ceramic serving trays.",
        price: 32.0, images: [PX("3756655")], stock: 85, brand: "Nordic Home",
        rating: 4.5, reviewCount: 54, tags: ["kitchen", "tableware"],
        attributes: { Material: "Ceramic", "Set Size": "3 pieces" },
      },
      {
        name: "GrindMaster Precision Coffee Grinder",
        shortDescription: "Conical burr grinder with 18 grind settings.",
        description: "Achieve the perfect grind every time with the GrindMaster Precision Coffee Grinder.",
        price: 45.0, compareAtPrice: 59.99, images: [PX("6007666")], stock: 70, brand: "GrindMaster",
        rating: 4.4, reviewCount: 88, tags: ["kitchen", "coffee"],
        attributes: { Settings: "18", "Hopper Capacity": "250g" },
      },
      {
        name: "GrindMaster Electric Bean Grinder Pro",
        shortDescription: "High-capacity electric burr grinder for home or office.",
        description: "Our best commercial-grade electric bean grinder built for high-volume brewing.",
        price: 65.0, images: [PX("20557063")], stock: 42, brand: "GrindMaster",
        rating: 4.6, reviewCount: 39, tags: ["kitchen", "coffee"],
        attributes: { Burrs: "Stainless steel", Capacity: "500g" },
      },
    ],
  },
  {
    name: "Groceries & Beverages",
    description: "Pantry staples, snacks and drinks sold in money-saving bulk packs.",
    image: PX("35740586"),
    products: [
      {
        name: "Gourmet Canned Delicacies Pack",
        shortDescription: "Assorted gourmet canned goods, 12-pack.",
        description: "A curated 12-can assortment of gourmet pantry staples.",
        price: 28.5, images: [PX("35740586")], stock: 150, brand: "PantryCo",
        rating: 4.3, reviewCount: 46, tags: ["grocery", "pantry"],
        attributes: { "Pack Size": "12 cans", "Shelf Life": "24 months" },
      },
      {
        name: "Ocean Catch Sardines Variety Pack",
        shortDescription: "Wild-caught sardines in a convenient multi-pack.",
        description: "Stock your pantry with protein-rich wild-caught sardines.",
        price: 19.99, images: [PX("6901810")], stock: 180, brand: "Ocean Catch",
        rating: 4.2, reviewCount: 61, tags: ["grocery", "seafood"],
        attributes: { "Pack Size": "8 tins", Protein: "High" },
      },
      {
        name: "FizzPop Soda Cans Multipack",
        shortDescription: "24-can multipack of refreshing soda.",
        description: "Keep the fridge stocked with FizzPop's refreshing soda.",
        price: 15.99, compareAtPrice: 21.99, images: [PX("11942010"), PX("11942004")], stock: 220, brand: "FizzPop",
        featured: true, rating: 4.1, reviewCount: 133, tags: ["grocery", "beverage"],
        attributes: { "Pack Size": "24 cans", Volume: "330ml each" },
      },
      {
        name: "Orchard Fresh Juice Jars Pack",
        shortDescription: "Cold-pressed juice in reusable glass jars, pack of 6.",
        description: "Enjoy the natural taste of cold-pressed fruit juice bottled in reusable glass jars.",
        price: 24.0, images: [PX("34270746")], stock: 90, brand: "Orchard Fresh",
        rating: 4.5, reviewCount: 37, tags: ["grocery", "beverage", "organic"],
        attributes: { "Pack Size": "6 jars", Volume: "500ml each" },
      },
    ],
  },
  {
    name: "Fashion & Apparel",
    description: "Footwear and accessories purchased in bulk from apparel suppliers.",
    image: PX("27988923"),
    products: [
      {
        name: "StrideFlex Running Sneakers — Silver",
        shortDescription: "Lightweight running sneakers with breathable mesh.",
        description: "StrideFlex Running Sneakers combine a breathable mesh upper with a responsive cushioned sole.",
        price: 44.99, compareAtPrice: 64.99, images: [PX("27988923")], stock: 110, brand: "StrideFlex",
        featured: true, rating: 4.4, reviewCount: 142, tags: ["footwear", "running"],
        attributes: { Color: "Silver", "Sizes Available": "6-12" },
      },
      {
        name: "StrideFlex Running Sneakers — Copper",
        shortDescription: "Lightweight running sneakers in a bold copper finish.",
        description: "The same comfort and durability as our classic StrideFlex sneaker, now in copper.",
        price: 44.99, images: [PX("27988920")], stock: 95, brand: "StrideFlex",
        rating: 4.3, reviewCount: 58, tags: ["footwear", "running"],
        attributes: { Color: "Copper", "Sizes Available": "6-12" },
      },
      {
        name: "StrideFlex Running Sneakers — Purple",
        shortDescription: "Lightweight running sneakers in vibrant purple.",
        description: "Add a pop of color to your workout wardrobe with these vibrant purple StrideFlex sneakers.",
        price: 44.99, images: [PX("27988922")], stock: 70, brand: "StrideFlex",
        rating: 4.5, reviewCount: 49, tags: ["footwear", "running"],
        attributes: { Color: "Purple", "Sizes Available": "6-12" },
      },
      {
        name: "Winter Essentials Accessory Crate",
        shortDescription: "Bundled crate of winter gloves, hats and scarves.",
        description: "Stay warm for less with this bundled crate of winter accessories.",
        price: 27.5, images: [PX("19411550")], stock: 65, brand: "WarmWear",
        rating: 4.2, reviewCount: 33, tags: ["apparel", "winter", "bundle"],
        attributes: { Includes: "Gloves, hat, scarf", Color: "Blue" },
      },
      {
        name: "Seasonal Accessory Crate — Green",
        shortDescription: "Bundled winter accessory crate in a green colorway.",
        description: "A cozy bundle of seasonal accessories — gloves and a knit hat — in green.",
        price: 25.0, images: [PX("19411552")], stock: 58, brand: "WarmWear",
        rating: 4.1, reviewCount: 21, tags: ["apparel", "winter", "bundle"],
        attributes: { Includes: "Gloves, hat", Color: "Green" },
      },
    ],
  },
  {
    name: "Beauty & Personal Care",
    description: "Skincare and beauty essentials sourced directly from manufacturers.",
    image: PX("31251024"),
    products: [
      {
        name: "GlowDrop Vitamin C Serum Trio",
        shortDescription: "Set of 3 vitamin C dropper serums for radiant skin.",
        description: "Brighten and even your skin tone with the GlowDrop Vitamin C Serum Trio.",
        price: 34.99, compareAtPrice: 49.99, images: [PX("31251024")], stock: 120, brand: "GlowDrop",
        featured: true, rating: 4.6, reviewCount: 97, tags: ["skincare", "serum"],
        attributes: { Volume: "30ml x 3", "Skin Type": "All" },
      },
      {
        name: "PureGlow Toner & Serum Duo",
        shortDescription: "Hydrating facial toner paired with a nourishing serum.",
        description: "This PureGlow duo pairs a refreshing facial toner with a nourishing serum.",
        price: 27.99, images: [PX("20382236")], stock: 88, brand: "PureGlow",
        rating: 4.4, reviewCount: 52, tags: ["skincare", "toner"],
        attributes: { Volume: "100ml + 30ml", "Skin Type": "Normal to dry" },
      },
      {
        name: "VelvetMilk Hydrating Body Lotion",
        shortDescription: "Rich body lotion for 24-hour hydration.",
        description: "VelvetMilk Hydrating Body Lotion absorbs quickly and locks in moisture for up to 24 hours.",
        price: 16.5, images: [PX("4832435")], stock: 140, brand: "VelvetMilk",
        rating: 4.5, reviewCount: 71, tags: ["skincare", "body care"],
        attributes: { Volume: "250ml", Scent: "Light floral" },
      },
      {
        name: "HerbEssence Shampoo Bundle",
        shortDescription: "Natural herbal shampoo bundle, pack of 2.",
        description: "Nourish your hair naturally with the HerbEssence Shampoo Bundle.",
        price: 22.0, images: [PX("18066458")], stock: 100, brand: "HerbEssence",
        rating: 4.3, reviewCount: 64, tags: ["haircare"],
        attributes: { "Pack Size": "2 bottles", Volume: "400ml each" },
      },
      {
        name: "ColorPop Matte Lipstick Collection",
        shortDescription: "Set of 6 long-lasting matte lipsticks.",
        description: "Express yourself with the ColorPop Matte Lipstick Collection — six highly-pigmented shades.",
        price: 29.99, compareAtPrice: 39.99, images: [PX("25533534")], stock: 75, brand: "ColorPop",
        rating: 4.7, reviewCount: 109, tags: ["makeup", "lipstick"],
        attributes: { "Set Size": "6 shades", Finish: "Matte" },
      },
    ],
  },
  {
    name: "Sports & Outdoors",
    description: "Fitness equipment and outdoor gear at wholesale prices.",
    image: "/images/products/dumbbell-set.jpg",
    products: [
      {
        name: "IronCore Rubber Hex Dumbbell Pair",
        shortDescription: "Pair of rubber-coated hex dumbbells for home workouts.",
        description: "Build strength at home with the IronCore Rubber Hex Dumbbell Pair.",
        price: 39.99, images: ["/images/products/dumbbell-set.jpg"], stock: 90, brand: "IronCore",
        featured: true, rating: 4.6, reviewCount: 84, tags: ["fitness", "strength"],
        attributes: { Weight: "10kg pair", Material: "Rubber-coated iron" },
      },
      {
        name: "FlexFit Non-Slip Yoga Mat",
        shortDescription: "Extra-thick non-slip yoga and exercise mat.",
        description: "The FlexFit Yoga Mat offers extra cushioning and a non-slip surface.",
        price: 24.99, compareAtPrice: 34.99, images: ["/images/products/yoga-mat.jpg"], stock: 130, brand: "FlexFit",
        rating: 4.5, reviewCount: 102, tags: ["fitness", "yoga"],
        attributes: { Thickness: "8mm", Color: "Teal" },
      },
      {
        name: "AeroRide Cycling Helmet",
        shortDescription: "Aerodynamic cycling helmet with adjustable fit.",
        description: "Stay safe on every ride with the AeroRide Cycling Helmet.",
        price: 49.99, images: ["/images/products/bike-helmet.jpg"], stock: 60, brand: "AeroRide",
        rating: 4.4, reviewCount: 45, tags: ["cycling", "safety"],
        attributes: { Sizes: "M-L adjustable", Ventilation: "14 vents" },
      },
    ],
  },
  {
    name: "Office & Stationery",
    description: "Everyday office and school supplies in bulk packs.",
    image: PX("13583358"),
    products: [
      {
        name: "ColorStroke Pencil Box Set",
        shortDescription: "Box of 48 premium colored pencils.",
        description: "A vibrant 48-pencil set perfect for schools, offices and creative studios.",
        price: 12.99, images: [PX("18889472")], stock: 200, brand: "ColorStroke",
        rating: 4.5, reviewCount: 66, tags: ["stationery", "art"],
        attributes: { "Set Size": "48 pencils" },
      },
      {
        name: "Executive Pen & Notebook Set",
        shortDescription: "Premium pen paired with a hardcover notebook.",
        description: "Make a statement in meetings with the Executive Pen & Notebook Set.",
        price: 18.5, images: [PX("13583358"), PX("13583360")], stock: 150, brand: "Executive",
        featured: true, rating: 4.6, reviewCount: 58, tags: ["stationery", "office"],
        attributes: { Includes: "1 pen, 1 notebook" },
      },
      {
        name: "Executive Ballpoint Pen 10-Pack",
        shortDescription: "Bulk pack of 10 smooth-writing ballpoint pens.",
        description: "Stock the office or classroom with this bulk 10-pack of smooth, reliable ballpoint pens.",
        price: 9.99, images: [PX("13583360")], stock: 260, brand: "Executive",
        rating: 4.3, reviewCount: 72, tags: ["stationery", "office"],
        attributes: { "Pack Size": "10 pens", "Ink Color": "Black" },
      },
      {
        name: "DeskPro Notebook & Organizer Bundle",
        shortDescription: "Desk organizer bundled with a premium notebook.",
        description: "Keep your workspace tidy with the DeskPro Notebook & Organizer Bundle.",
        price: 21.0, images: [PX("13583359")], stock: 85, brand: "DeskPro",
        rating: 4.4, reviewCount: 29, tags: ["stationery", "office"],
        attributes: { Includes: "Organizer, notebook" },
      },
    ],
  },
  {
    name: "Toys & Baby",
    description: "Toys and baby essentials bought in bulk for families and retailers.",
    image: "/images/products/wooden-blocks.jpg",
    products: [
      {
        name: "BuildJoy Wooden Block Set",
        shortDescription: "100-piece colorful wooden building block set.",
        description: "Spark creativity with the BuildJoy Wooden Block Set — 100 smooth, colorful wooden blocks.",
        price: 29.99, compareAtPrice: 39.99, images: ["/images/products/wooden-blocks.jpg"], stock: 100, brand: "BuildJoy",
        featured: true, rating: 4.8, reviewCount: 120, tags: ["toys", "educational"],
        attributes: { "Piece Count": "100", "Age Range": "3+" },
      },
      {
        name: "CuddleFriends Teddy Bear Plush",
        shortDescription: "Soft and huggable teddy bear plush toy.",
        description: "CuddleFriends Teddy Bear Plush is made with ultra-soft fabric and a gentle fill.",
        price: 15.99, images: ["/images/products/plush-bear.jpg"], stock: 160, brand: "CuddleFriends",
        rating: 4.7, reviewCount: 95, tags: ["toys", "plush"],
        attributes: { Height: "35cm", Material: "Plush polyester" },
      },
      {
        name: "RollEasy All-Terrain Baby Stroller",
        shortDescription: "Lightweight stroller with all-terrain wheels.",
        description: "The RollEasy All-Terrain Baby Stroller combines a lightweight aluminum frame with smooth-rolling wheels.",
        price: 149.0, compareAtPrice: 189.0, images: ["/images/products/baby-stroller.jpg"], stock: 25, brand: "RollEasy",
        rating: 4.6, reviewCount: 48, tags: ["baby", "stroller"],
        attributes: { Weight: "8.5kg", "Recline Positions": "3" },
      },
    ],
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  console.log("Clearing existing catalog...");
  await Product.deleteMany({});
  await Category.deleteMany({});

  for (const cat of SEED) {
    const category = await Category.create({
      name: cat.name,
      slug: slugify(cat.name),
      description: cat.description,
      image: cat.image,
    });

    console.log(`Inserted category: ${category.name}`);

    for (const p of cat.products) {
      await Product.create({
        name: p.name,
        slug: slugify(p.name),
        description: p.description,
        shortDescription: p.shortDescription,
        price: p.price.toFixed(2),
        compareAtPrice: p.compareAtPrice ? p.compareAtPrice.toFixed(2) : null,
        categoryId: category._id,
        images: p.images,
        stock: p.stock,
        sku: generateSku(cat.name.slice(0, 3).toUpperCase()),
        brand: p.brand,
        featured: p.featured ?? false,
        rating: (p.rating ?? 4.5).toFixed(1),
        reviewCount: p.reviewCount ?? 0,
        tags: p.tags ?? [],
        attributes: p.attributes ?? {},
      });
    }
    console.log(`  -> ${cat.products.length} products inserted`);
  }

  console.log("Seeding complete.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
