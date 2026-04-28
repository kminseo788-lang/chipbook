/**
 * chipbook common.js
 * 공통 유틸리티, 헤더/푸터 렌더링
 * Supabase 연동 버전
 */

import { supabase } from './supabase.js'

// ─────────────────────────────────────────
// 현재 로그인 유저 가져오기
// ─────────────────────────────────────────
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ─────────────────────────────────────────
// URL 파라미터 유틸리티
// ─────────────────────────────────────────
function getParam(name) {
  const params = new URLSearchParams(window.location.search)
  return params.get(name)
}

function getCurrentBookId() {
  return getParam('book_id')
}

// ─────────────────────────────────────────
// 도서 조회
// ─────────────────────────────────────────
async function getBookById(bookId) {
  const { data, error } = await supabase
    .from('books')
    .select('*, authors(pen_name, slug)')
    .eq('id', bookId)
    .single()
  if (error) return null
  return data
}

async function getAuthorById(authorId) {
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .eq('id', authorId)
    .single()
  if (error) return null
  return data
}

// ─────────────────────────────────────────
// 구매 여부 확인
// ─────────────────────────────────────────
async function isPurchased(bookId) {
  const user = await getCurrentUser()
  if (!user) return false
  const { data } = await supabase
    .from('library_books')
    .select('id')
    .eq('user_id', user.id)
    .eq('book_id', bookId)
    .single()
  return !!data
}

