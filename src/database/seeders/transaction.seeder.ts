import { POSTED } from "@constants/status";
import { Product } from "@models/product.model";
import { Transaction } from "@models/transaction.model";
import { TransactionDetail } from "@models/transaction_detail.model";
import { TransactionPayment } from "@models/transaction_payment.model";
import { User } from "@models/user.model";
import { DataSource } from "typeorm";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

const PAYMENT_METHODS = ["Tunai", "QRIS", "Kartu Debit", "Transfer", "E-Wallet"];

/**
 * Seed contoh data transaksi POSTED selama 30 hari terakhir.
 * Setiap transaksi memakai 1-4 produk acak, qty 1-3, dengan campuran metode pembayaran
 * (termasuk split payment) agar laporan X, Per Metode, dan Margin punya data berarti.
 */
export async function transactionSeeder(
  dataSource: DataSource,
  products: Product[],
  cashier: User,
) {
  const trxRepo = dataSource.getRepository(Transaction);
  const detailRepo = dataSource.getRepository(TransactionDetail);
  const payRepo = dataSource.getRepository(TransactionPayment);
  const productRepo = dataSource.getRepository(Product);

  if ((await trxRepo.count()) > 0) return;
  if (products.length === 0) throw new Error("Produk kosong, jalankan productSeeder dulu.");

  // Snapshot of stock so we can decrement as we sell
  const stockMap = new Map<string, number>(
    products.map((p) => [p.id, Number(p.stock) || 0]),
  );

  // ~5 transaksi per hari selama 30 hari = 150 transaksi
  const DAYS = 30;
  const TRX_PER_DAY = 5;
  let seq = 1;

  for (let d = DAYS - 1; d >= 0; d--) {
    for (let t = 0; t < TRX_PER_DAY; t++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(randInt(8, 20), randInt(0, 59), randInt(0, 59), 0);

      const itemCount = randInt(1, 4);
      const chosen: { product: Product; qty: number; price: number; priceName: string }[] = [];
      const usedIds = new Set<string>();

      for (let i = 0; i < itemCount; i++) {
        // Pick a product with stock left
        const available = products.filter(
          (p) => (stockMap.get(p.id) ?? 0) > 0 && !usedIds.has(p.id),
        );
        if (available.length === 0) break;
        const product = pick(available);
        usedIds.add(product.id);
        const stockLeft = stockMap.get(product.id) ?? 0;
        const qty = randInt(1, Math.min(3, stockLeft));
        // Pick a price tier (mostly Eceran, sometimes Grosir)
        const priceTier = product.prices && product.prices.length > 1 && Math.random() < 0.25
          ? product.prices[1]
          : product.prices?.[0];
        if (!priceTier) continue;
        const price = Number(priceTier.price) || 0;
        chosen.push({ product, qty, price, priceName: priceTier.name });
        stockMap.set(product.id, stockLeft - qty);
      }
      if (chosen.length === 0) continue;

      const totalPrice = chosen.reduce((s, c) => s + c.price * c.qty, 0);
      const totalQty = chosen.reduce((s, c) => s + c.qty, 0);

      // Build payments — ~70% single method, ~30% split (cash + non-cash)
      const isSplit = Math.random() < 0.3 && totalPrice >= 20000;
      type PayIn = { method: string; amount: number; tendered: number };
      const pays: PayIn[] = [];
      if (isSplit) {
        const cashPart = Math.round((totalPrice * (0.3 + Math.random() * 0.4)) / 1000) * 1000;
        const cashAmount = Math.min(Math.max(cashPart, 1000), totalPrice - 1000);
        const otherAmount = totalPrice - cashAmount;
        const otherMethod = pick(PAYMENT_METHODS.filter((m) => m !== "Tunai"));
        const cashTendered = Math.ceil(cashAmount / 1000) * 1000 + (Math.random() < 0.5 ? 0 : 1000);
        pays.push({ method: "Tunai", amount: cashAmount, tendered: cashTendered });
        pays.push({ method: otherMethod, amount: otherAmount, tendered: otherAmount });
      } else {
        const method = pick(PAYMENT_METHODS);
        const tendered = method === "Tunai"
          ? Math.ceil(totalPrice / 1000) * 1000 + (Math.random() < 0.4 ? 1000 : 0)
          : totalPrice;
        pays.push({ method, amount: totalPrice, tendered });
      }

      const cashRow = pays.find((p) => p.method === "Tunai");
      const cashAmount = cashRow ? cashRow.tendered : 0;
      const changeAmount = cashRow ? Math.max(0, cashRow.tendered - cashRow.amount) : 0;
      const paymentMethodLabel = pays.length > 1 ? "SPLIT" : pays[0].method;

      const trx = new Transaction();
      trx.cashierId = cashier.id;
      trx.transactionNo = `TRX-${Date.now()}-${seq++}`;
      trx.totalPrice = totalPrice;
      trx.totalQty = totalQty;
      trx.status = POSTED;
      trx.paymentMethod = paymentMethodLabel;
      trx.cashAmount = cashAmount;
      trx.changeAmount = changeAmount;
      trx.createdAt = date;
      trx.updatedAt = date;
      const savedTrx = await trxRepo.save(trx);

      // Force created/updated timestamps (Base may auto-set)
      await trxRepo.update(savedTrx.id, { createdAt: date, updatedAt: date } as Partial<Transaction>);

      // Save details
      const details = chosen.map((c) => {
        const d = new TransactionDetail();
        d.transactionId = savedTrx.id;
        d.productId = c.product.id;
        d.qty = c.qty;
        d.historicalName = c.product.name;
        d.historicalBarcode = c.product.barcode;
        d.historicalCode = c.product.code;
        d.historicalCategory = c.product.category;
        d.historicalPriceName = c.priceName;
        d.historicalPrice = c.price;
        d.uomId = c.product.uom_id ?? null;
        d.isRefund = false;
        return d;
      });
      await detailRepo.save(details);

      // Save payments
      const payments = pays.map((p) => {
        const pay = new TransactionPayment();
        pay.transactionId = savedTrx.id;
        pay.method = p.method;
        pay.amount = p.amount;
        pay.tendered = p.tendered;
        return pay;
      });
      await payRepo.save(payments);
    }
  }

  // Persist final stock after sales
  const updates = products.map((p) => {
    p.stock = stockMap.get(p.id) ?? p.stock;
    return p;
  });
  await productRepo.save(updates);
}
