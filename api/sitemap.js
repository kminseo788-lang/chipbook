// api/sitemap.js
// 요청이 들어올 때마다 Supabase에서 최신 도서 목록을 불러와 sitemap.xml을 생성합니다.
// 접속 주소: https://chipbook.net/sitemap.xml (vercel.json의 rewrite 설정으로 연결됨)

const SUPABASE_URL = "https://dxnjeurgrhhubskdcidq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_oMEgZ8_yufr9j3zyIB3wNQ_qXtywKA8";

const SITE_URL = "https://www.chipbook.net";

// sitemap에 항상 포함할 정적 페이지들
const STATIC_PAGES = [
  { path: "/", priority: "1.0" },
  { path: "/search.html", priority: "0.8" },
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function handler(req, res) {
  try {
    // id만 조회 (컬럼명이 확실히 존재하는 것만 사용, 오류 최소화)
    const url = `${SUPABASE_URL}/rest/v1/books?select=id&status=eq.published`;
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Supabase 조회 실패: ${response.status} - ${errText}`);
    }

    const books = await response.json();

    const staticUrls = STATIC_PAGES.map(
      (p) => `
  <url>
    <loc>${escapeXml(SITE_URL + p.path)}</loc>
    <priority>${p.priority}</priority>
  </url>`
    ).join("");

    const bookUrls = books
      .map(
        (book) => `
  <url>
    <loc>${escapeXml(`${SITE_URL}/book-detail.html?book_id=${book.id}`)}</loc>
    <priority>0.6</priority>
  </url>`
      )
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${bookUrls}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    res.status(200).send(xml);
  } catch (err) {
    res.status(500).send(`sitemap 생성 중 오류: ${err.message}`);
  }
}