import dataSource from "@config/database";
import { PriceProduct } from "@models/price.model";
import { Product } from "@models/product.model";
import { UUID } from "types/common_type";
import { ProductBody } from "types/product";
import { generateUniqueCode, validateBarcode } from "utils/utils";

export class ProductService {
  private productRepository = dataSource.getRepository(Product);
  private priceRepository = dataSource.getRepository(PriceProduct);

  public async getProducts(): Promise<Product[]> {
    return await this.productRepository.find({ relations: { prices: true } });
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
      prices.push(price);
    }

    const product = new Product();
    product.name = body.name;
    product.prices = prices;
    product.category = body.category;
    product.barcode = body.barcode;
    product.code = code;
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
        newPrices.push(price);
      }
    }
    const toDelete = existingPrices.filter(
      (p) => !body.prices?.some((bp) => bp.name === p.name),
    );
    if (toDelete.length > 0) await this.priceRepository.delete(toDelete);
    product.prices = newPrices;
    return await this.productRepository.save(product);
  }

  public async searchProducts({
    page,
    barcode,
    code,
  }: {
    page: number;
    barcode?: string;
    code?: string;
  }): Promise<{ products: Product[]; totalPages: number }> {
    const limit = 10;
    const offset = (page - 1) * limit;
    const queryBuilder = this.productRepository.createQueryBuilder("product");
    queryBuilder.leftJoinAndSelect("product.prices", "prices");
    if (barcode) {
      queryBuilder.where("product.barcode = :barcode", { barcode });
    }
    if (code) {
      queryBuilder.andWhere("product.code = :code", { code });
    }
    queryBuilder.skip(offset).take(limit);
    const [products, total] = await queryBuilder.getManyAndCount();
    return { products, totalPages: Math.ceil(total / limit) };
  }
}
