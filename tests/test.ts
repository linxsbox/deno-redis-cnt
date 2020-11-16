import { Redis } from '../mod.ts';

// C:\Works\redis\redis-server.exe
// deno run --allow-net test.ts

const config = {
  hostname: "127.0.0.1",
  port: 6379,
  // username: "",
  // password: "port63790",
  // transport: "tcp",
  // db: "",
  // maxRetryCount: 5,
  // retryInterval: 1500
};
const redis = await Redis(config);

const val1 = await redis.set('key1', '测试存储数据');
console.log(val1);

const val2 = await redis.get('key2');
console.log(val2);

const val3 = await redis.del('key1');
console.log(val3);

const val4 = await redis.echo('666');

console.log(val4);
