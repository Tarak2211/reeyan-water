/* ═══════════════════════════════════════════════════════
   રીયાન મિનરલ વોટર — મેનેજમેન્ટ સિસ્ટમ
   Role-based login + Real WhatsApp API
═══════════════════════════════════════════════════════ */

// ── Config ────────────────────────────────────────────────────────
const ADMIN_PASSWORD = 'reeyan2024';   // Admin password (change as needed)

// Users: staff have NO password. Admin has password.
const USERS = {
  admin:   { name: 'એડમિન',   role: 'admin', avatar: 'અ', requiresPass: true  },
  sameer:  { name: 'સમીર',    role: 'staff', avatar: 'સ', requiresPass: false, staffId: 's1' },
  kamlesh: { name: 'કમલેશ',   role: 'staff', avatar: 'ક', requiresPass: false, staffId: 's2' },
  rohan:   { name: 'રોહન',    role: 'staff', avatar: 'ર', requiresPass: false, staffId: 's3' },
  vinay:   { name: 'વિનય',    role: 'staff', avatar: 'વ', requiresPass: false, staffId: 's4' },
  bhavesh: { name: 'ભાવેશ',   role: 'staff', avatar: 'ભ', requiresPass: false, staffId: 's5' },
};

// ── Seed Data ─────────────────────────────────────────────────────
const SEED_CUSTOMERS = [
  { id:'c1', name:'રમેશ કુમાર',    phone:'9876543210', address:'૧૨, શાંતિ નગર, અમદાવાદ',    rateJug:50, rateBottleHot:15, rateBottleCold:15, pendingBalance:350,  isActive:true, type:'individual' },
  { id:'c2', name:'સુનિતા પટેલ',   phone:'9823456789', address:'૪B, નવજીવન સોસાયટી, સુરત',  rateJug:45, rateBottleHot:12, rateBottleCold:12, pendingBalance:135,  isActive:true, type:'individual' },
  { id:'c3', name:'મહેશ શાહ',      phone:'9712345678', address:'૮, લેકવ્યૂ, વડોદરા',         rateJug:50, rateBottleHot:15, rateBottleCold:15, pendingBalance:700,  isActive:true, type:'individual' },
  { id:'c4', name:'પ્રિયા દેસાઈ',  phone:'9601234567', address:'૨૨, રોઝ ગાર્ડન, રાજકોટ',    rateJug:40, rateBottleHot:10, rateBottleCold:10, pendingBalance:80,   isActive:true, type:'individual' },
  { id:'c5', name:'નીલેશ ત્રિવેદી',phone:'9512345670', address:'૩, પટેલ સ્ટ્રીટ, ગાંધીનગર', rateJug:55, rateBottleHot:15, rateBottleCold:15, pendingBalance:0,    isActive:true, type:'individual' },
  { id:'c6', name:'લક્ષ્મી Pvt. Ltd.',phone:'9900112233', address:'GIDC, અમદાવાદ',           rateJug:45, rateBottleHot:12, rateBottleCold:12, pendingBalance:1200, isActive:true, type:'company', contactPerson:'અર્જુન ભટ્ટ' },
];
const SEED_STAFF = [
  { id:'s1', name:'સમીર',   phone:'9988776601', isActive:true },
  { id:'s2', name:'કમલેશ',  phone:'9988776602', isActive:true },
  { id:'s3', name:'રોહન',   phone:'9988776603', isActive:true },
  { id:'s4', name:'વિનય',   phone:'9988776604', isActive:true },
  { id:'s5', name:'ભાવેશ',  phone:'9988776605', isActive:true },
];

// ── Force reset old seed data (staff names update) ────────────────
(function forceResetStaff() {
  const stored = JSON.parse(localStorage.getItem('aqp_staff') || '[]');
  const hasOldNames = stored.some(s => s.name === 'Suresh Patel' || s.name === 'Rakesh Sharma');
  if (hasOldNames || stored.length === 0) {
    localStorage.removeItem('aqp_staff');
    localStorage.removeItem('aqp_init');
  }
})();
const SEED_ENTRIES = [
  { id:'e1', customerId:'c1', deliveryBoyId:'s1', product:'jug_chilled', jugsDelivered:7,  jugsReturned:5, ratePerUnit:50, totalCost:350, status:'CONFIRMED', notes:'', entryDate:todayISO(), billId:'b1' },
  { id:'e2', customerId:'c2', deliveryBoyId:'s1', product:'bottle_hot',  jugsDelivered:10, jugsReturned:0, ratePerUnit:15, totalCost:150, status:'CONFIRMED', notes:'', entryDate:todayISO(), billId:'b2' },
  { id:'e3', customerId:'c3', deliveryBoyId:'s2', product:'jug_chilled', jugsDelivered:5,  jugsReturned:3, ratePerUnit:50, totalCost:250, status:'CONFIRMED', notes:'', entryDate:yesterdayISO(), billId:'b3' },
];
const SEED_BILLS = [
  { id:'b1', billNumber:'WP-'+todayISO().replace(/-/g,'').slice(0,8)+'-0001', customerId:'c1', dailyEntryId:'e1', billDate:todayISO(), product:'jug_chilled', jugsDelivered:7,  ratePerUnit:50, amountDue:350, pendingBefore:0,   pendingAfter:350, whatsappSent:false },
  { id:'b2', billNumber:'WP-'+todayISO().replace(/-/g,'').slice(0,8)+'-0002', customerId:'c2', dailyEntryId:'e2', billDate:todayISO(), product:'bottle_hot',  jugsDelivered:10, ratePerUnit:15, amountDue:150, pendingBefore:0,   pendingAfter:150, whatsappSent:false },
  { id:'b3', billNumber:'WP-'+yesterdayISO().replace(/-/g,'').slice(0,8)+'-0001', customerId:'c3', dailyEntryId:'e3', billDate:yesterdayISO(), product:'jug_chilled', jugsDelivered:5, ratePerUnit:50, amountDue:250, pendingBefore:450, pendingAfter:700, whatsappSent:false },
];

// ── Storage ───────────────────────────────────────────────────────
function db(key)          { return JSON.parse(localStorage.getItem('aqp_' + key) || 'null'); }
function saveDb(key, val) { localStorage.setItem('aqp_' + key, JSON.stringify(val)); }

function initDb() {
  if (!db('init')) {
    saveDb('customers', SEED_CUSTOMERS);
    saveDb('staff',     SEED_STAFF);
    saveDb('entries',   SEED_ENTRIES);
    saveDb('bills',     SEED_BILLS);
    saveDb('payments',  []);
    saveDb('routes',    []);
    saveDb('jama',      []);
    saveDb('init', true);
  }
}

