/**
 * chipbook index.js — 메인페이지
 * Supabase 연동 버전
 */

import { supabase } from './supabase.js'
import { formatPrice, createBookCard, getParam } from './common.js'

// setInterval을 함수 밖에서 한 번만 선언
let recommendInterval = null

document.addEventListener('DOMContentLoaded', async () => {
  await renderTags()
  await renderFreeBooks()
  await renderRecommendBooks()
  initSearch()

  // 15초마다 추천도서 교체 — 딱 한 번만 등록
  recommendInterval = setInterval(renderRecommendBooks, 15 * 1000)
})

// ─── 태그 목록 렌더링 ───
async function renderTags() {
  const container = document.getElementById('heroTagList')
  if (!container) return
  const tags = ['살림', '육아', '재테크', '인간관계', '자기계발', '시간관리', '정리정돈', '건강', '1인가구', '직장인']
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

  const shuffled = books.sort(() => Math.random() - 0.5)

  // 페이드 아웃
  container.style.transition = 'opacity 0.4s ease'
  container.style.opacity = '0'

  setTimeout(() => {
    container.innerHTML = shuffled.map(book =>
      createBookCard(book, { showRating: true, showPrice: true })
    ).join('')

    // 슬라이더 초기화 (이벤트 중복 방지)
    initSlider()

    // 페이드 인
    container.style.opacity = '1'
  }, 400)
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

  // 기존 이벤트 리스너 제거 (중복 방지)
  const newPrev = prevBtn?.cloneNode(true)
  const newNext = nextBtn?.cloneNode(true)
  if (prevBtn && newPrev) prevBtn.parentNode.replaceChild(newPrev, prevBtn)
  if (nextBtn && newNext) nextBtn.parentNode.replaceChild(newNext, nextBtn)

  const prev = document.getElementById('sliderPrev')
  const next = document.getElementById('sliderNext')

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
    if (prev) prev.disabled = currentIndex === 0
    if (next) next.disabled = currentIndex >= maxIndex
  }

  if (prev) prev.addEventListener('click', () => goTo(currentIndex - 1))
  if (next) next.addEventListener('click', () => goTo(currentIndex + 1))

  updateBtns()
}