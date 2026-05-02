import dataSource from "@config/database";
import { Uom } from "@models/uom.model";
import { UUID } from "types/common_type";
import { UomBody } from "types/uom";

export class UomService {
  private repo = dataSource.getRepository(Uom);

  public async list(): Promise<Uom[]> {
    return await this.repo.find({ order: { code: "ASC" } });
  }

  public async getById(id: UUID): Promise<Uom> {
    const uom = await this.repo.findOne({ where: { id } });
    if (!uom) throw new Error("UoM tidak ditemukan.");
    return uom;
  }

  public async create(body: UomBody): Promise<Uom> {
    const exists = await this.repo.findOne({ where: { code: body.code } });
    if (exists) throw new Error("Kode UoM sudah digunakan.");
    const uom = new Uom();
    uom.code = body.code;
    uom.name = body.name;
    uom.description = body.description ?? null;
    return await this.repo.save(uom);
  }

  public async update(id: UUID, body: UomBody): Promise<Uom> {
    const uom = await this.getById(id);
    if (body.code && body.code !== uom.code) {
      const exists = await this.repo.findOne({ where: { code: body.code } });
      if (exists) throw new Error("Kode UoM sudah digunakan.");
      uom.code = body.code;
    }
    uom.name = body.name ?? uom.name;
    uom.description = body.description ?? uom.description;
    return await this.repo.save(uom);
  }

  public async remove(id: UUID): Promise<void> {
    const uom = await this.getById(id);
    await this.repo.remove(uom);
  }
}