// ── Helpers ───────────────────────────────────────────────────────
function todayISO()     { return new Date().toISOString().split('T')[0]; }
function yesterdayISO() { const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; }
function uid()          { return 'x' + Math.random().toString(36).slice(2,10); }
function fmt(n)         { return '₹' + Number(n).toLocaleString('en-IN', {minimumFractionDigits:2}); }
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const months = ['જાન','ફેબ','માર','એપ','મે','જૂન','જુ','ઓગ','સપ','ઓક','નવ','ડિ'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
const PRODUCT_LABELS = {
  jug_chilled:  '💧 જગ (ઠ.)',
  bottle_hot:   '🍶 બોટ. (ગ.)',
  bottle_cold:  '🍶 બોટ. (ઠ.)',
};

let _currentUser = null;
let _payTarget   = null;
let _editCustId  = null;
let _verifyJamaId = null;

// ══════════════════════════════════════════════════════
// LOGIN SYSTEM
// ══════════════════════════════════════════════════════
function setupLoginUI() {
  const sel = document.getElementById('login-user');
  if (!sel) return;
  sel.addEventListener('change', function() {
    const u = USERS[this.value];
    const passGroup = document.getElementById('passGroup');
    if (!passGroup) return;
    if (u && u.requiresPass) {
      passGroup.style.display = 'block';
      document.getElementById('login-pass').focus();
    } else {
      passGroup.style.display = 'none';
      document.getElementById('login-pass').value = '';
    }
  });
  // Enter key on password
  document.getElementById('login-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
}

function doLogin() {
  const userKey = document.getElementById('login-user').value;
  const pass    = document.getElementById('login-pass').value;

  if (!userKey) {
    showToast('કૃપા કરી યુઝર પસંદ કરો', 'error');
    return;
  }

  const user = USERS[userKey];
  if (!user) {
    showToast('અમાન્ય યુઝર', 'error');
    return;
  }

  // Admin needs password
  if (user.requiresPass) {
    if (!pass) {
      showToast('Admin password ભરો', 'error');
      document.getElementById('login-pass').focus();
      return;
    }
    if (pass !== ADMIN_PASSWORD) {
      showToast('❌ ખોટો પાસવર્ડ', 'error');
      document.getElementById('login-pass').value = '';
      document.getElementById('login-pass').focus();
      return;
    }
  }

  // ── Login success ──────────────────────────────────────────────
  _currentUser = { key: userKey, ...user };

  // Update sidebar
  document.getElementById('sidebarAvatar').textContent = user.avatar;
  document.getElementById('sidebarName').textContent   = user.name;
  document.getElementById('sidebarRole').textContent   = user.role === 'admin' ? 'સુપર એડમિન' : 'ડિલિવરી સ્ટાફ';

  // Show/hide admin-only nav
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = user.role === 'admin' ? '' : 'none';
  });

  // Hide login, show main
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainContent').style.display = '';

  setTopbarDate();
  initDb();
  populateDropdowns();

  // Set today dates
  const today = todayISO();
  ['entry-date','report-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
  const mm = document.getElementById('monthly-month');
  if (mm) mm.value = today.slice(0,7);

  // Close modals on backdrop
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  if (user.role === 'staff') {
    // Staff → Delivery Entry directly
    showPage('delivery');
    setTimeout(() => {
      const dbEl = document.getElementById('entry-deliveryboy');
      if (dbEl && user.staffId) {
        dbEl.value = user.staffId;
      }
    }, 200);
  } else {
    // Admin → Dashboard
    showPage('dashboard');
  }

  document.getElementById('welcomeMsg').textContent = `નમસ્તે, ${user.name}! 👋`;
  showToast(`✅ સ્વાગત છે ${user.name}!`, 'success');
}

function doLogout() {
  _currentUser = null;
  document.getElementById('loginScreen').style.display  = '';
  document.getElementById('mainContent').style.display  = 'none';
  document.getElementById('login-user').value           = '';
  document.getElementById('login-pass').value           = '';
  const passGroup = document.getElementById('passGroup');
  if (passGroup) passGroup.style.display = 'none';
}

// ══════════════════════════════════════════════════════
// BOOTSTRAP
// ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Hide main content until login
  document.getElementById('mainContent').style.display = 'none';
  // Set today's date fields
  const today = todayISO();
  ['entry-date','report-date','monthly-month'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'monthly-month' ? today.slice(0,7) : today;
  });
  // Close modals on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
});

function setTopbarDate() {
  const d = new Date();
  const days   = ['રવિ','સોમ','મંગળ','બુધ','ગુરુ','શુક્ર','શનિ'];
  const months = ['જાન','ફેબ','માર','એપ','મે','જૂન','જુ','ઓગ','સપ','ઓક','નવ','ડિ'];
  const el = document.getElementById('topbarDate');
  if (el) el.textContent = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Navigation ────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:'ડેશબોર્ડ', route:'રૂટ અને જમા', delivery:'ડિલિવરી એન્ટ્રી',
  customers:'ગ્રાહકો', companies:'કંપની ક્લાયન્ટ', deliveryboys:'ડિલિવરી સ્ટાફ',
  bills:'બિલ અને રસીદ', reports:'રિપોર્ટ', settings:'સેટિંગ્સ'
};

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  const nav  = document.querySelector(`[data-page="${id}"]`);
  if (page) page.classList.add('active');
  if (nav)  nav.classList.add('active');
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = PAGE_TITLES[id] || id;
  if (window.innerWidth < 700) document.getElementById('sidebar').classList.remove('open');
  switch(id) {
    case 'dashboard':    renderDashboard();    break;
    case 'route':        renderRoutes();       break;
    case 'delivery':     renderTodayEntries(); break;
    case 'customers':    renderCustomers('');  break;
    case 'companies':    renderCompanies();    break;
    case 'deliveryboys': renderStaff();        break;
    case 'bills':        renderBills('');      break;
    case 'reports':      loadDailyReport();    break;
    case 'settings':     loadSettings();       break;
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── Dropdowns ─────────────────────────────────────────────────────
function populateDropdowns() {
  const customers = db('customers').filter(c => c.isActive);
  const staff     = db('staff').filter(s => s.isActive);

  ['entry-customer','ledger-customer'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="">— ગ્રાહક / કંપની પસંદ કરો —</option>` +
      customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');
  });

  ['entry-deliveryboy','disp-staff','jama-staff'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="">— સ્ટાફ —</option>` +
      staff.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  });

  // Company filter
  const cf = document.getElementById('company-filter');
  if (cf) {
    const companies = customers.filter(c => c.type === 'company');
    cf.innerHTML = `<option value="">— બધી કંપની —</option>` +
      companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  // Bill month filter
  populateBillMonths();
}

function populateBillMonths() {
  const el = document.getElementById('bill-month-filter');
  if (!el) return;
  const bills = db('bills') || [];
  const months = [...new Set(bills.map(b => b.billDate.slice(0,7)))].sort().reverse();
  el.innerHTML = `<option value="">— બધા —</option>` +
    months.map(m => `<option value="${m}">${m}</option>`).join('');
}

// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
function renderDashboard() {
  const entries   = db('entries') || [];
  const customers = db('customers') || [];
  const today     = todayISO();
  const todayE    = entries.filter(e => e.entryDate === today && e.status === 'CONFIRMED');

  const jugsToday    = todayE.filter(e=>e.product==='jug_chilled').reduce((s,e)=>s+e.jugsDelivered,0);
  const bottlesToday = todayE.filter(e=>e.product!=='jug_chilled').reduce((s,e)=>s+e.jugsDelivered,0);
  const revenue      = todayE.reduce((s,e)=>s+e.totalCost,0);
  const pending      = customers.reduce((s,c)=>s+c.pendingBalance,0);

  animateCount('stat-delivered', jugsToday);
  animateCount('stat-bottles',   bottlesToday);
  document.getElementById('stat-revenue').textContent = fmt(revenue);
  document.getElementById('stat-pending').textContent = fmt(pending);

  const tbody = document.getElementById('dash-recent-body');
  if (!tbody) return;
  if (todayE.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">આજે કોઈ ડિલિવરી નોંધાઈ નથી</td></tr>`;
  } else {
    tbody.innerHTML = todayE.slice(0,8).map(e => {
      const c = customers.find(x => x.id === e.customerId);
      return `<tr>
        <td><strong>${c?.name||'—'}</strong></td>
        <td>${PRODUCT_LABELS[e.product]||e.product}</td>
        <td><span class="badge badge-info">${e.jugsDelivered}</span></td>
        <td class="font-bold text-blue">${fmt(e.totalCost)}</td>
        <td><span class="badge badge-success">✓ કન્ફર્મ</span></td>
      </tr>`;
    }).join('');
  }

  const pendingList = document.getElementById('pending-list');
  if (!pendingList) return;
  const withPending = customers.filter(c=>c.pendingBalance>0).sort((a,b)=>b.pendingBalance-a.pendingBalance).slice(0,6);
  if (withPending.length === 0) {
    pendingList.innerHTML = `<div class="empty-state">🎉 બધા ગ્રાહકો ચૂકવ્યા!</div>`;
  } else {
    pendingList.innerHTML = withPending.map(c=>`
      <div class="pending-item">
        <div>
          <div class="pending-name">${c.name}</div>
          <div class="pending-phone">${c.phone}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="pending-amount">${fmt(c.pendingBalance)}</div>
          <button class="btn btn-sm btn-primary" onclick="openPaymentModal('${c.id}')">ચૂ.</button>
        </div>
      </div>`).join('');
  }
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const step  = Math.max(1, Math.floor(target/30));
  const timer = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) clearInterval(timer);
  }, 30);
}

