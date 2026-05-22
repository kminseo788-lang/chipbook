/**
 * chipbook search.js
 * Supabase 연동 버전
 */

import { supabase } from './supabase.js'
import { getCurrentUser, toggleWishlist, isWishlisted, formatPrice } from './common.js'

let selectedTags = []
let viewMode = 'grid'
let currentResults = []

const allTags = ['문학', '비문학', '살림', '육아', '건강', '인간관계', '자기계발', '재테크', '시간관리', '정리정돈', '심리', '시', '소설', '에세이', '1인가구', '신혼부부', '직장인', '주부', '초보부모', '학생', '시니어']
document.addEventListener('DOMContentLoaded', async () => {
  renderTagSelector()
  await parseUrlAndSearch()
  initControls()
})

// ─── URL 파싱 및 검색 ───
async function parseUrlAndSearch() {
  const keyword = new URLSearchParams(window.location.search).get('keyword')
  const type = new URLSearchParams(window.location.search).get('type')
  const tag = new URLSearchParams(window.location.search).get('tag')
  const authorId = new URLSearchParams(window.location.search).get('author_id')
  const series = new URLSearchParams(window.location.search).get('series')

  const inputEl = document.getElementById('searchInput')
  if (keyword && inputEl) inputEl.value = keyword

  if (tag) {
    selectedTags = [tag]
    renderSelectedTags()
  }

currentResults = await fetchBooks({ keyword, type, tag, author_id: authorId, series })
  renderResults(currentResults)
}

// ─── Supabase 도서 조회 ───
async function fetchBooks(params = {}) {
  let query = supabase
    .from('books')
    .select('*, authors(pen_name)')
    .eq('status', 'published')

  if (params.keyword) query = query.or(`title.ilike.%${params.keyword}%,description.ilike.%${params.keyword}%`)
  if (params.type === 'free') query = query.eq('is_free', true)
  if (params.type === 'welcome') query = query.eq('is_welcome', true).eq('is_free', false)
  if (params.series) query = query.eq('series', params.series)  // ← 순서 맞게 이동
  if (params.tag) query = query.contains('tags', [params.tag])
  if (params.author_id) query = query.eq('author_id', params.author_id)

  const { data, error } = await query
  if (error) return []
  return data || []
}

// ─── 태그 선택기 ───
function renderTagSelector() {
  const container = document.getElementById('allTagsList')
  if (!container) return
  container.innerHTML = allTags.map(tag =>
    `<span class="tag ${selectedTags.includes(tag) ? 'active' : ''}" onclick="toggleTag('${tag}')">#${tag}</span>`
  ).join('')
}

window.toggleTag = async function(tag) {
  const idx = selectedTags.indexOf(tag)
  if (idx === -1) selectedTags.push(tag)
  else selectedTags.splice(idx, 1)
  renderTagSelector()
  renderSelectedTags()

  if (selectedTags.length === 0) {
    currentResults = await fetchBooks({})
  } else {
    // 여러 태그 중 하나라도 포함된 도서
    const { data } = await supabase
      .from('books')
      .select('*, authors(pen_name)')
      .eq('status', 'published')
      .overlaps('tags', selectedTags)
    currentResults = data || []
  }
  renderResults(currentResults)
}

function renderSelectedTags() {
  const area = document.getElementById('selectedTagsArea')
  const list = document.getElementById('selectedTagsList')
  if (!area || !list) return
  area.style.display = selectedTags.length ? 'flex' : 'none'
  list.innerHTML = selectedTags.map(tag =>
    `<span class="selected-tag">${tag} <span class="selected-tag__remove" onclick="toggleTag('${tag}')">✕</span></span>`
  ).join('')
}

