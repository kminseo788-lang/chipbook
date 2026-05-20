

import { supabase } from './supabase.js'
import { getCurrentUser, isPurchased, toggleWishlist, isWishlisted, formatPrice, createBookCard, createCoverHTML } from './common.js'
document.addEventListener('DOMContentLoaded', async () => {
  const bookId = new URLSearchParams(window.location.search).get('book_id')
  if (!bookId) { window.location.href = 'index.html'; return }

  // 도서 정보 조회
  const { data: book, error } = await supabase
    .from('books')
    .select('*, authors(*)')
    .eq('id', bookId)
    .single()

  if (error || !book) {
    document.getElementById('bookDetailTop').innerHTML = '<div class="empty-state"><p class="empty-state__title">도서를 찾을 수 없어요</p></div>'
    return
  }

  document.title = `${book.title} — chipbook`
  renderBreadcrumb(book)
  await renderBookTop(book)
  renderToc(book, bookId)
  await renderPreview(bookId)
  renderAuthor(book)
  renderMoreBooks(book)
})

function renderBreadcrumb(book) {
  const el = document.getElementById('breadcrumb')
  if (!el) return
  el.innerHTML = `
    <a href="index.html">🏠 홈</a>
    <span class="breadcrumb__sep">›</span>
    <span>${book.category || ''}</span>
    <span class="breadcrumb__sep">›</span>
    <span>${book.title}</span>`
}

async function renderBookTop(book) {
  const el = document.getElementById('bookDetailTop')
  if (!el) return

const user = await getCurrentUser()
const purchased = await isPurchased(book.id)
const wishlisted = await isWishlisted(book.id)
const isFree = book.is_free
const authorName = book.authors?.pen_name || ''

  let mainBtn = ''
 // 작가 여부 확인
const { data: authorData } = await supabase
  .from('authors')
  .select('id')
  .eq('user_id', user?.id)
  .single()
const isAuthor = !!authorData

if (isFree || purchased || isAuthor) {
  mainBtn = `<a href="viewer.html?book_id=${book.id}" class="btn btn--primary btn--lg">바로 읽기</a>`
} else {
  if (user) {
    mainBtn = `<a href="book-payment.html?book_id=${book.id}" class="btn btn--primary btn--lg">구매하기</a>`
  } else {
    mainBtn = `<a href="login.html?redirect=book-detail.html%3Fbook_id%3D${book.id}" class="btn btn--primary btn--lg">로그인 후 구매하기</a>`
  }
}

  el.innerHTML = `
   <div class="book-detail-cover" style="overflow:hidden;position:relative;">
  ${createCoverHTML(book, 'lg')}
</div>
    <div class="book-detail-info">
      <div class="book-detail-cats">
        ${(book.tags||[]).slice(0,2).map(t => `<span class="book-detail-cat">${t}</span>`).join('')}
      </div>
      <h1 class="book-detail-title">${book.title}</h1>
      <p class="book-detail-subtitle">${book.subtitle || ''}</p>
      <p class="book-detail-desc">${book.description || ''}</p>
      <div class="book-detail-meta">
     <a href="author-room.html?author_id=${book.author_id}" style="color:inherit">👤 ${authorName} 작가</a>
        <span class="book-detail-meta__sep">|</span>
        <span>★ ${book.rating || 0} (${book.review_count || 0})</span>
        <span class="book-detail-meta__sep">|</span>
        <span>🛒 구매 ${(book.purchase_count || 0).toLocaleString()}</span>
      </div>
      <p class="book-detail-price">${isFree ? '무료' : formatPrice(book.price)}</p>
      <div class="book-detail-actions">
        ${mainBtn}
        <button class="btn btn--outline btn--lg" id="wishlistBtn" onclick="handleWishlistBtn('${book.id}', this)">
          ${wishlisted ? '♥ 찜 해제' : '♡ 찜하기'}
        </button>
      </div>
      <div class="book-detail-format">
        <span>📄 전자책(ePub)</span>
        <span>📅 ${book.created_at ? book.created_at.slice(0,10) : ''} 출간</span>
      </div>
    </div>`
}

window.handleWishlistBtn = async function(bookId, btn) {
  const added = await toggleWishlist(bookId)
  btn.textContent = added ? '♥ 찜 해제' : '♡ 찜하기'
}

