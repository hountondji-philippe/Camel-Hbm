// ===== ADMIN PANEL - VERSION COMPLÈTE =====

// === PROTECTION ===
(function() {
  // Bloquer les raccourcis développeur
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); window.location.href = 'about:blank'; }
    if (e.ctrlKey && e.shiftKey && e.key === 'I') e.preventDefault();
    if (e.key === 'F12') e.preventDefault();
    if (e.ctrlKey && e.key === 's') e.preventDefault();
    if (e.ctrlKey && e.key === 'p') e.preventDefault();
  });

  // Bloquer le clic droit
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });

  // Bloquer la sélection de texte
  document.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
  });
})();

// === CONFIGURATION FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyC1_1e0yB3aXOzFV6cdV8kBb62KamXvoZU",
  authDomain: "portfolio-8a07b.firebaseapp.com",
  databaseURL: "https://portfolio-8a07b-default-rtdb.firebaseio.com",
  projectId: "portfolio-8a07b",
  storageBucket: "portfolio-8a07b.firebasestorage.app",
  messagingSenderId: "52650351835",
  appId: "1:52650351835:web:3b81f55313e114de36c0fe"
};

// === IDENTIFIANTS ADMIN ===
const ADMIN_EMAIL = 'hountondjiphilippe58@gmail.com';
const ADMIN_PASSWORD = '65philippa29?!?!';

// === VARIABLES GLOBALES ===
let db;
let auth;
let isAuthenticated = false;
let allMessages = [];
let currentMessageId = null;
let messagesChartInstance = null;
let statusChartInstance = null;

// === PROTECTION AU CHARGEMENT ===
(function() {
  const dashboard = document.getElementById('dashboard');
  const loginPage = document.getElementById('loginPage');
  
  if (dashboard) {
    dashboard.classList.add('hidden');
  }
})();

// === ÉLÉMENTS DU DOM ===
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');

// Pages
const pages = {
  overview: document.getElementById('overviewPage'),
  messages: document.getElementById('messagesPage'),
  analytics: document.getElementById('analyticsPage'),
  settings: document.getElementById('settingsPage')
};

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('pageTitle');

// Modal
const messageModal = document.getElementById('messageModal');
const closeModalBtn = document.getElementById('closeModal');
const modalCloseX = document.querySelector('.modal-close');

// Boutons
const refreshBtn = document.getElementById('refreshBtn');
const togglePassword = document.querySelector('.toggle-password');

// === INITIALISATION FIREBASE ===
function initializeFirebase() {
  try {
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK non chargé !');
      return false;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    auth = firebase.auth();
    db = firebase.database();

    return true;
  } catch (error) {
    console.error('Erreur Firebase:', error);
    return false;
  }
}

// === FONCTION UTILITAIRE ===
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// === AUTHENTIFICATION ===
window.addEventListener('load', function() {
  if (dashboard) {
    dashboard.classList.add('hidden');
  }
  
  if (!initializeFirebase()) {
    return;
  }
  
  const savedAuth = localStorage.getItem('adminAuth');
  
  if (savedAuth) {
    try {
      const authData = JSON.parse(savedAuth);
      if (Date.now() - authData.timestamp < 3600000) {
        isAuthenticated = true;
        showDashboard();
        loadMessages();
        return;
      } else {
        localStorage.removeItem('adminAuth');
      }
    } catch (error) {
      localStorage.removeItem('adminAuth');
    }
  }
});

// Connexion
loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  
  if (!email || !password) {
    loginError.querySelector('span').textContent = 'Veuillez remplir tous les champs';
    loginError.style.display = 'flex';
    return;
  }
  
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
  
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    if (rememberMe) {
      localStorage.setItem('adminAuth', JSON.stringify({
        email: email,
        timestamp: Date.now()
      }));
    }
    
    isAuthenticated = true;
    loginError.style.display = 'none';
    showDashboard();
    loadMessages();
    showNotification('Connexion réussie !', 'success');
  } else {
    loginError.querySelector('span').textContent = 'Email ou mot de passe incorrect';
    loginError.style.display = 'flex';
    loginForm.classList.add('shake');
    setTimeout(() => loginForm.classList.remove('shake'), 500);
  }
  
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalText;
});

// Fonction pour afficher le dashboard
function showDashboard() {
  if (loginPage) {
    loginPage.style.display = 'none';
  }
  
  if (dashboard) {
    dashboard.classList.remove('hidden');
  }
}

// Déconnexion
logoutBtn.addEventListener('click', function() {
  localStorage.removeItem('adminAuth');
  isAuthenticated = false;
  allMessages = [];
  
  if (dashboard) {
    dashboard.classList.add('hidden');
  }
  
  if (loginPage) {
    loginPage.style.display = 'flex';
  }
  
  loginForm.reset();
  document.getElementById('adminEmail').value = ADMIN_EMAIL;
  
  showNotification('Déconnexion réussie', 'info');
});

