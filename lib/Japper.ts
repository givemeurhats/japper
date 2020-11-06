import { Pool, Client } from "pg";
import { buildInsertQuery, buildUpdateQuery, extractValuesForSQL } from "./Helpers";
import omit from "lodash.omit";

export class Japper {
  public adapter!: Pool | Client;
  public isOpened!: boolean;
  protected isClient: boolean = false;

  async query<T extends object>(query: string, params?: any[] | undefined): Promise<T[]> {
    if (!this.isOpened) await this.open();
    return (await this.adapter.query(query, params)).rows;
  }

  async queryFirst<T extends object>(query: string, params?: any[] | undefined): Promise<T | null> {
    if (!this.isOpened) await this.open();
    const value = await this.adapter.query(query, params);
    return value && value.rows.length > 0 ? value.rows[0] : null;
  }

  async executeScalar(query: string, params?: any[]): Promise<string | null> {
    if (!this.isOpened) await this.open();
    const value = await this.adapter.query(query, params);
    return value && value.rows.length > 0 ? value.rows[0][value.fields[0].name] : null;
  }

  async execute(query: string, params?: any[]): Promise<number> {
    if (!this.isOpened) await this.open();
    return (await this.adapter.query(query, params)).rowCount;
  }

  async insert<T extends object, K extends keyof T>(tableName: string, obj: T, excludeFields: K[] | null = null): Promise<number> {
    if (!this.isOpened) await this.open();
    const cleanObject = excludeFields != null ? omit(obj, excludeFields) : obj;
    return (await this.adapter.query(buildInsertQuery(tableName, cleanObject), extractValuesForSQL(cleanObject))).rowCount;
  }

  async insertReturning<T extends object, R extends keyof T, E extends keyof T>(tableName: string, obj: T, returningPropertyName: R, excludeFields: E[] | null = null): Promise<string> {
    if (!this.isOpened) await this.open();
    const cleanObject = excludeFields != null ? omit(obj, excludeFields) : obj;
    const query = await this.adapter.query(`${buildInsertQuery(tableName, cleanObject)} RETURNING ${returningPropertyName}`, extractValuesForSQL(cleanObject));
    return query.rows[0][query.fields[0].name];
  }

  async update<T extends object, K extends keyof T>(tableName: string, obj: T, primaryKeyName: K, excludeFields: K[] | null = null): Promise<number> {
    if (!this.isOpened) await this.open();
    const cleanObject = excludeFields != null ? omit(obj, excludeFields) : obj;
    return (await this.adapter.query(buildUpdateQuery(tableName, cleanObject, primaryKeyName.toString()), [obj[primaryKeyName], ...extractValuesForSQL(cleanObject)])).rowCount;
  }

  async delete(tableName: string, primaryKeyName: string = "id", primaryKeyValue: any): Promise<number> {
    if (!this.isOpened) await this.open();
    return (await this.adapter.query(`DELETE FROM ${tableName} WHERE ${primaryKeyName} = $1`, [primaryKeyValue])).rowCount;
  }

  public async open() {
    if (!this.isOpened) await this.adapter.connect();
    this.isOpened = true;
  }

  async close() {
    if (this.isOpened) await this.adapter.end();
    this.isOpened = false;
  }
}
