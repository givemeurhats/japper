import { Japper } from "./Japper";
import { Client, ClientConfig } from "pg";

type JapperConnectionCallback = (cn: Japper) => Promise<void>;

export class JapperConnection extends Japper {
  public adapter: Client;

  constructor(config: ClientConfig) {
    super();
    this.adapter = new Client(config);
    this.isClient = true;
    this.isOpened = false;
  }

  async open(callback: JapperConnectionCallback | null = null) {
    if (!this.isOpened) await this.adapter.connect();
    this.isOpened = true;
    if (callback) {
      await callback(this);
      await this.close();
    }
  }
}
