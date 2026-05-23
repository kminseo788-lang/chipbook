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
  if (params.type === 'welcome') query = query.eq('is_welcome', true)  // ← 추가
  if (params.series) query = query.eq('series', params.series)          // ← 추가
  if (params.tag) query = query.contains('tags', [params.tag])
  if (params.author_id) query = query.eq('author_id', params.author_id)
  const { data, error } = await query
  if (error) return []
  return data
}

function formatPrice(price) {
  return price === 0 ? '무료' : price.toLocaleString('ko-KR') + '원'
}
function createCoverHTML(book, size = 'sm') {
  const seriesConfig = {
    'spot': { color: '#F5F0E8', textColor: '#1B5E3A', label: 'Spot Book' },
    'frame': { color: '#1B5E3A', textColor: '#ffffff', label: 'Frame Book' },
    'fit': { color: '#1B3A4B', textColor: '#ffffff', label: 'Fit Book' },
  }
  const series = book.series ? seriesConfig[book.series] : null
  const bgColor = series ? series.color : (book.cover_color || '#E8F5E9')
  const textColor = series ? series.textColor : (book.cover_text_color || '#1B5E3A')

  if (series) {
    return `
      <div style="background:${bgColor};color:${textColor};width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:12px 10px;box-sizing:border-box;position:relative;">
        <div style="text-align:center;">
          ${book.is_series ? `<p style="font-size:8px;letter-spacing:1px;opacity:0.7;margin-bottom:2px;">CHIP BOOK SERIES</p><div style="border-top:1px solid currentColor;opacity:0.3;margin-bottom:4px;"></div>` : ''}
          <p style="font-size:10px;font-weight:700;">${series.label}</p>
          <div style="border-top:1px solid currentColor;opacity:0.3;margin:4px 0;"></div>
        </div>
        <div style="text-align:center;flex:1;display:flex;align-items:center;justify-content:center;">
          <p style="font-size:13px;font-weight:900;line-height:1.3;word-break:keep-all;">${book.title}</p>
        </div>
        <div style="text-align:center;">
          <div style="border-top:1px solid currentColor;opacity:0.3;margin-bottom:4px;"></div>
          <p style="font-size:8px;letter-spacing:1px;opacity:0.7;">— CHIP BOOK —</p>
        </div>
      </div>`
 } else if (book.cover_url) {
  return `<img src="${book.cover_url}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">`
  } else {
  return `
    <div style="background:${bgColor};color:${textColor};width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:12px 10px;box-sizing:border-box;">
      <div style="text-align:center;opacity:0.6;font-size:9px;letter-spacing:1px;">— CHIP BOOK —</div>
      <div style="text-align:center;">
        <p style="font-size:14px;font-weight:900;line-height:1.3;word-break:keep-all;">${book.title}</p>
        ${book.subtitle ? `<p style="font-size:10px;opacity:0.75;margin-top:6px;line-height:1.4;">${book.subtitle}</p>` : ''}
      </div>
      <div style="text-align:center;opacity:0.6;font-size:9px;letter-spacing:1px;">— CHIP BOOK —</div>
    </div>`
}
}

