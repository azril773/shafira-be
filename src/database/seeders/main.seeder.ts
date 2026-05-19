import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { userSeeder } from './user.seder';
import { uomSeeder } from './uom.seeder';
import { vendorSeeder } from './vendor.seeder';
import { productSeeder } from './product.seeder';
import { purchaseSeeder } from './purchase.seeder';
import { User } from '@models/user.model';
import { ADMIN } from '@constants/user';
export default class MainSeeder implements Seeder {
  public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
    void factoryManager;
    await userSeeder(dataSource)
    await uomSeeder(dataSource)
    const admin = await dataSource.getRepository(User).findOneOrFail({ where: { username: 'admin', role: ADMIN } })
    const vendors = await vendorSeeder(dataSource, admin)
    const products = await productSeeder(dataSource)
    await purchaseSeeder(dataSource, products, vendors, admin)
  }
}
