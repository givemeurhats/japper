import Pg from "pg";
import { JapperConnection, JapperPool } from "../lib/index";
import { config } from "./tests.config";
import { tableName, user1, InsertUserQuery } from "./users.config";

const pgOriginalPool = new Pg.Pool(config);
const JP = new JapperPool(config);

beforeAll(async () => {
  await pgOriginalPool.query(`DROP TABLE IF EXISTS ${tableName}`);
  await pgOriginalPool.query(`CREATE TABLE ${tableName}(username VARCHAR(50),password VARCHAR(50), email VARCHAR(255))`);
});

afterEach(async () => {
  await pgOriginalPool.query(`DELETE FROM ${tableName}`);
});

afterAll(async () => {
  await pgOriginalPool.query(`DROP TABLE IF EXISTS ${tableName}`);
  await pgOriginalPool.end();
  await JP.close();
});

describe("JapperConnection", () => {
  describe("OpenAsync", () => {
    test("opens connection", async () => {
      const values = ["test", , "test@gmail.com"];
      const JC = new JapperConnection(config);
      await JC.open();
      expect(await JC.adapter.query(InsertUserQuery, values)).toStrictEqual(await JC.adapter.query(InsertUserQuery, values));
      await JC.close();
    });

    test("if lamda is given it automatically closes connection after running it", async () => {
      const values = ["test", , "test@gmail.com"];
      const JC = new JapperConnection(config);
      await JC.open(async (cn) => {
        expect(await cn.adapter.query(InsertUserQuery, values)).toStrictEqual(await cn.adapter.query(InsertUserQuery, values));
      });
      expect(JC.isOpened).toBe(false);
    });

    describe("QueryAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.query(InsertUserQuery, ["test", , "test@gmail.com"]);
        await JC.close();
      });
    });

    describe("QueryFirstAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.queryFirst(`SELECT * FROM ${tableName}`);
        await JC.close();
      });
    });

    describe("ExecuteScalarAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.executeScalar(`SELECT username FROM ${tableName} LIMIT 1`);
        await JC.close();
      });
    });

    describe("ExecuteAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.execute(`DELETE FROM ${tableName}`);
        await JC.close();
      });
    });

    describe("InsertAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.insert(tableName, user1);
        await JC.close();
      });
    });

    describe("InsertReturningAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.insertReturning(tableName, user1, "username");
        await JC.close();
      });
    });

    describe("UpdateAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JP.insert(tableName, user1);
        await JC.update(tableName, { ...user1, username: "changed" }, "email");
        await JC.close();
      });
    });

    describe("DeleteAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.delete(tableName, "username", user1);
        await JC.close();
      });
    });
  });
});
