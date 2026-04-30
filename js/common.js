/**
 * chipbook common.js
 * 공통 유틸리티, 헤더/푸터 렌더링
 * Supabase 연동 버전
 */

import { supabase } from './supabase.js'

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function getParam(name) {
  const params = new URLSearchParams(window.location.search)
  return params.get(name)
}

function getCurrentBookId() {
  return getParam('book_id')
}

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

async function toggleWishlist(bookId) {
  const user = await getCurrentUser()
  if (!user) { window.location.href = 'login.html'; return false }
  const already = await isWishlisted(bookId)
  if (already) {
    await supabase.from('wishlist').delete().eq('user_id', user.id).eq('book_id', bookId)
    return false
  } else {
    await supabase.from('wishlist').insert({ user_id: user.id, book_id: bookId })
    return true
  }
}

async function searchBooks(params = {}) {
  let query = supabase.from('books').select('*, authors(pen_name)').eq('status', 'published')
  if (params.keyword) query = query.or(`title.ilike.%${params.keyword}%,description.ilike.%${params.keyword}%`)
  if (params.type === 'free') query = query.eq('is_free', true)
  if (params.type === 'recommended') query = query.eq('is_free', false)
  if (params.tag) query = query.contains('tags', [params.tag])
  if (params.author_id) query = query.eq('author_id', params.author_id)
  const { data, error } = await query
  if (error) return []
  return data
}

function formatPrice(price) {
  return price === 0 ? '무료' : price.toLocaleString('ko-KR') + '원'
}

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
        <a href="book-detail.html?book_id=${book.id}"><p class="book-card__title">${book.title}</p></a>
        <p class="book-card__subtitle">${book.subtitle || ''}</p>
        <p class="book-card__author">${authorName} 지음</p>
        ${options.showStats ? `<div class="book-card__stats"><span>♡ ${((book.like_count||0)/1000).toFixed(1)}K</span><span>👁 ${((book.view_count||0)/1000).toFixed(1)}K</span></div>` : ''}
        ${options.showRating ? `<div class="book-card__rating"><span class="stars">★</span> ${book.rating||0} (${book.review_count||0})</div>` : ''}
        ${options.showPrice ? `<p class="book-card__price">${isFree ? '무료' : formatPrice(book.price)}</p>` : ''}
      </div>
    </div>`
}

// ─── 헤더 렌더링 ───
async function renderHeader(options = {}) {
  const { isViewer = false } = options
  if (isViewer) return

  const headerEl = document.getElementById('header')
  if (!headerEl) return

  const user = await getCurrentUser()
  const isLoggedIn = !!user

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
        <div class="header__auth-btns">
          ${isLoggedIn
            ? `<a href="mypage.html" class="btn btn--primary btn--sm">마이페이지</a>
               <button onclick="handleSignOut()" class="btn btn--outline-gray btn--sm">로그아웃</button>`
            : `<a href="login.html" class="btn btn--outline-gray btn--sm">로그인</a>
               <a href="signup.html" class="btn btn--primary btn--sm">무료 회원가입</a>`
          }
        </div>
        <!-- 햄버거 버튼 (모바일 전용) -->
        <button class="header__hamburger" id="hamburgerBtn" onclick="toggleMobileMenu()">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <!-- 모바일 메뉴 -->
    <div class="mobile-menu" id="mobileMenu">
      <nav class="mobile-menu__nav">
        <a href="search.html?type=all" class="mobile-menu__item">도서검색</a>
        <a href="search.html?type=free" class="mobile-menu__item">무료도서</a>
        <a href="search.html?type=recommended" class="mobile-menu__item">추천도서</a>
        <a href="author-landing.html" class="mobile-menu__item">작가도전</a>
      </nav>
      <div class="mobile-menu__footer">
        ${isLoggedIn
          ? `<a href="mypage.html" class="btn btn--primary btn--full">마이페이지</a>
             <button onclick="handleSignOut()" class="btn btn--outline-gray btn--full" style="margin-top:8px">로그아웃</button>`
          : `<a href="login.html" class="btn btn--outline-gray btn--full">로그인</a>
             <a href="signup.html" class="btn btn--primary btn--full" style="margin-top:8px">무료 회원가입</a>`
        }
      </div>
    </div>`

  const path = window.location.pathname.split('/').pop()
  headerEl.querySelectorAll('.header__nav-item').forEach(a => {
    if (a.href.includes(path)) a.classList.add('active')
  })
}

// ─── 모바일 메뉴 토글 ───
window.toggleMobileMenu = function() {
  const menu = document.getElementById('mobileMenu')
  const btn = document.getElementById('hamburgerBtn')
  if (!menu) return
  menu.classList.toggle('open')
  btn.classList.toggle('open')
}

// ─── 푸터 렌더링 ───
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

document.addEventListener('DOMContentLoaded', async () => {
  await renderHeader()
  renderFooter()
})

export {
  getCurrentUser, getParam, getCurrentBookId, getBookById, getAuthorById,
  isPurchased, isWishlisted, toggleWishlist, searchBooks,
  formatPrice, createBookCard, renderHeader, renderFooter
}

window.handleSignOut = async function() {
  const { supabase } = await import('./supabase.js')
  await supabase.auth.signOut()
  window.location.href = 'index.html'
}

// 탭바 렌더링
function renderTabBar() {
  // 에디터 페이지엔 탭바 안 넣음
  if (document.body.classList.contains('editor-body')) return

  const currentPage = location.pathname.split('/').pop() || 'index.html'
  const tabs = [
    { label: '홈', icon: '🏠', href: 'index.html' },
    { label: '검색', icon: '🔍', href: 'search.html' },
    { label: '찜', icon: '🤍', href: 'wishlist.html' },
    { label: '마이', icon: '👤', href: 'mypage.html' },
  ]

  const nav = document.createElement('nav')
  nav.className = 'mobile-tab-bar'
  nav.innerHTML = tabs.map(t => `
    <a href="${t.href}" class="tab-bar-item ${currentPage === t.href ? 'active' : ''}">
      <span class="tab-bar-item__icon">${t.icon}</span>
      <span class="tab-bar-item__label">${t.label}</span>
    </a>
  `).join('')
  document.body.appendChild(nav)
}

renderTabBar()