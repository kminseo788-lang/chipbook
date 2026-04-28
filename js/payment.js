/**
 * chipbook payment.js
 * Supabase 연동 버전
 * 
 * 결제 흐름:
 * requestPayment() → PortOne 결제창 (추후 연동)
 * → verifyPayment() → 서버 검증 (추후)
 * → grantBookAccess() → Supabase library_books INSERT
 */

import { supabase } from './supabase.js'
import { getCurrentUser, isPurchased, formatPrice } from './common.js'

document.addEventListener('DOMContentLoaded', async () => {
  const bookId = new URLSearchParams(window.location.search).get('book_id')
  if (!bookId) { window.location.href = 'index.html'; return }

  // 도서 정보 조회
  const { data: book } = await supabase
    .from('books')
    .select('*, authors(pen_name)')
    .eq('id', bookId)
    .single()

  if (!book) { window.location.href = 'index.html'; return }

  // 무료 도서면 뷰어로
  if (book.is_free) {
    alert('무료 도서는 바로 읽을 수 있어요!')
    window.location.href = `viewer.html?book_id=${bookId}`
    return
  }

  // 이미 구매했으면 뷰어로
  const purchased = await isPurchased(bookId)
  if (purchased) {
    alert('이미 구매한 도서예요.')
    window.location.href = `viewer.html?book_id=${bookId}`
    return
  }

  renderProduct(book)
  document.title = `${book.title} 결제 — chipbook`
})

function renderProduct(book) {
  const el = document.getElementById('paymentProduct')
  if (!el) return
  const authorName = book.authors?.pen_name || ''
  el.innerHTML = `
    <div class="payment-product__cover" style="background:${book.cover_color};color:${book.cover_text_color}">${book.title}</div>
    <div class="payment-product__info">
      <span class="payment-product__badge">전자책</span>
      <p class="payment-product__title">${book.title}</p>
      <p class="payment-product__author">작가 · ${authorName}</p>
      <p class="payment-product__desc">${book.description || ''}</p>
    </div>
    <p class="payment-product__price">${formatPrice(book.price)}</p>`

  const btn = document.getElementById('payBtn')
  if (btn) btn.textContent = `🔒 ${formatPrice(book.price)} 결제하기`
}

// 전체 동의
window.toggleAll = function(masterCb) {
  document.querySelectorAll('.term-check').forEach(cb => cb.checked = masterCb.checked)
  updatePayBtn()
}

window.checkAllState = function() {
  const checks = document.querySelectorAll('.term-check')
  const allChecked = [...checks].every(cb => cb.checked)
  const agreeAll = document.getElementById('agreeAll')
  if (agreeAll) agreeAll.checked = allChecked
  updatePayBtn()
}

function updatePayBtn() {
  const checks = document.querySelectorAll('.term-check')
  const allChecked = [...checks].every(cb => cb.checked)
  const btn = document.getElementById('payBtn')
  if (btn) btn.disabled = !allChecked
}

// ─── 결제 요청 ───
// 나중에 PortOne SDK 연동 시 이 함수 수정
window.requestPayment = async function() {
  const bookId = new URLSearchParams(window.location.search).get('book_id')
  const { data: book } = await supabase.from('books').select('*').eq('id', bookId).single()
  if (!book) return

  const confirmed = confirm(`${formatPrice(book.price)} 결제를 진행합니다.\n(현재 테스트 모드)`)
  if (!confirmed) return

  // TODO: PortOne 연동 시 아래 주석 해제
  // IMP.request_pay({...}, async function(rsp) {
  //   if (rsp.success) await verifyPayment(rsp.imp_uid, rsp.merchant_uid)
  //   else alert('결제 실패: ' + rsp.error_msg)
  // })

  // 테스트 결제 처리
  await verifyPaymentMock(bookId, book.price)
}

// 결제 검증 mock → 나중에 서버 API 호출로 교체
async function verifyPaymentMock(bookId, amount) {
  await grantBookAccess(bookId, amount)
}

// 구매 권한 부여 → Supabase library_books INSERT
async function grantBookAccess(bookId, amount) {
  const user = await getCurrentUser()
  if (!user) {
    alert('로그인이 필요합니다.')
    window.location.href = 'login.html'
    return
  }

  // library_books 테이블에 구매 기록 저장
  const { error: libError } = await supabase
    .from('library_books')
    .insert({
      user_id: user.id,
      book_id: bookId,
      access_type: 'purchased'
    })

  // payments 테이블에 결제 기록 저장
  await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      book_id: bookId,
      amount: amount,
      order_id: `order_${Date.now()}`,
      payment_status: 'completed',
      paid_at: new Date().toISOString()
    })

  if (libError) {
    alert('오류가 발생했습니다: ' + libError.message)
    return
  }

  alert('결제가 완료되었습니다! 도서를 읽을 수 있습니다.')
  window.location.href = `viewer.html?book_id=${bookId}`
}
