/**
 * chipbook viewer.js
 * Supabase 연동 버전
 * 
 * 상태 분기:
 * A. 무료 도서          → 전체 열람 + 우측 회원가입 CTA
 * B. 유료 + 구매 완료   → 전체 열람 + 목차만 (우측 패널 없음)
 * C. 유료 + 미구매      → 일부 미리보기 + 우측 결제 버튼
 */

import { supabase } from './supabase.js'
import { getCurrentUser, isPurchased, formatPrice } from './common.js'

let currentBook = null
let allChapters = []
let currentChapterIndex = 0
let chapterContents = []

document.addEventListener('DOMContentLoaded', async () => {
  const bookId = new URLSearchParams(window.location.search).get('book_id')
  if (!bookId) { window.location.href = 'index.html'; return }

  // 미리보기 모드면 우측 패널 숨김
  const isPreview = new URLSearchParams(window.location.search).get('preview')
  if (isPreview) {
    document.getElementById('viewerSide').style.display = 'none'
  }

  // 도서 정보 조회
  const { data: book } = await supabase
    .from('books')
    .select('*, authors(pen_name)')
    .eq('id', bookId)
    .single()

  if (!book) { window.location.href = 'index.html'; return }
  currentBook = book

  // 챕터 목록 조회
  const { data: contents } = await supabase
    .from('book_contents')
    .select('*')
    .eq('book_id', bookId)
    .order('order_index')

  allChapters = contents || []
  chapterContents = allChapters

  // 헤더 설정
  document.getElementById('viewerBookTitle').textContent = book.title
  document.getElementById('viewerBookAuthor').textContent = (book.authors?.pen_name || '') + ' 지음'

  // 현재 유저 + 구매 여부 확인
  const user = await getCurrentUser()
  const purchased = await isPurchased(bookId)
 const isFree = book.is_free
const isWelcome = book.is_welcome

// 신규회원 여부 확인 (구매 내역이 0개면 신규)
let isNewUser = false
if (user && isWelcome) {
  const { count } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('payment_status', 'completed')
  isNewUser = count === 0
}

const hasAccess = isFree || purchased || (isWelcome && isNewUser)

// 뱃지 설정
const badge = document.getElementById('viewerBadge')
if (isFree) badge.textContent = '무료 도서'
else if (isWelcome && isNewUser) badge.textContent = '신규회원 무료'
else if (purchased) badge.textContent = '구매한 도서'
else badge.textContent = '미리보기'

// 상태별 분기
// 상태별 분기
if (!isPreview) {
  if (isFree) {
    renderSideFree(user)
  } else if (isWelcome && isNewUser) {
    renderSideFree(user)
  } else if (purchased) {
    renderSidePurchased()
  } else {
    renderSideUnpurchased()
  }
} else {
  document.getElementById('viewerSide').style.display = 'none'
}
  renderToc(hasAccess)
renderChapter(0, hasAccess)
initNavigation(hasAccess)
})

// ─── 목차 렌더링 ───
function renderToc(fullAccess) {
  const nav = document.getElementById('tocNav')
  if (!nav) return

  // 파트별 그룹화
  const parts = {}
  allChapters.forEach(ch => {
    const key = ch.part_title || '본문'
    if (!parts[key]) parts[key] = []
    parts[key].push(ch)
  })

  nav.innerHTML = Object.entries(parts).map(([partTitle, chapters]) => `
    <div class="toc-group">
      <div class="toc-group__part">${partTitle}</div>
      ${chapters.map(ch => `
        <button class="toc-chapter" data-id="${ch.id}" onclick="goToChapterById('${ch.id}')">
          ${ch.chapter_title}
        </button>`).join('')}
    </div>`).join('')

  // 하단 액션 버튼
  const actions = document.getElementById('tocActions')
  if (!actions) return

  if (fullAccess) {
    actions.innerHTML = `
      <button class="toc-action-btn" onclick="handleSaveLibrary()">📚 내 서재에 저장</button>`
  } else {
    actions.innerHTML = `
      <a href="signup.html" class="btn btn--primary btn--full btn--sm">무료 회원가입하기</a>`
  }
}

