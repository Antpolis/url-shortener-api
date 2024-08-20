import { db } from './db';
import { JWTConfig } from './jwt';

export default () => ({
  database: db,
  jwt: JWTConfig,
});
