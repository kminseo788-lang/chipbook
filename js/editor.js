/**
 * chipbook editor.js
 * Supabase 연동 버전
 */

import { supabase } from './supabase.js'
import { getCurrentUser } from './common.js'

window.parts = []
window.currentChapterKey = null
window.chapterContents = {}

let currentStep = 1
let selectedTags = []
let autoSaveTimer = null
let bookId = null
let authorId = null
let coverFile = null
let bookData = {
  title: '', description: '', oneLine: '',
  type: 'paid', price: '',
  coverColor: '#E8F5E9', coverTextColor: '#1B5E3A', coverUrl: ''
}

const tagData = [
  { icon: '📖', name: '장르', limit: 1, tags: ['문학', '비문학'] },
  { icon: '📁', name: '분야', limit: 2, tags: ['살림', '육아', '건강', '인간관계', '자기계발', '재테크', '시간관리', '정리정돈', '심리', '시', '소설', '에세이', '기타'] },
  { icon: '👥', name: '대상', limit: 2, tags: ['1인가구', '신혼부부', '직장인', '주부', '초보부모', '학생', '시니어', '기타'] },
  { icon: '🎨', name: '성향', limit: 2, tags: ['꼼꼼한편', '귀찮은게싫다', '빠르게실천', '천천히깊게', '시각적으로보고싶다', '기타'] },
]
const writingTips = [
  '구체적인 경험과 감정을 담아 작성하면 독자에게 더 큰 공감을 줄 수 있어요.',
  '짧고 명확한 문장이 독자의 이해를 높입니다.',
  '"나는 ~했다"처럼 1인칭 경험을 담으면 진정성이 높아져요.',
  '실제 숫자나 기간을 활용하면 더 신뢰감 있는 내용이 됩니다.',
]

// ─── 초기화 ───
document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser()
  if (!user) {
    alert('로그인이 필요합니다.')
    window.location.href = 'login.html'
    return
  }

  await ensureAuthorProfile(user)

  const editBookId = new URLSearchParams(window.location.search).get('book_id')
  if (editBookId) {
    await loadExistingBook(editBookId)
  } else {
    initDefaultParts()
  }

  renderTagCategories()
  startAutoSave()
  goToStep(1)
})

// ─── 작가 프로필 확인/생성 ───
async function ensureAuthorProfile(user) {
  const { data: author } = await supabase
    .from('authors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (author) {
    authorId = author.id
    return
  }

  const { data: newAuthor } = await supabase
    .from('authors')
    .insert({ user_id: user.id, pen_name: user.email.split('@')[0] })
    .select('id')
    .single()

  if (newAuthor) authorId = newAuthor.id
}

// ─── 기존 도서 불러오기 ───
async function loadExistingBook(id) {
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()

  if (!book) return
  bookId = book.id

  document.getElementById('bookTitle').value = book.title || ''
  document.getElementById('bookDesc').value = book.description || ''
  document.getElementById('bookOneLine').value = book.subtitle || ''
  document.getElementById('bookPrice').value = book.price || ''
  bookData.title = book.title
bookData.type = book.is_welcome ? 'welcome' : (book.is_free ? 'free' : 'paid')

// 라디오 버튼 UI 동기화
const radios = document.querySelectorAll('input[name="bookType"]')
radios.forEach(r => { r.checked = r.value === bookData.type })

// 가격 필드 표시/숨김
const pf = document.getElementById('priceField')
if (pf) pf.style.display = bookData.type === 'paid' || bookData.type === 'welcome' ? 'block' : 'none'
  bookData.coverColor = book.cover_color || '#E8F5E9'
  bookData.coverTextColor = book.cover_text_color || '#1B5E3A'

  if (book.cover_url) {
  const preview = document.getElementById('coverPreview')
  const placeholder = document.getElementById('coverPlaceholder')
  if (preview) { preview.src = book.cover_url; preview.style.display = 'block' }
  if (placeholder) placeholder.style.display = 'none'
  bookData.coverUrl = book.cover_url
}

  document.getElementById('titleCount').textContent = (book.title || '').length
  document.getElementById('descCount').textContent = (book.description || '').length
  document.getElementById('oneLineCount').textContent = (book.subtitle || '').length

  const { data: contents } = await supabase
    .from('book_contents')
    .select('*')
    .eq('book_id', id)
    .order('order_index')

  if (contents?.length) {
    const partsMap = {}
    contents.forEach(c => {
      const key = c.part_title
      if (!partsMap[key]) partsMap[key] = { title: key, chapters: [] }
      partsMap[key].chapters.push(c.chapter_title || '')
      const pIdx = Object.keys(partsMap).indexOf(key)
      window.chapterContents[`${pIdx}-${partsMap[key].chapters.length - 1}`] = c.content || ''
    })
    window.parts = Object.values(partsMap)
    renderParts()
  }
}

