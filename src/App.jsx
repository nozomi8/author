import { useState } from "react";

// Google Booksからデータを取得する関数
async function fetchBooksData(authorName) {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=inauthor:${authorName}&key=${apiKey}`
  );
  const data = await response.json();
  return data.items;
}

export default function App() {
  const [authorName, setAuthorName] = useState("");
  const [bookResults, setBookResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    setError(""); // 前回のエラーメッセージをクリア

    if (!authorName.trim()) {
      setError("著者名を入力してください。");
      setLoading(false);
      return;
    }

    try {
      const bookData = await fetchBooksData(authorName);
      setBookResults(bookData || []);
    } catch (err) {
      setError("データの取得に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>著者検索</h1>
      <input
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="著者名を入力"
      />
      <button onClick={handleSearch} disabled={loading || !authorName}>
        {loading ? "検索中..." : "検索"}
      </button>

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
        ) : !loading && authorName ? (
          <p>書籍情報は見つかりませんでした。</p>
        ) : null}
      </ul>
    </div>
  );
}
