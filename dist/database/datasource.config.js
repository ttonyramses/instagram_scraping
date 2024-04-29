"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv = require("dotenv");
dotenv.config();
exports.appDataSource = new typeorm_1.DataSource({
    type: 'sqlite',
    database: `${process.env.DATABASE_DIR}/${process.env.DATABASE_NAME}.sqlite3`,
    synchronize: true,
    logging: true,
    entities: [__dirname + '/../domaine/**/entity/*.entity{.ts,.js}'],
});
exports.default = exports.appDataSource;
//# sourceMappingURL=datasource.config.js.map