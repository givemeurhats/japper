import { Japper } from "./Japper";
import { Client, ClientConfig } from "pg";

type JapperConnectionCallback = (cn: Japper) => Promise<void>;

export class JapperConnection extends Japper {
  public adapter: Client;

  constructor(config: ClientConfig) {
    super();
    this.adapter = new Client(config);
    this.IsClient = true;
    this.IsOpened = false;
  }

  async OpenAsync(callback: JapperConnectionCallback | null = null) {
    if (!this.IsOpened) await this.adapter.connect();
    this.IsOpened = true;
    if (callback) {
      await callback(this);
      await this.CloseAsync();
    }
  }
}
