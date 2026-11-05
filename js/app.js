let allCardsData = [];
let quizQuestions = [];
let currentUser = null; 

document.addEventListener('DOMContentLoaded', () => {
  loadCardsJSONL();
  loadQuizJSONL();
  const savedTheme = localStorage.getItem('petthinks_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    updateThemeButton(true);
  }
});

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('petthinks_theme', isDark ? 'dark' : 'light');
  updateThemeButton(isDark);
}

function updateThemeButton(isDark) {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  if (isDark) {
    btn.innerHTML = '☀️ <span class="theme-text">Claro</span>';
  } else {
    btn.innerHTML = '🌙 <span class="theme-text">Oscuro</span>';
  }
}

async function loadCardsJSONL() {
  allCardsData = [];
  await fetchJSONL('assets/data/perros.jsonl');
  await fetchJSONL('assets/data/gatos.jsonl');
  renderCards(allCardsData);
}

async function fetchJSONL(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return;
    const text = await res.text();
    text.split('\n').filter(l => l.trim() !== '').forEach(line => {
      try { allCardsData.push(JSON.parse(line)); } catch(e){}
    });
  } catch(e) { console.error("Error al cargar JSONL:", e); }
}

function renderCards(cards) {
  const container = document.getElementById('cardsGrid');
  container.innerHTML = '';

  if (cards.length === 0) {
    container.innerHTML = '<p style="color: #718096;">No se encontraron fichas informativas.</p>';
    return;
  }

  cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.setAttribute('data-species', card.especie);
    cardEl.onclick = () => openDetailModal(card.id);

    const imgSrc = card.imagen_low || card.imagen || 'https://via.placeholder.com/300x160?text=PetThinks';

    cardEl.innerHTML = `
      <img src="${imgSrc}" class="card-img" alt="${card.raza}" loading="lazy">
      <span class="card-badge">${card.especie.toUpperCase()}</span>
      <h3>${card.raza}</h3>
      <p>${card.resumen}</p>
    `;
    container.appendChild(cardEl);
  });
}