// ─── 스텝 이동 ───
window.goToStep = function(step) {
  document.querySelectorAll('.editor-section').forEach(s => s.style.display = 'none')
  const target = document.getElementById(`step${step}`)
  if (target) target.style.display = 'block'

  document.querySelectorAll('.step-item').forEach(item => {
    const s = parseInt(item.dataset.step)
    item.classList.toggle('active', s === step)
    item.querySelector('.step-num')?.classList.toggle('active', s === step)
  })

  currentStep = step

  if (step === 4) renderTocList()
  if (step === 5) renderPublishChecklist()
}

// ─── 글자수 카운트 ───
window.updateCount = function(el, countId, max) {
  document.getElementById(countId).textContent = el.value.length
  if (countId === 'titleCount') bookData.title = el.value
}

// ─── 가격 토글 ───
window.togglePrice = function(type) {
  bookData.type = type
  const pf = document.getElementById('priceField')
  if (pf) pf.style.display = type === 'free' ? 'none' : 'block'
}

// ─── 표지 미리보기 ───
window.previewCover = function(input) {
  const file = input.files[0]
  if (!file) return
  coverFile = file
  const reader = new FileReader()
  reader.onload = e => {
    const preview = document.getElementById('coverPreview')
    const placeholder = document.getElementById('coverPlaceholder')
    if (preview) { preview.src = e.target.result; preview.style.display = 'block' }
    if (placeholder) placeholder.style.display = 'none'
    bookData.coverUrl = e.target.result
  }
  reader.readAsDataURL(file)
}

// ─── 태그 렌더링 ───
function renderTagCategories() {
  const container = document.getElementById('tagCategories')
  if (!container) return

  container.innerHTML = tagData.map((cat, ci) => `
    <div class="tag-category">
      <div class="tag-category__header">
        <span>${cat.icon} ${cat.name}</span>
        <span class="tag-category__limit">최대 ${cat.limit}개</span>
      </div>
      <div class="tag-list">
        ${cat.tags.map(tag => `
          <button class="tag-btn" onclick="toggleTag(${ci}, '${tag}', ${cat.limit})">${tag}</button>
        `).join('')}
      </div>
    </div>
  `).join('')
}

window.toggleTag = function(catIdx, tag, limit) {
  const catName = tagData[catIdx].name
  const existing = selectedTags.filter(t => t.cat === catName)
  const found = selectedTags.findIndex(t => t.cat === catName && t.tag === tag)

  if (found >= 0) {
    selectedTags.splice(found, 1)
  } else {
    if (existing.length >= limit) { alert(`${catName} 카테고리는 최대 ${limit}개까지 선택 가능합니다.`); return }
    if (selectedTags.length >= 10) { alert('태그는 최대 10개까지 선택 가능합니다.'); return }
    selectedTags.push({ cat: catName, tag })
  }

  renderTagCategories()
  selectedTags.forEach(t => {
    const btns = document.querySelectorAll('.tag-btn')
    btns.forEach(btn => { if (btn.textContent === t.tag) btn.classList.add('active') })
  })

  document.getElementById('selectedTagCount').textContent = `선택된 태그 (${selectedTags.length}/10)`
  const summary = document.getElementById('selectedTagSummary')
  if (summary) {
    summary.innerHTML = selectedTags.length
      ? selectedTags.map(t => `<span class="tag-btn active">${t.tag}</span>`).join('')
      : '<span style="font-size:13px;color:var(--color-text-light)">태그를 선택해주세요</span>'
  }
}

