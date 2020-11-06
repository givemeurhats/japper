import { Pool, Client } from "pg";
import { buildInsertQuery, buildUpdateQuery, extractValuesForSQL } from "./Helpers";
import omit from "lodash.omit";

export class Japper {
  public adapter!: Pool | Client;
  public IsOpened!: boolean;
  protected IsClient: boolean = false;

  async QueryAsync<T extends object>(query: string, params?: any[] | undefined): Promise<T[]> {
    if (!this.IsOpened) await this.OpenAsync();
    return (await this.adapter.query(query, params)).rows;
  }

  async QueryFirstAsync<T extends object>(query: string, params?: any[] | undefined): Promise<T | null> {
    if (!this.IsOpened) await this.OpenAsync();
    const value = await this.adapter.query(query, params);
    return value && value.rows.length > 0 ? value.rows[0] : null;
  }

  async ExecuteScalarAsync(query: string, params?: any[]): Promise<string | null> {
    if (!this.IsOpened) await this.OpenAsync();
    const value = await this.adapter.query(query, params);
    return value && value.rows.length > 0 ? value.rows[0][value.fields[0].name] : null;
  }

  async ExecuteAsync(query: string, params?: any[]): Promise<number> {
    if (!this.IsOpened) await this.OpenAsync();
    return (await this.adapter.query(query, params)).rowCount;
  }

  async InsertAsync<T extends object, K extends keyof T>(tableName: string, obj: T, excludeFields: K[] | null = null): Promise<number> {
    if (!this.IsOpened) await this.OpenAsync();
    const cleanObject = excludeFields != null ? omit(obj, excludeFields) : obj;
    return (await this.adapter.query(buildInsertQuery(tableName, cleanObject), extractValuesForSQL(cleanObject))).rowCount;
  }

  async InsertReturningAsync<T extends object, R extends keyof T, E extends keyof T>(tableName: string, obj: T, returningPropertyName: R, excludeFields: E[] | null = null): Promise<string> {
    if (!this.IsOpened) await this.OpenAsync();
    const cleanObject = excludeFields != null ? omit(obj, excludeFields) : obj;
    const query = await this.adapter.query(`${buildInsertQuery(tableName, cleanObject)} RETURNING ${returningPropertyName}`, extractValuesForSQL(cleanObject));
    return query.rows[0][query.fields[0].name];
  }

  async UpdateAsync<T extends object, K extends keyof T>(tableName: string, obj: T, primaryKeyName: K, excludeFields: K[] | null = null): Promise<number> {
    if (!this.IsOpened) await this.OpenAsync();
    const cleanObject = excludeFields != null ? omit(obj, excludeFields) : obj;
    return (await this.adapter.query(buildUpdateQuery(tableName, cleanObject, primaryKeyName.toString()), [obj[primaryKeyName], ...extractValuesForSQL(cleanObject)])).rowCount;
  }

  async DeleteAsync(tableName: string, primaryKeyName: string = "id", primaryKeyValue: any): Promise<number> {
    if (!this.IsOpened) await this.OpenAsync();
    return (await this.adapter.query(`DELETE FROM ${tableName} WHERE ${primaryKeyName} = $1`, [primaryKeyValue])).rowCount;
  }

  public async OpenAsync() {
    if (!this.IsOpened) await this.adapter.connect();
    this.IsOpened = true;
  }

  async CloseAsync() {
    if (this.IsOpened) await this.adapter.end();
    this.IsOpened = false;
  }
}
