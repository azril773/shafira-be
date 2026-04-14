import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import MainSeeder from '@database/seeders/main.seeder';

const options: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER || 'azril',
  password: process.env.POSTGRES_PASSWORD || '123',
  database: process.env.POSTGRES_DB || 'shafira_db',
  entities: ['{src,build}/models/*.model{.ts,.js}'],
  // synchronize: true,
  // additional config options brought by typeorm-extension
  factories: ['{src,build}/database/factories/*.factory{.ts,.js}'],
  seeds: [MainSeeder],
};

const dataSource: DataSource = new DataSource(options);

export default dataSource;