// ─── 기본 파트 초기화 ───
function initDefaultParts() {
  window.parts = [
    { title: 'PART 1', chapters: ['소제목을 입력해주세요'] }
  ]
  renderParts()
}

// ─── 파트 렌더링 ───
function renderParts() {
  const list = document.getElementById('partsList')
  if (!list) return

  list.innerHTML = window.parts.map((part, pi) => `
    <div class="part-item" id="part-${pi}">
      <div class="part-item__header">
        <input type="text" class="input part-item__title" value="${part.title}"
          onchange="window.parts[${pi}].title = this.value" placeholder="파트 제목">
        <button class="btn btn--outline-gray btn--sm" onclick="insertPartAbove(${pi})">위에 추가</button>
<button class="btn btn--outline-gray btn--sm" onclick="deletePart(${pi})">삭제</button>
      </div>
      <div class="chapters-list" id="chapters-${pi}">
        ${part.chapters.map((ch, ci) => `
          <div class="chapter-item">
            <span class="chapter-item__num">${ci + 1}</span>
            <input type="text" class="input chapter-item__input" value="${ch}"
              onchange="window.parts[${pi}].chapters[${ci}] = this.value" placeholder="소제목 입력">
            <button class="chapter-item__del" onclick="deleteChapter(${pi}, ${ci})">✕</button>
          </div>
        `).join('')}
      </div>
      <button class="add-chapter-btn" onclick="addChapter(${pi})">+ 소제목 추가</button>
    </div>
  `).join('')
}

window.addPart = function() {
  window.parts.push({ title: `PART ${window.parts.length + 1}`, chapters: [''] })
  renderParts()
}

window.deletePart = function(pi) {
  if (window.parts.length <= 1) { alert('최소 1개의 파트가 필요합니다.'); return }
  window.parts.splice(pi, 1)
  renderParts()
}

window.addChapter = function(pi) {
  window.parts[pi].chapters.push('')
  renderParts()
}

window.deleteChapter = function(pi, ci) {

  window.parts[pi].chapters.splice(ci, 1)
  renderParts()
}

window.saveParts = function() {
  const allFilled = window.parts.every(p => p.title)
  if (!allFilled) { alert('파트 제목을 입력해주세요.'); return }
  alert('파트 구성이 저장되었습니다.')
  goToStep(4)
}

// ─── 목차 리스트 렌더링 (STEP 4) ───
function renderTocList() {
  const tocList = document.getElementById('tocList')
  if (!tocList) return

  tocList.innerHTML = window.parts.map((part, pi) => `
    <div class="toc-part">
      <div class="toc-part__title">${part.title}</div>
      ${part.chapters.map((ch, ci) => `
        <div class="toc-chapter-item ${window.currentChapterKey === `${pi}-${ci}` ? 'active' : ''}"
          onclick="selectChapter(${pi}, ${ci})">
          <span>${ci + 1}. ${ch || '(소제목 없음)'}</span>
          <span class="toc-chapter-item__len">${(window.chapterContents[`${pi}-${ci}`] || '').replace(/<[^>]*>/g, '').length}자</span>
        </div>
      `).join('')}
    </div>
  `).join('')
}

window.selectChapter = function(pi, ci) {
  saveCurrentChapter()
  window.currentChapterKey = `${pi}-${ci}`
  const part = window.parts[pi]
  const ch = part?.chapters[ci] || ''

  document.getElementById('editorBreadcrumb').textContent = part?.title || ''
  document.getElementById('editorChapterTitle').textContent = ch
  document.getElementById('editorContentArea').innerHTML = window.chapterContents[`${pi}-${ci}`] || ''
  updateEditorCharCount()

  const tipIdx = Math.floor(Math.random() * writingTips.length)
  document.getElementById('writingTip').textContent = writingTips[tipIdx]

  renderTocList()
}

