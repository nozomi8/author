import { useState } from "react";

// Google Booksからデータを取得する関数
async function fetchBooksData(authorName, bookTitle) {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  let query = "";
  if (authorName) {
    query += `inauthor:${encodeURIComponent(authorName)}`;
  }
  if (bookTitle) {
    if (query) query += "+";
    query += `intitle:${encodeURIComponent(bookTitle)}`;
  }
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}`
  );
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.items || [];
}

export default function App() {
  const [authorName, setAuthorName] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookResults, setBookResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    setError(""); // 前回のエラーメッセージをクリア

    try {
      const bookData = await fetchBooksData(authorName, bookTitle);
      setBookResults(bookData || []);
    } catch (err) {
      setError("データの取得に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>著者・作品検索</h1>
      {/* 著者名入力 */}
      <input
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="著者名を入力"
      />
      {/* 作品名入力 */}
      <input
        type="text"
        value={bookTitle}
        onChange={(e) => setBookTitle(e.target.value)}
        placeholder="作品名を入力"
      />
      <button onClick={handleSearch}>検索</button>
      {loading && <p>読み込み中...</p>} {/* ローディング中の表示 */}
      {error && <p style={{ color: "red" }}>{error}</p>} {/* エラーメッセージ */}

      <h2>書籍情報</h2>
      <ul>
        {bookResults.length > 0 ? (
          bookResults.map((book) => (
            <li key={book.id}>
              <strong>{book.volumeInfo.title}</strong> by{" "}
              {book.volumeInfo.authors?.join(", ") || "不明"}
            </li>
          ))
        ) : (
          <p>書籍情報は見つかりませんでした。</p>
        )}
      </ul>
    </div>
  );
}