// ─── 결과 렌더링 ───
function renderResults(books) {
  const container = document.getElementById('searchResultsContainer')
  const countEl = document.getElementById('resultsCount')
  if (!container) return

  if (countEl) countEl.textContent = `총 ${books.length}권의 도서를 찾았어요`

  if (!books.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🔍</div>
        <p class="empty-state__title">검색 결과가 없어요</p>
        <p class="empty-state__desc">다른 키워드나 태그로 검색해보세요</p>
      </div>`
    return
  }

  if (viewMode === 'grid') {
    container.innerHTML = `<div class="books-grid">${books.map(b => renderGridCard(b)).join('')}</div>`
  } else {
    container.innerHTML = `<div class="books-list-view">${books.map(b => renderListItem(b)).join('')}</div>`
  }
}

function renderGridCard(book) {
  const authorName = book.authors?.pen_name || ''

  const seriesConfig = {
    'spot':    { color: '#F5F0E8', textColor: '#1B5E3A', label: 'Spot Book',    desc: '하나의 책, 하나의 문제 해결' },
    'routine': { color: '#1B5E3A', textColor: '#ffffff', label: 'Routine Book', desc: '지금 상황을 쉽게 굴러가게 만드는 책' },
    'core':    { color: '#1B3A4B', textColor: '#ffffff', label: 'Core Book',    desc: '삶을 바라보는 기준과 철학' },
  }

  const series = book.series ? seriesConfig[book.series] : null
  const bgColor = series ? series.color : (book.cover_color || '#E8F5E9')
  const textColor = series ? series.textColor : (book.cover_text_color || '#1B5E3A')

  let coverContent = ''
  if (series) {
    coverContent = `
      <div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:16px 14px;box-sizing:border-box;">
        <div style="text-align:center;">
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

  const badge = book.is_free
  ? '<span class="badge badge--free" style="position:absolute;top:10px;left:10px;">무료</span>'
  : (book.is_welcome 
    ? '<span class="badge" style="position:absolute;top:10px;left:10px;background:#C9A84C;color:#fff;">첫구매무료</span>'
    : '')
  const welcomeBtn = book.is_welcome && new URLSearchParams(window.location.search).get('type') === 'welcome'
  ? `<button onclick="selectWelcomeBook('${book.id}')" 
       style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);
       background:#C9A84C;color:#fff;border:none;border-radius:8px;
       padding:6px 14px;font-size:12px;cursor:pointer;white-space:nowrap;">
       이 책 무료로 받기</button>`
  : ''

 return `
  <div class="book-card">
    <div class="book-card__cover-link"
         onclick="${welcomeBtn ? '' : `window.location.href='book-detail.html?book_id=${book.id}'`}">
      <div class="book-card__cover" style="background:${bgColor};color:${textColor};overflow:hidden;position:relative;">
        ${coverContent}
        ${badge}
        ${welcomeBtn}
      </div>
    </div>
    <div class="book-card__info">
      <a href="book-detail.html?book_id=${book.id}"><p class="book-card__title">${book.title}</p></a>
      <p class="book-card__author">${authorName} 지음</p>
      <div class="book-card__rating"><span class="stars">★</span> ${book.rating || 0}</div>
      <p class="book-card__price">${book.is_free ? '무료' : formatPrice(book.price)}</p>
    </div>
  </div>`
}

function renderListItem(book) {
  const authorName = book.authors?.pen_name || ''
  return `
    <div class="book-list-item">
      <a href="book-detail.html?book_id=${book.id}">
        <div class="book-list-item__cover" style="background:${book.cover_color};color:${book.cover_text_color}">${book.title}</div>
      </a>
      <div class="book-list-item__info">
        <a href="book-detail.html?book_id=${book.id}"><p class="book-list-item__title">${book.title}</p></a>
        <p class="book-list-item__author">${authorName} 지음</p>
        <p class="book-list-item__desc">${book.description || ''}</p>
        <div class="book-list-item__tags">${(book.tags||[]).map(t => `<span class="book-list-item__tag">${t}</span>`).join('')}</div>
      </div>
      <div class="book-list-item__right">
        <p class="book-list-item__price">${book.is_free ? '무료' : formatPrice(book.price)}</p>
        <p class="book-list-item__rating"><span class="stars">★</span> ${book.rating || 0} (${book.review_count || 0})</p>
        <div class="book-list-item__actions">
          <a href="book-detail.html?book_id=${book.id}" class="btn btn--primary btn--sm">상세보기</a>
          <button class="book-list-item__wishlist" onclick="handleWishlist('${book.id}', this)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>
    </div>`
}

window.handleWishlist = async function(bookId, btn) {
  const added = await toggleWishlist(bookId)
  btn.classList.toggle('active', added)
  btn.querySelector('svg').setAttribute('fill', added ? 'currentColor' : 'none')
}

// ─── 컨트롤 ───
function initControls() {
  document.getElementById('searchBtn')?.addEventListener('click', async () => {
    const kw = document.getElementById('searchInput').value.trim()
    if (kw) {
      currentResults = await fetchBooks({ keyword: kw })
      renderResults(currentResults)
    }
  })

  document.getElementById('searchInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('searchBtn')?.click()
  })

  document.getElementById('viewGrid')?.addEventListener('click', () => {
    viewMode = 'grid'
    document.getElementById('viewGrid').classList.add('active')
    document.getElementById('viewList').classList.remove('active')
    renderResults(currentResults)
  })

  document.getElementById('viewList')?.addEventListener('click', () => {
    viewMode = 'list'
    document.getElementById('viewList').classList.add('active')
    document.getElementById('viewGrid').classList.remove('active')
    renderResults(currentResults)
  })

  document.getElementById('clearAllTags')?.addEventListener('click', async () => {
    selectedTags = []
    renderTagSelector()
    renderSelectedTags()
    currentResults = await fetchBooks({})
    renderResults(currentResults)
  })
}
window.selectWelcomeBook = async function(bookId) {
  const user = await getCurrentUser()
  if (!user) { window.location.href = 'login.html'; return }

  // 이미 선택했는지 확인
  const { data: userData } = await supabase
    .from('users')
    .select('welcome_book_id')
    .eq('id', user.id)
    .single()

  if (userData?.welcome_book_id) {
    alert('이미 무료 도서를 선택하셨습니다.')
    window.location.href = `viewer.html?book_id=${userData.welcome_book_id}`
    return
  }

  // welcome_book_id 저장
  await supabase
    .from('users')
    .update({ welcome_book_id: bookId })
    .eq('id', user.id)

  window.location.href = `viewer.html?book_id=${bookId}`
}