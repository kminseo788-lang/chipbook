/**
 * chipbook search.js
 * Supabase 연동 버전
 */

import { supabase } from './supabase.js'
import { getCurrentUser, toggleWishlist, isWishlisted, formatPrice } from './common.js'

let selectedTags = []
let viewMode = 'grid'
let currentResults = []

const allTags = ['시간관리', '돈절약', '미니멀라이프', '육아', '습관', '자기계발', '관계', '정리정돈', '재테크', '루틴']

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

  const inputEl = document.getElementById('searchInput')
  if (keyword && inputEl) inputEl.value = keyword

  if (tag) {
    selectedTags = [tag]
    renderSelectedTags()
  }

  currentResults = await fetchBooks({ keyword, type, tag, author_id: authorId })
  renderResults(currentResults)
}

// ─── Supabase 도서 조회 ───
async function fetchBooks(params = {}) {
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
  return `
    <div class="book-card">
      <a href="book-detail.html?book_id=${book.id}" class="book-card__cover-link">
     <div class="book-card__cover" style="background:${book.cover_color};color:${book.cover_text_color};overflow:hidden;position:relative;">
  ${book.cover_url ? `<img src="${book.cover_url}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">` : ''}
          ${book.is_free ? '<span class="badge badge--free">무료</span>' : ''}
          <div class="book-card__cover-title">${book.title}</div>
        </div>
      </a>
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
