import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

dotenv.config()

export const appDataSource = new DataSource({
  type: 'sqlite',
  database: `${process.env.DATABASE_DIR}/${process.env.DATABASE_NAME}.sqlite3`,
  synchronize: true,
  logging: true,
  entities: [ __dirname + '/../domaine/**/entity/*.entity{.ts,.js}'],
});
export default appDataSource
