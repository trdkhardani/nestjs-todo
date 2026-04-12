// interface Env {
//   port: number;
// }

const env = process.env;

export default () => ({
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
});
