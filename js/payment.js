/**
 * chipbook payment.js
 * Supabase + PortOne(아임포트) KCP 연동 버전
 */

import { supabase } from './supabase.js'
import { getCurrentUser, isPurchased, formatPrice, createCoverHTML } from './common.js'

// PortOne SDK 로드
const IMP_UID = 'store-5953daa0-ff3c-49cc-ab90-529761466261' // 포트원 가맹점 식별코드

document.addEventListener('DOMContentLoaded', async () => {
  // PortOne SDK 동적 로드
  if (!window.IMP) {
    const script = document.createElement('script')
    script.src = 'https://cdn.iamport.kr/v1/iamport.js'
    document.head.appendChild(script)
    await new Promise(resolve => script.onload = resolve)
  }
  window.IMP.init(IMP_UID)

  const bookId = new URLSearchParams(window.location.search).get('book_id')
  if (!bookId) { window.location.href = 'index.html'; return }

  const { data: book } = await supabase
    .from('books')
    .select('*, authors(pen_name)')
    .eq('id', bookId)
    .single()

  if (!book) { window.location.href = 'index.html'; return }

  if (book.is_free) {
    alert('무료 도서는 바로 읽을 수 있어요!')
    window.location.href = `viewer.html?book_id=${bookId}`
    return
  }

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
    <div class="payment-product__cover" style="overflow:hidden;position:relative;">${createCoverHTML(book)}</div>
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
window.requestPayment = async function() {
  const user = await getCurrentUser()
  if (!user) {
    alert('로그인이 필요합니다.')
    window.location.href = 'login.html'
    return
  }

  const bookId = new URLSearchParams(window.location.search).get('book_id')
  const { data: book } = await supabase
    .from('books')
    .select('*, authors(pen_name)')
    .eq('id', bookId)
    .single()

  if (!book) return

  const orderId = `chipbook_${Date.now()}`

  window.IMP.request_pay({
    pg: 'kcp.AO09C',
    pay_method: 'card',
    merchant_uid: orderId,
    name: book.title,
    amount: book.price,
    buyer_email: user.email,
    buyer_name: user.email,
  }, async function(rsp) {
    if (rsp.success) {
      // 결제 성공
      await grantBookAccess(bookId, book.price, orderId, rsp.imp_uid)
    } else {
      alert('결제에 실패했습니다.\n' + rsp.error_msg)
    }
  })
}

// 구매 권한 부여
async function grantBookAccess(bookId, amount, orderId, impUid) {
  const user = await getCurrentUser()

  const { error: libError } = await supabase
    .from('library_books')
    .insert({
      user_id: user.id,
      book_id: bookId,
      access_type: 'purchased'
    })

  await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      book_id: bookId,
      amount: amount,
      order_id: orderId,
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