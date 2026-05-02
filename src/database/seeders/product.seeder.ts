import { PriceProduct } from "@models/price.model";
import { Product } from "@models/product.model";
import { Uom } from "@models/uom.model";
import { DataSource } from "typeorm";

const CATEGORIES = [
  "Makanan",
  "Minuman",
  "Snack",
  "Perawatan",
  "Rumah Tangga",
  "Alat Tulis",
  "Kesehatan",
  "Bayi",
];

function pad(n: number, len: number) {
  return n.toString().padStart(len, "0");
}

function randomBarcode(seed: number) {
  // 13-digit EAN-like deterministic-ish barcode
  return `899${pad(seed, 10)}`;
}

function randomPrice(min: number, max: number, step = 500) {
  const n = Math.floor(Math.random() * ((max - min) / step + 1)) + min / step;
  return n * step;
}

export async function productSeeder(dataSource: DataSource): Promise<Product[]> {
  const productRepo = dataSource.getRepository(Product);
  const priceRepo = dataSource.getRepository(PriceProduct);
  const uomRepo = dataSource.getRepository(Uom);

  const uoms = await uomRepo.find();
  if (uoms.length === 0) throw new Error("UoM kosong, jalankan uomSeeder dulu.");

  const existingCount = await productRepo.count();
  if (existingCount >= 100) {
    return await productRepo.find({ relations: { prices: true } });
  }

  const target = 100;
  const toCreate = target - existingCount;
  const products: Product[] = [];

  for (let i = 0; i < toCreate; i++) {
    const idx = existingCount + i + 1;
    const category = CATEGORIES[idx % CATEGORIES.length];
    const uom = uoms[idx % uoms.length];

    const product = new Product();
    product.name = `Produk ${pad(idx, 3)}`;
    product.code = `SKU-${pad(idx, 4)}`;
    product.category = category;
    product.barcode = randomBarcode(idx);
    product.stock = 0;
    product.uomId = uom.id;
    const saved = await productRepo.save(product);

    const basePrice = randomPrice(2000, 50000, 500);
    const grosirPrice = Math.max(basePrice - 500, 1000);
    const prices: PriceProduct[] = [];
    const p1 = new PriceProduct();
    p1.productId = saved.id;
    p1.name = "Eceran";
    p1.price = basePrice;
    prices.push(p1);
    const p2 = new PriceProduct();
    p2.productId = saved.id;
    p2.name = "Grosir";
    p2.price = grosirPrice;
    prices.push(p2);
    await priceRepo.save(prices);
    saved.prices = prices;
    products.push(saved);
  }

  if (existingCount > 0) {
    const existing = await productRepo.find({ relations: { prices: true } });
    return existing;
  }
  return products;
}
