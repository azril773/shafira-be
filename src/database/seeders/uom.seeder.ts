import { Uom } from "@models/uom.model";
import { DataSource } from "typeorm";

export async function uomSeeder(dataSource: DataSource) {
  const repo = dataSource.getRepository(Uom);
  const defaults: { code: string; name: string; description?: string }[] = [
    { code: "pcs", name: "Pieces", description: "Satuan per buah" },
    { code: "gram", name: "Gram", description: "Satuan berat (gram)" },
    { code: "ml", name: "Mililiter", description: "Satuan volume (ml)" },
  ];
  const items = defaults.map((d) => {
    const u = new Uom();
    u.code = d.code;
    u.name = d.name;
    u.description = d.description ?? null;
    return u;
  });
  return await repo.save(items);
}
