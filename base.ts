// ----- 初始化基础工程信息 -----

// ---------- RESP v2 协议 ----------
// 数据类型定义
export const ErrorReplyCode = '-'.charCodeAt(0); // 非二进制简单错误信息字符串
export const SimpleStringCode = '+'.charCodeAt(0); // 二进制简单错误信息字符串
export const IntegerReplyCode = ':'.charCodeAt(0); // 有符号 64 位整数数字
export const BulkReplyCode = '$'.charCodeAt(0); // 二进制安全字符串
export const ArrayReplyCode = '*'.charCodeAt(0); // 有序集合列表

// ---------- RESP v3 协议 ----------
// 数据类型定义

// simple types
export const TypeBlobStringCode = '$'.charCodeAt(0); // $<length>\r\n<bytes>\r\n 二进制安全字符串
export const TypeBlobErrorCode = '!'.charCodeAt(0); // !<length>\r\n<bytes>\r\n 二进制安全错误信息字符串
export const TypeSimpleStringCode = '+'.charCodeAt(0); // +<string>\r\n 二进制简单错误信息字符串
export const TypeSimpleErrorCode = '-'.charCodeAt(0); // -<string>\r\n 非二进制简单错误信息字符串
export const TypeNumberCode = ':'.charCodeAt(0); // :<number>\r\n 有符号 64 位整数数字
export const TypeBigNumberCode = '('.charCodeAt(0); // (<big number>\n 大数字
export const TypeDoubleCode = ','.charCodeAt(0); // ,<floating point number>\r\n 浮点数
export const TypeBooleanCode = '#'.charCodeAt(0); // #t\r\n or #f\r\n 布尔类型
export const TypeVerbatimStringCode = '='.charCodeAt(0); // =<length>\r\n<format(3 bytes):><bytes>\r\n 二进制安全字符串,带文本格式
export const TypeNullCode = '_'.charCodeAt(0); // _\r\n 空值

// Aggregate data types
export const TypeArrayCode = '*'.charCodeAt(0); // *<elements number>\r\n... 有序集合列表
export const TypeMapCode = '%'.charCodeAt(0); // %<elements number>\r\n... 有序键值对
export const TypeSetCode = '~'.charCodeAt(0); // ~<elements number>\r\n... 无须不重复集合列表
export const TypeAttributeCode = '|'.charCodeAt(0); // |~<elements number>\r\n... 支持 键 的属性类型，类 Map
export const TypePushCode = '>'.charCodeAt(0); // ><elements number>\r\n<first item is String>\r\n... numelements-1 other types ...

// special type
export const TypeStreamCode = '$EOF:'.charCodeAt(0); // $EOF:<40 bytes marker><CR><LF>... any number of bytes of data here not containing the marker ...<40 bytes marker> 字节流类型

export const CR = '\r'.charCodeAt(0);
export const LF = '\n'.charCodeAt(0);

// 解码/加码
export const encoder = new TextEncoder();
export const decoder = new TextDecoder();

export interface IConfig {
  hostname: string
  port: number
  tls?: boolean
  transport?: string
  db?: number
  username?: string
  password?: string
  maxRetryCount?: number;
  retryInterval?: number;
}
export interface IConfigOptions {
  tls?: boolean
  transport?: string
  db?: number
  username?: string
  password?: string
  maxRetryCount?: number;
  retryInterval?: number;
}

export const defaultConfig = {
  hostname: '127.0.0.1',
  port: 6379,
  tls: false,
  transport: 'TCP',
  db: undefined,
  username: '',
  password: '',
  maxRetryCount: 5,
  retryInterval: 1500,
}

// 安全端口检查，以及遵守 BSD 保留端口范围
function checkSafePort(port = 0) {
  return port >= 1024 && port <= 65535
}

export interface IRawData {
  symbol: string
  state: string | undefined
  len: number
  value: string | number | undefined
  type: string
}

// 命令类型枚举
export enum CommandType {
  AUTH = 'AUTH',
  PING = 'PING',
  SELECT = 'SELECT',
  QUIT = 'QUIT',
  ECHO = 'ECHO',
  FLUSHDB = 'FLUSHDB',
  FLUSHALL = 'FLUSHALL',
  DBSIZE = 'DBSIZE',
  SET = 'SET',
  GET = 'GET',
  DEL = 'DEL',
  TYPE = 'TYPE',
  MOVE = 'move',
  EXPIRE = 'EXPIRE',
  EXPIREAT = 'EXPIREAT',
  PEXPIRE = 'PEXPIRE',
  PEXPIREAT = 'PEXPIREAT',
  PERSIST = 'PERSIST',
  TTL = 'TTL',
  PTTL = 'PTTL',
  EXISTS = 'EXISTS',
}

// 命令接口定义
export interface IRedisCommands {
  // 基本命令
  // 身份验证
  auth(password: string): Promise<IRawData>;
  auth(username: string, password: string): Promise<IRawData>;
  // 用于测试与服务器的连接
  ping(): Promise<IRawData>;
  ping(message: string): Promise<IRawData>;
  // 用于选择库 0~15
  select(index: number): Promise<IRawData>;
  // 退出与 Redis 服务的连接
  quit(): Promise<IRawData>;
  // 
  echo(message: string): Promise<IRawData>;
  // 刷新数据
  flushdb(async?: boolean): Promise<IRawData>;
  flushall(async?: boolean): Promise<IRawData>;
  // 获取当前库的 key 数量
  dbsize(): Promise<IRawData>;

  // 设置 key 数据为 value 可选属性为 opts
  set(key: string, value: string, opts?: any): Promise<IRawData>;
  // 获取 key 的数据
  get(key: string): Promise<IRawData>;
  // 删除 key 的数据
  del(...keys: string[]): Promise<IRawData>;
  // 返回指定 key 的数据类型
  type(key: string): Promise<IRawData>;
  // 移动指定的 key 到指定的 db
  move(key: string, db: number): Promise<IRawData>;

  // 设置过期时间 - 秒
  expire(key: string, seconds: number): Promise<IRawData>;
  // 设置过期时间 - 时间戳
  expireat(key: string, timestamp: string): Promise<IRawData>;
  // 设置过期时间 - 毫秒
  pexpire(key: string, milliseconds: number): Promise<IRawData>;
  // 设置过期时间 - 毫秒时间戳
  pexpireat(key: string, milliseconds_timestamp: number): Promise<IRawData>;
  // 取消过期
  persist(key: string): Promise<IRawData>;

  // 查看过期时间 - 秒
  ttl(key: string): Promise<IRawData>;
  // 查看过期时间 - 毫秒
  pttl(key: string): Promise<IRawData>;

  // 是否存在 - 存在：1 | 不存在：0
  existe(key: string): Promise<IRawData>;
}