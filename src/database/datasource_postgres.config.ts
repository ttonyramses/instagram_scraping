import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

dotenv.config();

export const appDataSource = new DataSource({
  type: 'postgres',
  host: "localhost",
  port: 15432,
  username: "postgres",
  password: "postgres",
  database: `${process.env.DATABASE_NAME}`,
  synchronize: true,
  logging: false,
  entities: [__dirname + '/../domaine/**/entity/*.entity{.ts,.js}'],
});
export default appDataSource;