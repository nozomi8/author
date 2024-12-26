import { useState, useEffect } from "react";

// Google Booksからデータを取得する関数
async function fetchBooksData(authorName, bookTitle) {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  let query = "";
  if (authorName) query += `inauthor:${encodeURIComponent(authorName)}`;
  if (bookTitle) query += (query ? "+" : "") + `intitle:${encodeURIComponent(bookTitle)}`;

  const maxResults = 40;
  let allResults = [];
  let startIndex = 0;

  while (true) {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}&startIndex=${startIndex}&maxResults=${maxResults}`
    );
    const data = await response.json();
    if (!data.items || data.items.length === 0) break;
    allResults = [...allResults, ...data.items];
    startIndex += maxResults;
    if (startIndex >= 120) break; 
  }

  return allResults;
}

export default function App() {
  const [authorName, setAuthorName] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookResults, setBookResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleSearch = async () => {
    if (!authorName && !bookTitle) {
      setError("検索条件を入力してください。");
      return;
    }

    setLoading(true);
    setError("");
    setBookResults([]); // 新しい検索の前に結果をクリア

    try {
      const bookData = await fetchBooksData(authorName, bookTitle);

      // 関連性を考慮して並べ替え
      const sortedBooks = bookData.sort((a, b) => {
        // 1. 完全一致（著者名とタイトルの一致）を優先
        const aScore = getMatchScore(a, authorName, bookTitle);
        const bScore = getMatchScore(b, authorName, bookTitle);

        // 2. 完全一致がない場合でも部分一致を重視
        if (aScore !== bScore) return bScore - aScore;

        // 3. 出版年で並べ替え（新しいものが上）
        const yearA = a.volumeInfo.publishedDate ? parseInt(a.volumeInfo.publishedDate.substring(0, 4)) : 0;
        const yearB = b.volumeInfo.publishedDate ? parseInt(b.volumeInfo.publishedDate.substring(0, 4)) : 0;
        return yearB - yearA;
      });

      setBookResults(sortedBooks);
    } catch (err) {
      setError("データの取得に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  // キーワードの一致度スコアを計算
  const getMatchScore = (book, authorName, bookTitle) => {
    const title = book.volumeInfo.title?.toLowerCase() || "";
    const authors = book.volumeInfo.authors?.join(", ").toLowerCase() || "";

    // 完全一致を重視
    let score = 0;
    if (authorName && authors.includes(authorName.toLowerCase())) score += 3;
    if (bookTitle && title.includes(bookTitle.toLowerCase())) score += 2;

    // 部分一致も考慮
    return score;
  };

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
            <li key={book.id}>
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