// ─────────────────────────────────────────
// 찜 여부 확인
// ─────────────────────────────────────────
async function isWishlisted(bookId) {
  const user = await getCurrentUser()
  if (!user) return false
  const { data } = await supabase
    .from('wishlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('book_id', bookId)
    .single()
  return !!data
}

// ─────────────────────────────────────────
// 찜 토글
// ─────────────────────────────────────────
async function toggleWishlist(bookId) {
  const user = await getCurrentUser()
  if (!user) {
    window.location.href = 'login.html'
    return false
  }
  const already = await isWishlisted(bookId)
  if (already) {
    await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('book_id', bookId)
    return false
  } else {
    await supabase
      .from('wishlist')
      .insert({ user_id: user.id, book_id: bookId })
    return true
  }
}

// ─────────────────────────────────────────
// 도서 검색
// ─────────────────────────────────────────
async function searchBooks(params = {}) {
  let query = supabase
    .from('books')
    .select('*, authors(pen_name)')
    .eq('status', 'published')

  if (params.keyword) {
    query = query.or(`title.ilike.%${params.keyword}%,description.ilike.%${params.keyword}%`)
  }
  if (params.type === 'free') query = query.eq('is_free', true)
  if (params.type === 'recommended') query = query.eq('is_free', false)
  if (params.tag) query = query.contains('tags', [params.tag])
  if (params.author_id) query = query.eq('author_id', params.author_id)

  const { data, error } = await query
  if (error) return []
  return data
}

// ─────────────────────────────────────────
// 가격 포맷
// ─────────────────────────────────────────
function formatPrice(price) {
  return price === 0 ? '무료' : price.toLocaleString('ko-KR') + '원'
}

// ─────────────────────────────────────────
// 도서 카드 HTML 생성
// ─────────────────────────────────────────
function createBookCard(book, options = {}) {
  const isFree = book.is_free
  const authorName = book.authors?.pen_name || book.author_name || ''

  return `
    <div class="book-card" data-book-id="${book.id}">
      <a href="book-detail.html?book_id=${book.id}" class="book-card__cover-link">
      <div class="book-card__cover" style="background:${book.cover_color}; color:${book.cover_text_color}; overflow:hidden; position:relative;">
  ${book.cover_url ? `<img src="${book.cover_url}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">` : ''}
          ${isFree ? '<span class="badge badge--free">무료</span>' : ''}
          <div class="book-card__cover-title">${book.title}</div>
        </div>
      </a>
      <div class="book-card__info">
        <a href="book-detail.html?book_id=${book.id}">
          <p class="book-card__title">${book.title}</p>
        </a>
        <p class="book-card__subtitle">${book.subtitle || ''}</p>
        <p class="book-card__author">${authorName} 지음</p>
        ${options.showStats ? `
          <div class="book-card__stats">
            <span>♡ ${((book.like_count||0)/1000).toFixed(1)}K</span>
            <span>👁 ${((book.view_count||0)/1000).toFixed(1)}K</span>
          </div>` : ''}
        ${options.showRating ? `
          <div class="book-card__rating">
            <span class="stars">★</span> ${book.rating||0} (${book.review_count||0})
          </div>` : ''}
        ${options.showPrice ? `
          <p class="book-card__price">${isFree ? '무료' : formatPrice(book.price)}</p>` : ''}
      </div>
    </div>`
}

// ─────────────────────────────────────────
// 헤더 렌더링
// ─────────────────────────────────────────
async function renderHeader(options = {}) {
  const { isViewer = false } = options
  if (isViewer) return

  const headerEl = document.getElementById('header')
  if (!headerEl) return

  // 실제 로그인 유저 확인
  const user = await getCurrentUser()
  const isLoggedIn = !!user
  const userName = user?.user_metadata?.name || ''

  headerEl.innerHTML = `
    <div class="header__inner">
      <div class="header__left">
        <a href="index.html" class="header__logo">chipbook</a>
        <span class="header__slogan">작은 습관이 만드는 큰 변화</span>
      </div>
      <nav class="header__nav">
        <a href="search.html?type=all" class="header__nav-item">도서검색</a>
        <a href="search.html?type=free" class="header__nav-item">무료도서</a>
        <a href="search.html?type=recommended" class="header__nav-item">추천도서</a>
        <a href="author-landing.html" class="header__nav-item">작가도전</a>
      </nav>
      <div class="header__right">
        <a href="search.html" class="header__icon" title="검색">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </a>
        <a href="${isLoggedIn ? 'wishlist.html' : 'login.html'}" class="header__icon" title="찜">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </a>
        <a href="${isLoggedIn ? 'mypage.html' : 'login.html'}" class="header__icon" title="마이페이지">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </a>
        ${isLoggedIn
        ? `<span style="display:flex;gap:8px;">
    <a href="mypage.html" class="btn btn--primary">마이페이지</a>
    <button onclick="handleSignOut()" class="btn btn--outline-gray">로그아웃</button>
  </span>`
          : `<span style="display:flex;gap:8px;">
              <a href="login.html" class="btn btn--outline-gray">로그인</a>
              <a href="signup.html" class="btn btn--primary">무료 회원가입</a>
            </span>`
        }
      </div>
    </div>`

  // 현재 페이지 nav 활성화
  const path = window.location.pathname.split('/').pop()
  headerEl.querySelectorAll('.header__nav-item').forEach(a => {
    if (a.href.includes(path)) a.classList.add('active')
  })
}

// ─────────────────────────────────────────
// 푸터 렌더링
// ─────────────────────────────────────────
function renderFooter() {
  const footerEl = document.getElementById('footer')
  if (!footerEl) return

  footerEl.innerHTML = `
    <div class="footer__inner">
      <p class="footer__logo">chipbook</p>
      <div class="footer__links">
        <a href="terms.html">이용약관</a>
        <span class="footer__divider">·</span>
        <a href="privacy.html">개인정보처리방침</a>
        <span class="footer__divider">·</span>
        <a href="refund.html">환불정책</a>
      </div>
      <p class="footer__email">contact@chipbook.net</p>
    </div>`
}

// ─────────────────────────────────────────
// 공통 초기화
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await renderHeader()
  renderFooter()
})

// 전역 export (다른 파일에서 import해서 사용)
export {
  getCurrentUser,
  getParam,
  getCurrentBookId,
  getBookById,
  getAuthorById,
  isPurchased,
  isWishlisted,
  toggleWishlist,
  searchBooks,
  formatPrice,
  createBookCard,
  renderHeader,
  renderFooter
}

window.handleSignOut = async function() {
  const { supabase } = await import('./supabase.js')
  await supabase.auth.signOut()
  window.location.href = 'index.html'
}
