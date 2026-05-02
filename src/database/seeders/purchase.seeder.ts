import { POSTED } from "@constants/status";
import { Product } from "@models/product.model";
import { Purchase } from "@models/purchase.model";
import { PurchaseDetail } from "@models/purchase_detail.model";
import { User } from "@models/user.model";
import { Vendor } from "@models/vendor.model";
import { DataSource } from "typeorm";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function purchaseSeeder(
  dataSource: DataSource,
  products: Product[],
  vendors: Vendor[],
  actor: User,
) {
  const purchaseRepo = dataSource.getRepository(Purchase);
  const detailRepo = dataSource.getRepository(PurchaseDetail);
  const productRepo = dataSource.getRepository(Product);

  if ((await purchaseRepo.count()) > 0) return;
  if (vendors.length === 0) throw new Error("Vendor kosong.");
  if (products.length === 0) throw new Error("Product kosong.");

  // Cache stock additions to update once at the end
  const stockMap = new Map<string, number>(
    products.map((p) => [p.id, p.stock || 0]),
  );

  // 3 purchases per product, each as its own purchase order with random vendor and qty
  for (const product of products) {
    const eceranPrice = Number(product.prices?.[0]?.price ?? 0);
    // Purchase price ~ 60-85% of eceran price (rounded to 100)
    for (let n = 0; n < 3; n++) {
      const vendor = vendors[randInt(0, vendors.length - 1)];
      const qty = randInt(5, 50);
      const factor = 0.6 + Math.random() * 0.25;
      const purchasePrice =
        Math.max(500, Math.round((eceranPrice * factor) / 100) * 100);

      const purchase = new Purchase();
      purchase.vendorId = vendor.id;
      purchase.status = POSTED;
      // Random date within the last 60 days
      const daysAgo = randInt(0, 60);
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - daysAgo);
      purchase.purchaseDate = purchaseDate;
      purchase.createdById = actor.id;
      purchase.updatedById = actor.id;
      const savedPurchase = await purchaseRepo.save(purchase);

      const detail = new PurchaseDetail();
      detail.purchaseId = savedPurchase.id;
      detail.productId = product.id;
      detail.qty = qty;
      detail.purchasePrice = purchasePrice;
      await detailRepo.save(detail);

      stockMap.set(product.id, (stockMap.get(product.id) ?? 0) + qty);
    }
  }

  // Persist final stock per product
  const updated = products.map((p) => {
    p.stock = stockMap.get(p.id) ?? p.stock;
    return p;
  });
  await productRepo.save(updated);
}
