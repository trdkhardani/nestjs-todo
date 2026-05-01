// interface Env {
//   port: number;
// }

const env = process.env;

export default () => ({
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
  databaseUrl: env.DATABASE_URL,
  mongoDbUrl: env.MONGODB_URL,
  jwtSecretKey: env.JWT_SECRET_KEY,
  redisUrl: env.REDIS_URL,
  mailHost: env.MAIL_HOST,
  mailUser: env.MAIL_USER,
  mailPass: env.MAIL_PASS,
  appEncryptionKey: env.APP_ENCRYPTION_KEY,
});