// Toggle password
if (togglePassword) {
  togglePassword.addEventListener('click', function() {
    const passwordInput = document.getElementById('adminPassword');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      passwordInput.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  });
}

// === CHARGEMENT DES MESSAGES DEPUIS FIREBASE ===
function loadMessages() {
  if (!isAuthenticated) {
    return;
  }
  
  db.ref('messages').on('value', function(snapshot) {
    allMessages = [];
    
    snapshot.forEach(function(childSnapshot) {
      const message = childSnapshot.val();
      message.id = childSnapshot.key;
      allMessages.push(message);
    });
    
    allMessages.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    updateDashboard();
  }, function(error) {
    console.error('Erreur Firebase:', error);
    showNotification('Erreur lors du chargement des messages', 'error');
  });
}

// === MISE À JOUR DU DASHBOARD ===
function updateDashboard() {
  updateStats();
  updateRecentMessages();
  updateMessagesList();
  updateAnalytics();
}

function updateStats() {
  const total = allMessages.length;
  const read = allMessages.filter(m => m.read).length;
  const unread = total - read;
  
  const today = allMessages.filter(m => {
    const msgDate = new Date(m.date);
    const todayDate = new Date();
    return msgDate.toDateString() === todayDate.toDateString();
  }).length;
  
  document.getElementById('totalMessages').textContent = total;
  document.getElementById('readMessages').textContent = read;
  document.getElementById('unreadMessages').textContent = unread;
  document.getElementById('todayMessages').textContent = today;
  document.getElementById('messageCount').textContent = unread;
}

function updateRecentMessages() {
  const container = document.getElementById('recentMessagesList');
  const recent = allMessages.slice(0, 5);
  
  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Aucun message</h3><p>Les messages du formulaire apparaîtront ici</p></div>';
    return;
  }
  
  container.innerHTML = recent.map(msg => createMessageHTML(msg)).join('');
  attachMessageListeners();
}

function updateMessagesList() {
  const container = document.getElementById('messagesList');
  
  if (allMessages.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Aucun message</h3><p>Les messages du formulaire apparaîtront ici</p></div>';
    return;
  }
  
  container.innerHTML = allMessages.map(msg => createMessageHTML(msg, true)).join('');
  attachMessageListeners();
}

function createMessageHTML(msg, showActions = false) {
  const unreadClass = msg.read ? '' : 'unread';
  const preview = msg.message.length > 100 ? msg.message.substring(0, 100) + '...' : msg.message;
  const date = formatDate(msg.date);
  
  let actions = '';
  if (showActions) {
    actions = `
      <div class="message-actions">
        <button class="btn-small mark-read" data-id="${msg.id}">
          <i class="fas ${msg.read ? 'fa-envelope' : 'fa-envelope-open'}"></i>
          ${msg.read ? 'Marquer non lu' : 'Marquer lu'}
        </button>
        <button class="btn-small danger delete-msg" data-id="${msg.id}">
          <i class="fas fa-trash"></i>
          Supprimer
        </button>
      </div>
    `;
  }
  
  return `
    <div class="message-item ${unreadClass}" data-id="${msg.id}">
      <div class="message-header">
        <div class="message-sender">
          <i class="fas fa-user"></i>
          ${escapeHtml(msg.name)}
        </div>
        <div class="message-date">
          <i class="fas fa-clock"></i>
          ${date}
        </div>
      </div>
      <div class="message-email">
        <i class="fas fa-envelope"></i>
        ${escapeHtml(msg.email)}
      </div>
      <div class="message-preview">${escapeHtml(preview)}</div>
      ${actions}
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function attachMessageListeners() {
  document.querySelectorAll('.message-item').forEach(item => {
    item.addEventListener('click', function(e) {
      if (!e.target.closest('.message-actions')) {
        openMessageModal(this.dataset.id);
      }
    });
  });
  
  document.querySelectorAll('.mark-read').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleReadStatus(this.dataset.id);
    });
  });
  
  document.querySelectorAll('.delete-msg').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      deleteMessage(this.dataset.id);
    });
  });
}

// === MODAL ===
function openMessageModal(id) {
  const message = allMessages.find(m => m.id === id);
  if (!message) return;
  
  currentMessageId = id;
  
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <div class="modal-detail">
      <div class="modal-field">
        <label><i class="fas fa-user"></i> Nom</label>
        <div class="value">${escapeHtml(message.name)}</div>
      </div>
      
      <div class="modal-field">
        <label><i class="fas fa-envelope"></i> Email</label>
        <div class="value">${escapeHtml(message.email)}</div>
      </div>
      
      <div class="modal-field">
        <label><i class="fas fa-clock"></i> Date</label>
        <div class="value">${formatDate(message.date)}</div>
      </div>
      
      <div class="modal-field">
        <label><i class="fas fa-comment"></i> Message</label>
        <div class="value" style="white-space: pre-wrap;">${escapeHtml(message.message)}</div>
      </div>
    </div>
  `;
  
  messageModal.classList.add('active');
  
  if (!message.read) {
    markAsRead(id);
  }
}