// ─── 챕터 렌더링 ───
function renderChapter(index, fullAccess) {
  const chapter = allChapters[index]
  if (!chapter) {
    document.getElementById('viewerContent').innerHTML = '<p style="color:var(--color-text-sub);padding:40px;text-align:center">챕터를 선택해주세요.</p>'
    return
  }

  // 유료 미구매 → 2챕터 이후 미리보기 제한
  const isPreviewOnly = !fullAccess && index >= 2

  // 저작권 문구 (첫 챕터 도입부)
  const copyrightIntro = index === 0 ? `
    <div style="font-size:12px;color:var(--color-text-light);text-align:center;padding:8px 0 20px;border-bottom:1px solid var(--color-border);margin-bottom:24px">
      © ${new Date().getFullYear()} ${currentBook.authors?.pen_name || '저자'}. 이 책의 저작권은 저자에게 있습니다. 무단 전재 및 재배포를 금합니다.
    </div>` : ''

  let html = `
    <div class="viewer-chapter-num">${chapter.part_title || 'PART'}</div>
    <h2 class="viewer-chapter-title">${index + 1}. ${chapter.chapter_title}</h2>
    ${copyrightIntro}
    <div class="viewer-chapter-body">
      ${isPreviewOnly
        ? `<p>이 챕터의 일부만 미리보기로 제공됩니다.</p><p>계속 읽으시려면 구매 후 이용해주세요.</p>`
        : (chapter.content || '<p>내용을 준비 중입니다.</p>')}
    </div>`

  // 미리보기 제한 UI
  if (isPreviewOnly) {
    html += `
      <div class="viewer-preview-limit">
        <div class="viewer-preview-blur"></div>
        <div class="viewer-preview-cta">
          <p>이후 내용은 구매 후 열람할 수 있습니다</p>
          <a href="book-payment.html?book_id=${currentBook.id}" class="btn btn--primary">구매하러 가기</a>
        </div>
      </div>`
  }

  // 구매자 액션 바
  if (fullAccess) {
    html += `
      <div class="viewer-actions">
        <button class="viewer-action-btn" onclick="handleSaveLibrary()">📚 내 서재에 저장</button>
        <button class="viewer-action-btn" onclick="toggleMemoModal()">📝 메모 작성</button>
        <button class="viewer-action-btn">♡ 좋아요</button>
      </div>`
  }

  // 마지막 챕터 → 저작권 + 면책사항 자동 삽입
  if (index === allChapters.length - 1) {
    html += `
      <div style="margin-top:48px;padding:24px;background:#f8f8f6;border-radius:12px;border:1px solid var(--color-border)">
        <p style="font-size:13px;font-weight:700;margin-bottom:12px;text-align:center">📋 저작권 및 면책사항</p>
        <div style="font-size:12px;color:var(--color-text-sub);line-height:1.8">
          <p style="margin-bottom:8px">© ${new Date().getFullYear()} ${currentBook.authors?.pen_name || '저자'}. All rights reserved.</p>
          <p style="margin-bottom:8px">이 책의 저작권은 저자에게 있습니다. 저작권법에 의해 보호받는 저작물이므로 저자의 서면 동의 없이 내용의 전부 또는 일부를 복제·배포·수정하는 것을 금합니다.</p>
          <p style="margin-bottom:4px">✗ 무단 복제 및 재배포 금지</p>
          <p style="margin-bottom:4px">✗ SNS·블로그·카페 등 무단 공유 금지</p>
          <p style="margin-bottom:12px">✓ 개인 학습 목적의 메모·발췌는 허용됩니다.</p>
          <p style="border-top:1px solid var(--color-border);padding-top:12px">이 책의 내용은 저자의 개인적 경험을 바탕으로 작성되었으며, 전문적인 의료·법률·재무 조언을 대체하지 않습니다. 실천 결과는 개인에 따라 다를 수 있습니다.</p>
        </div>
      </div>`
  }

  // 무료 도서 마지막 챕터 → 회원가입 유도
  if (currentBook.is_free && index >= allChapters.length - 2) {
    html += `
      <div style="margin-top:32px;padding:24px;background:var(--color-primary-bg);border-radius:12px;text-align:center">
        <p style="font-weight:600;margin-bottom:8px">이 글이 도움이 되셨나요?</p>
        <p style="font-size:14px;color:var(--color-text-sub);margin-bottom:16px">더 많은 기능과 함께 다양한 책을 경험할 수 있습니다.</p>
        <a href="signup.html" class="btn btn--primary">무료 회원가입하기</a>
      </div>`
  }

  document.getElementById('viewerContent').innerHTML = html
  updateNavPages()
  updateProgress()

  // 목차 활성화
  document.querySelectorAll('.toc-chapter').forEach((btn, i) => {
    btn.classList.toggle('active', i === index)
  })
}

// ─── 우측 패널 — A: 무료 도서 ───
async function renderSideFree(user) {
  const side = document.getElementById('viewerSide')
  if (!side) return

  const isLoggedIn = !!user

  side.innerHTML = `
    ${!isLoggedIn ? `
      <div class="side-join-cta">
        <div class="side-join-cta__icons">
          <div class="side-join-cta__icon">📚<span>내 서재 저장</span></div>
          <div class="side-join-cta__icon">📝<span>메모 작성</span></div>
          <div class="side-join-cta__icon">♡<span>찜한 도서 관리</span></div>
        </div>
        <a href="signup.html" class="btn btn--primary btn--full">무료 회원가입하기</a>
        <p class="side-join-cta__sub">가입은 1분이면 충분해요! 😊</p>
      </div>` : ''}
    <div class="side-section" id="sideRecommended"></div>`

  await renderSideRecommended()
}

// ─── 우측 패널 — B: 유료 구매 완료 (우측 패널 없음) ───
function renderSidePurchased() {
  const side = document.getElementById('viewerSide')
  if (!side) return
  side.style.display = 'none' // 우측 패널 숨김
}