// ══════════════════════════════════════════════════════
// ROUTE & JAMA
// ══════════════════════════════════════════════════════
function renderRoutes() {
  const routes    = db('routes') || [];
  const jamas     = db('jama')   || [];
  const staff     = db('staff')  || [];
  const container = document.getElementById('active-routes');
  if (!container) return;

  if (routes.length === 0) {
    container.innerHTML = `<div class="empty-state">🚚 કોઈ ચાલુ રૂટ નથી</div>`;
  } else {
    container.innerHTML = routes.map(r => {
      const s = staff.find(x => x.id === r.staffId);
      return `<div class="entry-item" style="margin:8px 16px">
        <div>
          <div class="entry-customer">🗺️ ${r.route} — ${s?.name||'—'}</div>
          <div class="entry-meta">💧 ભ. ${r.fullJug} | 🍶 ગ. ${r.bottleHot} | 🍶 ઠ. ${r.bottleCold} | 📅 ${fmtDate(r.date)}</div>
        </div>
        <span class="badge badge-info">ડિસ્પેચ</span>
      </div>`;
    }).join('');
  }

  // Jama table
  const tbody = document.getElementById('jama-body');
  if (!tbody) return;
  if (jamas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-row">કોઈ જમા એન્ટ્રી નથી</td></tr>`;
    return;
  }
  tbody.innerHTML = jamas.slice().reverse().map(j => {
    const s = staff.find(x => x.id === j.staffId);
    return `<tr>
      <td>${fmtDate(j.date)}</td>
      <td><strong>${s?.name||'—'}</strong></td>
      <td>${j.route}</td>
      <td><span class="badge badge-info">${j.fullOut}</span></td>
      <td><span class="badge badge-success">${j.emptyRet}</span></td>
      <td class="font-bold text-green">${fmt(j.cash)}</td>
      <td><span class="badge ${j.approved?'badge-success':'badge-warning'}">${j.approved?'✓ મંજૂર':'⏳ બાકી'}</span></td>
      <td>
        ${j.photoUrl ? `<button class="btn btn-sm btn-ghost" onclick="verifyJama('${j.id}')">📸 ચકાસો</button>` : '—'}
      </td>
    </tr>`;
  }).join('');
}

function saveDispatch() {
  const staffId    = document.getElementById('disp-staff').value;
  const route      = document.getElementById('disp-route').value.trim();
  const fullJug    = parseInt(document.getElementById('disp-full-jug').value)||0;
  const bottleHot  = parseInt(document.getElementById('disp-bottle-hot').value)||0;
  const bottleCold = parseInt(document.getElementById('disp-bottle-cold').value)||0;
  const emptyJug   = parseInt(document.getElementById('disp-empty-jug').value)||0;

  if (!staffId || !route) { showToast('સ્ટાફ અને રૂટ ભરો', 'error'); return; }

  const routes = db('routes') || [];
  routes.push({ id:uid(), staffId, route, fullJug, bottleHot, bottleCold, emptyJug, date:todayISO() });
  saveDb('routes', routes);
  closeModal('dispatchModal');
  renderRoutes();
  showToast('🚚 ડિસ્પેચ સફળ!', 'success');
}

let _jamaPhotoDataUrl = null;
function previewJamaPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _jamaPhotoDataUrl = e.target.result;
    document.getElementById('jamaPhotoImg').src = _jamaPhotoDataUrl;
    document.getElementById('jamaPhotoPreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function saveJama() {
  const staffId  = document.getElementById('jama-staff').value;
  const route    = document.getElementById('jama-route').value.trim();
  const fullOut  = parseInt(document.getElementById('jama-full-out').value)||0;
  const emptyRet = parseInt(document.getElementById('jama-empty-ret').value)||0;
  const cash     = parseFloat(document.getElementById('jama-cash').value)||0;

  if (!staffId) { showToast('સ્ટાફ પસંદ કરો', 'error'); return; }

  const jamas = db('jama') || [];
  jamas.push({ id:uid(), staffId, route, fullOut, emptyRet, cash, photoUrl:_jamaPhotoDataUrl, approved:false, date:todayISO() });
  saveDb('jama', jamas);
  _jamaPhotoDataUrl = null;
  document.getElementById('jamaPhotoPreview').style.display = 'none';
  closeModal('jamaModal');
  renderRoutes();
  showToast('💰 જમા સચવાઈ!', 'success');
}

function verifyJama(id) {
  _verifyJamaId = id;
  const jama  = (db('jama')||[]).find(j=>j.id===id);
  const staff = (db('staff')||[]).find(s=>s.id===jama.staffId);
  const body  = document.getElementById('verify-jama-body');
  if (!body) return;
  body.innerHTML = `
    <div style="margin-bottom:12px">
      <strong>${staff?.name||'—'}</strong> — ${fmtDate(jama.date)}<br>
      ભ. ગ. ${jama.fullOut} | ખ. પ. ${jama.emptyRet} | રોકડ: ${fmt(jama.cash)}
    </div>
    ${jama.photoUrl ? `<img src="${jama.photoUrl}" style="width:100%;border-radius:10px;max-height:250px;object-fit:cover" />` : '<div class="empty-state">કોઈ ફોટો નથી</div>'}`;
  openModal('verifyJamaModal');
}

function approveJama() {
  if (!_verifyJamaId) return;
  const jamas = db('jama')||[];
  const idx   = jamas.findIndex(j=>j.id===_verifyJamaId);
  if (idx>=0) { jamas[idx].approved = true; saveDb('jama', jamas); }
  closeModal('verifyJamaModal');
  renderRoutes();
  showToast('✅ જમા મંજૂર!', 'success');
}

// ══════════════════════════════════════════════════════
// DELIVERY ENTRY
// ══════════════════════════════════════════════════════
let _selectedCustomer = null;

function onCustomerSelect() {
  const id = document.getElementById('entry-customer').value;
  _selectedCustomer = (db('customers')||[]).find(c=>c.id===id)||null;
  recalcEntry();
}

function onProductChange() { recalcEntry(); }

function getProductRate(customer, product) {
  if (!customer || !product) return 0;
  if (product === 'jug_chilled')  return customer.rateJug         || 0;
  if (product === 'bottle_hot')   return customer.rateBottleHot   || 0;
  if (product === 'bottle_cold')  return customer.rateBottleCold  || 0;
  return 0;
}

function recalcEntry() {
  const product = document.getElementById('entry-product')?.value || '';
  const rate    = getProductRate(_selectedCustomer, product);
  const qty     = parseInt(document.getElementById('entry-delivered')?.value)||0;
  const total   = qty * rate;
  const pending = (_selectedCustomer?.pendingBalance||0) + total;
  document.getElementById('preview-rate').textContent    = fmt(rate);
  document.getElementById('preview-qty').textContent     = qty;
  document.getElementById('preview-total').textContent   = fmt(total);
  document.getElementById('preview-pending').textContent = fmt(pending);
  recalcJama();
}

function recalcJama() {
  const delivered = parseInt(document.getElementById('entry-delivered')?.value)||0;
  const returned  = parseInt(document.getElementById('entry-returned')?.value)||0;
  const jama      = parseInt(document.getElementById('entry-jama')?.value)||0;

  // Balance = jugs out (delivered + jama) - jugs returned
  const totalOut  = delivered + jama;
  const balance   = totalOut - returned;

  const balField = document.getElementById('entry-jama-balance');
  if (balField) balField.value = balance < 0 ? 0 : balance;

  const bar = document.getElementById('jamaBar');
  if (jama > 0 || returned > 0 || delivered > 0) {
    if (bar) bar.style.display = 'block';
    const outEl = document.getElementById('jama-out-show');
    const retEl = document.getElementById('jama-ret-show');
    const balEl = document.getElementById('jama-bal-show');
    if (outEl) outEl.textContent = totalOut;
    if (retEl) retEl.textContent = returned;
    if (balEl) balEl.textContent = balance < 0 ? 0 : balance;
  } else {
    if (bar) bar.style.display = 'none';
  }
}

let _cashPhotoDataUrl = null;