function closeMessageModal() {
  messageModal.classList.remove('active');
  currentMessageId = null;
}

closeModalBtn.addEventListener('click', closeMessageModal);
modalCloseX.addEventListener('click', closeMessageModal);
messageModal.addEventListener('click', function(e) {
  if (e.target === this) closeMessageModal();
});

document.getElementById('deleteMessage').addEventListener('click', function() {
  if (currentMessageId) {
    deleteMessage(currentMessageId);
    closeMessageModal();
  }
});

// === ACTIONS SUR LES MESSAGES ===
function markAsRead(id) {
  db.ref('messages/' + id).update({ read: true })
    .then(() => console.log('Message marqué comme lu'))
    .catch(error => console.error('Erreur:', error));
}

function toggleReadStatus(id) {
  const message = allMessages.find(m => m.id === id);
  if (!message) return;
  
  db.ref('messages/' + id).update({ read: !message.read })
    .then(() => showNotification(`Message marqué comme ${!message.read ? 'lu' : 'non lu'}`, 'success'))
    .catch(error => {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la mise à jour', 'error');
    });
}

function deleteMessage(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;
  
  db.ref('messages/' + id).remove()
    .then(() => showNotification('Message supprimé', 'success'))
    .catch(error => {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la suppression', 'error');
    });
}

// === RECHERCHE ET FILTRES ===
const searchInput = document.getElementById('searchMessages');
const filterSelect = document.getElementById('filterMessages');
const sortSelect = document.getElementById('sortMessages');

if (searchInput) searchInput.addEventListener('input', applyFilters);
if (filterSelect) filterSelect.addEventListener('change', applyFilters);
if (sortSelect) sortSelect.addEventListener('change', applyFilters);

function applyFilters() {
  let filtered = [...allMessages];
  
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(msg =>
      msg.name.toLowerCase().includes(searchTerm) ||
      msg.email.toLowerCase().includes(searchTerm) ||
      msg.message.toLowerCase().includes(searchTerm)
    );
  }
  
  const filterValue = filterSelect.value;
  if (filterValue === 'read') filtered = filtered.filter(msg => msg.read);
  else if (filterValue === 'unread') filtered = filtered.filter(msg => !msg.read);
  
  const sortValue = sortSelect.value;
  if (sortValue === 'newest') {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortValue === 'oldest') {
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
  
  const container = document.getElementById('messagesList');
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>Aucun résultat</h3><p>Aucun message ne correspond à votre recherche</p></div>';
    return;
  }
  
  container.innerHTML = filtered.map(msg => createMessageHTML(msg, true)).join('');
  attachMessageListeners();
}

// === ACTIONS RAPIDES ===
document.querySelectorAll('.action-card').forEach(card => {
  card.addEventListener('click', function() {
    const action = this.dataset.action;
    
    if (action === 'export') exportData();
    else if (action === 'delete-all-read') deleteAllRead();
    else if (action === 'mark-all-read') markAllAsRead();
  });
});

