import { User } from "@models/user.model";
import { Vendor } from "@models/vendor.model";
import { DataSource } from "typeorm";

export async function vendorSeeder(
  dataSource: DataSource,
  actor: User,
): Promise<Vendor[]> {
  const repo = dataSource.getRepository(Vendor);
  const existing = await repo.find();
  if (existing.length >= 5) return existing;

  const defaults: { name: string; phone: string }[] = [
    { name: "PT Sumber Rejeki", phone: "081200000001" },
    { name: "CV Mitra Niaga", phone: "081200000002" },
    { name: "UD Berkah Jaya", phone: "081200000003" },
    { name: "PT Anugerah Sentosa", phone: "081200000004" },
    { name: "CV Cahaya Abadi", phone: "081200000005" },
  ];

  const items: Vendor[] = [];
  for (const d of defaults) {
    const found = existing.find((v) => v.name === d.name);
    if (found) {
      items.push(found);
      continue;
    }
    const v = new Vendor();
    v.name = d.name;
    v.phone = d.phone;
    v.createdById = actor.id;
    v.updatedById = actor.id;
    items.push(await repo.save(v));
  }
  return items;
}
