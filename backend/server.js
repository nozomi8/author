const express = require('express');
const { Pool } = require('pg');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json()); // JSONリクエストボディを処理するために追加

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'user_bd',
  password: 'nzmooi879',
  port: 5432,
});

const corsOptions = {
  origin: 'http://localhost:3000', // フロントエンドのURLを指定
  methods: 'GET, POST, PUT, DELETE', // 許可するHTTPメソッドを指定
  allowedHeaders: 'Content-Type, Authorization', // 許可するヘッダーを指定
};

// CORSを有効にする
app.use(cors({
  origin: ['http://localhost:3000', 'http://example.com'], // 複数のオリジンを許可
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // フロントエンドのURLを指定
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // 許可するHTTPメソッドを指定
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // 許可するヘッダーを指定
  next();
});


// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error(err.stack); // エラーの詳細をログに出力
  res.status(500).send('Something went wrong!');
});

// 読みたい本リストを取得
app.get('/api/want-to-read', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM want_to_read');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error fetching reading list');
  }
});

// 読んだ本リストを取得
app.get('/api/read_books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM read_books');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error fetching read list');
  }
});

// 読みたい本リストに追加
app.post('/api/want-to-read', async (req, res) => {
  const { title, authors, description } = req.body;
  try {
    // データベースに本を挿入
    const result = await pool.query('INSERT INTO want_to_read (title, authors, description) VALUES ($1, $2, $3)', 
    [title, authors, description]);

    res.status(201).send('Book added to want-to-read list');
  } catch (err) {
    console.error('Error adding book to want-to-read list:', err); // エラーログを追加
    res.status(500).send('Error adding book to want-to-read list');
  }
});

// 読んだ本リストに移動
app.post('/api/read', async (req, res) => {
  const { title, authors, description } = req.body;
  try {
    // 本をread_booksテーブルに追加
    await pool.query('INSERT INTO read_books (title, authors, description) VALUES ($1, $2, $3)', 
    [title, authors, description]);

    // want_to_readテーブルから削除
    await pool.query('DELETE FROM want_to_read WHERE title = $1 AND authors = $2 AND description = $3', 
    [title, authors, description]);

    res.status(201).send('Book moved to read list');
  } catch (err) {
    console.error('Error moving book to read list:', err); // エラーログを追加
    res.status(500).send('Error moving book to read list');
  }
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
