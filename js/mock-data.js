/**
 * chipbook mock-data.js
 * 실제 Supabase 연결 전 샘플 데이터
 * 나중에 Supabase 쿼리로 교체 시 이 파일만 수정하면 됩니다
 */

// ─────────────────────────────────────────
// 현재 로그인 사용자 (mock)
// ─────────────────────────────────────────
const currentUser = {
  id: 'user001',
  email: 'soyeon@email.com',
  name: '김소연',
  role: 'user',
  is_author: true,       // true: 작가 모드 탭 표시 / false: 독자 모드만
  is_logged_in: true,
  profile_image: null,
  purchased_book_ids: ['book001', 'book003', 'book007'], // 구매한 도서 IDs
  wishlist_ids: ['book002', 'book004', 'book006', 'book008', 'book010', 'book011', 'book012', 'book013'],
};

// ─────────────────────────────────────────
// 작가 데이터
// ─────────────────────────────────────────
const authors = [
  {
    id: 'author001',
    user_id: 'user001',
    pen_name: '김소연',
    intro: '시간관리 컨설턴트로 10년 이상 다양한 사람들의 시간 고민을 해결해왔습니다. 수많은 시행착오 끝에 얻은 시간관리 노하우를 더 많은 사람들과 나누고 있습니다.',
    profile_image: null,
    slug: 'kim-soyeon',
    stats: { books: 12, followers: 3420, total_sales: 1248 }
  },
  {
    id: 'author002',
    user_id: 'user002',
    pen_name: '김집복',
    intro: '일상의 작은 습관으로 삶을 바꾸는 방법을 연구합니다.',
    profile_image: null,
    slug: 'kim-jipbok',
    stats: { books: 8, followers: 2100, total_sales: 856 }
  },
  {
    id: 'author003',
    user_id: 'user003',
    pen_name: '이소연',
    intro: '관계와 대화에 대해 씁니다.',
    profile_image: null,
    slug: 'lee-soyeon',
    stats: { books: 5, followers: 1500, total_sales: 420 }
  },
];

