/* ============================================================
   শেয়ার্ড স্ক্রিপ্ট: Supabase ক্লায়েন্ট, হেডার/নেভ, সাহায্যকারী ফাংশন
   ============================================================ */
(function () {
  const cfg = window.APP_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.startsWith('YOUR_');
  const sb = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  const ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    plus: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
  };
  const svg = (k) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[k] + '</svg>';

  const ERRORS = {
    'Invalid login credentials': 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।',
    'Email not confirmed': 'আগে আপনার ইমেইল যাচাই করুন (ইনবক্স বা স্প্যাম ফোল্ডার দেখুন)।',
    'User already registered': 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে।',
    'Database error saving new user': 'অ্যাকাউন্ট খোলা যায়নি। সম্ভবত এই মোবাইল নম্বর আগে ব্যবহার করা হয়েছে।',
    'Password should be at least 6 characters.': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
    'email rate limit exceeded': 'অল্প সময়ে অনেক ইমেইল পাঠানো হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
    'Failed to fetch': 'ইন্টারনেট সংযোগ পরীক্ষা করুন।'
  };

  const App = {
    sb,
    configured,
    siteName: cfg.SITE_NAME || 'টিউটরহাব',

    errMsg(err) {
      const m = (err && err.message) || String(err || '');
      for (const k in ERRORS) if (m.indexOf(k) !== -1) return ERRORS[k];
      return 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।';
    },

    toast(msg) {
      let t = document.getElementById('toast');
      if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
      t.textContent = msg;
      requestAnimationFrame(() => t.classList.add('show'));
      clearTimeout(App._tt);
      App._tt = setTimeout(() => t.classList.remove('show'), 3200);
    },

    showAlert(el, type, msg) {
      el.className = 'alert alert-' + type;
      el.textContent = msg;
      el.hidden = false;
    },

    // BD মোবাইল নম্বর: 01XXXXXXXXX (১১ ডিজিট)
    normalizePhone(v) {
      const bn = '০১২৩৪৫৬৭৮৯';
      let s = String(v || '').replace(/[০-৯]/g, (d) => bn.indexOf(d)).replace(/[\s\-]/g, '');
      if (s.startsWith('+88')) s = s.slice(3);
      else if (s.startsWith('88')) s = s.slice(2);
      return /^01[3-9]\d{8}$/.test(s) ? s : null;
    },

    async getUser() {
      if (!sb) return null;
      const { data } = await sb.auth.getSession();
      return data.session ? data.session.user : null;
    },

    async getStaff(userId) {
      if (!sb || !userId) return null;
      const { data } = await sb.from('staff_roles').select('role, permissions, is_active').eq('user_id', userId).maybeSingle();
      return data && data.is_active ? data : null;
    },

    async logout() {
      if (sb) await sb.auth.signOut();
      location.href = 'index.html';
    },

    async requireAuth() {
      const u = await App.getUser();
      if (!u) location.href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop());
      return u;
    },

    // হেডার ও মোবাইল বটম নেভ আঁকা। active = 'home' | 'tutor' | 'tuition' | 'post' | 'account'
    async mount(active) {
      const user = await App.getUser();
      const staff = user ? await App.getStaff(user.id) : null;
      const link = (href, key, label) => '<a href="' + href + '"' + (active === key ? ' class="active"' : '') + '>' + label + '</a>';

      const actions = user
        ? (staff ? '<a class="btn btn-ghost btn-sm" href="admin/index.html">অ্যাডমিন</a>' : '') +
          '<a class="btn btn-primary btn-sm" href="dashboard.html">ড্যাশবোর্ড</a>' +
          '<button class="btn btn-ghost btn-sm" id="logout-btn" type="button">লগআউট</button>'
        : '<a class="btn btn-ghost btn-sm" href="login.html">লগইন</a>' +
          '<a class="btn btn-primary btn-sm" href="register.html">রেজিস্টার</a>';

      const h = document.getElementById('site-header');
      if (h) {
        h.className = 'site-header';
        h.innerHTML =
          '<div class="container header-in">' +
          '<a class="brand" href="index.html"><span class="brand-mark">ট</span>' + App.siteName + '</a>' +
          '<nav class="nav-links">' +
          link('index.html', 'home', 'হোম') +
          link('find-tutor.html', 'tutor', 'টিউটর খুঁজুন') +
          link('find-tuition.html', 'tuition', 'টিউশন খুঁজুন') +
          link('post-tuition.html', 'post', 'টিউশন পোস্ট') +
          link('become-tutor.html', 'become', 'টিউটর হোন') +
          '</nav>' +
          '<div class="header-actions">' + actions + '</div></div>';
        const lb = document.getElementById('logout-btn');
        if (lb) lb.addEventListener('click', App.logout);
      }

      const b = document.getElementById('bottom-nav');
      if (b) {
        b.className = 'bottom-nav';
        const item = (href, key, icon, label, cls) =>
          '<a href="' + href + '" class="' + (cls || '') + (active === key ? ' active' : '') + '">' + svg(icon) + '<span>' + label + '</span></a>';
        b.innerHTML =
          item('index.html', 'home', 'home', 'হোম') +
          item('find-tutor.html', 'tutor', 'search', 'টিউটর') +
          item('post-tuition.html', 'post', 'plus', 'পোস্ট', 'post-btn') +
          item('find-tuition.html', 'tuition', 'book', 'টিউশন') +
          item(user ? 'dashboard.html' : 'login.html', 'account', 'user', user ? 'ড্যাশবোর্ড' : 'লগইন');
      }

      document.querySelectorAll('[data-site-name]').forEach((el) => (el.textContent = App.siteName));
      return { user, staff };
    }
  };

  window.App = App;
})();
        
