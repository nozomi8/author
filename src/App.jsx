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
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  const data = await response.json();
  return {
    books: data.items || [],
    total: data.totalItems || 0, // 総件数を取得
  };
}

// サーバーAPI経由で読みたい本リストを取得
async function fetchReadingList() {
  const response = await fetch("http://localhost:5000/api/want-to-read");
  if (!response.ok) {
    throw new Error("Failed to fetch reading list.");
  }
  return response.json();
}

// サーバーAPI経由で読んだ本リストを取得
async function fetchReadList() {
  const response = await fetch("http://localhost:5000/api/read");
  if (!response.ok) {
    throw new Error("Failed to fetch read list.");
  }
  return response.json();
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
  const [readingList, setReadingList] = useState([]); // 読みたい本リスト
  const [readList, setReadList] = useState([]); // 読んだ本リスト

  const resultsPerPage = 10; // 1ページあたりの表示件数

  // スクロール位置によってトップボタンを表示
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 初期データの取得（マウント時に実行）
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [readingListData, readListData] = await Promise.all([
          fetchReadingList(),
          fetchReadList(),
        ]);
        setReadingList(readingListData);  // サーバーからデータを取得して状態にセット
        setReadList(readListData);        // サーバーからデータを取得して状態にセット
      } catch (err) {
        console.error("Error fetching lists:", err);
      }
    };
    fetchLists();
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

  // 読みたい本リストに追加
  const addToReadingList = (book) => {
    setReadingList((prevList) => [...prevList, book]);
  };

  // 読んだ本リストに移動
  const moveToReadList = (book) => {
    setReadList((prevList) => [...prevList, book]);
    setReadingList((prevList) => prevList.filter((b) => b.id !== book.id));
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
    bookResults.map((book) => {
      const uniqueKey = `${book.id}-${book.volumeInfo.title}-${book.volumeInfo.authors?.join(", ")}`;
      return (
        <li key={uniqueKey} className="book-item">
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
          <br />
          {/* 読みたい本リストに追加ボタン */}
          <button
            className="add-to-reading-btn"
            onClick={() => addToReadingList(book)}
          >
            読みたい本リストに追加
          </button>

          {/* 読んだ本リストに移動ボタン */}
          <button 
            className="move-to-read-btn" 
            onClick={() => moveToReadList(book)}
          >
            読んだ本リストに移動
          </button>
        </li>
      );
    })
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

      {/* 読みたい本リスト */}
<h2>読みたい本リスト</h2>
<ul>
  {readingList.length > 0 ? (
    readingList.map((book) => {
      const uniqueKey = `${book.id}-${book.volumeInfo.title}-${book.volumeInfo.authors?.join(", ")}`;
      return (
        <li key={uniqueKey}>
          {book.volumeInfo.title} by {book.volumeInfo.authors?.join(", ")}
        </li>
      );
    })
  ) : (
    <p>読みたい本リストには本がありません。</p>
  )}
</ul>

{/* 読んだ本リスト */}
<h2>読んだ本リスト</h2>
<ul>
  {readList.length > 0 ? (
    readList.map((book) => {
      const uniqueKey = `${book.id}-${book.volumeInfo.title}-${book.volumeInfo.authors?.join(", ")}`;
      return (
        <li key={uniqueKey}>
          {book.volumeInfo.title} by {book.volumeInfo.authors?.join(", ")}
        </li>
      );
    })
  ) : (
    <p>読んだ本リストには本がありません。</p>
  )}
</ul>

      <footer class="footer">
        <p>5423014 谷中希実</p>
        <p>日本大学文理学部情報科学科 Webプログラミング演習課題</p>
      </footer>
    </div>
  );
}
