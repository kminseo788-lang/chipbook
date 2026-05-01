/**
 * chipbook mypage.js
 * Supabase 연동 버전
 */

import { supabase } from './supabase.js'
import { getCurrentUser, formatPrice } from './common.js'

let currentMode = 'reader'
let currentUser = null
let userProfile = null

document.addEventListener('DOMContentLoaded', async () => {
  // 로그인 확인
  currentUser = await getCurrentUser()
  if (!currentUser) {
    window.location.href = 'login.html'
    return
  }

  // users 테이블에서 프로필 조회
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', currentUser.id)
    .single()

  // users 테이블에 없으면 새로 생성
  if (!profile) {
    const { data: newProfile } = await supabase
      .from('users')
      .insert({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.user_metadata?.name || '',
        role: 'user',
        is_author: false
      })
      .select()
      .single()
    userProfile = newProfile
  } else {
    userProfile = profile
  }

  const urlMode = new URLSearchParams(window.location.search).get('mode')

  // 프로필 렌더링
  document.getElementById('profileName').textContent = userProfile?.name || currentUser.email
  document.getElementById('profileEmail').textContent = currentUser.email
  document.getElementById('profileRole').textContent = userProfile?.is_author ? '일반 독자 · 작가' : '일반 독자'

  // 작가인 경우 모드 토글 표시
  if (userProfile?.is_author) {
    document.getElementById('modeToggle').style.display = 'block'
    document.getElementById('mypageShortcuts').style.display = 'block'
  }

  if (urlMode === 'author' && userProfile?.is_author) {
    currentMode = 'author'
  }

  renderNav()
  renderContent()
})

window.switchMode = function(mode) {
  currentMode = mode
  document.getElementById('readerModeBtn').classList.toggle('active', mode === 'reader')
  document.getElementById('authorModeBtn').classList.toggle('active', mode === 'author')
  renderNav()
  renderContent()
}
function renderNav() {
  const nav = document.getElementById('mypageNav')
  if (!nav) return

  const readerMenu = [
    { icon: '📚', label: '내 서재', key: 'library' },
    { icon: '🔖', label: '찜한 도서', key: 'wishlist' },
    { icon: '🛒', label: '구매 내역', key: 'purchases' },
    { icon: '⚙️', label: '설정', key: 'settings' },
  ]
  const authorMenu = [
    { icon: '📊', label: '대시보드', key: 'dashboard' },
    { icon: '📖', label: '내 도서 관리', key: 'books' },
    { icon: '💰', label: '정산 내역', key: 'revenue' },
    { icon: '⚙️', label: '설정', key: 'settings' },
  ]

  const menu = currentMode === 'author' ? authorMenu : readerMenu

  nav.innerHTML = menu.map((item, i) =>
    `<div class="mypage-nav-item ${i === 0 ? 'active' : ''}" 
      onclick="switchSection('${item.key}', this)">
      ${item.icon} ${item.label}
    </div>`
  ).join('')
}

window.switchSection = function(key, el) {
  document.querySelectorAll('.mypage-nav-item').forEach(i => i.classList.remove('active'))
  el.classList.add('active')
  const container = document.getElementById('mypageContent')
  
  // 독자 모드 섹션
  if (key === 'library') renderReaderDashboard(container)
  else if (key === 'wishlist') renderWishlist(container)
  else if (key === 'purchases') renderPurchases(container)
  else if (key === 'settings') renderSettings(container)
  
  // 작가 모드 섹션
  else if (key === 'dashboard') renderAuthorDashboard(container)
  else if (key === 'books') renderAuthorBooks(container)
  else if (key === 'revenue') renderRevenue(container)
  else if (key === 'settings') renderSettings(container)
}

function renderContent() {
  const container = document.getElementById('mypageContent')
  if (!container) return
  if (currentMode === 'author') {
    renderAuthorDashboard(container)
  } else {
    renderReaderDashboard(container)
  }
}

