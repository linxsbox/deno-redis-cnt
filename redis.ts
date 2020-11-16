import { IConfig, defaultConfig, CommandType, IRawData, IRedisCommands } from './base.ts';
import { Executor } from "./executor.ts";
import { RedisConnection, IConnection } from "./connection.ts";

interface IRedisInstance {
  readonly connection: IConnection; // 连接实例
  readonly executor: Executor;
  readonly isClosed: boolean; // 是否关闭： true 已关闭 | false 未关闭
  readonly isConnected: boolean; // 是否连接： true 已连接 | false 未连接
  close(): void;
}

// export class RedisImpl {
export class RedisImpl implements IRedisInstance, IRedisCommands {
  readonly connection: IConnection; // 连接实例
  readonly executor: Executor;
  constructor(connection: IConnection, executor: Executor) {
    this.connection = connection; // 连接实例操作
    this.executor = executor;
  }

  // 获取已创建连接的关闭状态
  get isClosed(): boolean {
    return this.connection.isClosed;
  }
  // 获取已创建连接的连接状态
  get isConnected(): boolean {
    return this.connection.isConnected;
  }
  // 调用已创建连接并关闭该连接
  close(): void {
    this.connection.close();
  }

  // ----- 基本命令操作 -----
  auth(username: string, password?: string) {
    if (password !== undefined) {
      return this.exec(CommandType.AUTH, username, password);
    }
    return this.exec(CommandType.AUTH, username);
  }
  ping(message?: string) {
    if (message) {
      return this.exec(CommandType.PING, message);
    }
    return this.exec(CommandType.PING);
  }
  select(index: number): Promise<IRawData> {
    return this.exec(CommandType.SELECT, index);
  }
  quit(): Promise<IRawData> {
    return this.exec(CommandType.SELECT).finally(() => this.close());
  }
  echo(message: string): Promise<IRawData> {
    return this.exec(CommandType.ECHO, message);
  }

  // ----- 刷新操作 -----
  flushdb(async?: boolean): Promise<IRawData> {
    if (async) {
      return this.exec(CommandType.FLUSHDB, 'ASYNC');
    }
    return this.exec(CommandType.FLUSHDB);
  };
  flushall(async?: boolean): Promise<IRawData> {
    if (async) {
      return this.exec(CommandType.FLUSHALL, 'ASYNC');
    }
    return this.exec(CommandType.FLUSHALL);
  };
  dbsize(): Promise<IRawData> {
    return this.exec(CommandType.DBSIZE);
  }

  // ---------
  set(key: string, value: string, opts?: any): Promise<IRawData> {
    const setArgs: (string | number)[] = [key, value];
    return this.exec(CommandType.SET, ...setArgs);
  }
  get(key: string): Promise<IRawData> {
    return this.exec(CommandType.GET, key);
  }
  del(...keys: string[]): Promise<IRawData> {
    return this.exec(CommandType.DEL, ...keys);
  }
  type(key: string): Promise<IRawData> {
    return this.exec(CommandType.TYPE, key);
  }
  move(key: string, db: number): Promise<IRawData> {
    return this.exec(CommandType.MOVE, key, db);
  }

  // ----- 过期时间操作 -----
  expire(key: string, seconds: number): Promise<IRawData> {
    return this.exec(CommandType.EXPIRE, key, seconds);
  }
  expireat(key: string, timestamp: string): Promise<IRawData> {
    return this.exec(CommandType.EXPIRE, key, timestamp);
  }
  pexpire(key: string, milliseconds: number): Promise<IRawData> {
    return this.exec(CommandType.EXPIRE, key, milliseconds);
  }
  pexpireat(key: string, milliseconds_timestamp: number): Promise<IRawData> {
    return this.exec(CommandType.EXPIRE, key, milliseconds_timestamp);
  }
  persist(key: string): Promise<IRawData> {
    return this.exec(CommandType.PERSIST, key);
  }
  ttl(key: string): Promise<IRawData> {
    return this.exec(CommandType.TTL, key);
  }
  pttl(key: string): Promise<IRawData> {
    return this.exec(CommandType.PTTL, key);
  }

  // ----- 是否存在 -----
  existe(key: string): Promise<IRawData> {
    return this.exec(CommandType.EXISTS, key);
  }

  // ----------

  async exec(
    command: string,
    ...args: (string | number)[]
  ): Promise<IRawData> {
    return await this.executor.enqueue(command, ...args);;
  }
}

/**
 * @example
 * const config = { hostname: 127.0.0.1, port: 6379 };
 * const redis = await Redis(config);
 * // config opstions
 * tls?: false
 * transport?: 'TCP'
 * db?: undefined
 * username?: ''
 * password?: ''
 * maxRetryCount?: 5
 * retryInterval?: 1500
 */
export async function Redis(config?: IConfig) {
  const { hostname = '127.0.0.1', port = 6379, ...opts } = config || defaultConfig;
  const redisConnection = new RedisConnection(hostname, port, opts);
  await redisConnection.connect();
  const executor = new Executor(redisConnection);
  return new RedisImpl(redisConnection, executor);
}
