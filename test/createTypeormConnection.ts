import { createConnection, getConnection } from "typeorm";
import { db } from "../config/sqlitedb";

export const createTypeormConn = async () => {
  const result = await createConnection(db);
  return result;
};

export const closeTypeormConn = async () => {
  return await getConnection().close();
};
