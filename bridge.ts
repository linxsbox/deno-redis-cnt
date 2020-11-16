import {
  encoder, decoder,
  TypeBlobStringCode,
  TypeBlobErrorCode,
  TypeSimpleStringCode,
  TypeSimpleErrorCode,
  TypeNumberCode,
  TypeBigNumberCode,
  TypeDoubleCode,
  TypeBooleanCode,
  TypeVerbatimStringCode,
  TypeNullCode,
  TypeArrayCode,
  TypeMapCode,
  TypeSetCode,
  TypeAttributeCode,
  TypePushCode,
  TypeStreamCode,
  IRawData
} from "./base.ts";
import { BufReader, BufWriter } from "./vendor/deno.land/std/io/bufio.ts";

// 构建命令内容
export function buildCommand(command: string, args: (string | number)[]) {
  const parseArgs = args.filter(val => val !== void 0 && val !== null);
  let commandMsg = '';
  commandMsg += `*${parseArgs.length + 1}\r\n`; // 有序集合数量，即命令参数个数
  commandMsg += `$${command.length}\r\n`; // 子命令长度
  commandMsg += `${command}\r\n`; // 子命令明文

  // 子命令后的参数
  for (const arg of parseArgs) {
    const argItem = String(arg); // 参数转为字符串类型
    const byteLen = encoder.encode(argItem).byteLength; // 转换后字节长度
    commandMsg += `$${byteLen}\r\n`; // 参数长度
    commandMsg += `${argItem}\r\n`; // 参数明文
  }

  return commandMsg;
}

// 发送命令
export async function sendCommand(
  writer: BufWriter,
  reader: BufReader,
  command: string,
  ...args: (number | string)[]
) {
  const msg = buildCommand(command, args);

  await writer.write(encoder.encode(msg));
  await writer.flush();

  return readReply(reader);
}

// 读取回复数据
async function readReply(reader: BufReader): Promise<any> {
  const res = await reader.peek(1);
  if (res === null) { throw new Error(); }

  switch (res[0]) {
    case TypeBlobStringCode:
      return await typeBlobString(reader, 'BlobString');
    case TypeBlobErrorCode:
      return await typeBlobError(reader, 'BlobError');
    case TypeSimpleStringCode:
      return await typeSimpleString(reader, 'SimpleString');
    case TypeSimpleErrorCode:
      return await typeSimpleError(reader, 'SimpleError');
    case TypeNumberCode:
      return await typeNumber(reader, 'Number');
    case TypeBigNumberCode:
      return await typeBigNumber(reader, 'BigNumber');
    case TypeDoubleCode:
      return await typeDouble(reader, 'Double');
    case TypeBooleanCode:
      return await typeBoolean(reader, 'Boolean');
    case TypeVerbatimStringCode:
      return await typeVerbatimString(reader, 'VerbatimString');
    case TypeNullCode:
      return await typeNull(reader, 'Null');
    case TypeArrayCode:
      return await typeArray(reader, 'Array');
    case TypeMapCode:
      return await typeMap(reader, 'Map');
    case TypeSetCode:
      return await typeSet(reader, 'Set');
    case TypeAttributeCode:
      return await typeAttribute(reader, 'Attribute');
    case TypePushCode:
      return await typePush(reader, 'Push');
    case TypeStreamCode:
      return await typeStream(reader, 'Stream');
  }
  throw new Error();
}

// 解析回复数据
function parseReplyData(reader: BufReader) {
  // console.log(reader.buffered());
  const buf = new Uint8Array(reader.buffered());
  reader.readFull(buf); // 但凡调用了 reader 实例的 read 函数，则整个流程就会阻塞
  // console.log(decoder.decode(buf));
  const sbuf: string[] = decoder.decode(buf).split('\r\n');
  // console.log(sbuf);

  const symbol = sbuf[0][0]; // 首行符号
  // if (symbol === '$') {
  // Type Stream
  // }
  let state = sbuf[0].substr(1); // 状态
  const value = sbuf[1];

  return { symbol, state, value };
}

async function typeBlobString(reader: BufReader, type: string): Promise<IRawData> {
  let { symbol, state, value } = parseReplyData(reader);
  const len = parseInt(state);
  if (symbol !== '$' || len < 0) { return { type, symbol, state: 'nil', len, value: 'nil' }; }
  if (len >= 0) { state = 'OK'; }
  return { type, symbol, state, len, value };
}
async function typeBlobError(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  if (symbol !== '!') { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value };
}
async function typeSimpleString(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  if (symbol !== '+') { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value };
}
async function typeSimpleError(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  if (symbol !== '-') { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value };
}
async function typeNumber(reader: BufReader, type: string): Promise<IRawData> {
  let { symbol, state, value } = parseReplyData(reader);
  const len = parseInt(state);
  if (symbol !== ':' || len < 0) { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value: len >= 0 && !value ? len : value};
}
async function typeBigNumber(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  if (symbol !== '(') { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value };
}
async function typeDouble(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  if (symbol !== ',') { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value };
}
async function typeBoolean(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  if (symbol !== '#') { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value };
}
async function typeVerbatimString(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  if (symbol !== '=') { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value };
}
async function typeNull(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  if (symbol !== '_') { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value };
}
async function typeArray(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  if (symbol !== '*') { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value };
}
async function typeMap(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  if (symbol !== '%') { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value };
}
async function typeSet(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  if (symbol !== '~') { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value };
}
async function typeAttribute(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  if (symbol !== '|') { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value };
}
async function typePush(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  if (symbol !== '>') { return { type, symbol, state, len: 0, value: 'Error' }; }
  return { type, symbol, state, len: 0, value };
}
async function typeStream(reader: BufReader, type: string): Promise<IRawData> {
  const { symbol, state, value } = parseReplyData(reader);
  return { type, symbol, state, len: 0, value };
}
