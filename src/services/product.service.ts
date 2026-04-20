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


  public async searchProducts({ page, barcode, code }: { page: number; barcode?: string; code?: string }): Promise<{ products: Product[], totalPages: number }> {
    const limit = 10
    const offset = (page - 1) * limit;
    const queryBuilder = this.productRepository.createQueryBuilder("product");
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
