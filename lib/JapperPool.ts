import { Japper } from "./Japper";
import { Pool, PoolConfig } from "pg";

export class JapperPool extends Japper {
  public adapter: Pool;

  constructor(config: PoolConfig) {
    super();
    this.adapter = new Pool(config);
    this.IsClient = false;
    this.IsOpened = true;
  }
}