// ─────────────────────────────────────────
// 도서 데이터
// ─────────────────────────────────────────
const books = [
  {
    id: 'book001',
    author_id: 'author002',
    author_name: '김집복',
    title: '시간 관리의 기술',
    subtitle: '하루 24시간을 2배로 쓰는 법',
    description: '바쁜 하루 속에서 시간과 돈을 동시에 낭비하는 습관을 정리하고, 일상에 여유를 만드는 실전 시간관리 방법을 알려드립니다.',
    cover_color: '#E8F5E9',
    cover_text_color: '#1B5E3A',
    price: 9900,
    is_free: true,
    status: 'published',
    category: '시간관리',
    tags: ['시간관리', '자기계발', '습관'],
    rating: 4.8,
    review_count: 127,
    like_count: 1200,
    view_count: 12400,
    purchase_count: 1248,
    created_at: '2025-01-15',
    pages: 187,
    format: '전자책(ePub)',
  },
  {
    id: 'book002',
    author_id: 'author002',
    author_name: '김집복',
    title: '돈이 모이는 작은 습관',
    subtitle: '티끌 모아 여유 만들기',
    description: '불필요한 것을 줄이고 진짜 중요한 것에 집중하는 삶의 기술.',
    cover_color: '#FFF8E1',
    cover_text_color: '#F57F17',
    price: 9900,
    is_free: true,
    status: 'published',
    category: '재테크',
    tags: ['재테크', '절약', '습관'],
    rating: 4.7,
    review_count: 96,
    like_count: 982,
    view_count: 8700,
    purchase_count: 856,
    created_at: '2025-02-01',
    pages: 142,
    format: '전자책(ePub)',
  },
  {
    id: 'book003',
    author_id: 'author002',
    author_name: '김집복',
    title: '미니멀 라이프 시작하기',
    subtitle: '비우면 삶이 가벼워진다',
    description: '가진 것을 줄이면 진짜 원하는 것이 보입니다.',
    cover_color: '#F3E5F5',
    cover_text_color: '#7B1FA2',
    price: 9900,
    is_free: true,
    status: 'published',
    category: '라이프스타일',
    tags: ['미니멀라이프', '정리정돈', '라이프스타일'],
    rating: 4.9,
    review_count: 203,
    like_count: 1100,
    view_count: 9300,
    purchase_count: 934,
    created_at: '2025-02-10',
    pages: 165,
    format: '전자책(ePub)',
  },
  {
    id: 'book004',
    author_id: 'author002',
    author_name: '김집복',
    title: '아이와 하루 10분 대화법',
    subtitle: '관계를 바꾸는 작은 시간',
    description: '아이와 부모가 함께 행복해지는 일상 루틴의 힘.',
    cover_color: '#E3F2FD',
    cover_text_color: '#1565C0',
    price: 9900,
    is_free: true,
    status: 'published',
    category: '육아',
    tags: ['육아', '관계', '대화법'],
    rating: 4.6,
    review_count: 87,
    like_count: 875,
    view_count: 6400,
    purchase_count: 621,
    created_at: '2025-02-20',
    pages: 128,
    format: '전자책(ePub)',
  },
  {
    id: 'book005',
    author_id: 'author002',
    author_name: '김집복',
    title: '작은 하루 습관',
    subtitle: '매일 1%의 변화가 만드는 기적',
    description: '작은 습관이 모여 큰 변화를 만들어냅니다.',
    cover_color: '#E8F5E9',
    cover_text_color: '#2E7D32',
    price: 9900,
    is_free: true,
    status: 'published',
    category: '자기계발',
    tags: ['습관', '자기계발', '루틴'],
    rating: 4.7,
    review_count: 112,
    like_count: 1500,
    view_count: 14200,
    purchase_count: 1123,
    created_at: '2025-03-01',
    pages: 156,
    format: '전자책(ePub)',
  },
  {
    id: 'book006',
    author_id: 'author003',
    author_name: '이소연',
    title: '관계의 말투',
    subtitle: '상처 주지 않고 마음을 이는 대화법',
    description: '관계를 살리는 말과 관계를 죽이는 말의 차이.',
    cover_color: '#FCE4EC',
    cover_text_color: '#C62828',
    price: 9900,
    is_free: false,
    status: 'published',
    category: '관계',
    tags: ['관계', '대화법', '인간관계'],
    rating: 4.8,
    review_count: 128,
    like_count: 2100,
    view_count: 18500,
    purchase_count: 1502,
    created_at: '2025-01-20',
    pages: 198,
    format: '전자책(ePub)',
  },
  {
    id: 'book007',
    author_id: 'author001',
    author_name: '김소연',
    title: '불안한 마음 정리법',
    subtitle: '걱정을 멈추고 나답게 사는 법',
    description: '마음속 불안을 다스리고 평온을 찾는 방법.',
    cover_color: '#E3F2FD',
    cover_text_color: '#0D47A1',
    price: 9900,
    is_free: false,
    status: 'published',
    category: '자기계발',
    tags: ['자기계발', '마음', '정신건강'],
    rating: 4.7,
    review_count: 96,
    like_count: 1800,
    view_count: 15200,
    purchase_count: 1234,
    created_at: '2025-02-05',
    pages: 174,
    format: '전자책(ePub)',
  },
  {
    id: 'book008',
    author_id: 'author001',
    author_name: '김소연',
    title: '아침 루틴의 기적',
    subtitle: '하루를 바꾸는 30분의 힘',
    description: '성공한 사람들이 공통적으로 가진 아침 습관의 비밀.',
    cover_color: '#FFF3E0',
    cover_text_color: '#E65100',
    price: 9900,
    is_free: false,
    status: 'published',
    category: '자기계발',
    tags: ['루틴', '아침', '자기계발'],
    rating: 4.9,
    review_count: 203,
    like_count: 2400,
    view_count: 21000,
    purchase_count: 1876,
    created_at: '2025-02-15',
    pages: 162,
    format: '전자책(ePub)',
  },
  {
    id: 'book009',
    author_id: 'author001',
    author_name: '김소연',
    title: '퇴근 후 1시간의 힘',
    subtitle: '평범한 직장인의 성장 습관',
    description: '퇴근 후 단 1시간으로 인생을 바꾸는 방법.',
    cover_color: '#FFF8E1',
    cover_text_color: '#FF8F00',
    price: 9900,
    is_free: false,
    status: 'published',
    category: '자기계발',
    tags: ['자기계발', '직장인', '성장'],
    rating: 4.6,
    review_count: 87,
    like_count: 1600,
    view_count: 13800,
    purchase_count: 1089,
    created_at: '2025-03-01',
    pages: 145,
    format: '전자책(ePub)',
  },
  {
    id: 'book010',
    author_id: 'author001',
    author_name: '김소연',
    title: '정리 습관의 힘',
    subtitle: '물건, 시간, 마음을 정리하는 기술',
    description: '정리 습관이 되면 집안일이 줄고 마음의 여유가 생깁니다.',
    cover_color: '#E8EAF6',
    cover_text_color: '#283593',
    price: 9900,
    is_free: false,
    status: 'published',
    category: '라이프스타일',
    tags: ['정리정돈', '라이프스타일', '습관'],
    rating: 4.7,
    review_count: 112,
    like_count: 1900,
    view_count: 16700,
    purchase_count: 1345,
    created_at: '2025-03-10',
    pages: 189,
    format: '전자책(ePub)',
  },
  {
    id: 'book011',
    author_id: 'author001',
    author_name: '김소연',
    title: '시간은 없고 해야 할 일은 산더미라면',
    subtitle: '하루 30분, 삶의 여유를 찾아주는 시간관리의 기술',
    description: '바쁜 하루 속에서 시간과 돈을 동시에 낭비하는 습관을 정리하고, 일상에 여유를 만드는 실전 시간관리 방법을 알려드립니다.',
    cover_color: '#E8F5E9',
    cover_text_color: '#1B5E3A',
    price: 12900,
    is_free: false,
    status: 'published',
    category: '시간관리',
    tags: ['시간관리', '자기계발'],
    rating: 4.8,
    review_count: 127,
    like_count: 2300,
    view_count: 19500,
    purchase_count: 1248,
    created_at: '2025-04-20',
    pages: 187,
    format: '전자책(ePub)',
  },
  {
    id: 'book012',
    author_id: 'author001',
    author_name: '김소연',
    title: '돈이 모이는 미니멀 라이프 습관',
    subtitle: '티끌 모아 여유 만들기',
    description: '불필요한 것을 줄이고 진짜 중요한 것에 집중하는 삶의 기술.',
    cover_color: '#FFF8E1',
    cover_text_color: '#FF6F00',
    price: 9900,
    is_free: false,
    status: 'published',
    category: '재테크',
    tags: ['재테크', '미니멀라이프'],
    rating: 4.7,
    review_count: 89,
    like_count: 1400,
    view_count: 11200,
    purchase_count: 892,
    created_at: '2024-03-10',
    pages: 155,
    format: '전자책(ePub)',
  },
  {
    id: 'book013',
    author_id: 'author001',
    author_name: '김소연',
    title: '아이와 함께 성장하는 하루 루틴',
    subtitle: '부모와 아이가 함께 만드는 습관',
    description: '아이와 부모가 함께 행복해지는 일상 루틴의 힘.',
    cover_color: '#F3E5F5',
    cover_text_color: '#6A1B9A',
    price: 12900,
    is_free: false,
    status: 'published',
    category: '육아',
    tags: ['육아', '루틴', '자기계발'],
    rating: 4.9,
    review_count: 140,
    like_count: 2100,
    view_count: 17800,
    purchase_count: 1456,
    created_at: '2024-02-05',
    pages: 201,
    format: '전자책(ePub)',
  },
];