// ─── 독자 대시보드 ───
async function renderReaderDashboard(container) {
  const name = userProfile?.name || currentUser.email

  // 구매한 도서 조회
  const { data: libraryBooks } = await supabase
    .from('library_books')
    .select('*, books(*, authors(pen_name))')
    .eq('user_id', currentUser.id)
    .limit(3)

  // 찜한 도서 수
  const { count: wishCount } = await supabase
    .from('wishlist')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)

  // 구매 내역
  const { data: purchases } = await supabase
    .from('payments')
    .select('*, books(title, cover_color, cover_text_color, authors(pen_name))')
    .eq('user_id', currentUser.id)
    .eq('payment_status', 'completed')
    .order('paid_at', { ascending: false })
    .limit(3)

  const readingBooks = libraryBooks || []

  container.innerHTML = `
    <div class="welcome-banner">
      <div class="welcome-banner__text">
        <h2>안녕하세요, ${name}님! 📚</h2>
        <p>오늘도 좋은 책과 함께 성장하는 하루 되세요.</p>
      </div>
      <div class="welcome-banner__visual">📚</div>
    </div>

    <div class="content-section">
      <div class="content-section__header">
        <p class="content-section__title">읽는 중인 도서</p>
        <a href="#" class="content-section__more">전체 보기 ›</a>
      </div>
      <div class="reading-books">
        ${readingBooks.length ? readingBooks.map(lb => {
          const book = lb.books
          if (!book) return ''
          return `
            <div class="reading-book-card">
              <div class="reading-book-card__cover" style="background:${book.cover_color};color:${book.cover_text_color}">${book.title}</div>
              <p class="reading-book-card__title">${book.title}</p>
              <div class="reading-book-card__progress-bar">
                <div class="reading-book-card__progress-fill" style="width:0%"></div>
              </div>
              <a href="viewer.html?book_id=${book.id}" class="btn btn--outline btn--sm btn--full">이어 읽기</a>
            </div>`
        }).join('') : '<p style="font-size:14px;color:var(--color-text-sub)">구매한 도서가 없어요. 도서를 둘러보세요!</p>'}
        <div style="display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;background:var(--color-bg-sub);border-radius:12px;min-height:160px;border:1px dashed var(--color-border);">
          <a href="search.html" style="text-align:center;text-decoration:none;color:var(--color-text-sub)">
            <span style="font-size:24px">+</span>
            <p style="font-size:13px">더 많은 도서 찾기</p>
          </a>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div class="content-section__header"><p class="content-section__title">내 서재</p></div>
      <div class="library-stats">
        <div class="library-stat">
          <div class="library-stat__icon">📚</div>
          <p class="library-stat__label">보유 도서</p>
          <p class="library-stat__value">${readingBooks.length}권</p>
        </div>
        <div class="library-stat">
          <div class="library-stat__icon">♡</div>
          <p class="library-stat__label">찜한 도서</p>
          <p class="library-stat__value">${wishCount || 0}권</p>
        </div>
        <div class="library-stat">
          <div class="library-stat__icon">✅</div>
          <p class="library-stat__label">완독한 도서</p>
          <p class="library-stat__value">0권</p>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div class="content-section__header">
        <p class="content-section__title">최근 구매 내역</p>
        <a href="#" class="content-section__more">전체 보기 ›</a>
      </div>
      <div class="purchase-list">
        ${purchases?.length ? purchases.map(p => {
          const book = p.books
          if (!book) return ''
          return `
            <div class="purchase-item">
              <div class="purchase-item__cover" style="background:${book.cover_color};color:${book.cover_text_color}">${book.title?.slice(0,6)}</div>
              <div class="purchase-item__info">
                <p class="purchase-item__title">${book.title}</p>
                <p class="purchase-item__author">${book.authors?.pen_name || ''} 작가</p>
                <p class="purchase-item__date">구매일 ${p.paid_at ? p.paid_at.slice(0,10) : ''}</p>
              </div>
              <div class="purchase-item__actions">
                <a href="viewer.html?book_id=${book.id}" class="btn btn--primary btn--sm">바로 읽기</a>
              </div>
            </div>`
        }).join('') : '<p style="font-size:14px;color:var(--color-text-sub)">구매 내역이 없어요.</p>'}
      </div>
    </div>`
}

// ─── 작가 대시보드 ───
async function renderAuthorDashboard(container) {
  const name = userProfile?.name || currentUser.email

  // 내 작가 프로필 조회
  const { data: authorProfile } = await supabase
    .from('authors')
    .select('*')
    .eq('user_id', currentUser.id)
    .single()

  // 내 도서 조회
  let authorBooks = []
  if (authorProfile) {
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .eq('author_id', authorProfile.id)
      .limit(3)
    authorBooks = books || []
  }

  container.innerHTML = `
    <div class="welcome-banner">
      <div class="welcome-banner__text">
        <h2>안녕하세요, ${name} 작가님! ✏️</h2>
        <p>당신의 이야기가 많은 사람들에게 영감을 주고 있어요.</p>
      </div>
      <div class="welcome-banner__visual">💻</div>
    </div>

    <div class="content-section" style="margin-bottom:24px">
      <div class="content-section__header">
        <p class="content-section__title">내 도서 현황</p>
        <a href="my-books.html" class="content-section__more">전체 도서 관리 ›</a>
      </div>
      <div class="author-books-grid">
        ${authorBooks.map(book => `
          <div class="author-book-card">
            <div class="author-book-card__cover" style="background:${book.cover_color};color:${book.cover_text_color}">${book.title}</div>
            <p class="author-book-card__title">${book.title}</p>
            <p class="author-book-card__meta">상태: ${book.status}</p>
            <a href="editor.html?book_id=${book.id}" class="btn btn--outline btn--sm btn--full">도서 관리</a>
          </div>`).join('')}
        <a href="editor.html" class="author-book-card" style="display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;background:var(--color-bg-sub);border:1px dashed var(--color-border);min-height:200px;cursor:pointer;text-decoration:none;">
          <span style="font-size:28px">+</span>
          <p style="font-size:13px;color:var(--color-text-sub)">새 도서 등록하기</p>
        </a>
      </div>
    </div>`
}
