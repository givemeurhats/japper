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
  await JP.closeAsync();
});

describe("JapperConnection", () => {
  describe("OpenAsync", () => {
    test("opens connection", async () => {
      const values = ["test", , "test@gmail.com"];
      const JC = new JapperConnection(config);
      await JC.openAsync();
      expect(await JC.adapter.query(InsertUserQuery, values)).toStrictEqual(await JC.adapter.query(InsertUserQuery, values));
      await JC.closeAsync();
    });

    test("if lamda is given it automatically closes connection after running it", async () => {
      const values = ["test", , "test@gmail.com"];
      const JC = new JapperConnection(config);
      await JC.openAsync(async (cn) => {
        expect(await cn.adapter.query(InsertUserQuery, values)).toStrictEqual(await cn.adapter.query(InsertUserQuery, values));
      });
      expect(JC.isOpened).toBe(false);
    });

    describe("QueryAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.queryAsync(InsertUserQuery, ["test", , "test@gmail.com"]);
        await JC.closeAsync();
      });
    });

    describe("QueryFirstAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.queryFirstAsync(`SELECT * FROM ${tableName}`);
        await JC.closeAsync();
      });
    });

    describe("ExecuteScalarAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.executeScalarAsync(`SELECT username FROM ${tableName} LIMIT 1`);
        await JC.closeAsync();
      });
    });

    describe("ExecuteAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.executeAsync(`DELETE FROM ${tableName}`);
        await JC.closeAsync();
      });
    });

    describe("InsertAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.insertAsync(tableName, user1);
        await JC.closeAsync();
      });
    });

    describe("InsertReturningAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.insertReturningAsync(tableName, user1, "username");
        await JC.closeAsync();
      });
    });

    describe("UpdateAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JP.insertAsync(tableName, user1);
        await JC.updateAsync(tableName, { ...user1, username: "changed" }, "email");
        await JC.closeAsync();
      });
    });

    describe("DeleteAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.deleteAsync(tableName, "username", user1);
        await JC.closeAsync();
      });
    });
  });
});
