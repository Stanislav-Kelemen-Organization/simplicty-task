import 'dotenv/config';

import { DataSource } from "typeorm"
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { join } from 'path';

const {
  DB_HOST: host,
  DB_PORT: port,
  DB_USER: username,
  DB_PASSWORD: password,
  DB_NAME: database,
} = process.env;

export const databaseConfiguration: DataSourceOptions = {
  type: 'postgres',
  host,
  port: parseInt(port || '5432', 10),
  username,
  password,
  database,
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
};

export default new DataSource({
  ...databaseConfiguration,
  entities: [join(__dirname, '../src/**/*.model.ts')],
  migrations:[ "d"],
});

