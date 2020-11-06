import Pg from "pg";
import { JapperPool } from "../lib/index";
import { config } from "./tests.config";
import { tableName, User, user1, user2, InsertUserQuery } from "./users.config";

const pgOriginalPool = new Pg.Pool(config);
const JP = new JapperPool(config);

const insertUser = async (newUser: User): Promise<void> => {
  await pgOriginalPool.query(InsertUserQuery, [newUser.username, newUser.password, newUser.email]);
};

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

describe("Japper", () => {
  describe("QueryAsync", () => {
    test("returns an array of found rows", async () => {
      await insertUser(user1);
      await insertUser(user2);

      const JapperPoolResult = await JP.QueryAsync<User>(`SELECT * FROM ${tableName}`);
      expect(Array.isArray(JapperPoolResult)).toBe(true);
      expect(JapperPoolResult[0]).toStrictEqual(user1);
      expect(JapperPoolResult[1]).toStrictEqual(user2);
    });

    test("returns an empty array if no matches found", async () => {
      const JapperPoolResult = await JP.QueryAsync<User>(`SELECT * FROM ${tableName}`);
      expect(Array.isArray(JapperPoolResult)).toBe(true);
      expect(JapperPoolResult.length).toBe(0);
    });
  });

  describe("QueryFirstAsync", () => {
    test("returns a single row object if any number of rows are found", async () => {
      await pgOriginalPool.query(InsertUserQuery, [user1.username, user1.password, user1.email]);
      await pgOriginalPool.query(InsertUserQuery, [user2.username, user2.password, user2.email]);
      const JapperPoolResult = await JP.QueryFirstAsync<User>(`SELECT * FROM ${tableName} WHERE username = $1`, [user2.username]);
      expect(Array.isArray(JapperPoolResult)).toBe(false);
      expect(JapperPoolResult).toStrictEqual(user2);
    });

    test("returns null if no matches found", async () => {
      expect(
        await JP.QueryFirstAsync<User>(`SELECT * FROM ${tableName} WHERE username = $1`, [user2.username])
      ).toBeNull();
    });
  });

  describe("ExecuteScalarAsync", () => {
    test("returns single value as string if found", async () => {
      await pgOriginalPool.query(InsertUserQuery, [user1.username, user1.password, user1.email]);
      await pgOriginalPool.query(InsertUserQuery, [user2.username, user2.password, user2.email]);
      const JapperPoolResult = await JP.ExecuteScalarAsync(`SELECT email FROM ${tableName} WHERE username = $1`, [user2.username]);
      expect(typeof JapperPoolResult).toBe(typeof "");
      expect(JapperPoolResult).toBe(user2.email);
    });

    test("returns null if no matches found", async () => {
      expect(await JP.ExecuteScalarAsync(`SELECT email FROM ${tableName} WHERE username = $1`, [user2.username])).toBeNull();
    });
  });

  describe("ExecuteAsync", () => {
    test("returns number of rows changed", async () => {
      await pgOriginalPool.query(InsertUserQuery, [user1.username, user1.password, user1.email]);
      await pgOriginalPool.query(InsertUserQuery, [user2.username, user2.password, user2.email]);
      expect(await JP.ExecuteAsync(`DELETE FROM ${tableName}`)).toBe(2);
      expect(await JP.ExecuteAsync(`DELETE FROM ${tableName}`)).toBe(0);
    });
  });

  describe("InsertAsync", () => {
    test("generates insert query based on a provided object", async () => {
      await JP.InsertAsync(tableName, user1);
      expect(await JP.QueryFirstAsync<User>(`SELECT * FROM ${tableName}`)).toStrictEqual(user1);
    });

    test("ignores fields listed in IgnoreFields when generating query from object schema", async () => {
      try {
        await JP.InsertAsync(tableName, { ...user1, ignore: "test" });
      } catch (error) {
        expect(error.message).toBe('column "ignore" of relation "users" does not exist');
      }
      await JP.InsertAsync(tableName, { ...user1, ignore: "test" }, ["ignore"]);
      expect(await JP.QueryFirstAsync<User>(`SELECT * FROM ${tableName}`)).toStrictEqual(user1);
    });

    test("returns number of rows changed", async () => {
      expect(await JP.InsertAsync(tableName, { ...user1, ignore: "test" }, ["ignore"])).toBe(1);
    });
  });

  describe("InsertReturningAsync", () => {
    test("returns returningPropertyName as string", async () => {
      expect(await JP.InsertReturningAsync(tableName, user1, "username")).toBe(user1.username);
    });
  });

  describe("UpdateAsync", () => {
    test("generates update query based on provided object and returns modified rows count", async () => {
      await JP.InsertAsync(tableName, user1);
      expect(await JP.UpdateAsync(tableName, { ...user1, email: "changed@gmail.com" }, "username")).toBe(1);
      await JP.InsertAsync(tableName, user1);
      expect(await JP.UpdateAsync(tableName, { ...user1, email: "changed@gmail.com" }, "username")).toBe(2);
      expect(await JP.UpdateAsync(tableName, { ...user2, email: "changed@gmail.com" }, "username")).toBe(0);
    });

    test("ignores fields listed in IgnoreFields when generating query from object schema", async () => {
      await JP.InsertAsync(tableName, user1);
      expect(await JP.UpdateAsync(tableName, { ...user1, email: "changed@gmail.com", extra: "test" }, "username", ["extra"])).toBe(1);
    });
  });

  describe("DeleteAsync", () => {
    test("generates basic delete query", async () => {
      await JP.InsertAsync(tableName, user1);
      expect(await JP.QueryFirstAsync(`SELECT * FROM ${tableName}`)).toStrictEqual(user1);
      await JP.DeleteAsync(tableName, "username", user1.username);
      expect(await JP.QueryFirstAsync(`SELECT * FROM ${tableName}`)).toBe(null);
    });

    test("returns number of rows changed", async () => {
      await JP.InsertAsync(tableName, user1);
      expect(await JP.DeleteAsync(tableName, "username", user1.username)).toBe(1);
      expect(await JP.DeleteAsync(tableName, "username", user1.username)).toBe(0);
    });

    describe("CloseAsync", () => {
      test("closes an open connection", async () => {
        const JP2 = new JapperPool(config);
        await JP2.CloseAsync();
        try {
          await JP2.InsertAsync(tableName, user1);
        } catch (error) {
          expect(error.message).toBe("Cannot use a pool after calling end on the pool");
        }
      });
    });
  });
});
