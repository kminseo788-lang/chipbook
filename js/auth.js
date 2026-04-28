// chipbook/js/auth.js
import { supabase } from './supabase.js'

// ─── 회원가입 ───
async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  })
  if (error) throw error
  return data
}

// ─── 로그인 ───
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

// ─── 로그아웃 ───
async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  window.location.href = 'index.html'
}

// ─── 현재 로그인 유저 가져오기 ───
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ─── 로그인 상태 확인 ───
async function isLoggedIn() {
  const user = await getCurrentUser()
  return !!user
}

export { signUp, signIn, signOut, getCurrentUser, isLoggedIn }
