import { Deal } from './types';

// Curated realistic deal sets for common demo searches
const PRESET_DEALS: Record<string, Deal[]> = {
  'sony wh-1000xm5': [
    {
      title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones - Black',
      price: 329.99,
      priceText: '$329.99',
      store: 'Amazon',
      link: 'https://www.amazon.com/dp/B09XS7JWHH',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&auto=format&fit=crop&q=80',
      rating: 4.7,
      ratingCount: 14200,
      delivery: 'Free 2-day delivery'
    },
    {
      title: 'Sony - WH-1000XM5 Wireless Noise-Canceling Over-the-Ear Headphones - Silver',
      price: 349.99,
      priceText: '$349.99',
      store: 'Best Buy',
      link: 'https://www.bestbuy.com/site/sony-wh-1000xm5/6505727.p',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80',
      rating: 4.6,
      ratingCount: 8900,
      delivery: 'Free store pickup'
    },
    {
      title: 'Sony WH-1000XM5 Noise Canceling Bluetooth Headphones (Midnight Blue)',
      price: 338.00,
      priceText: '$338.00',
      store: 'B&H Photo',
      link: 'https://www.bhphotovideo.com/c/product/1703661-REG/sony_wh1000xm5_b_wh_1000xm5_wireless_noise_canceling.html',
      image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=200&auto=format&fit=crop&q=80',
      rating: 4.8,
      ratingCount: 3120,
      delivery: 'Free shipping'
    },
    {
      title: 'Sony WH-1000XM5 Headphones - Certified Refurbished',
      price: 269.95,
      priceText: '$269.95',
      store: 'eBay',
      link: 'https://www.ebay.com/itm/Sony-WH-1000XM5-Headphones',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&auto=format&fit=crop&q=80',
      rating: 4.5,
      ratingCount: 1540,
      delivery: '$4.99 shipping'
    },
    {
      title: 'Sony WH-1000XM5 Wireless Noise Canceling Over-Ear Headphones',
      price: 379.99,
      priceText: '$379.99',
      store: 'Target',
      link: 'https://www.target.com/p/sony-wh-1000xm5',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80',
      rating: 4.4,
      ratingCount: 820,
      delivery: 'Free standard delivery'
    },
    {
      title: 'Sony WH-1000XM5 Premium Noise Canceling Headphones bundle with power bank',
      price: 398.00,
      priceText: '$398.00',
      store: 'Walmart',
      link: 'https://www.walmart.com/ip/sony-wh-1000xm5',
      image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=200&auto=format&fit=crop&q=80',
      rating: 4.3,
      ratingCount: 460,
      delivery: 'Free shipping'
    }
  ],
  'macbook air': [
    {
      title: 'Apple MacBook Air 13-inch M3 Chip 16GB Memory 512GB SSD - Midnight',
      price: 1249.00,
      priceText: '$1,249.00',
      store: 'Amazon',
      link: 'https://www.amazon.com/dp/B0CX23G2G9',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&auto=format&fit=crop&q=80',
      rating: 4.8,
      ratingCount: 2890,
      delivery: 'Prime free delivery'
    },
    {
      title: 'Apple - MacBook Air 13-inch Laptop - M3 chip - 16GB Memory - 512GB SSD - Space Gray',
      price: 1249.00,
      priceText: '$1,249.00',
      store: 'Best Buy',
      link: 'https://www.bestbuy.com/site/macbook-air-m3/6534606.p',
      image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=200&auto=format&fit=crop&q=80',
      rating: 4.9,
      ratingCount: 1410,
      delivery: 'Free same-day pickup'
    },
    {
      title: 'Apple 13.6" MacBook Air (M3, Starlight, 16GB / 512GB)',
      price: 1199.00,
      priceText: '$1,199.00',
      store: 'B&H Photo',
      link: 'https://www.bhphotovideo.com/c/product/1815123-REG/apple_macbook_air_m3.html',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&auto=format&fit=crop&q=80',
      rating: 4.9,
      ratingCount: 650,
      delivery: 'Free expedited delivery'
    },
    {
      title: 'Apple MacBook Air 13.3" M1 Laptop 8GB 256GB SSD (Renewed Premium)',
      price: 599.99,
      priceText: '$599.99',
      store: 'Walmart',
      link: 'https://www.walmart.com/ip/macbook-air-m1',
      image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=200&auto=format&fit=crop&q=80',
      rating: 4.4,
      ratingCount: 9200,
      delivery: 'Free 2-day delivery'
    }
  ],
  'nike air force 1': [
    {
      title: "Nike Air Force 1 '07 Men's Shoes - Triple White",
      price: 115.00,
      priceText: '$115.00',
      store: 'Nike.com',
      link: 'https://www.nike.com/t/air-force-1-07-mens-shoes-jBrhbr/CW2288-111',
      image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&auto=format&fit=crop&q=80',
      rating: 4.7,
      ratingCount: 8430,
      delivery: 'Free shipping for members'
    },
    {
      title: "Nike Men's Air Force 1 '07 Low Top Sneaker Shoes",
      price: 104.99,
      priceText: '$104.99',
      store: 'Foot Locker',
      link: 'https://www.footlocker.com/product/nike-air-force-1',
      image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=200&auto=format&fit=crop&q=80',
      rating: 4.6,
      ratingCount: 3200,
      delivery: 'Free shipping over $50'
    },
    {
      title: "Nike Air Force 1 '07 Sneakers (All Sizes Available)",
      price: 109.99,
      priceText: '$109.99',
      store: "Dick's Sporting Goods",
      link: 'https://www.dickssportinggoods.com/p/nike-air-force-1',
      image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&auto=format&fit=crop&q=80',
      rating: 4.5,
      ratingCount: 1100,
      delivery: 'Curbside pickup available'
    },
    {
      title: "Nike Air Force 1 07 Low White Authentic Deadstock",
      price: 98.50,
      priceText: '$98.50',
      store: 'StockX',
      link: 'https://stockx.com/nike-air-force-1-low-07-white',
      image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=200&auto=format&fit=crop&q=80',
      rating: 4.3,
      ratingCount: 5400,
      delivery: 'Verified Authentic'
    }
  ]
};

