import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { Category } from "../src/models/Category";
import { Product } from "../src/models/Product";
import { slugify } from "../src/lib/utils";

async function seed20Products() {
  await connectDB();
  console.log("Connected to MongoDB. Setting up categories & subcategories...");

  // 1. Ensure Categories with clean Subcategories
  const categoryDefinitions = [
    {
      name: "Electronics",
      slug: "electronics",
      description: "Cutting-edge gadgets, smart devices, audio, and personal computers.",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80",
      subcategories: [
        { name: "Smartphones", slug: "smartphones", description: "Mobile phones and cellular accessories" },
        { name: "Audio & Headphones", slug: "audio-headphones", description: "Premium headphones, earbuds, and speakers" },
        { name: "Laptops & Computers", slug: "laptops-computers", description: "High-performance notebooks and workstations" },
        { name: "Smart Watches", slug: "smart-watches", description: "Wearable smart devices and fitness trackers" },
      ],
    },
    {
      name: "Fashion",
      slug: "fashion",
      description: "Contemporary apparel, trendy shoes, and fashion accessories.",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
      subcategories: [
        { name: "Men's Clothing", slug: "mens-clothing", description: "Shirts, trousers, and casual wear for men" },
        { name: "Women's Clothing", slug: "womens-clothing", description: "Dresses, tops, and stylish outfits for women" },
        { name: "Footwear", slug: "footwear", description: "Sneakers, boots, and formal leather shoes" },
        { name: "Accessories", slug: "accessories", description: "Watches, belts, sunglasses, and leather bags" },
      ],
    },
    {
      name: "Home & Kitchen",
      slug: "home-kitchen",
      description: "Modern kitchen appliances, cookware, and cozy home decor.",
      image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80",
      subcategories: [
        { name: "Kitchen Appliances", slug: "kitchen-appliances", description: "Blenders, air fryers, and coffee makers" },
        { name: "Cookware & Dining", slug: "cookware-dining", description: "Pans, knives, and premium dinner sets" },
        { name: "Home Decor", slug: "home-decor", description: "Lamps, wall art, and ambient lighting" },
      ],
    },
    {
      name: "Sports & Outdoors",
      slug: "sports-outdoors",
      description: "Fitness equipment, camping gear, and sports essentials.",
      image: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&q=80",
      subcategories: [
        { name: "Fitness & Gym", slug: "fitness-gym", description: "Dumbbells, resistance bands, and workout mats" },
        { name: "Camping & Hiking", slug: "camping-hiking", description: "Backpacks, water bottles, and outdoor gear" },
        { name: "Cycling", slug: "cycling", description: "Bikes, helmets, and cycling gear" },
      ],
    },
  ];

  const categoryMap = new Map<string, mongoose.Types.ObjectId>();

  for (const catDef of categoryDefinitions) {
    let category = await Category.findOne({ slug: catDef.slug });
    if (!category) {
      category = await Category.create({
        name: catDef.name,
        slug: catDef.slug,
        description: catDef.description,
        image: catDef.image,
        isActive: true,
        subcategories: catDef.subcategories,
      });
      console.log(`Created category: ${catDef.name}`);
    } else {
      category.subcategories = catDef.subcategories as any;
      if (!category.image) category.image = catDef.image;
      await category.save();
      console.log(`Updated category subcategories: ${catDef.name}`);
    }
    categoryMap.set(catDef.slug, category._id as mongoose.Types.ObjectId);
  }

  // 2. 20 Realistic Demo Products with Subcategories
  const demoProducts = [
    // --- ELECTRONICS ---
    {
      name: "Samsung Galaxy S24 Ultra 512GB",
      categorySlug: "electronics",
      subcategory: "Smartphones",
      price: 345000,
      salePrice: 329000,
      sku: "ELC-SM-001",
      description: "Experience the next level of mobile AI with the titanium-crafted Galaxy S24 Ultra, 200MP camera, and built-in S Pen.",
      images: [
        "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80",
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80",
      ],
      specifications: [
        { key: "Brand", value: "Samsung" },
        { key: "Screen Size", value: "6.8 inch AMOLED 120Hz" },
        { key: "Storage", value: "512GB" },
        { key: "Color", value: "Titanium Gray" },
      ],
      tags: ["samsung", "smartphone", "5g", "flagship"],
      stock: 24,
      isFeatured: true,
    },
    {
      name: "Google Pixel 8 Pro",
      categorySlug: "electronics",
      subcategory: "Smartphones",
      price: 265000,
      salePrice: 249000,
      sku: "ELC-SM-002",
      description: "The Google Tensor G3 chip delivers cutting-edge AI photography, Best Take, and a breathtaking Super Actua display.",
      images: [
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80",
      ],
      specifications: [
        { key: "Brand", value: "Google" },
        { key: "Camera", value: "50MP Triple Rear" },
        { key: "RAM", value: "12GB" },
      ],
      tags: ["google", "pixel", "android"],
      stock: 18,
      isFeatured: false,
    },
    {
      name: "Bose QuietComfort Ultra Wireless Headphones",
      categorySlug: "electronics",
      subcategory: "Audio & Headphones",
      price: 125000,
      salePrice: 115000,
      sku: "ELC-AUD-003",
      description: "World-class active noise cancellation with breakthrough spatialized audio for an immersive listening experience.",
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      ],
      specifications: [
        { key: "Brand", value: "Bose" },
        { key: "Battery Life", value: "Up to 24 hours" },
        { key: "Connectivity", value: "Bluetooth 5.3" },
      ],
      tags: ["bose", "audio", "noise-canceling", "headphones"],
      stock: 35,
      isFeatured: true,
    },
    {
      name: "JBL Flip 6 Portable Bluetooth Speaker",
      categorySlug: "electronics",
      subcategory: "Audio & Headphones",
      price: 38000,
      salePrice: null,
      sku: "ELC-AUD-004",
      description: "Bold sound for every adventure. IP67 waterproof and dustproof design with 12 hours of playtime on a single charge.",
      images: [
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80",
      ],
      specifications: [
        { key: "Brand", value: "JBL" },
        { key: "Water Resistance", value: "IP67" },
        { key: "Battery Life", value: "12 Hours" },
      ],
      tags: ["jbl", "speaker", "bluetooth", "waterproof"],
      stock: 42,
      isFeatured: false,
    },
    {
      name: "Apple MacBook Air 15-inch M3",
      categorySlug: "electronics",
      subcategory: "Laptops & Computers",
      price: 435000,
      salePrice: 415000,
      sku: "ELC-LAP-005",
      description: "Impossibly thin and blazing fast with the Apple M3 chip, Liquid Retina display, and up to 18 hours of battery life.",
      images: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
      ],
      specifications: [
        { key: "Brand", value: "Apple" },
        { key: "Processor", value: "Apple M3 8-core" },
        { key: "Memory", value: "16GB Unified" },
        { key: "Storage", value: "512GB SSD" },
      ],
      tags: ["apple", "macbook", "laptop", "m3"],
      stock: 12,
      isFeatured: true,
    },
    {
      name: "Garmin Fenix 7 Pro Solar Multisport Watch",
      categorySlug: "electronics",
      subcategory: "Smart Watches",
      price: 240000,
      salePrice: null,
      sku: "ELC-WAT-006",
      description: "Rugged GPS smartwatch with solar charging lens, built-in LED flashlight, and advanced cardiovascular training metrics.",
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
      ],
      specifications: [
        { key: "Brand", value: "Garmin" },
        { key: "Lens", value: "Power Glass Solar" },
        { key: "Battery Life", value: "Up to 22 Days" },
      ],
      tags: ["garmin", "smartwatch", "fitness", "gps"],
      stock: 15,
      isFeatured: false,
    },

    // --- FASHION ---
    {
      name: "Classic Oxford Cotton Button-Down Shirt",
      categorySlug: "fashion",
      subcategory: "Men's Clothing",
      price: 8500,
      salePrice: 6900,
      sku: "FAS-MEN-007",
      description: "Tailored from 100% premium long-staple cotton, this timeless Oxford shirt pairs effortlessly with chinos or blazers.",
      images: [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
      ],
      specifications: [
        { key: "Material", value: "100% Cotton" },
        { key: "Fit", value: "Slim Fit" },
        { key: "Color", value: "Light Blue" },
      ],
      tags: ["shirt", "menswear", "cotton", "formal"],
      stock: 65,
      isFeatured: false,
    },
    {
      name: "Men's Slim Fit Chino Trousers",
      categorySlug: "fashion",
      subcategory: "Men's Clothing",
      price: 9800,
      salePrice: null,
      sku: "FAS-MEN-008",
      description: "Comfort stretch twill fabric designed for daily commute, business casual meetings, and weekend getaways.",
      images: [
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
      ],
      specifications: [
        { key: "Material", value: "98% Cotton, 2% Elastane" },
        { key: "Color", value: "Khaki" },
      ],
      tags: ["pants", "chinos", "menswear"],
      stock: 48,
      isFeatured: false,
    },
    {
      name: "Floral Wrap Midi Dress",
      categorySlug: "fashion",
      subcategory: "Women's Clothing",
      price: 14500,
      salePrice: 12200,
      sku: "FAS-WOM-009",
      description: "A breezy silhouette featuring a flattering V-neckline, self-tie waist belt, and delicate floral botanical prints.",
      images: [
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80",
      ],
      specifications: [
        { key: "Material", value: "Breathable Viscose" },
        { key: "Length", value: "Midi" },
        { key: "Pattern", value: "Floral" },
      ],
      tags: ["dress", "womenswear", "summer", "floral"],
      stock: 30,
      isFeatured: true,
    },
    {
      name: "Nike Air Max 270 Lifestyle Sneakers",
      categorySlug: "fashion",
      subcategory: "Footwear",
      price: 48000,
      salePrice: 43500,
      sku: "FAS-SHO-010",
      description: "Boasting Nike's biggest heel Air unit yet, the Air Max 270 delivers super-soft bounce with a modern athletic aesthetic.",
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
      ],
      specifications: [
        { key: "Brand", value: "Nike" },
        { key: "Closure", value: "Lace-up" },
        { key: "Color", value: "Red / White / Black" },
      ],
      tags: ["nike", "sneakers", "footwear", "shoes"],
      stock: 28,
      isFeatured: true,
    },
    {
      name: "Handcrafted Top-Grain Leather Weekend Duffle",
      categorySlug: "fashion",
      subcategory: "Accessories",
      price: 32000,
      salePrice: null,
      sku: "FAS-ACC-011",
      description: "Vintage-inspired full leather travel bag featuring brass hardware, reinforced stitching, and a padded shoulder strap.",
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      ],
      specifications: [
        { key: "Material", value: "Top-Grain Genuine Leather" },
        { key: "Capacity", value: "45 Liters" },
        { key: "Warranty", value: "2 Years" },
      ],
      tags: ["bag", "leather", "travel", "accessories"],
      stock: 19,
      isFeatured: false,
    },
    {
      name: "Polarized Aviator Sunglasses UV400",
      categorySlug: "fashion",
      subcategory: "Accessories",
      price: 11500,
      salePrice: 8900,
      sku: "FAS-ACC-012",
      description: "Lightweight titanium alloy frame with scratch-resistant polarized lenses providing 100% UVA/UVB eye protection.",
      images: [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
      ],
      specifications: [
        { key: "Lens", value: "Polarized UV400" },
        { key: "Frame Material", value: "Stainless Titanium" },
      ],
      tags: ["sunglasses", "eyewear", "summer"],
      stock: 55,
      isFeatured: false,
    },

    // --- HOME & KITCHEN ---
    {
      name: "Ninja Air Fryer Pro 4-in-1 5L",
      categorySlug: "home-kitchen",
      subcategory: "Kitchen Appliances",
      price: 52000,
      salePrice: 47500,
      sku: "HME-KIT-013",
      description: "Air fry, roast, reheat, and dehydrate crisp family meals with up to 75% less fat than traditional frying methods.",
      images: [
        "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&q=80",
      ],
      specifications: [
        { key: "Brand", value: "Ninja" },
        { key: "Capacity", value: "5.0 Liters" },
        { key: "Wattage", value: "1750W" },
      ],
      tags: ["kitchen", "airfryer", "cooking", "appliances"],
      stock: 33,
      isFeatured: true,
    },
    {
      name: "Breville Barista Touch Espresso Machine",
      categorySlug: "home-kitchen",
      subcategory: "Kitchen Appliances",
      price: 295000,
      salePrice: null,
      sku: "HME-KIT-014",
      description: "Third-wave specialty coffee at home with automated touchscreen operation, integrated conical grinder, and microfoam steam wand.",
      images: [
        "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80",
      ],
      specifications: [
        { key: "Brand", value: "Breville" },
        { key: "Bar Pressure", value: "15 Bar Italian Pump" },
        { key: "Grinder", value: "Integrated Burr Grinder" },
      ],
      tags: ["coffee", "espresso", "breville", "kitchen"],
      stock: 10,
      isFeatured: false,
    },
    {
      name: "Cast Iron Enameled Dutch Oven 6-Quart",
      categorySlug: "home-kitchen",
      subcategory: "Cookware & Dining",
      price: 26500,
      salePrice: 22000,
      sku: "HME-COK-015",
      description: "Heavy-duty cast iron distributes heat evenly for slow-cooking stews, braising meats, and baking crusty artisanal bread.",
      images: [
        "https://images.unsplash.com/photo-1584990347449-399120790d56?w=800&q=80",
      ],
      specifications: [
        { key: "Material", value: "Enameled Cast Iron" },
        { key: "Oven Safe", value: "Up to 500°F (260°C)" },
        { key: "Color", value: "Cerulean Blue" },
      ],
      tags: ["cookware", "dutch-oven", "baking", "dining"],
      stock: 22,
      isFeatured: false,
    },
    {
      name: "Minimalist Scandinavian Dimmable Floor Lamp",
      categorySlug: "home-kitchen",
      subcategory: "Home Decor",
      price: 18500,
      salePrice: null,
      sku: "HME-DEC-016",
      description: "Sleek matte black arc frame with warm ambient LED glow and smooth foot-pedal touch dimmer for living room relaxation.",
      images: [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
      ],
      specifications: [
        { key: "Bulb Type", value: "Integrated Warm LED (2700K)" },
        { key: "Height", value: "165 cm" },
        { key: "Finish", value: "Matte Black Steel" },
      ],
      tags: ["lighting", "lamp", "homedecor", "minimalist"],
      stock: 26,
      isFeatured: false,
    },

    // --- SPORTS & OUTDOORS ---
    {
      name: "Bowflex SelectTech Adjustable Dumbbells (Pair)",
      categorySlug: "sports-outdoors",
      subcategory: "Fitness & Gym",
      price: 110000,
      salePrice: 98000,
      sku: "SPT-GYM-017",
      description: "Combines 15 sets of weights into one compact system. Easily adjust resistance from 2kg up to 24kg with the turn of a dial.",
      images: [
        "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80",
      ],
      specifications: [
        { key: "Weight Range", value: "2.5kg - 24kg per dumbbell" },
        { key: "Material", value: "Steel with Dura-Grip Coating" },
      ],
      tags: ["fitness", "dumbbells", "gym", "weights"],
      stock: 14,
      isFeatured: true,
    },
    {
      name: "Non-Slip High Density Yoga Mat with Strap",
      categorySlug: "sports-outdoors",
      subcategory: "Fitness & Gym",
      price: 6800,
      salePrice: 5500,
      sku: "SPT-GYM-018",
      description: "Eco-friendly 6mm TPE dual-layer cushion protects joints during pilates, yoga, and high-intensity floor workouts.",
      images: [
        "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80",
      ],
      specifications: [
        { key: "Thickness", value: "6mm" },
        { key: "Material", value: "Eco TPE Foam" },
        { key: "Dimensions", value: "183cm x 61cm" },
      ],
      tags: ["yoga", "mat", "exercise", "pilates"],
      stock: 50,
      isFeatured: false,
    },
    {
      name: "Osprey Atmos AG 65L Hiking Backpack",
      categorySlug: "sports-outdoors",
      subcategory: "Camping & Hiking",
      price: 78000,
      salePrice: null,
      sku: "SPT-OUT-019",
      description: "Anti-Gravity suspension system delivers seamless ventilation and incredible comfort on multi-day backcountry trails.",
      images: [
        "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
      ],
      specifications: [
        { key: "Brand", value: "Osprey" },
        { key: "Volume", value: "65 Liters" },
        { key: "Includes", value: "Integrated Raincover" },
      ],
      tags: ["hiking", "backpack", "camping", "osprey"],
      stock: 16,
      isFeatured: false,
    },
    {
      name: "Trek Domane AL 2 Disc Endurance Road Bike",
      categorySlug: "sports-outdoors",
      subcategory: "Cycling",
      price: 365000,
      salePrice: 340000,
      sku: "SPT-CYC-020",
      description: "Speed, comfort, and stability. Lightweight Alpha Aluminum frame with carbon fork and mechanical disc brakes for all-weather confidence.",
      images: [
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
      ],
      specifications: [
        { key: "Brand", value: "Trek" },
        { key: "Frame", value: "100 Series Alpha Aluminum" },
        { key: "Brakes", value: "Tektro Mechanical Disc" },
        { key: "Drivetrain", value: "Shimano Claris 16-Speed" },
      ],
      tags: ["cycling", "bike", "road-bike", "outdoor"],
      stock: 8,
      isFeatured: true,
    },
  ];

  console.log(`\nAdding ${demoProducts.length} demo products with subcategories...`);

  let addedCount = 0;
  let updatedCount = 0;

  for (const item of demoProducts) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) {
      console.warn(`Category ${item.categorySlug} not found, skipping ${item.name}`);
      continue;
    }

    const slug = slugify(item.name);

    const productPayload = {
      name: item.name,
      slug,
      description: item.description,
      category: categoryId,
      subcategory: item.subcategory,
      price: item.price,
      salePrice: item.salePrice,
      sku: item.sku,
      images: item.images,
      imageKeys: [],
      specifications: item.specifications,
      tags: item.tags,
      stock: item.stock,
      lowStockThreshold: 5,
      status: "active" as const,
      isFeatured: item.isFeatured,
      totalSold: Math.floor(Math.random() * 45) + 5,
    };

    const existingProduct = await Product.findOne({ sku: item.sku });

    if (existingProduct) {
      await Product.updateOne({ sku: item.sku }, { $set: productPayload });
      updatedCount++;
    } else {
      await Product.create(productPayload);
      addedCount++;
    }

    console.log(`✓ [${item.subcategory}] ${item.name} (${item.sku}) - LKR ${item.price.toLocaleString()}`);
  }

  console.log(`\n🎉 Success! Added ${addedCount} new products, updated ${updatedCount} products.`);
  await mongoose.connection.close();
  process.exit(0);
}

seed20Products().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
