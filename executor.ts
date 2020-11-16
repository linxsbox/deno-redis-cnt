import { IRawData } from "./base.ts";
import { sendCommand } from "./bridge.ts";
import { IConnection } from "./connection.ts";
import { Deferred, deferred } from './vendor/deno.land/std/async/mod.ts'

// 
export class Executor {
  readonly connection: IConnection; // 连接实例
  private execQueue: {
    command: string,
    args: (string | number)[],
    defer: Deferred<IRawData>
  }[] = []; // 执行队列
  constructor(connection: IConnection) {
    this.connection = connection;
  }

  // 入列
  async enqueue(command: string, ...args: (string | number)[]): Promise<IRawData> {
    const defer = deferred<IRawData>(); // ???
    this.execQueue.push({ command, args, defer });
    if (this.execQueue.length === 1) {
      this.dequeue();
    }
    return defer;
  }

  // 出列
  private dequeue(): void {
    const [execItem] = this.execQueue;
    if (!execItem) { return; }

    sendCommand(
      this.connection.writer, this.connection.reader,
      execItem.command, ...execItem.args
    )
      .then(execItem.defer.resolve)
      .finally(() => {
        this.execQueue.shift();
        this.dequeue();
      })
  }
  // Dispatch() { }
  // // 执行命令
  // private execCommand() { }
}