function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  document.getElementById('imagePreview').src = URL.createObjectURL(file);
  document.getElementById('imagePreviewWrap').style.display = 'block';
  showToast('🤖 AI ફોટો ગણી રહ્યો છે…', 'info');
  setTimeout(() => {
    const full  = Math.floor(Math.random()*6)+2;
    const empty = Math.floor(Math.random()*full)+1;
    document.getElementById('entry-delivered').value      = full;
    document.getElementById('entry-returned').value       = empty;
    document.getElementById('ai-full').textContent        = full;
    document.getElementById('ai-empty').textContent       = empty;
    document.getElementById('ai-conf').textContent        = 'ઉચ્ચ';
    document.getElementById('ai-conf-badge').style.background = '#dcfce7';
    document.getElementById('ai-conf-badge').style.color      = '#16a34a';
    document.getElementById('aiResultBar').style.display      = 'flex';
    recalcEntry();
    showToast(`✅ AI: ${full} ભ., ${empty} ખ. જગ`, 'success');
  }, 1800);
}

function submitEntry() {
  const customerId    = document.getElementById('entry-customer').value;
  const deliveryBoyId = document.getElementById('entry-deliveryboy').value;
  const product       = document.getElementById('entry-product').value;
  const delivered     = parseInt(document.getElementById('entry-delivered').value)||0;
  const returned      = parseInt(document.getElementById('entry-returned').value)||0;
  const notes         = document.getElementById('entry-notes').value.trim();
  const date          = document.getElementById('entry-date').value||todayISO();

  const jama       = parseInt(document.getElementById('entry-jama')?.value)||0;
  const jamaBalance= parseInt(document.getElementById('entry-jama-balance')?.value)||0;

  if (!customerId)    { showToast('ગ્રાહક પસંદ કરો',   'error'); return; }
  if (!deliveryBoyId) { showToast('સ્ટાફ પસંદ કરો',    'error'); return; }
  if (!product)       { showToast('ઉત્પાદ પ્રકાર પસંદ કરો', 'error'); return; }
  if (delivered < 1)  { showToast('ઓછામાં ઓછા ૧ નંગ', 'error'); return; }

  const cust      = (db('customers')||[]).find(c=>c.id===customerId);
  const rate      = getProductRate(cust, product);
  const total     = delivered * rate;
  const pendBefore= cust.pendingBalance;
  const entryId   = uid();
  const billId    = uid();
  const dateStr   = date.replace(/-/g,'');
  const bills     = db('bills')||[];
  const billCount = String(bills.filter(b=>b.billDate.startsWith(date.slice(0,7))).length+1).padStart(4,'0');
  const billNum   = `WP-${dateStr}-${billCount}`;

  const entry = { id:entryId, customerId, deliveryBoyId, product, jugsDelivered:delivered, jugsReturned:returned, jamaJugs:jama, jamaBalance, ratePerUnit:rate, totalCost:total, status:'CONFIRMED', notes, entryDate:date, billId };
  const bill  = { id:billId, billNumber:billNum, customerId, dailyEntryId:entryId, billDate:date, product, jugsDelivered:delivered, ratePerUnit:rate, amountDue:total, pendingBefore:pendBefore, pendingAfter:pendBefore+total, whatsappSent:false };

  const entries = db('entries')||[]; entries.push(entry); saveDb('entries', entries);
  bills.push(bill); saveDb('bills', bills);

  const customers = db('customers');
  const ci = customers.findIndex(c=>c.id===customerId);
  customers[ci].pendingBalance += total;
  saveDb('customers', customers);

  showToast(`✅ બિલ ${billNum} તૈયાર!`, 'success');

  ['entry-customer','entry-deliveryboy','entry-product'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  ['entry-delivered','entry-returned','entry-jama','entry-jama-balance'].forEach(id => { const el=document.getElementById(id); if(el) el.value='0'; });
  document.getElementById('entry-notes').value = '';
  document.getElementById('imagePreviewWrap').style.display = 'none';
  document.getElementById('aiResultBar').style.display     = 'none';
  document.getElementById('jugImage').value = '';
  const bar = document.getElementById('jamaBar');
  if (bar) bar.style.display = 'none';
  _selectedCustomer = null;
  recalcEntry();
  renderTodayEntries();
  populateBillMonths();
  setTimeout(() => showBillModal(billId), 500);
}

function renderTodayEntries() {
  const entries   = db('entries')||[];
  const customers = db('customers')||[];
  const staff     = db('staff')||[];
  const container = document.getElementById('today-entries');
  if (!container) return;

  let myEntries = entries.filter(e => e.entryDate === todayISO());
  // Staff sees only their own entries
  if (_currentUser?.role === 'staff' && _currentUser.staffId) {
    myEntries = myEntries.filter(e => e.deliveryBoyId === _currentUser.staffId);
  }

  const countEl = document.getElementById('today-count');
  if (countEl) countEl.textContent = myEntries.length;

  if (myEntries.length === 0) {
    container.innerHTML = `<div class="empty-state">📋 આજે હજી કોઈ એન્ટ્રી નથી</div>`;
    return;
  }
  container.innerHTML = myEntries.slice().reverse().map(e => {
    const c = customers.find(x=>x.id===e.customerId);
    const s = staff.find(x=>x.id===e.deliveryBoyId);
    return `<div class="entry-item">
      <div>
        <div class="entry-customer">${c?.name||'—'}</div>
        <div class="entry-meta">${s?.name||'—'} | ${PRODUCT_LABELS[e.product]||''} | ✅ ${e.jugsDelivered} ↗ | 🔄 ${e.jugsReturned} ↩ ${e.jamaJugs>0?`| 🪣 જમા: ${e.jamaJugs}`:''}</div>
      </div>
      <div style="text-align:right">
        <div class="entry-amount">${fmt(e.totalCost)}</div>
        <button class="btn btn-sm btn-ghost" style="margin-top:4px" onclick="showBillModal('${e.billId}')">🧾 બિલ</button>
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════
// CUSTOMERS
// ══════════════════════════════════════════════════════
function renderCustomers(filter) {
  let customers = (db('customers')||[]).filter(c=>c.isActive && c.type!=='company');
  if (filter) {
    const q = filter.toLowerCase();
    customers = customers.filter(c=>c.name.toLowerCase().includes(q)||c.phone.includes(q));
  }
  const tbody = document.getElementById('customers-body');
  if (!tbody) return;
  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-row">કોઈ ગ્રાહક મળ્યો નથી</td></tr>`;
    return;
  }
  tbody.innerHTML = customers.map((c,i) => `
    <tr>
      <td class="text-muted">${i+1}</td>
      <td><strong>${c.name}</strong></td>
      <td>${c.phone}</td>
      <td style="font-size:12px;color:var(--muted);max-width:160px">${c.address}</td>
      <td>${fmt(c.rateJug)}</td>
      <td>${fmt(c.rateBottleHot)}</td>
      <td><span class="font-bold ${c.pendingBalance>0?'text-red':'text-green'}">${fmt(c.pendingBalance)}</span></td>
      <td>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          <button class="btn btn-sm btn-primary" onclick="openPaymentModal('${c.id}')">💰</button>
          <button class="btn btn-sm btn-ghost"   onclick="editCustomer('${c.id}')">✏️</button>
        </div>
      </td>
    </tr>`).join('');
}

function filterCustomers(val) { renderCustomers(val); }

function saveCustomer() {
  const name      = document.getElementById('c-name').value.trim();
  const phone     = document.getElementById('c-phone').value.trim();
  const rateJug   = parseFloat(document.getElementById('c-rate-jug').value)||0;
  const rateHot   = parseFloat(document.getElementById('c-rate-bottle-hot').value)||0;
  const rateCold  = parseFloat(document.getElementById('c-rate-bottle-cold').value)||0;
  const address   = document.getElementById('c-address').value.trim();

  if (!name||!phone||!address) { showToast('બધી માહિતી ભરો', 'error'); return; }

  if (_editCustId) {
    const customers = db('customers');
    const idx = customers.findIndex(c=>c.id===_editCustId);
    if (idx>=0) customers[idx] = {...customers[idx], name, phone, rateJug, rateBottleHot:rateHot, rateBottleCold:rateCold, address};
    saveDb('customers', customers);
    showToast('ગ્રાહક અપડેટ!', 'success');
    _editCustId = null;
  } else {
    if ((db('customers')||[]).find(c=>c.phone===phone)) { showToast('ફોન પહેલેથી નોંધ્યો', 'error'); return; }
    const customers = db('customers');
    customers.push({ id:uid(), name, phone, address, rateJug, rateBottleHot:rateHot, rateBottleCold:rateCold, pendingBalance:0, isActive:true, type:'individual' });
    saveDb('customers', customers);
    showToast(`${name} ઉમેરાઈ ગઈ!`, 'success');
  }

  ['c-name','c-phone','c-rate-jug','c-rate-bottle-hot','c-rate-bottle-cold','c-address'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('custModalTitle').textContent = 'નવો ગ્રાહક ઉમેરો';
  closeModal('addCustomerModal');
  renderCustomers('');
  populateDropdowns();
}

function editCustomer(id) {
  _editCustId = id;
  const c = (db('customers')||[]).find(x=>x.id===id);
  if (!c) return;
  document.getElementById('c-name').value             = c.name;
  document.getElementById('c-phone').value            = c.phone;
  document.getElementById('c-rate-jug').value         = c.rateJug;
  document.getElementById('c-rate-bottle-hot').value  = c.rateBottleHot;
  document.getElementById('c-rate-bottle-cold').value = c.rateBottleCold;
  document.getElementById('c-address').value          = c.address;
  document.getElementById('custModalTitle').textContent = 'ગ્રાહક ફેરફાર';
  openModal('addCustomerModal');
}

// ══════════════════════════════════════════════════════
// COMPANIES
// ══════════════════════════════════════════════════════
function renderCompanies(filterId) {
  let companies = (db('customers')||[]).filter(c=>c.isActive && c.type==='company');
  if (filterId) companies = companies.filter(c=>c.id===filterId);
  const tbody = document.getElementById('companies-body');
  if (!tbody) return;
  if (companies.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-row">કોઈ કંપની નથી</td></tr>`;
    return;
  }
  tbody.innerHTML = companies.map((c,i) => `
    <tr>
      <td>${i+1}</td>
      <td><strong>${c.name}</strong></td>
      <td>${c.contactPerson||'—'}</td>
      <td>${c.phone}</td>
      <td>${fmt(c.rateJug)}</td>
      <td>${fmt(c.rateBottleHot)}</td>
      <td><span class="font-bold ${c.pendingBalance>0?'text-red':'text-green'}">${fmt(c.pendingBalance)}</span></td>
      <td>
        <div style="display:flex;gap:5px">
          <button class="btn btn-sm btn-primary" onclick="openPaymentModal('${c.id}')">💰</button>
          <button class="btn btn-sm btn-ghost"   onclick="editCustomer('${c.id}')">✏️</button>
        </div>
      </td>
    </tr>`).join('');
}

function filterByCompany() {
  const val = document.getElementById('company-filter').value;
  renderCompanies(val);
}

function saveCompany() {
  const name    = document.getElementById('co-name').value.trim();
  const contact = document.getElementById('co-contact').value.trim();
  const phone   = document.getElementById('co-phone').value.trim();
  const rateJug = parseFloat(document.getElementById('co-rate-jug').value)||0;
  const rateHot = parseFloat(document.getElementById('co-rate-bottle-hot').value)||0;
  const rateCold= parseFloat(document.getElementById('co-rate-bottle-cold').value)||0;
  const address = document.getElementById('co-address').value.trim();

  if (!name||!phone) { showToast('નામ અને ફોન ભરો', 'error'); return; }

  const customers = db('customers');
  customers.push({ id:uid(), name, contactPerson:contact, phone, address, rateJug, rateBottleHot:rateHot, rateBottleCold:rateCold, pendingBalance:0, isActive:true, type:'company' });
  saveDb('customers', customers);
  ['co-name','co-contact','co-phone','co-rate-jug','co-rate-bottle-hot','co-rate-bottle-cold','co-address'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  closeModal('addCompanyModal');
  renderCompanies();
  populateDropdowns();
  showToast(`${name} ઉમેરાઈ!`, 'success');
}

// ══════════════════════════════════════════════════════
// STAFF
// ══════════════════════════════════════════════════════
function renderStaff() {
  const staff   = (db('staff')||[]).filter(s=>s.isActive);
  const entries = (db('entries')||[]).filter(e=>e.entryDate===todayISO()&&e.status==='CONFIRMED');
  const damaged = (db('damaged')||[]);
  const grid    = document.getElementById('staff-grid');
  if (!grid) return;
  if (staff.length === 0) {
    grid.innerHTML = `<div class="empty-state">કોઈ સ્ટાફ નથી</div>`;
    return;
  }
  grid.innerHTML = staff.map(s => {
    const my           = entries.filter(e=>e.deliveryBoyId===s.id);
    const delivered    = my.reduce((a,e)=>a+e.jugsDelivered,0);
    const returned     = my.reduce((a,e)=>a+e.jugsReturned,0);
    const jama         = my.reduce((a,e)=>a+(e.jamaJugs||0),0);
    const balance      = delivered + jama - returned;
    const todayDamaged = damaged.filter(d=>d.staffId===s.id&&d.date===todayISO());
    const damagedCount = todayDamaged.reduce((a,d)=>a+(d.count||0),0);

    return `<div class="staff-card">
      <div class="staff-avatar">${s.name.charAt(0)}</div>
      <div class="staff-name">${s.name}</div>
      <div class="staff-phone">📞 ${s.phone}</div>

      <div class="staff-detail-grid">
        <div class="staff-detail-item blue">
          <div class="staff-detail-val">${delivered}</div>
          <div class="staff-detail-lbl">💧 ઉતાર્યા</div>
        </div>
        <div class="staff-detail-item green">
          <div class="staff-detail-val">${returned}</div>
          <div class="staff-detail-lbl">♻️ પરત</div>
        </div>
        <div class="staff-detail-item orange">
          <div class="staff-detail-val">${jama}</div>
          <div class="staff-detail-lbl">🪣 જમા</div>
        </div>
        <div class="staff-detail-item ${balance>0?'red':'green'}">
          <div class="staff-detail-val">${balance}</div>
          <div class="staff-detail-lbl">📦 બાકી</div>
        </div>
      </div>

      ${damagedCount > 0 ? `
        <div class="damaged-bar">⚠️ આજે <strong>${damagedCount}</strong> જગ ખોવાયેલ/તૂટેલ</div>
      ` : ''}

      <div style="display:flex;gap:8px;margin-top:12px;justify-content:center;flex-wrap:wrap">
        <span class="badge badge-success">● સક્રિય</span>
        <button class="btn btn-sm"
          style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;font-size:11px;padding:4px 10px"
          onclick="openDamagedModal('${s.id}','${s.name}')">
          ⚠️ ખોવાયેલ/તૂટેલ
        </button>
      </div>
    </div>`;
  }).join('');
}

// ── Damaged/Lost Jug Tracking ────────────────────────────────────
let _damagedStaffId   = null;
let _damagedStaffName = '';

function openDamagedModal(staffId, staffName) {
  _damagedStaffId   = staffId;
  _damagedStaffName = staffName;
  const modal = document.getElementById('damagedModal');
  if (!modal) return;
  modal.querySelector('#damaged-staff-label').textContent = `સ્ટાફ: ${staffName}`;
  document.getElementById('damaged-count').value    = '1';
  document.getElementById('damaged-type').value     = 'lost';
  document.getElementById('damaged-notes').value    = '';
  openModal('damagedModal');
}

function saveDamaged() {
  const count = parseInt(document.getElementById('damaged-count').value)||0;
  const type  = document.getElementById('damaged-type').value;
  const notes = document.getElementById('damaged-notes').value.trim();

  if (count < 1)       { showToast('સંખ્યા ઓછામાં ઓછી ૧ ભરો', 'error'); return; }
  if (!_damagedStaffId){ showToast('સ્ટાફ select કરો', 'error'); return; }

  const damaged = db('damaged')||[];
  damaged.push({
    id:      uid(),
    staffId: _damagedStaffId,
    staffName: _damagedStaffName,
    count,
    type,   // 'lost' | 'broken'
    notes,
    date:    todayISO(),
    time:    new Date().toLocaleTimeString('gu-IN'),
  });
  saveDb('damaged', damaged);
  closeModal('damagedModal');
  renderStaff();
  const label = type === 'lost' ? 'ખોવાયેલ' : 'તૂટેલ';
  showToast(`⚠️ ${count} ${label} જગ નોંધ્યા — ${_damagedStaffName}`, 'error');
}

function saveStaff() {
  const name  = document.getElementById('s-name').value.trim();
  const phone = document.getElementById('s-phone').value.trim();
  if (!name||!phone) { showToast('નામ અને ફોન ભરો', 'error'); return; }
  const staff = db('staff')||[];
  if (staff.find(s=>s.phone===phone)) { showToast('ફોન નોંધ્યો છે', 'error'); return; }
  staff.push({ id:uid(), name, phone, isActive:true });
  saveDb('staff', staff);
  populateDropdowns();
  closeModal('addStaffModal');
  renderStaff();
  showToast(`${name} ઉમેરાઈ ગઈ!`, 'success');
  document.getElementById('s-name').value = '';
  document.getElementById('s-phone').value = '';
}

// ══════════════════════════════════════════════════════
// BILLS
// ══════════════════════════════════════════════════════
function renderBills(filter) {
  let bills     = (db('bills')||[]).slice().reverse();
  const customers = db('customers')||[];
  const month   = document.getElementById('bill-month-filter')?.value||'';

  if (month)  bills = bills.filter(b=>b.billDate.startsWith(month));
  if (filter) {
    const q = filter.toLowerCase();
    bills = bills.filter(b => {
      const c = customers.find(x=>x.id===b.customerId);
      return b.billNumber.toLowerCase().includes(q)||(c&&c.name.toLowerCase().includes(q));
    });
  }

  const tbody = document.getElementById('bills-body');
  if (!tbody) return;
  if (bills.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-row">કોઈ બિલ મળ્યું નથી</td></tr>`;
    return;
  }
  tbody.innerHTML = bills.map(b => {
    const c = customers.find(x=>x.id===b.customerId);
    return `<tr>
      <td class="font-bold text-blue">${b.billNumber}</td>
      <td>${PRODUCT_LABELS[b.product]||b.product}</td>
      <td>${fmtDate(b.billDate)}</td>
      <td><strong>${c?.name||'—'}</strong><br><span style="font-size:11px;color:var(--muted)">${c?.phone||''}</span></td>
      <td>${b.jugsDelivered}</td>
      <td class="font-bold">${fmt(b.amountDue)}</td>
      <td class="font-bold text-red">${fmt(b.pendingAfter)}</td>
      <td>
        ${b.whatsappSent
          ? `<span class="badge badge-success">✓ મોકલ્યું</span>`
          : `<span class="badge badge-warning">⏳ બાકી</span>`}
      </td>
      <td>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          <button class="btn btn-sm btn-primary" onclick="showBillModal('${b.id}')">🧾 જુઓ</button>
          <button class="btn btn-sm" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0" onclick="downloadBillPDF('${b.id}')">📄 PDF</button>
          <button class="btn btn-sm btn-green" onclick="sendWhatsApp('${b.id}')" title="WhatsApp">📲</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterBills(val)    { renderBills(val); }

function generateMonthlyBills() {
  showToast('📄 માસિક બિલ ફીચર ટૂંક સમયમાં!', 'info');
}

// ══════════════════════════════════════════════════════
// BILL RECEIPT MODAL
// ══════════════════════════════════════════════════════
function showBillModal(billId) {
  _currentBillId = billId; // track for PDF download
  const bill     = (db('bills')||[]).find(b=>b.id===billId);
  if (!bill) return;
  const customer = (db('customers')||[]).find(c=>c.id===bill.customerId);
  const entry    = (db('entries')||[]).find(e=>e.id===bill.dailyEntryId);
  const body     = document.getElementById('bill-modal-body');
  if (!body) return;

  body.innerHTML = `
    <div class="receipt">
      <div class="receipt-header">
        <div class="receipt-company">💧 રીયાન મિનરલ વોટર</div>
        <div class="receipt-addr">૧૨૩ વોટર સ્ટ્રીટ, અમદાવાદ | ફોન: +91 98765 43210</div>
        <div class="receipt-title">ડિલિવરી રસીદ</div>
      </div>
      <div class="receipt-meta">
        <div class="receipt-meta-item"><span>બિલ નં.</span><strong>#${bill.billNumber}</strong></div>
        <div class="receipt-meta-item"><span>તારીખ</span><strong>${fmtDate(bill.billDate)}</strong></div>
      </div>
      <div class="receipt-customer">
        <div class="receipt-customer-name">${customer?.name||'—'}</div>
        <div class="receipt-customer-sub">📞 ${customer?.phone||'—'} | 📍 ${customer?.address||'—'}</div>
      </div>
      <table class="receipt-table">
        <thead><tr><th>વિગત</th><th style="text-align:center">નંગ</th><th style="text-align:center">દર</th><th>રકમ</th></tr></thead>
        <tbody>
          <tr>
            <td>${PRODUCT_LABELS[bill.product]||bill.product} — પહોંચાડ્યા</td>
            <td style="text-align:center">${bill.jugsDelivered}</td>
            <td style="text-align:center">${fmt(bill.ratePerUnit)}</td>
            <td>${fmt(bill.amountDue)}</td>
          </tr>
          ${entry?.jugsReturned>0?`<tr style="color:var(--muted)"><td>ખાલી પરત</td><td style="text-align:center">${entry.jugsReturned}</td><td style="text-align:center">—</td><td>—</td></tr>`:''}
          ${entry?.jamaJugs>0?`<tr style="color:#d97706;background:#fffbeb"><td>🪣 જમા જગ (Deposit)</td><td style="text-align:center">${entry.jamaJugs}</td><td style="text-align:center">—</td><td>—</td></tr>`:''}
          ${entry?.jamaBalance>0?`<tr style="color:#dc2626;font-weight:600"><td>📦 જમા બાકી (Balance)</td><td style="text-align:center">${entry.jamaBalance}</td><td style="text-align:center">—</td><td>—</td></tr>`:''}
        </tbody>
      </table>
      <div class="receipt-totals">
        <div class="receipt-total-row"><span>આજનો ચાર્જ</span><strong>${fmt(bill.amountDue)}</strong></div>
        <div class="receipt-total-row"><span>અગાઉની બાકી</span><strong>${fmt(bill.pendingBefore)}</strong></div>
        <div class="receipt-total-row grand"><span>કુલ બાકી રકમ</span><span>${fmt(bill.pendingAfter)}</span></div>
      </div>
      <div class="receipt-footer">રીયાન મિનરલ વોટર — આભાર! | +91 98765 43210</div>
    </div>`;

  // Update modal footer
  const footer = document.querySelector('#billModal .modal-footer');
  if (footer) {
    footer.innerHTML = `
      <button class="btn btn-ghost" onclick="closeModal('billModal')">બંધ</button>
      <button class="btn btn-green" onclick="sendWhatsApp('${billId}');closeModal('billModal')">📲 WhatsApp</button>
      <button class="btn btn-primary" onclick="downloadBillPDF('${billId}')">📄 PDF Download</button>`;
  }

  openModal('billModal');
}

// ── PDF Download (replaces browser print) ────────────────────────
let _currentBillId = null; // set when bill modal opens

function printBill() {
  if (_currentBillId) {
    downloadBillPDF(_currentBillId);
  }
}

async function downloadBillPDF(billId) {
  const bill     = (db('bills')||[]).find(b => b.id === billId);
  if (!bill) { showToast('બિલ મળ્યું નથી', 'error'); return; }
  const customer = (db('customers')||[]).find(c => c.id === bill.customerId);
  const entry    = (db('entries')||[]).find(e => e.id === bill.dailyEntryId);

  showToast('📄 PDF બનાવી રહ્યા છીએ…', 'info');

  try {
    const res = await fetch('/api/whatsapp/generate-pdf', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        billNumber:    bill.billNumber,
        billSeq:       bill.billNumber.split('-').pop(),
        billDate:      fmtDate(bill.billDate),
        customerName:  customer?.name    || '—',
        phone:         customer?.phone   || '—',
        address:       customer?.address || '—',
        product:       PRODUCT_LABELS[bill.product] || bill.product,
        jugsDelivered: bill.jugsDelivered,
        ratePerUnit:   bill.ratePerUnit,
        amountDue:     bill.amountDue,
        pendingBefore: bill.pendingBefore,
        pendingAfter:  bill.pendingAfter,
        jugsReturned:  entry?.jugsReturned || 0,
        jamaJugs:      entry?.jamaJugs     || 0,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(`❌ ${err.message||'PDF error'}`, 'error');
      return;
    }

    // Force download as PDF — never opens in Word
    const blob = await res.blob();
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    const url  = URL.createObjectURL(pdfBlob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Reeyan-Bill-${bill.billNumber}.pdf`;
    a.type     = 'application/pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    showToast(`✅ PDF Download: Reeyan-Bill-${bill.billNumber}.pdf`, 'success');

  } catch (err) {
    console.error(err);
    showToast('❌ PDF error — console check', 'error');
  }
}

// ══════════════════════════════════════════════════════
// WHATSAPP — Generate PDF + Send via WhatsApp Web
// ══════════════════════════════════════════════════════
async function sendWhatsApp(billId) {
  const bill     = (db('bills')||[]).find(b => b.id === billId);
  if (!bill) { showToast('બિલ મળ્યું નથી', 'error'); return; }
  const customer = (db('customers')||[]).find(c => c.id === bill.customerId);
  if (!customer) { showToast('ગ્રાહક મળ્યો નથી', 'error'); return; }
  const entry    = (db('entries')||[]).find(e => e.id === bill.dailyEntryId);

  showToast('📄 PDF બનાવી રહ્યા છીએ…', 'info');

  // Step 1: Generate PDF on server, get saved filename
  let pdfFilename = null;
  try {
    const pdfRes = await fetch('/api/whatsapp/generate-pdf-save', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        billNumber:    bill.billNumber,
        billSeq:       bill.billNumber.split('-').pop(),
        billDate:      fmtDate(bill.billDate),
        customerName:  customer.name,
        phone:         customer.phone,
        address:       customer.address || '',
        product:       PRODUCT_LABELS[bill.product] || bill.product,
        jugsDelivered: bill.jugsDelivered,
        ratePerUnit:   bill.ratePerUnit,
        amountDue:     bill.amountDue,
        pendingBefore: bill.pendingBefore,
        pendingAfter:  bill.pendingAfter,
        jugsReturned:  entry?.jugsReturned || 0,
        jamaJugs:      entry?.jamaJugs     || 0,
      }),
    });
    if (pdfRes.ok) {
      const d = await pdfRes.json();
      pdfFilename = d.filename;
    }
  } catch(_) {}

  // Step 2: Build PDF download link using current host IP
  // window.location.origin works on LAN too (e.g. http://192.168.1.5:3000)
  const host    = window.location.origin;
  const pdfLink = pdfFilename ? `${host}/pdfs/${pdfFilename}` : '';

  // Step 3: Build WhatsApp message with PDF link
  const msg =
`💧 *Reeyan Mineral Water*
━━━━━━━━━━━━━━━━━━
📋 *Delivery Receipt*

Hello *${customer.name}* 👋

🧾 *Bill No:* #${bill.billNumber}
📅 *Date:* ${fmtDate(bill.billDate)}
📦 *Product:* ${PRODUCT_LABELS[bill.product]||bill.product}
🔢 *Qty:* ${bill.jugsDelivered}  💲 *Rate:* ₹${Number(bill.ratePerUnit).toFixed(0)}/-
${entry?.jugsReturned>0?`♻️ *Returned:* ${entry.jugsReturned}\n`:''}${entry?.jamaJugs>0?`🪣 *Jama:* ${entry.jamaJugs}\n`:''}━━━━━━━━━━━━━━━━━━
💰 *Today: ₹${Number(bill.amountDue).toFixed(0)}/-*
⚠️ *Total Pending: ₹${Number(bill.pendingAfter).toFixed(0)}/-*
━━━━━━━━━━━━━━━━━━
💳 *UPI Pay:* 9712390525@okbizaxis
${pdfLink ? `📄 *PDF Bill (tap to open):*\n${pdfLink}\n` : ''}━━━━━━━━━━━━━━━━━━
Thank you! 🙏
📞 9712390525 | 9016320650`;

  // Step 4: Open WhatsApp with pre-filled message
  let phone = customer.phone.replace(/\D/g,'');
  if (phone.length===10) phone='91'+phone;

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');

  // Mark as sent
  const bills = db('bills');
  const idx = bills.findIndex(b=>b.id===billId);
  if (idx>=0) { bills[idx].whatsappSent=true; saveDb('bills',bills); }

  showToast(`📲 WhatsApp ખૂલ્યું — Send કરો! PDF link included.`, 'success');
  renderBills('');
}

// ══════════════════════════════════════════════════════
// PAYMENT
// ══════════════════════════════════════════════════════
function previewCashPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  _cashPhotoDataUrl = URL.createObjectURL(file);
  document.getElementById('cashPhotoImg').src = _cashPhotoDataUrl;
  document.getElementById('cashPhotoPreview').style.display = 'block';
}

function openPaymentModal(customerId) {
  _payTarget = customerId;
  const c = (db('customers')||[]).find(x=>x.id===customerId);
  if (!c) return;
  const info = document.getElementById('payment-customer-info');
  if (info) info.innerHTML = `
    <div class="receipt-customer">
      <div class="receipt-customer-name">${c.name}</div>
      <div class="receipt-customer-sub">હાલની બાકી: <strong class="text-red">${fmt(c.pendingBalance)}</strong></div>
    </div>`;
  const pa = document.getElementById('pay-amount');
  const pn = document.getElementById('pay-note');
  if (pa) pa.value = '';
  if (pn) pn.value = '';
  document.getElementById('cashPhotoPreview').style.display = 'none';
  openModal('paymentModal');
}

function savePayment() {
  const amount = parseFloat(document.getElementById('pay-amount').value);
  const method = document.getElementById('pay-method').value;
  const note   = document.getElementById('pay-note').value.trim();

  if (!amount||amount<=0) { showToast('માન્ય રકમ ભરો', 'error'); return; }
  if (!_payTarget)         { showToast('ગ્રાહક નથી', 'error');    return; }

  const customers = db('customers');
  const idx = customers.findIndex(c=>c.id===_payTarget);
  if (idx<0) return;

  customers[idx].pendingBalance = Math.max(0, customers[idx].pendingBalance - amount);
  saveDb('customers', customers);

  const payments = db('payments')||[];
  payments.push({ id:uid(), customerId:_payTarget, amount, method, note, photoUrl:_cashPhotoDataUrl, paidAt:new Date().toISOString() });
  saveDb('payments', payments);

  _cashPhotoDataUrl = null;
  closeModal('paymentModal');
  showToast(`💰 ${fmt(amount)} ની ચુકવણી!`, 'success');
  renderCustomers('');
  renderDashboard();
}

// ══════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════
function switchTab(id, e) {
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  if (e && e.target) e.target.classList.add('active');
  if (id==='ledger')  loadLedger();
  if (id==='monthly') loadMonthlyReport();
}

function loadDailyReport() {
  const date      = document.getElementById('report-date')?.value||todayISO();
  const entries   = (db('entries')||[]).filter(e=>e.entryDate===date&&e.status==='CONFIRMED');
  const customers = db('customers')||[];
  const staff     = db('staff')||[];

  const jugs     = entries.filter(e=>e.product==='jug_chilled').reduce((s,e)=>s+e.jugsDelivered,0);
  const bottles  = entries.filter(e=>e.product!=='jug_chilled').reduce((s,e)=>s+e.jugsDelivered,0);
  const revenue  = entries.reduce((s,e)=>s+e.totalCost,0);

  const rs = document.getElementById('report-stats');
  if (rs) rs.innerHTML = `
    <div class="stat-card blue"><div class="stat-icon">📦</div><div class="stat-info"><div class="stat-value">${entries.length}</div><div class="stat-label">એન્ટ્રી</div></div></div>
    <div class="stat-card green"><div class="stat-icon">💧</div><div class="stat-info"><div class="stat-value">${jugs}</div><div class="stat-label">જગ</div></div></div>
    <div class="stat-card orange"><div class="stat-icon">🍶</div><div class="stat-info"><div class="stat-value">${bottles}</div><div class="stat-label">બોટલ</div></div></div>
    <div class="stat-card red"><div class="stat-icon">₹</div><div class="stat-info"><div class="stat-value">${fmt(revenue)}</div><div class="stat-label">આવક</div></div></div>`;

  const tbody = document.getElementById('report-table-body');
  if (!tbody) return;
  if (entries.length===0) {
    tbody.innerHTML=`<tr><td colspan="5" class="empty-row">${fmtDate(date)} — કોઈ નોંધ નથી</td></tr>`;
    return;
  }
  tbody.innerHTML = entries.map(e => {
    const c=customers.find(x=>x.id===e.customerId);
    const s=staff.find(x=>x.id===e.deliveryBoyId);
    return `<tr>
      <td><strong>${c?.name||'—'}</strong></td>
      <td>${s?.name||'—'}</td>
      <td>${PRODUCT_LABELS[e.product]||e.product}</td>
      <td><span class="badge badge-info">${e.jugsDelivered}</span></td>
      <td class="font-bold text-blue">${fmt(e.totalCost)}</td>
    </tr>`;
  }).join('');
}

function loadLedger() {
  const customerId = document.getElementById('ledger-customer')?.value;
  const lc = document.getElementById('ledger-content');
  if (!customerId||!lc) { if(lc) lc.innerHTML=''; return; }

  const c        = (db('customers')||[]).find(x=>x.id===customerId);
  const entries  = (db('entries')||[]).filter(e=>e.customerId===customerId&&e.status==='CONFIRMED');
  const payments = (db('payments')||[]).filter(p=>p.customerId===customerId);
  const methodMap= { CASH:'રોકડ', UPI:'UPI', BANK:'બેંક', OTHER:'અન્ય' };

  const allTx = [
    ...entries.map(e=>({ date:e.entryDate, desc:`${e.jugsDelivered} ${PRODUCT_LABELS[e.product]||''} `, debit:e.totalCost, credit:0 })),
    ...payments.map(p=>({ date:p.paidAt.split('T')[0], desc:`ચુકવણી (${methodMap[p.method]||p.method})`, debit:0, credit:p.amount })),
  ].sort((a,b)=>a.date.localeCompare(b.date));

  let running = 0;
  const rows = allTx.map(t => {
    running += t.debit - t.credit;
    return `<tr>
      <td>${fmtDate(t.date)}</td><td>${t.desc}</td>
      <td class="${t.debit>0?'text-red font-bold':''}">${t.debit>0?fmt(t.debit):'—'}</td>
      <td class="${t.credit>0?'text-green font-bold':''}">${t.credit>0?fmt(t.credit):'—'}</td>
      <td class="font-bold ${running>0?'text-red':'text-green'}">${fmt(running)}</td>
    </tr>`;
  }).join('');

  lc.innerHTML = `
    <div class="ledger-balance">
      <div><strong style="font-size:16px">${c.name}</strong><div style="font-size:12px;color:var(--muted)">📞 ${c.phone}</div></div>
      <div style="text-align:right">
        <div style="font-size:11px;color:var(--muted);font-weight:600">બાકી</div>
        <div style="font-size:22px;font-weight:800;color:var(--red)">${fmt(c.pendingBalance)}</div>
      </div>
    </div>
    <div class="card"><div class="card-header"><h3 class="card-title">વ્યવહારો</h3></div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>તારીખ</th><th>વિગત</th><th>ઉધાર</th><th>જમા</th><th>બાકી</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="5" class="empty-row">કોઈ વ્યવહાર નથી</td></tr>'}</tbody>
    </table></div></div>`;
}

function loadMonthlyReport() {
  const month   = document.getElementById('monthly-month')?.value||todayISO().slice(0,7);
  const entries = (db('entries')||[]).filter(e=>e.entryDate.startsWith(month)&&e.status==='CONFIRMED');
  const customers=(db('customers')||[]);
  const mc = document.getElementById('monthly-content');
  if (!mc) return;

  const byCustomer = {};
  entries.forEach(e => {
    if (!byCustomer[e.customerId]) byCustomer[e.customerId] = { jugs:0, bottles:0, total:0 };
    if (e.product==='jug_chilled') byCustomer[e.customerId].jugs += e.jugsDelivered;
    else byCustomer[e.customerId].bottles += e.jugsDelivered;
    byCustomer[e.customerId].total += e.totalCost;
  });

  const totalRev = Object.values(byCustomer).reduce((s,v)=>s+v.total,0);
  const rows = Object.entries(byCustomer).map(([cid, v]) => {
    const c = customers.find(x=>x.id===cid);
    return `<tr><td><strong>${c?.name||'—'}</strong></td><td>${v.jugs}</td><td>${v.bottles}</td><td class="font-bold text-blue">${fmt(v.total)}</td></tr>`;
  }).join('');

  mc.innerHTML = `
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue"><div class="stat-icon">📦</div><div class="stat-info"><div class="stat-value">${entries.length}</div><div class="stat-label">ડિ.</div></div></div>
      <div class="stat-card red"><div class="stat-icon">₹</div><div class="stat-info"><div class="stat-value">${fmt(totalRev)}</div><div class="stat-label">આવક</div></div></div>
    </div>
    <div class="card"><div class="card-header"><h3 class="card-title">ગ્રાહક-વાર સારાંશ</h3></div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>ગ્રાહક</th><th>💧 જગ</th><th>🍶 બોટ.</th><th>₹ કુલ</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="4" class="empty-row">કોઈ ડેટા નથી</td></tr>'}</tbody>
    </table></div></div>`;
}

// ══════════════════════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════════════════════
async function loadSettings() {
  try {
    const res  = await fetch('/api/settings/whatsapp');
    const data = await res.json();
    const badge = document.getElementById('wa-status-badge');
    const testSection = document.getElementById('wa-test-section');

    if (data.configured) {
      if (badge) {
        badge.textContent  = '✅ Connected';
        badge.className    = 'badge badge-success';
      }
      // Show token preview (masked)
      const tokenEl   = document.getElementById('wa-token');
      const phoneIdEl = document.getElementById('wa-phone-id');
      if (tokenEl)   tokenEl.placeholder   = data.tokenPreview   || 'Token set ✓';
      if (phoneIdEl) phoneIdEl.placeholder = data.phoneIdPreview || 'Phone ID set ✓';
      if (testSection) testSection.style.display = 'block';
    } else {
      if (badge) {
        badge.textContent = '⚠️ Configure કરો';
        badge.className   = 'badge badge-warning';
      }
      if (testSection) testSection.style.display = 'none';
    }
  } catch (_) {}
}

async function saveWASettings() {
  const token   = document.getElementById('wa-token')?.value.trim();
  const phoneId = document.getElementById('wa-phone-id')?.value.trim();

  if (!token || !phoneId) {
    showToast('Token અને Phone ID બંને ભરો', 'error'); return;
  }

  try {
    const res  = await fetch('/api/settings/whatsapp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, phoneNumberId: phoneId }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('✅ WhatsApp credentials સચવાઈ!', 'success');
      document.getElementById('wa-token').value   = '';
      document.getElementById('wa-phone-id').value = '';
      loadSettings();
    } else {
      showToast(data.message || 'Error', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

async function testWhatsApp() {
  const phone = document.getElementById('wa-test-phone')?.value.trim();
  if (!phone) { showToast('Test phone number ભરો', 'error'); return; }
  showToast('📲 Test message મોકલી રહ્યા છીએ…', 'info');
  try {
    const res  = await fetch('/api/whatsapp/send-bill', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        phone,
        customerName:  'Test Customer',
        billNumber:    'TEST-001',
        amountDue:     100,
        pendingBefore: 0,
        pendingAfter:  100,
        jugsDelivered: 2,
        jugsReturned:  0,
        jamaJugs:      0,
        product:       '💧 જગ (ઠ.)',
        ratePerUnit:   50,
        billDate:      fmtDate(todayISO()),
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('✅ Test message sent! Check WhatsApp', 'success');
    } else {
      showToast(`❌ ${data.message}`, 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

function saveAppSettings() {
  const name    = document.getElementById('set-app-name')?.value.trim();
  const address = document.getElementById('set-app-address')?.value.trim();
  const phone   = document.getElementById('set-app-phone')?.value.trim();
  // Save to localStorage for receipt use
  if (name)    localStorage.setItem('aqp_app_name',    name);
  if (address) localStorage.setItem('aqp_app_address', address);
  if (phone)   localStorage.setItem('aqp_app_phone',   phone);
  showToast('✅ Business info saved!', 'success');
}

// ══════════════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════════════
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ══════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════
let _toastTimer;
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = `toast ${type}`;
  clearTimeout(_toastTimer);
  setTimeout(() => t.classList.add('show'), 10);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}
