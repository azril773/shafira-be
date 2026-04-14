import dataSource from "@config/database";
import { Product } from "@models/product.model";
import { ProductBody } from "types/product";
import { generateUniqueCode, validateBarcode } from "utils/utils";

export class ProductService {
  private productRepository = dataSource.getRepository(Product);
  public async createProduct(body: ProductBody): Promise<Product> {
    const isBarcodeValid = validateBarcode(body.barcode);
    if (!isBarcodeValid) throw new Error("Invalid barcode");

    const existingCodes = (await this.productRepository.find()).map((p) => p.code);

    let code = generateUniqueCode(8);
    while (existingCodes.includes(code)) {
      code = generateUniqueCode(8);
    }

    const product = new Product();
    product.name = body.name;
    product.price = body.price;
    product.category = body.category;
    product.barcode = body.barcode;
    product.code = code;
    return await this.productRepository.save(product);
  }


  public async getProductByCode(code: string): Promise<Product[]> {
    return await this.productRepository.find({ where: { code } });
  }

  public async getProductByBarcode(barcode: string): Promise<Product[]> {
    return await this.productRepository.find({ where: { barcode } });
  }
}
