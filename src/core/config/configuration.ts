// interface Env {
//   port: number;
// }

const env = process.env;

export default () => ({
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
  databaseUrl: env.DATABASE_URL,
  jwtSecretKey: env.JWT_SECRET_KEY,
});