function createBookCard(book, options = {}) {
  const isFree = book.is_free
  const authorName = book.authors?.pen_name || book.author_name || ''

  const seriesConfig = {
    'spot':    { color: '#F5F0E8', textColor: '#1B5E3A', label: 'Spot Book',    desc: '하나의 책, 하나의 문제 해결' },
    'frame': { color: '#1B5E3A', textColor: '#ffffff', label: 'Frame Book', desc: '분야 전체를 다루는 기준서' },
    'fit':   { color: '#1B3A4B', textColor: '#ffffff', label: 'Fit Book',   desc: '나를 위한 맞춤형 지침서' },
  }

  const series = book.series ? seriesConfig[book.series] : null
  const bgColor = series ? series.color : (book.cover_color || '#E8F5E9')
  const textColor = series ? series.textColor : (book.cover_text_color || '#1B5E3A')

  let coverContent = ''

  if (series) {
    coverContent = `
      <div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:16px 14px;box-sizing:border-box;">
        <div style="text-align:center;">
          ${book.is_series ? `<p style="font-size:9px;letter-spacing:2px;opacity:0.7;margin-bottom:4px;">CHIP BOOK SERIES</p><div style="border-top:1px solid currentColor;opacity:0.3;margin-bottom:6px;"></div>` : ''}
          <p style="font-size:11px;font-weight:700;letter-spacing:1px;">${series.label}</p>
          <div style="border-top:1px solid currentColor;opacity:0.3;margin:6px 0;"></div>
          <p style="font-size:9px;opacity:0.75;">${series.desc}</p>
        </div>
        <div style="text-align:center;">
          <p style="font-size:16px;font-weight:900;line-height:1.3;word-break:keep-all;">${book.title}</p>
          ${book.subtitle ? `<p style="font-size:10px;opacity:0.8;margin-top:6px;line-height:1.4;">${book.subtitle}</p>` : ''}
        </div>
        <div style="text-align:center;">
          <div style="border-top:1px solid currentColor;opacity:0.3;margin-bottom:6px;"></div>
          <p style="font-size:9px;letter-spacing:2px;opacity:0.7;">— CHIP BOOK —</p>
        </div>
      </div>`
  } else if (book.cover_url) {
    coverContent = `<img src="${book.cover_url}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">`
  } else {
    coverContent = `
      <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:12px 10px;box-sizing:border-box;">
        <div style="text-align:center;opacity:0.6;font-size:9px;letter-spacing:1px;">— CHIP BOOK —</div>
        <div style="text-align:center;">
          <p style="font-size:15px;font-weight:900;line-height:1.3;word-break:keep-all;">${book.title}</p>
          ${book.subtitle ? `<p style="font-size:10px;opacity:0.75;margin-top:6px;line-height:1.4;">${book.subtitle}</p>` : ''}
        </div>
        <div style="text-align:center;opacity:0.6;font-size:9px;letter-spacing:1px;">— CHIP BOOK —</div>
      </div>`
  }

  const badge = isFree
    ? '<span class="badge badge--free" style="position:absolute;top:10px;left:10px;">무료</span>'
    : (book.is_welcome ? '<span class="badge" style="position:absolute;top:10px;left:10px;background:#C9A84C;color:#fff;">첫구매무료</span>' : '')

  return `
    <div class="book-card" data-book-id="${book.id}">
      <a href="book-detail.html?book_id=${book.id}" class="book-card__cover-link">
        <div class="book-card__cover" style="background:${bgColor};color:${textColor};overflow:hidden;position:relative;">
          ${coverContent}
          ${badge}
        </div>
      </a>
      <div class="book-card__info">
        <a href="book-detail.html?book_id=${book.id}"><p class="book-card__title">${book.title}</p></a>
        <p class="book-card__subtitle">${book.subtitle || ''}</p>
        <p class="book-card__author">칩북 편집부</p>
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
  <a href="search.html" class="header__nav-item">도서 찾기</a>
  <div class="header__nav-dropdown">
    <span class="header__nav-item header__nav-item--dropdown">시리즈 ▾</span>
    <div class="header__nav-dropdown-menu">
      <a href="search.html?series=spot" class="header__nav-dropdown-item">📗 Spot Book</a>
      <a href="search.html?series=frame" class="header__nav-dropdown-item">📘 Frame Book</a>
<a href="search.html?series=fit" class="header__nav-dropdown-item">📕 Fit Book</a>
</div>
</div>
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
  <a href="search.html" class="mobile-menu__item">도서 찾기</a>
  <a href="search.html?series=spot" class="mobile-menu__item">Spot Book</a>
  <a href="search.html?series=frame" class="mobile-menu__item">Frame Book</a>
  <a href="search.html?series=fit" class="mobile-menu__item">Fit Book</a>
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
  if (a.href && a.href.includes(path)) a.classList.add('active')
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
  formatPrice, createBookCard, createCoverHTML, renderHeader, renderFooter
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

// 채널톡
document.addEventListener('DOMContentLoaded', function() {
  (function(){var w=window;if(w.ChannelIO){return;}var d=window.document;var ch=function(){ch.c(arguments);};ch.q=[];ch.c=function(args){ch.q.push(args);};w.ChannelIO=ch;function l(){if(w.ChannelIOBootstrapped){return;}w.ChannelIOBootstrapped=true;var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://cdn.channel.io/plugin/ch-plugin-web.js';s.charset='UTF-8';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);}if(d.readyState==='complete'){l();}else{window.addEventListener('load',l,false);}})();
  ChannelIO('boot', { pluginKey: 'd5ee346b-6bc7-4b7d-8e52-ff9a1bd12b9d' });
});