// ─────────────────────────────────────────
// 도서 챕터 데이터 (뷰어용)
// ─────────────────────────────────────────
const bookContents = {
  book001: {
    parts: [
      {
        id: 'part1',
        part_title: 'PART 1',
        part_subtitle: '당신이 해결할 문제는 무엇인가요?',
        chapters: [
          {
            id: 'ch1',
            chapter_title: '돈과 시간이 새고 있었다',
            order_index: 1,
            content: `<blockquote>"바쁘게 살고 있었지만, 정작 내 삶은 제자리에 있었다. 시간은 흘러가고, 통장 잔고는 그대로였다."</blockquote>

<p>매일 아침 일어나면 정신없이 하루를 시작했습니다. 출근 준비, 업무, 회의, 메일 확인, 퇴근 후 집안일과 개인 업무까지. 정말 쉴 틈 없이 하루가 흘러갔죠.</p>

<p>그런데 문득 이런 생각이 들었습니다. '이렇게 열심히 사는데, 왜 나는 항상 같은 자리일까?'</p>

<p>시간은 누구에게나 공평하게 주어지는데, 왜 어떤 사람은 성장하고, 나는 계속 제자리인 걸까?</p>

<p>그때부터 문제의 원인을 찾기 시작했습니다. 그리고 작은 습관의 힘을 알게 되었습니다.</p>`,
          },
          {
            id: 'ch2',
            chapter_title: '매일 반복되는 불만과 후회',
            order_index: 2,
            content: `<p>반복되는 일상 속에서 우리는 종종 같은 실수를 반복합니다. 오늘도 충분히 했다고 생각했는데, 막상 저녁이 되면 허무함이 밀려옵니다.</p>

<p>이 챕터에서는 그 패턴을 인식하고 끊는 방법을 알아봅니다.</p>`,
          },
          {
            id: 'ch3',
            chapter_title: '변화가 필요하다는 걸 알았다',
            order_index: 3,
            content: `<p>변화는 거창한 것이 아닙니다. 작은 것에서 시작합니다. 하루 5분, 그 5분이 쌓여 삶을 바꿉니다.</p>`,
          },
        ]
      },
      {
        id: 'part2',
        part_title: 'PART 2',
        part_subtitle: '문제의 원인은 무엇이었나요?',
        chapters: [
          { id: 'ch4', chapter_title: '명확한 목표가 없었다', order_index: 4, content: '<p>목표 없이 바쁜 것은 방향 없이 달리는 것과 같습니다.</p>' },
          { id: 'ch5', chapter_title: '우선순위가 항상 뒤로 밀렸다', order_index: 5, content: '<p>중요한 것과 급한 것을 구분하지 못했습니다.</p>' },
          { id: 'ch6', chapter_title: '실행보다 계획에만 머물렀다', order_index: 6, content: '<p>완벽한 계획을 세우느라 정작 실행을 못했습니다.</p>' },
        ]
      },
      {
        id: 'part3',
        part_title: 'PART 3',
        part_subtitle: '어떤 변화를 경험했나요?',
        chapters: [
          { id: 'ch7', chapter_title: '하루가 가벼워졌다', order_index: 7, content: '<p>작은 습관 하나가 하루 전체를 바꾸었습니다.</p>' },
          { id: 'ch8', chapter_title: '집중력이 높아졌다', order_index: 8, content: '<p>불필요한 것을 줄이니 중요한 것에 집중할 수 있었습니다.</p>' },
          { id: 'ch9', chapter_title: '내가 나를 믿게 되었다', order_index: 9, content: '<p>작은 성공이 쌓여 자신감이 생겼습니다.</p>' },
        ]
      },
      {
        id: 'epilogue',
        part_title: '에필로그',
        part_subtitle: '',
        chapters: [
          { id: 'ch10', chapter_title: '마치며', order_index: 10, content: '<p>이 책이 당신의 작은 변화의 시작이 되기를 바랍니다.</p>' },
        ]
      },
    ]
  }
};

// ─────────────────────────────────────────
// 찜 목록 데이터
// ─────────────────────────────────────────
const wishlistBooks = books.filter(b => currentUser.wishlist_ids.includes(b.id));

// ─────────────────────────────────────────
// 구매 내역 (mock)
// ─────────────────────────────────────────
const purchaseHistory = [
  { id: 'pay001', book_id: 'book011', amount: 12900, purchased_at: '2024.05.20', status: 'completed' },
  { id: 'pay002', book_id: 'book010', amount: 9900, purchased_at: '2024.05.18', status: 'completed' },
  { id: 'pay003', book_id: 'book007', amount: 9900, purchased_at: '2024.05.15', status: 'completed' },
];

// ─────────────────────────────────────────
// 태그 목록
// ─────────────────────────────────────────
const allTags = ['시간관리', '돈절약', '미니멀라이프', '육아', '습관', '자기계발', '관계', '정리정돈', '재테크', '루틴', '마인드셋', '직장인'];

// ─────────────────────────────────────────
// Export (전역 사용)
// ─────────────────────────────────────────
window.MockData = {
  currentUser,
  authors,
  books,
  bookContents,
  wishlistBooks,
  purchaseHistory,
  allTags,
};
