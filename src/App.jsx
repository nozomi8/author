import { useState, useEffect } from "react";

// Google Booksからデータを取得する関数
async function fetchBooksData(authorName, bookTitle, startIndex = 0, maxResults = 10) {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  let query = "";
  if (authorName) query += `inauthor:${encodeURIComponent(authorName)}`;
  if (bookTitle) query += (query ? "+" : "") + `intitle:${encodeURIComponent(bookTitle)}`;

  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}&startIndex=${startIndex}&maxResults=${maxResults}`
  );
  const data = await response.json();
  return {
    books: data.items || [],
    total: data.totalItems || 0, // 総件数を取得
  };
}

export default function App() {
  const [authorName, setAuthorName] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookResults, setBookResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // 現在のページ
  const [totalResults, setTotalResults] = useState(0); // 検索結果の総数
  const [showScrollTop, setShowScrollTop] = useState(false); // スクロールトップボタン表示管理

  const resultsPerPage = 10; // 1ページあたりの表示件数

  // スクロール位置によってトップボタンを表示
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ページトップにスクロール
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 検索処理
  const handleSearch = async () => {
    if (!authorName && !bookTitle) {
      setError("検索条件を入力してください。");
      return;
    }

    setLoading(true);
    setError("");
    setBookResults([]);
    setCurrentPage(1); // 検索のたびにページを1にリセット

    try {
      const { books, total } = await fetchBooksData(authorName, bookTitle, 0, resultsPerPage);
      setBookResults(books); // 書籍情報を設定
      setTotalResults(total); // 総件数を設定
    } catch (err) {
      setError("データの取得に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  // ページ変更処理
  const handlePageChange = async (newPage) => {
    setLoading(true);
    setError("");

    try {
      const startIndex = (newPage - 1) * resultsPerPage;
      const { books } = await fetchBooksData(authorName, bookTitle, startIndex, resultsPerPage);
      setBookResults(books); // 書籍情報を設定
      setCurrentPage(newPage); // 現在のページを更新
    } catch (err) {
      setError("データの取得に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>著者・作品検索</h1>
      <input
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="著者名を入力"
      />
      <input
        type="text"
        value={bookTitle}
        onChange={(e) => setBookTitle(e.target.value)}
        placeholder="作品名を入力"
      />
      <button onClick={handleSearch}>検索</button>
      {loading && <p>読み込み中...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>書籍情報</h2>
      <ul>
        {bookResults.length > 0 ? (
          bookResults.map((book) => (
            <li key={book.id} className="book-item">
              <strong>{book.volumeInfo.title || "タイトル不明"}</strong> by{" "}
              {book.volumeInfo.authors?.join(", ") || "著者不明"}
              <br />
              <strong>出版年:</strong> {book.volumeInfo.publishedDate || "不明"}
              <br />
              <strong>説明:</strong> {book.volumeInfo.description || "説明なし"}
              <br />
              <strong>ページ数:</strong> {book.volumeInfo.pageCount || "不明"}
              <br />
              <strong>出版社:</strong> {book.volumeInfo.publisher || "不明"}
              <br />
              {book.volumeInfo.imageLinks?.thumbnail && (
                <img src={book.volumeInfo.imageLinks.thumbnail} alt="Cover" />
              )}
            </li>
          ))
        ) : (
          <p>書籍情報は見つかりませんでした。</p>
        )}
      </ul>

      {/* ページネーション */}
      {totalResults > resultsPerPage && (
        <div className="pagination">
        <button
          className="pagination-button"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          前のページ
        </button>
        <span className="pagination-info">
          {currentPage} / {Math.ceil(totalResults / resultsPerPage)}
        </span>
        <button
          className="pagination-button"
          disabled={currentPage * resultsPerPage >= totalResults}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          次のページ
        </button>
      </div>
    )}


      {/* スクロールトップボタン */}
      <button
        className={`scroll-top-btn ${showScrollTop ? "show" : ""}`}
        onClick={scrollToTop}
      >
        ↑ 上に戻る
      </button>
    </div>
  );
}