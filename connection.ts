import { IConfig, IConfigOptions } from './base.ts';
import { sendCommand } from './bridge.ts';
import { BufReader, BufWriter } from './vendor/deno.land/std/io/bufio.ts';

// 定义关闭类型
type Closer = Deno.Closer;

// 连接器接口定义
export interface IConnection {
  closer: Closer; // 连接关闭器
  reader: BufReader; // 读取器
  writer: BufWriter; // 写入器
  maxRetryCount: number; // 最大重试次数
  retryInterval: number; // 重试间隔
  isClosed: boolean; // 是否关闭
  isConnected: boolean; // 是否连接
  close(): void; // 关闭函数
  connect(): Promise<void>; // 连接函数
  reconnect(): Promise<void>; // 重连函数
}

export class RedisConnection implements IConnection {
  closer!: Closer; // 连接关闭器
  reader!: BufReader; // 读取器
  writer!: BufWriter; // 写入器

  username = ''; // 默认用户名

  maxRetryCount = 5; // 默认尝试次数 5
  retryInterval = 1500; // 默认尝试间隔 1.5 秒

  private retryCount = 0; // 已尝试次数
  private _isClosed = false; // 关闭状态默认为 false
  private _isConnected = false; // 连接状态默认为 false

  private connector: () => Promise<RedisConnection>;

  // 获取关闭状态
  get isClosed(): boolean {
    return this._isClosed;
  }
  // 获取连接状态
  get isConnected(): boolean {
    return this._isConnected;
  }

  constructor(
    hostname: string,
    port: number,
    options: IConfigOptions
  ) {
    this.connector = this.vConnector(hostname, port, options);
  }

  // 连接器实现，返回一个由 Promise 包装过的 RedisConnection 对象
  private vConnector(
    hostname: string,
    port: number,
    options: IConfigOptions
  ): () => Promise<RedisConnection> {
    return async () => {
      const dialOpts: Deno.ConnectOptions = {
        hostname, port
      };
      const conn: Deno.Conn = await Deno.connect(dialOpts);

      // options logic
      if (options?.username) {
        this.username = options.username;
      }
      // 如果配置了重试次数，则使用重试次数的配置信息
      if (options?.maxRetryCount) {
        this.maxRetryCount = options.maxRetryCount;
      }
      // 如果配置了重试间隔，则使用重试间隔的配置信息
      if (options?.retryInterval) {
        this.retryInterval = options.retryInterval;
      }

      // 创建连接的 读/写 器
      this.reader = new BufReader(conn);
      this.writer = new BufWriter(conn);

      // 更新连接关闭器
      this.closer = conn;

      // 更新状态
      this._isClosed = false;
      this._isConnected = true;

      try {
        // 如果有访问密码，则调用验证函数
        if (options?.password) {
          await this.authenticate(options.password);
        }
        // 如果有指定库名，则调用选择库函数
        if (options?.db) {
          await this.selectDB(options.db)
        }
      } catch (error) {
        throw new Error(error);
      }

      return this as RedisConnection;
    };
  }

  // 
  private async authenticate(password: string): Promise<any> {
    return sendCommand(this.writer, this.reader, 'AUTH', password);
  }

  // 
  private async selectDB(db: number): Promise<any> {
    if (!db && db !== 0) {
      throw new Error('数据库索引未定义。');
    } else if (db < 0 && db > 15) {
      throw new Error(`${db} 不是一个合法的数据库索引。`);
    }
    return
  }

  // 关闭连接
  close(): void {
    this._isClosed = true;
    this._isConnected = false;

    this.closer.close();

    throw new Error('Method not implemented.');
  }

  // 连接 Redis
  async connect(): Promise<void> {
    await this.connector();
    // throw new Error('Method not implemented.');
  }

  // 重连 Redis
  async reconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