function openDetailModal(id) {
  const item = allCardsData.find(c => c.id === id);
  if (!item) return;

  const highImgSrc = item.imagen_high || item.imagen_low || item.imagen || 'https://via.placeholder.com/600x250?text=PetThinks+HD';

  let fuentesHTML = '';
  if (Array.isArray(item.fuentes) && item.fuentes.length > 0) {
    fuentesHTML = `<ul class="sources-list">${item.fuentes.map(f => `<li>${f}</li>`).join('')}</ul>`;
  }

  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <img src="${highImgSrc}" class="modal-header-img" alt="${item.raza}">
      <span class="card-badge" style="margin-top:0.8rem;">${item.especie.toUpperCase()}</span>
      <h2 style="color:var(--primary); margin-top:0.3rem;">${item.raza}</h2>
    </div>

    <div class="modal-section">
      <h4>📌 Información General</h4>
      <p>${item.info_general}</p>
    </div>

    <div class="modal-section">
      <h4>🍖 Alimentación</h4>
      <p>${item.alimentacion}</p>
    </div>

    <div class="modal-section">
      <h4>🛁 Cuidados y Bañado</h4>
      <p>${item.banado}</p>
    </div>

    <div class="modal-section">
      <h4>💉 Esquema de Vacunación</h4>
      <p>${item.vacunas}</p>
    </div>

    <div class="modal-section sources-section">
      <h4>📚 Fuentes / Referencias Médicas</h4>
      ${fuentesHTML}
    </div>
  `;

  document.getElementById('detailModal').classList.add('active');
}

function closeModal(event) {
  if (!event || event.target.id === 'detailModal' || event.target.classList.contains('modal-close')) {
    document.getElementById('detailModal').classList.remove('active');
  }
}

async function loadQuizJSONL() {
  try {
    const res = await fetch('assets/data/preguntas.jsonl');
    if (!res.ok) return;
    const text = await res.text();
    quizQuestions = text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
    loadRandomQuestion();
  } catch(e) { console.error("Error al cargar preguntas:", e); }
}

function loadRandomQuestion() {
  if (quizQuestions.length === 0) return;
  
  const q = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
  document.getElementById('quizQuestion').innerText = q.pregunta;

  const options = [
    { text: q.correcta, isCorrect: true },
    { text: q.incorrecta1, isCorrect: false },
    { text: q.incorrecta2, isCorrect: false },
    { text: q.incorrecta3, isCorrect: false }
  ].filter(o => o.text).sort(() => Math.random() - 0.5);

  const optionsContainer = document.getElementById('quizOptions');
  optionsContainer.innerHTML = '';

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'btn-option';
    btn.innerText = opt.text;
    btn.onclick = () => {
      if (opt.isCorrect) {
        alert('¡Correcto! Respuesta acertada.');
        if (currentUser) currentUser.Puntuacion_Total += 10;
      } else {
        alert('Incorrecto, ¡sigue intentándolo!');
      }
    };
    optionsContainer.appendChild(btn);
  });
}

function switchView(viewId, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
  
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (viewId === 'accountView') {
    checkUserSession();
  }
}

function showAccountSubView(subView) {
  document.getElementById('loginBox').style.display = subView === 'login' ? 'block' : 'none';
  document.getElementById('registerBox').style.display = subView === 'register' ? 'block' : 'none';
  document.getElementById('profileBox').style.display = subView === 'profile' ? 'block' : 'none';
}

function checkUserSession() {
  const navBtn = document.getElementById('accountNavBtn');
  if (currentUser) {
    navBtn.innerText = 'Mi Perfil (' + currentUser.Nombre + ')';
    document.getElementById('profileName').innerText = currentUser.Nombre;
    document.getElementById('profileEmail').innerText = currentUser.Correo;
    document.getElementById('profilePet').innerText = currentUser.Mascota || '🐶 Perros';
    document.getElementById('profilePoints').innerText = '⭐ ' + currentUser.Puntuacion_Total + ' pts';
    document.getElementById('profileAvatar').innerText = currentUser.Nombre.substring(0, 2).toUpperCase();
    showAccountSubView('profile');
  } else {
    navBtn.innerText = 'Iniciar Sesión / Registro';
    showAccountSubView('login');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  currentUser = {
    Usuario_ID: 1,
    Nombre: email.split('@')[0],
    Correo: email,
    Fecha_Registro: new Date().toISOString(),
    Puntuacion_Total: 150,
    Mascota: 'Perro'
  };
  checkUserSession();
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const pet = document.getElementById('regPet').value;

  currentUser = {
    Usuario_ID: Math.floor(Math.random() * 1000),
    Nombre: name,
    Correo: email,
    Fecha_Registro: new Date().toISOString(),
    Puntuacion_Total: 0,
    Mascota: pet
  };
  checkUserSession();
}

function handleLogout() {
  currentUser = null;
  checkUserSession();
}

function filterSpecies(species, btn) {
  document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (species === 'all') renderCards(allCardsData);
  else renderCards(allCardsData.filter(c => c.especie.toLowerCase() === species.toLowerCase()));
}


function cleanText(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); 
}

function searchCards() {
  const rawQuery = document.getElementById('globalSearch').value;
  const cleanedQuery = cleanText(rawQuery).trim();

  if (cleanedQuery === '') {
    const activeFilterBtn = document.querySelector('.btn-filter.active');
    const species = activeFilterBtn ? activeFilterBtn.innerText.toLowerCase() : 'todos';
    
    if (species.includes('perro')) filterSpecies('perro', activeFilterBtn);
    else if (species.includes('gato')) filterSpecies('gato', activeFilterBtn);
    else filterSpecies('all', activeFilterBtn);
    return;
  }

  const searchTerms = cleanedQuery.split(/\s+/);

  const filtered = allCardsData.filter(item => {
    const tagsText = Array.isArray(item.etiquetas) ? item.etiquetas.join(' ') : '';
    const fuentesText = Array.isArray(item.fuentes) ? item.fuentes.join(' ') : (item.fuentes || '');
    
    const fullContent = cleanText(`
      ${item.raza} 
      ${item.especie} 
      ${item.resumen} 
      ${item.info_general} 
      ${item.alimentacion} 
      ${item.banado} 
      ${item.vacunas} 
      ${tagsText} 
      ${fuentesText}
    `);

    return searchTerms.some(term => fullContent.includes(term));
  });

  renderCards(filtered);
}