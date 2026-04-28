/**
 * chipbook index.js — 메인페이지
 * Supabase 연동 버전
 */

import { supabase } from './supabase.js'
import { formatPrice, createBookCard, getParam } from './common.js'

document.addEventListener('DOMContentLoaded', async () => {
  await renderTags()
  await renderFreeBooks()
  await renderRecommendBooks()
  initSearch()
  initSlider()
})

// ─── 태그 목록 렌더링 ───
async function renderTags() {
  const container = document.getElementById('heroTagList')
  if (!container) return
  // 태그는 고정값 사용 (books 테이블의 tags 컬럼에서 가져올 수도 있음)
  const tags = ['시간관리', '돈절약', '미니멀라이프', '육아', '습관', '자기계발', '관계', '정리정돈']
  container.innerHTML = tags.map(tag =>
    `<span class="tag" onclick="searchByTag('${tag}')">#${tag}</span>`
  ).join('')
}

window.searchByTag = function(tag) {
  window.location.href = `search.html?tag=${encodeURIComponent(tag)}`
}

// ─── 무료도서 렌더링 ───
async function renderFreeBooks() {
  const container = document.getElementById('freeBookList')
  if (!container) return

  const { data: books, error } = await supabase
    .from('books')
    .select('*, authors(pen_name)')
    .eq('is_free', true)
    .eq('status', 'published')
    .limit(5)

  if (error || !books?.length) {
    container.innerHTML = '<p style="color:var(--color-text-sub);font-size:14px">등록된 무료 도서가 없습니다.</p>'
    return
  }

  container.innerHTML = books.map(book => createBookCard(book, { showStats: true })).join('')
}

// ─── 추천도서 렌더링 ───
async function renderRecommendBooks() {
  const container = document.getElementById('recommendBookList')
  if (!container) return

  const { data: books, error } = await supabase
    .from('books')
    .select('*, authors(pen_name)')
    .eq('is_free', false)
    .eq('status', 'published')
    .limit(8)

  if (error || !books?.length) {
    container.innerHTML = '<p style="color:var(--color-text-sub);font-size:14px">등록된 추천 도서가 없습니다.</p>'
    return
  }

  container.innerHTML = books.map(book => createBookCard(book, { showRating: true, showPrice: true })).join('')
  initSlider()
}

// ─── 검색 초기화 ───
function initSearch() {
  const btn = document.getElementById('heroSearchBtn')
  const input = document.getElementById('heroSearchInput')
  if (!btn || !input) return

  btn.addEventListener('click', doSearch)
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch() })
}

function doSearch() {
  const kw = document.getElementById('heroSearchInput').value.trim()
  if (kw) window.location.href = `search.html?keyword=${encodeURIComponent(kw)}`
}

// ─── 슬라이더 ───
function initSlider() {
  const track = document.getElementById('recommendBookList')
  const dotsContainer = document.getElementById('sliderDots')
  const prevBtn = document.getElementById('sliderPrev')
  const nextBtn = document.getElementById('sliderNext')
  if (!track) return

  const cardWidth = 180 + 24
  const visibleCount = 5
  const totalCards = track.children.length
  const maxIndex = Math.max(0, totalCards - visibleCount)
  let currentIndex = 0
  const totalDots = Math.ceil(totalCards / visibleCount)

  if (dotsContainer) {
    dotsContainer.innerHTML = Array.from({ length: totalDots }, (_, i) =>
      `<span class="slider-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`
    ).join('')
    dotsContainer.querySelectorAll('.slider-dot').forEach(dot => {
      dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index) * visibleCount))
    })
  }

  function goTo(index) {
    currentIndex = Math.max(0, Math.min(index, maxIndex))
    track.style.transform = `translateX(-${currentIndex * cardWidth}px)`
    updateDots()
    updateBtns()
  }

  function updateDots() {
    const dotIndex = Math.floor(currentIndex / visibleCount)
    document.querySelectorAll('.slider-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === dotIndex)
    })
  }

  function updateBtns() {
    if (prevBtn) prevBtn.disabled = currentIndex === 0
    if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(currentIndex - 1))
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(currentIndex + 1))

  updateBtns()
}
