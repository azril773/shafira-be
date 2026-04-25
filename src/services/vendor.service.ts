import dataSource from "@config/database";
import { User } from "@models/user.model";
import { Vendor } from "@models/vendor.model";
import { UUID } from "types/common_type";
import { VendorBody } from "types/vendor_type";

export class VendorService {
  private vendorRepository = dataSource.getRepository(Vendor);

  public async getVendors(): Promise<Vendor[]> {
    return await this.vendorRepository.find();
  }

  public async searchVendors({
    page,
    name,
    phone,
  }: {
    page: number;
    name?: string;
    phone?: string;
  }): Promise<{ vendors: Vendor[]; totalPages: number }> {
    const limit = 10
    const offset = (page - 1) * limit;
    const queryBuilder = this.vendorRepository.createQueryBuilder("vendor");
    if (name) {
      queryBuilder.andWhere("vendor.name = :name", { name });
    }
    if (phone) {
      queryBuilder.andWhere("vendor.phone = :phone", { phone });
    }

    queryBuilder.take(limit).skip(offset);
    const [vendors, count] = await queryBuilder.getManyAndCount();
    return { vendors, totalPages: Math.ceil(count / 10) };
  }

  public async createVendor(user: User, body: VendorBody): Promise<Vendor> {
    const existingVendor = await this.vendorRepository.findOne({
      where: { name: body.name },
    });
    if (existingVendor) {
      throw new Error("Vendor dengan nama tersebut sudah ada");
    }
    const vendor = new Vendor();
    vendor.name = body.name;
    vendor.phone = body.phone;
    vendor.createdById = user.id;
    vendor.updatedById = user.id;
    return await this.vendorRepository.save(vendor);
  }

  public async updateVendor(
    id: UUID,
    user: User,
    body: VendorBody,
  ): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({ where: { id } });
    if (!vendor) throw new Error("Vendor tidak ditemukan");
    Object.assign(vendor, body);
    vendor.updatedById = user.id;
    return await this.vendorRepository.save(vendor);
  }
}
