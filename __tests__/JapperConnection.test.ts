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
  await JP.CloseAsync();
});

describe("JapperConnection", () => {
  describe("OpenAsync", () => {
    test("opens connection", async () => {
      const values = ["test", , "test@gmail.com"];
      const JC = new JapperConnection(config);
      await JC.OpenAsync();
      expect(await JC.adapter.query(InsertUserQuery, values)).toStrictEqual(await JC.adapter.query(InsertUserQuery, values));
      await JC.CloseAsync();
    });

    test("if lamda is given it automatically closes connection after running it", async () => {
      const values = ["test", , "test@gmail.com"];
      const JC = new JapperConnection(config);
      await JC.OpenAsync(async (cn) => {
        expect(await cn.adapter.query(InsertUserQuery, values)).toStrictEqual(await cn.adapter.query(InsertUserQuery, values));
      });
      expect(JC.IsOpened).toBe(false);
    });

    describe("QueryAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.QueryAsync(InsertUserQuery, ["test", , "test@gmail.com"]);
        await JC.CloseAsync();
      });
    });

    describe("QueryFirstAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.QueryFirstAsync(`SELECT * FROM ${tableName}`);
        await JC.CloseAsync();
      });
    });

    describe("ExecuteScalarAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.ExecuteScalarAsync(`SELECT username FROM ${tableName} LIMIT 1`);
        await JC.CloseAsync();
      });
    });

    describe("ExecuteAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.ExecuteAsync(`DELETE FROM ${tableName}`);
        await JC.CloseAsync();
      });
    });

    describe("InsertAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.InsertAsync(tableName, user1);
        await JC.CloseAsync();
      });
    });

    describe("InsertReturningAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.InsertReturningAsync(tableName, user1, "username");
        await JC.CloseAsync();
      });
    });

    describe("UpdateAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JP.InsertAsync(tableName, user1);
        await JC.UpdateAsync(tableName, { ...user1, username: "changed" }, "email");
        await JC.CloseAsync();
      });
    });

    describe("DeleteAsync", () => {
      test("auto opens a closed connection", async () => {
        const JC = new JapperConnection(config);
        await JC.DeleteAsync(tableName, "username", user1);
        await JC.CloseAsync();
      });
    });
  });
});