async function renderToc(book, bookId) {
  const tocEl = document.getElementById('bookToc')
  if (!tocEl) return

  const { data: contents } = await supabase
    .from('book_contents')
    .select('*')
    .eq('book_id', bookId)
    .order('order_index')

  if (!contents?.length) return

  // 파트별로 그룹화
  const parts = {}
  contents.forEach(c => {
    const key = c.part_title || '본문'
    if (!parts[key]) parts[key] = { subtitle: c.part_subtitle, chapters: [] }
    parts[key].chapters.push(c.chapter_title)
  })

  tocEl.style.display = 'block'
  document.getElementById('tocGrid').innerHTML = Object.entries(parts).map(([partTitle, part]) => `
    <div class="toc-part">
      <p class="toc-part__num">${partTitle}</p>
      <p class="toc-part__title">${part.subtitle || '—'}</p>
      <ul class="toc-part__chapters">
        ${part.chapters.map(ch => `<li class="toc-part__chapter">${ch}</li>`).join('')}
      </ul>
    </div>`).join('')
}

async function renderAuthor(book) {
  const authorEl = document.getElementById('bookAuthor')
  if (!authorEl || !book.authors) return

  const author = book.authors
  authorEl.style.display = 'block'
  document.getElementById('authorProfile').innerHTML = `
    <div class="author-profile__photo">👤</div>
    <div class="author-profile__info">
      <p class="author-profile__name">${author.pen_name} 작가</p>
      <p class="author-profile__bio">${author.intro || ''}</p>
      <a href="author-room.html?author_id=${author.id}" class="btn btn--outline btn--sm" style="margin-top:12px">작가의 방 보기 →</a>
    </div>`
}
async function renderMoreBooks(book) {
  const moreEl = document.getElementById('authorMoreBooks')
  if (!moreEl) return

  const { data: otherBooks } = await supabase
    .from('books')
    .select('*, authors(pen_name)')
    .eq('author_id', book.author_id)
    .eq('status', 'published')
    .neq('id', book.id)
    .limit(10)

  if (!otherBooks?.length) return

  moreEl.style.display = 'block'
  const link = document.getElementById('authorMoreLink')
  if (link) link.href = `search.html?author_id=${book.author_id}`

  const listEl = document.getElementById('authorMoreBooksList')
  const isMobile = () => window.innerWidth <= 768

  const renderList = (count) => {
    listEl.innerHTML = otherBooks.slice(0, count).map(b =>
      createBookCard(b, { showRating: true, showPrice: true })
    ).join('')
  }

  const initialCount = isMobile() ? 2 : otherBooks.length
  renderList(initialCount)

  if (isMobile() && otherBooks.length > 2) {
    const moreBtn = document.createElement('button')
    moreBtn.className = 'btn btn--outline btn--full'
    moreBtn.style.marginTop = '16px'
    moreBtn.textContent = `더보기 (${otherBooks.length - 4}권 더)`
    moreBtn.onclick = () => {
      renderList(otherBooks.length)
      moreBtn.remove()
    }
    const sliderWrap = moreEl.querySelector('.book-slider-wrap')
    listEl.insertAdjacentElement('afterend', moreBtn)
  }
}

async function renderPreview(bookId) {
  const previewEl = document.getElementById('bookPreview')
  if (!previewEl) return

  const { data: contents } = await supabase
    .from('book_contents')
    .select('content, chapter_title, part_title')
    .eq('book_id', bookId)
    .order('order_index')
    .limit(1)  // 첫 챕터만

  if (!contents?.length || !contents[0].content) return

  const text = contents[0].content
  // HTML 태그 제거하고 텍스트만
  const plain = text.replace(/<[^>]*>/g, '').trim()
  if (!plain) return

  previewEl.style.display = 'block'
  document.getElementById('previewContent').innerHTML = `
    <p style="font-size:12px;color:#888;margin-bottom:12px">${contents[0].part_title} · ${contents[0].chapter_title}</p>
    <div style="position:relative;overflow:hidden;max-height:280px;">
      <div style="font-size:14px;line-height:1.9;color:#333;white-space:pre-line">${plain}</div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:100px;background:linear-gradient(transparent,#fff)"></div>
    </div>
    <div style="text-align:center;margin-top:16px;font-size:13px;color:#888">
      🔒 전체 내용은 구매 후 읽을 수 있어요
    </div>`
}