const { Client } = require('pg');

// 環境変数から接続情報を取得
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

client.connect()
  .then(() => console.log("PostgreSQLに接続しました"))
  .catch((err) => console.error("接続エラー:", err.stack));

module.exports = client;