function saveCurrentChapter() {
  if (!window.currentChapterKey) return
  const area = document.getElementById('editorContentArea')
  if (area) window.chapterContents[window.currentChapterKey] = area.innerHTML
}

window.filterToc = function(query) {
  const items = document.querySelectorAll('.toc-chapter-item')
  items.forEach(item => {
    item.style.display = item.textContent.includes(query) ? '' : 'none'
  })
}

// ─── 에디터 툴바 ───
window.execFormat = function(cmd, value) {
  document.getElementById('editorContentArea')?.focus()
  document.execCommand(cmd, false, value || null)
}

window.insertBlockquote = function() {
  document.execCommand('formatBlock', false, 'blockquote')
}

window.insertImage = function() {
  const url = prompt('이미지 URL을 입력하세요:')
  if (url) document.execCommand('insertImage', false, url)
}

window.insertLink = function() {
  const url = prompt('링크 URL을 입력하세요:')
  if (url) document.execCommand('createLink', false, url)
}

window.onEditorInput = function() {
  updateEditorCharCount()
  triggerAutoSave()
}

window.handleEditorKeydown = function(e) {
  if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    ') }
}

function updateEditorCharCount() {
  const area = document.getElementById('editorContentArea')
  const count = area ? area.innerText.replace(/\n/g, '').length : 0
  const el = document.getElementById('editorCharCount')
  if (el) el.textContent = count
}

// ─── 발행 체크리스트 ───
function renderPublishChecklist() {
  const checks = [
    { icon: '📝', text: '책 제목', status: bookData.title ? 'ok' : 'err', statusText: bookData.title ? '완료' : '필요' },
    { icon: '📄', text: '한 줄 소개', status: bookData.oneLine ? 'ok' : 'warn', statusText: bookData.oneLine ? '완료' : '권장' },
    { icon: '🗂', text: '파트 구성', status: window.parts.length > 0 ? 'ok' : 'err', statusText: `${window.parts.length}개 파트` },
    { icon: '✍️', text: '내용 작성', status: Object.keys(window.chapterContents).length > 0 ? 'ok' : 'warn', statusText: `${Object.keys(window.chapterContents).length}개 챕터 작성됨` },
    { icon: '🏷', text: '태그', status: selectedTags.length > 0 ? 'ok' : 'warn', statusText: selectedTags.length > 0 ? `${selectedTags.length}개 선택됨` : '권장' },
  ]

  const cl = document.getElementById('publishChecklist')
  if (cl) cl.innerHTML = checks.map(c => `
    <div class="publish-check-item">
      <span class="publish-check-icon">${c.icon}</span>
      <span class="publish-check-text">${c.text}</span>
      <span class="publish-check-status ${c.status}">${c.statusText}</span>
    </div>`).join('')

  const preview = document.getElementById('publishPreview')
  if (preview) preview.innerHTML = `
    <div class="publish-preview__cover" style="background:${bookData.coverColor};color:${bookData.coverTextColor}">
      ${bookData.title || '(제목 없음)'}
    </div>
    <div class="publish-preview__info">
      <h3>${bookData.title || '(제목을 입력해주세요)'}</h3>
      <p>${bookData.oneLine || '(한 줄 소개를 입력해주세요)'}</p>
      <p style="margin-top:8px;font-size:14px;font-weight:600;color:var(--color-primary)">
        ${bookData.type === 'free' ? '무료' : (bookData.price ? parseInt(bookData.price).toLocaleString() + '원' : '가격 미설정')}
      </p>
      <p style="margin-top:8px;font-size:13px">태그: ${selectedTags.map(t => t.tag).join(', ') || '없음'}</p>
    </div>`
}

// ─── 임시저장 / 자동저장 ───
window.saveDraft = function() {
  saveCurrentChapter()
  bookData.title = document.getElementById('bookTitle')?.value || ''
  showAutoSave()
  alert('임시저장되었습니다.')
}