// ─── 우측 패널 — C: 유료 미구매 ───
function renderSideUnpurchased() {
  const side = document.getElementById('viewerSide')
  if (!side) return

  side.innerHTML = `
    <div style="padding:20px;background:var(--color-primary-bg);border-radius:12px;text-align:center">
      <p style="font-size:15px;font-weight:700;margin-bottom:8px">${currentBook.title}</p>
      <p style="font-size:24px;font-weight:700;color:var(--color-primary);margin-bottom:16px">${formatPrice(currentBook.price)}</p>
      <a href="book-payment.html?book_id=${currentBook.id}" class="btn btn--primary btn--full">구매하기</a>
      <p style="font-size:12px;color:var(--color-text-sub);margin-top:10px">지금 구매하면 바로 전체 열람 가능</p>
    </div>
    <div class="side-section" id="sideRecommended" style="margin-top:20px"></div>`

  renderSideRecommended()
}

// ─── 우측 추천 도서 ───
async function renderSideRecommended() {
  const container = document.getElementById('sideRecommended')
  if (!container) return

  const { data: books } = await supabase
    .from('books')
    .select('*, authors(pen_name)')
    .eq('status', 'published')
    .neq('id', currentBook.id)
    .limit(3)

  if (!books?.length) return

  container.innerHTML = `
    <p class="side-section__title">이 책과 비슷한 추천 도서</p>
    ${books.map(b => `
      <a href="book-detail.html?book_id=${b.id}" class="side-book-item">
        <div class="side-book-item__cover" style="background:${b.cover_color};color:${b.cover_text_color}">${b.title.slice(0,6)}</div>
        <div class="side-book-item__info">
          <p class="side-book-item__title">${b.title}</p>
          <p class="side-book-item__author">${b.authors?.pen_name || ''} 지음</p>
          <p class="side-book-item__price">${b.is_free ? '무료' : formatPrice(b.price)}</p>
        </div>
      </a>`).join('')}`
}

// ─── 네비게이션 ───
function initNavigation(fullAccess) {
  document.getElementById('prevChapter')?.addEventListener('click', () => {
    if (currentChapterIndex > 0) {
      currentChapterIndex--
      renderChapter(currentChapterIndex, fullAccess)
    }
  })
  document.getElementById('nextChapter')?.addEventListener('click', () => {
    if (currentChapterIndex < allChapters.length - 1) {
      currentChapterIndex++
      renderChapter(currentChapterIndex, fullAccess)
    }
  })
}

window.goToChapterById = function(id) {
  const idx = allChapters.findIndex(ch => ch.id === id)
  if (idx !== -1) {
    currentChapterIndex = idx
    const fullAccess = currentBook.is_free || document.getElementById('viewerBadge').textContent === '구매한 도서'
    renderChapter(idx, fullAccess)
  }
}

function updateNavPages() {
  const container = document.getElementById('navPages')
  if (!container) return
  const total = allChapters.length
  const cur = currentChapterIndex

  // 현재 챕터 기준으로 앞뒤 3개씩 표시 (최대 7개)
  let start = Math.max(0, cur - 3)
  let end = Math.min(total - 1, start + 6)
  if (end - start < 6) start = Math.max(0, end - 6)

  let html = ''
  if (start > 0) html += `<button class="nav-page-btn" onclick="goToChapterByIndex(0)">1</button><span style="padding:0 4px;color:var(--color-text-light)">…</span>`

  for (let i = start; i <= end; i++) {
    html += `<button class="nav-page-btn ${i === cur ? 'active' : ''}" onclick="goToChapterByIndex(${i})">${i + 1}</button>`
  }

  if (end < total - 1) html += `<span style="padding:0 4px;color:var(--color-text-light)">…</span><button class="nav-page-btn" onclick="goToChapterByIndex(${total - 1})">${total}</button>`

  container.innerHTML = html
}

window.goToChapterByIndex = function(idx) {
  currentChapterIndex = idx
  const fullAccess = currentBook.is_free || document.getElementById('viewerBadge').textContent === '구매한 도서'
  renderChapter(idx, fullAccess)
}

function updateProgress() {
  const pct = allChapters.length ? Math.round(((currentChapterIndex + 1) / allChapters.length) * 100) : 0
  const fill = document.getElementById('progressFill')
  const label = document.getElementById('tocProgress')
  if (fill) fill.style.width = pct + '%'
  if (label) label.textContent = `읽는 중 ${pct}%`
}

function toggleMemoModal() {
  let modal = document.getElementById('memoModal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'memoModal'
    modal.className = 'memo-modal'
    modal.innerHTML = `
      <div class="memo-modal__header">
        <p class="memo-modal__title">메모 작성</p>
        <span class="memo-modal__close" onclick="toggleMemoModal()">✕</span>
      </div>
      <textarea placeholder="기억하고 싶은 내용을 메모해보세요."></textarea>
      <p class="memo-modal__hint">💡 메모 저장 기능은 준비 중입니다.</p>
      <button class="btn btn--primary btn--full btn--sm">저장하기</button>`
    document.body.appendChild(modal)
  }
  modal.classList.toggle('show')
}

function handleSaveLibrary() {
  alert('내 서재 저장 기능은 준비 중입니다.')
}
