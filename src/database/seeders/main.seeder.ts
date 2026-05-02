import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { userSeeder } from './user.seder';
import { uomSeeder } from './uom.seeder';
export default class MainSeeder implements Seeder {
  public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
    await userSeeder(dataSource)
    await uomSeeder(dataSource)
  }
}
