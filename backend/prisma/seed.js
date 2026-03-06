// @ts-check
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminPassword = await bcrypt.hash("Admin1234!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@shopify-clone.com" },
    update: {},
    create: {
      email: "admin@shopify-clone.com",
      passwordHash: adminPassword,
      name: "Admin User",
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Test user
  const userPassword = await bcrypt.hash("User1234!", 12);
  const testUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      passwordHash: userPassword,
      name: "John Doe",
      role: "USER",
      emailVerified: true,
    },
  });
  console.log(`✅ Test user: ${testUser.email}`);

  // Categories
  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: {
      name: "Electronics",
      slug: "electronics",
      description: "Electronic devices and accessories",
      image: "/images/categories/electronics.jpg",
    },
  });

  const clothing = await prisma.category.upsert({
    where: { slug: "clothing" },
    update: {},
    create: {
      name: "Clothing",
      slug: "clothing",
      description: "Fashion and apparel",
      image: "/images/categories/clothing.jpg",
    },
  });

  const books = await prisma.category.upsert({
    where: { slug: "books" },
    update: {},
    create: {
      name: "Books",
      slug: "books",
      description: "Books and literature",
      image: "/images/categories/books.jpg",
    },
  });

  const homeGarden = await prisma.category.upsert({
    where: { slug: "home-garden" },
    update: {},
    create: {
      name: "Home & Garden",
      slug: "home-garden",
      description: "Products for your home and garden",
      image: "/images/categories/home.jpg",
    },
  });
  console.log("✅ Categories created");

  // Products
  const products = [
    {
      name: "Wireless Noise-Cancelling Headphones",
      slug: "wireless-noise-cancelling-headphones",
      description:
        "Premium wireless headphones with active noise cancellation, 30-hour battery life, and premium sound quality. Perfect for travel and work-from-home setups.",
      categoryId: electronics.id,
      basePrice: 299.99,
      comparePrice: 399.99,
      sku: "ELEC-001",
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800",
          isPrimary: false,
        },
      ],
      variants: [
        { name: "Color", value: "Black", priceAdjustment: 0, stock: 50 },
        { name: "Color", value: "White", priceAdjustment: 0, stock: 30 },
        { name: "Color", value: "Rose Gold", priceAdjustment: 20, stock: 20 },
      ],
      stock: 100,
    },
    {
      name: "Mechanical Gaming Keyboard",
      slug: "mechanical-gaming-keyboard",
      description:
        "Tactile mechanical switches, RGB backlit, compact TKL layout. Built for gamers who demand precision and speed.",
      categoryId: electronics.id,
      basePrice: 149.99,
      comparePrice: null,
      sku: "ELEC-002",
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800",
          isPrimary: true,
        },
      ],
      variants: [
        {
          name: "Switch Type",
          value: "Cherry MX Red",
          priceAdjustment: 0,
          stock: 40,
        },
        {
          name: "Switch Type",
          value: "Cherry MX Blue",
          priceAdjustment: 0,
          stock: 35,
        },
        {
          name: "Switch Type",
          value: "Cherry MX Brown",
          priceAdjustment: 0,
          stock: 25,
        },
      ],
      stock: 100,
    },
    {
      name: "Premium Cotton T-Shirt",
      slug: "premium-cotton-t-shirt",
      description:
        "100% organic cotton, sustainable manufacturing, pre-shrunk, available in multiple colors and sizes.",
      categoryId: clothing.id,
      basePrice: 39.99,
      comparePrice: 59.99,
      sku: "CLTH-001",
      isFeatured: false,
      images: [
        {
          url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
          isPrimary: true,
        },
      ],
      variants: [
        { name: "Size", value: "S", priceAdjustment: 0, stock: 20 },
        { name: "Size", value: "M", priceAdjustment: 0, stock: 40 },
        { name: "Size", value: "L", priceAdjustment: 0, stock: 35 },
        { name: "Size", value: "XL", priceAdjustment: 0, stock: 25 },
        { name: "Size", value: "XXL", priceAdjustment: 5, stock: 15 },
      ],
      stock: 135,
    },
    {
      name: "JavaScript: The Definitive Guide",
      slug: "javascript-definitive-guide",
      description:
        "The comprehensive reference to JavaScript for experienced developers and beginners alike.",
      categoryId: books.id,
      basePrice: 54.99,
      comparePrice: 69.99,
      sku: "BOOK-001",
      isFeatured: false,
      images: [
        {
          url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800",
          isPrimary: true,
        },
      ],
      variants: [
        { name: "Format", value: "Paperback", priceAdjustment: 0, stock: 30 },
        { name: "Format", value: "Hardcover", priceAdjustment: 15, stock: 15 },
      ],
      stock: 45,
    },
    {
      name: "Smart LED Desk Lamp",
      slug: "smart-led-desk-lamp",
      description:
        "WiFi-connected smart desk lamp with adjustable color temperature, brightness control, and USB-C charging port. Works with Alexa and Google Home.",
      categoryId: homeGarden.id,
      basePrice: 89.99,
      comparePrice: 129.99,
      sku: "HOME-001",
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
          isPrimary: true,
        },
      ],
      variants: [
        { name: "Color", value: "White", priceAdjustment: 0, stock: 60 },
        { name: "Color", value: "Black", priceAdjustment: 0, stock: 40 },
      ],
      stock: 100,
    },
    {
      name: '4K Ultra HD Smart TV 55"',
      slug: "4k-ultra-hd-smart-tv-55",
      description:
        "55-inch 4K UHD display with HDR10+, Dolby Vision, 120Hz refresh rate, built-in streaming apps, and voice control.",
      categoryId: electronics.id,
      basePrice: 799.99,
      comparePrice: 999.99,
      sku: "ELEC-003",
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1593359677879-a4bb92f4a9f4?w=800",
          isPrimary: true,
        },
      ],
      variants: [
        { name: "Size", value: '55"', priceAdjustment: 0, stock: 20 },
        { name: "Size", value: '65"', priceAdjustment: 200, stock: 15 },
      ],
      stock: 35,
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
    });
    if (!existing) {
      const product = await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          categoryId: p.categoryId,
          basePrice: p.basePrice,
          comparePrice: p.comparePrice ?? undefined,
          sku: p.sku,
          isFeatured: p.isFeatured,
          images: {
            create: p.images.map((img, i) => ({
              url: img.url,
              isPrimary: img.isPrimary,
              sortOrder: i,
            })),
          },
          variants: {
            create: p.variants.map((v) => ({
              name: v.name,
              value: v.value,
              priceAdjustment: v.priceAdjustment,
              stock: v.stock,
              sku: `${p.sku}-${v.value.replace(/\s/g, "-").toUpperCase()}`,
            })),
          },
          inventory: { create: { quantity: p.stock, lowStockAlert: 10 } },
        },
      });
      console.log(`✅ Product: ${product.name}`);
    }
  }

  // Ensure cart & wishlist exist for test user
  await prisma.cart.upsert({
    where: { userId: testUser.id },
    update: {},
    create: { userId: testUser.id },
  });
  await prisma.wishlist.upsert({
    where: { userId: testUser.id },
    update: {},
    create: { userId: testUser.id },
  });

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