function triggerAutoSave() {
  clearTimeout(autoSaveTimer)
  const el = document.getElementById('saveStatusText')
  if (el) el.textContent = '저장 중...'
  autoSaveTimer = setTimeout(() => { showAutoSave() }, 1500)
}

function showAutoSave() {
  const now = new Date()
  const time = now.toTimeString().slice(0, 8)
  const el = document.getElementById('saveStatusText')
  const timeEl = document.getElementById('autosaveTime')
  if (el) el.textContent = '자동저장됨'
  if (timeEl) timeEl.textContent = `마지막 저장: ${time}`
}

function startAutoSave() {
  setInterval(() => { triggerAutoSave() }, 30000)
}

// ─── 발행 ───
window.publishBook = async function() {
  saveCurrentChapter()
  const title = document.getElementById('bookTitle')?.value || bookData.title
  if (!title) {
    alert('책 제목을 입력해주세요.')
    goToStep(1)
    return
  }

  const confirmed = confirm('도서를 발행하시겠습니까?\n발행 후에도 수정이 가능합니다.')
  if (!confirmed) return

  try {
 const bookPayload = {
  author_id: authorId,
  title,
  description: document.getElementById('bookDesc')?.value || '',
  subtitle: document.getElementById('bookOneLine')?.value || '',
  price: bookData.type === 'free' ? 0 : parseInt(document.getElementById('bookPrice')?.value || 0),
  is_free: bookData.type === 'free' || bookData.type === 'welcome',
  is_welcome: bookData.type === 'welcome',
  cover_color: bookData.coverColor,
  cover_text_color: bookData.coverTextColor,
  cover_url: bookData.coverUrl || '',
  status: 'published',
  tags: selectedTags.map(t => t.tag),
}
    let savedBookId = bookId
    if (bookId) {
      await supabase.from('books').update(bookPayload).eq('id', bookId)
    } else {
      const { data } = await supabase.from('books').insert(bookPayload).select('id').single()
      savedBookId = data?.id
    }

    if (savedBookId) {
      await supabase.from('book_contents').delete().eq('book_id', savedBookId)
      const contentRows = []
      let orderIdx = 0
      window.parts.forEach(part => {
        part.chapters.forEach((ch, ci) => {
          const key = `${window.parts.indexOf(part)}-${ci}`
          contentRows.push({
            book_id: savedBookId,
            part_title: part.title,
            chapter_title: ch,
            content: window.chapterContents[key] || '',
            order_index: orderIdx++,
          })
        })
      })
      if (contentRows.length) await supabase.from('book_contents').insert(contentRows)
    }

    alert('🎉 도서가 발행되었습니다!')
    window.location.href = 'mypage.html?mode=author'
  } catch (err) {
    alert('발행 중 오류가 발생했습니다.')
    console.error(err)
  }
}

window.openPreview = function() {
  alert('미리보기 기능은 준비 중입니다.')
}

window.showExampleToc = function() {
  const modal = document.getElementById('exampleModal')
  if (modal) modal.style.display = 'flex'
}

window.closeExampleModal = function() {
  const modal = document.getElementById('exampleModal')
  if (modal) modal.style.display = 'none'
}


window.changeFontColor = function(color) {
  document.getElementById('editorContentArea')?.focus()
  document.execCommand('foreColor', false, color)
}

window.uploadAndInsertImage = async function(input) {
  const file = input.files[0]
  if (!file) return

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `book-images/${fileName}`

  const { error } = await supabase.storage
    .from('chipbook')
    .upload(filePath, file)

  if (error) { alert('이미지 업로드 실패'); console.error(error); return }

  const { data } = supabase.storage
    .from('chipbook')
    .getPublicUrl(filePath)

  document.getElementById('editorContentArea')?.focus()
  document.execCommand('insertImage', false, data.publicUrl)
  input.value = ''
}

window.insertPartAbove = function(pi) {
  window.parts.splice(pi, 0, { title: `PART ${pi + 1}`, chapters: [''] })
  renderParts()
}