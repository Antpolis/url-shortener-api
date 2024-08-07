import { ConnectionOptions } from "typeorm";
import { Models } from "../entities";

export let db: ConnectionOptions = {
  type: "sqlite",
  database: "src/config/testdata.sqlite",
  entities: Models,
  synchronize: true,
  logging: true,
};
