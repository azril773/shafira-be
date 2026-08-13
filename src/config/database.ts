import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import MainSeeder from '@database/seeders/main.seeder';
import path from 'path';

const runtimeRoot = path.basename(path.dirname(__dirname));
const runtimeExtension = runtimeRoot === 'build' ? 'js' : 'ts';

const options: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER || 'azril',
  password: process.env.POSTGRES_PASSWORD || '123',
  database: process.env.POSTGRES_DB || 'shafira_db_clone',
  entities: [`${runtimeRoot}/models/*.model.${runtimeExtension}`],
  migrations: [`${runtimeRoot}/database/migrations/*.${runtimeExtension}`],
  // synchronize: true,
  // additional config options brought by typeorm-extension
  factories: [`${runtimeRoot}/database/factories/*.factory.${runtimeExtension}`],
  seeds: [MainSeeder],
};

const dataSource: DataSource = new DataSource(options);

export default dataSource;