// Generates dynamic realistic deals for any query if preset not found
export function generateDemoDealsForQuery(query: string): Deal[] {
  const normalized = query.toLowerCase().trim();

  // Check preset matches
  for (const [key, deals] of Object.entries(PRESET_DEALS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return deals;
    }
  }

  // Otherwise synthesize realistic deals across top stores
  const stores = [
    { name: 'Amazon', domain: 'amazon.com', basePriceOffset: 0.95 },
    { name: 'Best Buy', domain: 'bestbuy.com', basePriceOffset: 1.0 },
    { name: 'Walmart', domain: 'walmart.com', basePriceOffset: 0.92 },
    { name: 'Target', domain: 'target.com', basePriceOffset: 0.98 },
    { name: 'B&H Photo', domain: 'bhphotovideo.com', basePriceOffset: 1.02 },
    { name: 'eBay', domain: 'ebay.com', basePriceOffset: 0.84 },
    { name: 'Newegg', domain: 'newegg.com', basePriceOffset: 0.97 }
  ];

  // Derive pseudo base price from query chars
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = (hash << 5) - hash + query.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const basePrice = (positiveHash % 250) + 29.99;

  // Capitalize query nicely
  const formattedQuery = query
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const images = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&auto=format&fit=crop&q=80'
  ];

  return stores.slice(0, 5).map((store, index) => {
    const rawPrice = Number((basePrice * store.basePriceOffset * (1 + (index * 0.03))).toFixed(2));
    const ratings = [4.8, 4.6, 4.5, 4.4, 4.7];
    const reviewCounts = [3410, 1850, 920, 640, 2150];

    return {
      title: `${formattedQuery} - Official Model (${store.name} Edition)`,
      price: rawPrice,
      priceText: `$${rawPrice.toFixed(2)}`,
      store: store.name,
      link: `https://www.${store.domain}/search?q=${encodeURIComponent(query)}`,
      image: images[index % images.length],
      rating: ratings[index % ratings.length],
      ratingCount: reviewCounts[index % reviewCounts.length],
      delivery: index === 0 ? 'Free Prime delivery' : index === 1 ? 'Free in-store pickup' : 'Free standard shipping'
    };
  });
}
