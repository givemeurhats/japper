import { buildInsertQuery, buildUpdateQuery, extractValuesForSQL } from "../lib/Helpers";
import { tableName, user1 } from "./users.config";

describe("buildInsertQuery", () => {
  test("generates insert query based on a given object", () => {
    expect(buildInsertQuery("users", user1)).toBe(`INSERT INTO ${tableName}(username, password, email) VALUES($1, $2, $3)`);
  });
});

describe("buildUpdateQuery", () => {
  test("generates update query based on a given object", () => {
    expect(buildUpdateQuery("users", user1)).toBe(`UPDATE ${tableName} SET username = $2, password = $3, email = $4 WHERE id = $1`);
  });

  test("if primaryKeyName provided then generates update query with WHERE clause based on it", () => {
    const primaryKey = "ID";
    expect(buildUpdateQuery("users", user1, primaryKey)).toBe(`UPDATE ${tableName} SET username = $2, password = $3, email = $4 WHERE ${primaryKey} = $1`);
  });
});

describe("extractValuesForSQL", () => {
  test("generates a values string based on object", () => {
    expect(extractValuesForSQL(user1)).toStrictEqual([user1.username, user1.password, user1.email]);
  });

  test("replaces null values with 'NULL'", () => {
    expect(extractValuesForSQL({ ...user1, username: null })).toStrictEqual(["NULL", user1.password, user1.email]);
  });
});
