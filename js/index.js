/**
 * chipbook index.js — 메인페이지
 * Supabase 연동 버전
 */

import { supabase } from './supabase.js'
import { formatPrice, createBookCard, createCoverHTML, getParam } from './common.js'

// setInterval을 함수 밖에서 한 번만 선언
let recommendInterval = null

document.addEventListener('DOMContentLoaded', async () => {
  await renderTags()
  await renderFreeBooks()
  await renderWelcomeBooks()
  await renderRecommendBooks()
  await renderSeriesBooks()
  initSearch()

  recommendInterval = setInterval(renderRecommendBooks, 15 * 1000)
  setInterval(renderWelcomeBooks, 15 * 1000)

  // 로그인 상태에 따라 버튼 변경
  const { data: { user } } = await supabase.auth.getUser()
  const welcomeBtn = document.getElementById('welcomeBtn')
  if (welcomeBtn) {
    if (user) {
      welcomeBtn.textContent = '무료 도서 받으러 가기 →'
      welcomeBtn.href = 'search.html?type=welcome'
    } else {
      welcomeBtn.textContent = '회원가입하고 받기 →'
      welcomeBtn.href = 'signup.html'
    }
  }
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
    .eq('is_welcome', false)
    .eq('status', 'published')
    .limit(8)

  if (error || !books?.length) {
    container.innerHTML = '<p style="color:var(--color-text-sub);font-size:14px">등록된 추천 도서가 없습니다.</p>'
    return
  }

  const shuffled = books.sort(() => Math.random() - 0.5)

  container.style.transition = 'opacity 0.4s ease'
  container.style.opacity = '0'

  setTimeout(() => {
    container.innerHTML = shuffled.map(book =>
      createBookCard(book, { showRating: true, showPrice: true })
    ).join('')
    initSlider()
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

// ─── 첫 구매 환영 도서 렌더링 ───
async function renderWelcomeBooks() {
  const container = document.getElementById('welcomeBookList')
  if (!container) return

  const { data: books, error } = await supabase
    .from('books')
    .select('*, authors(pen_name)')
    .eq('is_welcome', true)
    .eq('status', 'published')
    .limit(10)

  if (error || !books?.length) {
    container.innerHTML = '<p style="color:var(--color-text-sub);font-size:14px">등록된 도서가 없습니다.</p>'
    return
  }

  const shuffled = books.sort(() => Math.random() - 0.5).slice(0, 5)
  container.style.transition = 'opacity 0.4s ease'
  container.style.opacity = '0'

  setTimeout(() => {
    container.innerHTML = shuffled.map(book =>
      createBookCard(book, { showPrice: true })
    ).join('')
    container.style.opacity = '1'
  }, 400)
}

// ─── 시리즈 도서 렌더링 (전용 미니카드) ───
async function renderSeriesBooks() {
  const series = ['spot', 'routine', 'core']
  const ids = ['seriesSpotList', 'seriesRoutineList', 'seriesCoreList']

  for (let i = 0; i < series.length; i++) {
    const container = document.getElementById(ids[i])
    if (!container) continue

    const { data: books } = await supabase
      .from('books')
      .select('*, authors(pen_name)')
      .eq('series', series[i])
      .eq('status', 'published')
      .limit(2)

    if (!books?.length) continue

   const colors = {
  spot:    { bg: '#ede4d0', text: '#1B5E3A' },
  routine: { bg: '#174d30', text: '#ffffff' },
  core:    { bg: '#0f1e2a', text: '#ffffff' },
}
const { bg: bgColor, text: textColor } = colors[series[i]]

container.innerHTML = books.map(book => {
  const priceHTML = book.is_free
    ? `<span class="series-mini-price series-mini-price--free">무료</span>`
    : `<span class="series-mini-price">${formatPrice(book.price)}</span>`

 const coverHTML = `<div style="width:100%;height:100%;background:${bgColor};color:${textColor};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;text-align:center;gap:6px;">
  <span style="font-size:13px;font-weight:800;line-height:1.4;">${book.title}</span>
  ${book.subtitle ? `<span style="font-size:10px;opacity:0.75;line-height:1.4;">${book.subtitle}</span>` : ''}
</div>`

  return `
    <a href="book-detail.html?book_id=${book.id}" class="series-mini-card">
      <div class="series-mini-cover">${coverHTML}</div>
          <div class="series-mini-info">
            <div class="series-mini-title">${book.title}</div>
            ${priceHTML}
          </div>
        </a>
      `
    }).join('')
  }
}