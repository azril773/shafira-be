import dataSource from "@config/database";
import { PriceProduct } from "@models/price.model";
import { Product } from "@models/product.model";
import { UUID } from "types/common_type";
import { ProductBody } from "types/product";
import { generateUniqueCode, validateBarcode } from "utils/utils";
import { AuditLogService } from "@services/audit_log.service";
import { User } from "@models/user.model";
import { AUDIT_EDIT_STOCK } from "types/audit_log";

export class ProductService {
  private productRepository = dataSource.getRepository(Product);
  private priceRepository = dataSource.getRepository(PriceProduct);
  private auditLogService = new AuditLogService();

  public async getProducts(): Promise<Product[]> {
    return await this.productRepository.find({ relations: { prices: true, uom: true } });
  }

  public async createProduct(body: ProductBody): Promise<Product> {
    if (body.prices.length <= 0)
      throw new Error("Setidaknya harus ada satu harga!");
    const isBarcodeValid = validateBarcode(body.barcode);
    if (!isBarcodeValid)
      throw new Error("Barcode tidak valid.");

    const existingCodes = (await this.productRepository.find()).map(
      (p) => p.code,
    );

    let code = generateUniqueCode(8);
    while (existingCodes.includes(code)) {
      code = generateUniqueCode(8);
    }

    const prices: PriceProduct[] = [];
    for (const priceData of body.prices) {
      if (priceData.price < 0)
        throw new Error("Harga tidak boleh negatif.");

      if (prices.find((p) => p.price === priceData.price))
        throw new Error(
          "Price sudah ada.",
        );

      if (prices.find((p) => p.name === priceData.name))
        throw new Error(
          "Price name sudah ada.",
        );

      const price = new PriceProduct();
      price.name = priceData.name;
      price.price = priceData.price;
      price.promoPrice = priceData.promoPrice ?? null;
      price.promoStartDate = priceData.promoStartDate ? new Date(priceData.promoStartDate) : null;
      price.promoEndDate = priceData.promoEndDate ? new Date(priceData.promoEndDate) : null;
      prices.push(price);
    }

    const product = new Product();
    product.name = body.name;
    product.prices = prices;
    product.category = body.category;
    product.barcode = body.barcode;
    product.code = code;
    product.uom_id = body.uomId ?? null;
    product.hpp = body.hpp ?? 0;
    return await this.productRepository.save(product);
  }

  public async updateProduct(id: UUID, body: ProductBody): Promise<Product> {
    if (body.prices.length <= 0) throw new Error("Setidaknya harus ada satu harga!");
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        prices: true,
      },
    });
    if (!product) throw new Error("Product tidak ditemukan.");

    if (body.barcode) {
      const isBarcodeValid = validateBarcode(body.barcode);
      if (!isBarcodeValid) throw new Error("Barcode tidak valid.");
    }

    if (body.prices) {
      for (const priceData of body.prices) {
        if (priceData.price < 0) throw new Error("Harga tidak boleh negatif.");
      }
    }

    product.name = body.name ?? product.name;
    product.category = body.category ?? product.category;
    product.barcode = body.barcode ?? product.barcode;
    if (body.uomId !== undefined) product.uom_id = body.uomId;
    if (body.hpp !== undefined) product.hpp = body.hpp;

    const existingPrices = product.prices;
    const newPrices: PriceProduct[] = [];
    if (body.prices) {
      for (const priceData of body.prices) {
        if (
          existingPrices.find(
            (p) => p.price === priceData.price && p.name !== priceData.name,
          )
        )
          throw new Error("Harga sudah ada.");
        const price =
          existingPrices.find((p) => p.name === priceData.name) ??
          new PriceProduct();
        price.name = priceData.name;
        price.price = priceData.price;
        price.promoPrice = priceData.promoPrice ?? null;
        price.promoStartDate = priceData.promoStartDate
          ? new Date(priceData.promoStartDate)
          : null;
        price.promoEndDate = priceData.promoEndDate
          ? new Date(priceData.promoEndDate)
          : null;
        newPrices.push(price);
      }
    }
    const toDelete = existingPrices.filter(
      (p) => !body.prices?.some((bp) => bp.name === p.name),
    );
    if (toDelete.length > 0) await this.priceRepository.delete(toDelete.map((p) => p.id));
    product.prices = newPrices;
    return await this.productRepository.save(product);
  }

  public async updateStock(
    id: UUID,
    stock: number,
    actor: User,
    reason?: string,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new Error("Produk tidak ditemukan.");
    const oldStock = product.stock;
    product.stock = stock;
    const saved = await this.productRepository.save(product);
    await this.auditLogService.createLog(actor, {
      action: AUDIT_EDIT_STOCK,
      entityType: "Product",
      entityId: id,
      reason: reason ?? null,
      payload: { oldStock, newStock: stock, productName: product.name },
    });
    return saved;
  }

  public async searchProductsForPOS({ name }: { name?: string }): Promise<Product[]> {
    const queryBuilder = this.productRepository.createQueryBuilder("product");
    queryBuilder.leftJoinAndSelect("product.prices", "prices");
    queryBuilder.leftJoinAndSelect("product.uom", "uom");
    if (name) {
      queryBuilder.andWhere("LOWER(product.name) LIKE :name", {
        name: `%${name.toLowerCase()}%`,
      });
    }
    return await queryBuilder.getMany();
  }

  public async searchProductsForPurchase({ q }: { q?: string }): Promise<Product[]> {
    const queryBuilder = this.productRepository.createQueryBuilder("product");
    queryBuilder.leftJoinAndSelect("product.prices", "prices");
    queryBuilder.leftJoinAndSelect("product.uom", "uom");
    if (q) {
      queryBuilder.andWhere(
        "(LOWER(product.name) LIKE :q OR LOWER(product.barcode) LIKE :q OR LOWER(product.code) LIKE :q)",
        { q: `%${q.toLowerCase()}%` },
      );
    }
    return await queryBuilder.getMany();
  }

  public async searchProducts({
    page,
    barcode,
    code,
    name,
  }: {
    page: number;
    barcode?: string;
    code?: string;
    name?: string;
  }): Promise<{ products: Product[]; totalPages: number }> {
    const limit = 10;
    const offset = (page - 1) * limit;
    const queryBuilder = this.productRepository.createQueryBuilder("product");
    queryBuilder.leftJoinAndSelect("product.prices", "prices");
    queryBuilder.leftJoinAndSelect("product.uom", "uom");
    if (barcode) {
      queryBuilder.andWhere("product.barcode = :barcode OR product.code = :code", {
        barcode,
        code: barcode,
      });
    }
    if (code) {
      queryBuilder.andWhere("LOWER(product.code) LIKE :code", {
        code: `%${code.toLowerCase()}%`,
      });
    }
    if (name) {
      queryBuilder.andWhere("LOWER(product.name) LIKE :name", {
        name: `%${name.toLowerCase()}%`,
      });
    }
    queryBuilder.skip(offset).take(limit);
    const [products, total] = await queryBuilder.getManyAndCount();
    return { products, totalPages: Math.ceil(total / limit) };
  }
}