function exportData() {
  const dataStr = JSON.stringify(allMessages, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `messages-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showNotification('Données exportées', 'success');
}

function deleteAllRead() {
  const readMessages = allMessages.filter(m => m.read);
  if (readMessages.length === 0) {
    showNotification('Aucun message lu à supprimer', 'info');
    return;
  }
  
  if (!confirm(`Supprimer ${readMessages.length} message(s) lu(s) ?`)) return;
  
  const promises = readMessages.map(msg => db.ref('messages/' + msg.id).remove());
  
  Promise.all(promises)
    .then(() => showNotification(`${readMessages.length} messages supprimés`, 'success'))
    .catch(error => {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la suppression', 'error');
    });
}

function markAllAsRead() {
  if (!confirm('Marquer tous les messages comme lus ?')) return;
  
  const promises = allMessages.map(msg => db.ref('messages/' + msg.id).update({ read: true }));
  
  Promise.all(promises)
    .then(() => showNotification('Tous les messages marqués comme lus', 'success'))
    .catch(error => {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la mise à jour', 'error');
    });
}

// === ANALYTICS ===
function updateAnalytics() {
  updateMessagesChart();
  updateStatusChart();
  updateAnalyticsInfo();
}

function updateMessagesChart() {
  const ctx = document.getElementById('messagesChart');
  if (!ctx) return;
  
  const labels = [];
  const data = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
    
    const count = allMessages.filter(msg => {
      const msgDate = new Date(msg.date);
      return msgDate.toDateString() === date.toDateString();
    }).length;
    
    data.push(count);
  }
  
  if (messagesChartInstance) messagesChartInstance.destroy();
  
  messagesChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Messages reçus',
        data: data,
        borderColor: '#FF6B35',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#B4B8D4' } }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#B4B8D4', stepSize: 1 },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        x: {
          ticks: { color: '#B4B8D4' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      }
    }
  });
}

function updateStatusChart() {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;
  
  const read = allMessages.filter(m => m.read).length;
  const unread = allMessages.length - read;
  
  if (statusChartInstance) statusChartInstance.destroy();
  
  statusChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Lus', 'Non lus'],
      datasets: [{
        data: [read, unread],
        backgroundColor: ['#10B981', '#FF6B35'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#B4B8D4' } }
      }
    }
  });
}

function updateAnalyticsInfo() {
  if (allMessages.length === 0) {
    document.getElementById('firstMessageDate').textContent = '-';
    document.getElementById('lastMessageDate').textContent = '-';
    document.getElementById('avgMessagesPerDay').textContent = '-';
    return;
  }
  
  const dates = allMessages.map(m => new Date(m.date));
  const firstDate = new Date(Math.min(...dates));
  const lastDate = new Date(Math.max(...dates));
  
  document.getElementById('firstMessageDate').textContent = formatDate(firstDate.toISOString());
  document.getElementById('lastMessageDate').textContent = formatDate(lastDate.toISOString());
  
  const daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) || 1;
  const avg = (allMessages.length / daysDiff).toFixed(1);
  document.getElementById('avgMessagesPerDay').textContent = `${avg} messages/jour`;
}

// === PARAMÈTRES ===
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    showNotification('Pour changer le mot de passe, modifiez les constantes ADMIN_EMAIL et ADMIN_PASSWORD dans le code', 'info');
  });
}

document.getElementById('deleteAllMessages').addEventListener('click', function() {
  if (!confirm('Supprimer TOUS les messages ?')) return;
  if (!confirm('Êtes-vous absolument sûr ?')) return;
  
  db.ref('messages').remove()
    .then(() => showNotification('Tous les messages supprimés', 'warning'))
    .catch(error => {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la suppression', 'error');
    });
});

// === REFRESH ===
if (refreshBtn) {
  refreshBtn.addEventListener('click', function() {
    this.querySelector('i').classList.add('fa-spin');
    loadMessages();
    setTimeout(() => {
      refreshBtn.querySelector('i').classList.remove('fa-spin');
    }, 1000);
    showNotification('Données rafraîchies', 'info');
  });
}

// === NOTIFICATIONS ===
document.getElementById('notificationsBtn').addEventListener('click', function() {
  const unreadCount = allMessages.filter(m => !m.read).length;
  
  if (unreadCount === 0) {
    showNotification('Aucune nouvelle notification', 'info');
  } else {
    showNotification(`Vous avez ${unreadCount} message(s) non lu(s)`, 'info');
  }
});

// === NAVIGATION ===
navItems.forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    const pageName = this.dataset.page;
    
    navItems.forEach(nav => nav.classList.remove('active'));
    this.classList.add('active');
    
    Object.keys(pages).forEach(key => pages[key].classList.remove('active'));
    pages[pageName].classList.add('active');
    
    const titles = {
      overview: 'Vue d\'ensemble',
      messages: 'Messages',
      analytics: 'Statistiques',
      settings: 'Paramètres'
    };
    pageTitle.textContent = titles[pageName];
    
    if (window.innerWidth <= 992) {
      sidebar.classList.remove('active');
    }
    
    if (pageName === 'analytics') {
      setTimeout(() => {
        updateAnalytics();
        if (messagesChartInstance) messagesChartInstance.resize();
        if (statusChartInstance) statusChartInstance.resize();
      }, 100);
    }
  });
});

if (menuToggle) {
  menuToggle.addEventListener('click', function() {
    sidebar.classList.toggle('active');
  });
}

window.addEventListener('resize', function() {
  if (messagesChartInstance) messagesChartInstance.resize();
  if (statusChartInstance) statusChartInstance.resize();
});

// === UTILITAIRES ===
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'À l\'instant';
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  }
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  }
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

console.log('%c🔒 Admin Panel Chargé', 'color: #10B981; font-size: 24px; font-weight: bold;');

