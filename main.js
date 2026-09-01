async function initPortfolio() {
  try {
    const response = await fetch(`profile.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    renderPage(data);
  } catch (error) {
    console.error('Failed to load profile.json:', error);
  }
}

// Check if DOM is already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPortfolio);
} else {
  initPortfolio();
}

function renderPage(data) {
  // 1. Top Navbar
  const b = data.basics;
  document.getElementById('nav-avatar').src = b.avatar || '';
  document.getElementById('nav-name').textContent = b.name;
  document.getElementById('nav-title').textContent = b.title;
  document.getElementById('nav-email').href = `mailto:${b.email}`;
  document.getElementById('nav-linkedin').href = b.linkedin;
  document.getElementById('nav-contact-btn').href = b.contactFormUrl;

  // 2. About Section
  document.getElementById('about-content').innerHTML = `
    <p style="font-size: 0.95rem; color: #cfd3dc;">${b.about}</p>
  `;

  // 3. Work Experience Section
  const expContainer = document.getElementById('experience-container');
  expContainer.innerHTML = data.experience.map(item => createCardHTML({
    logo: item.logo,
    title: item.role,
    subtitle: `${item.company} ${item.employmentType ? '· ' + item.employmentType : ''}`,
    meta: `${item.period} | ${item.location}`,
    bullets: item.bullets,
    media: item.media
  })).join('');

  // 4. Volunteering Section
  const volContainer = document.getElementById('volunteering-container');
  volContainer.innerHTML = data.volunteering.map(item => createCardHTML({
    logo: item.logo,
    title: item.role,
    subtitle: item.organization,
    meta: `${item.period} | ${item.cause}`,
    bullets: item.bullets,
    media: item.media
  })).join('');

  // 5. Honors & Awards Section
  const honContainer = document.getElementById('honors-container');
  honContainer.innerHTML = data.honors.map(item => createCardHTML({
    logo: item.logo,
    title: item.title,
    subtitle: `Issued by ${item.issuer} · ${item.date}`,
    meta: item.description,
    bullets: [],
    media: item.media
  })).join('');

  // 6. Bind Modal Triggers
  document.querySelectorAll('.media-item').forEach(el => {
    el.addEventListener('click', () => {
      openModal(JSON.parse(el.dataset.media));
    });
  });
}

function createCardHTML({ logo, title, subtitle, meta, bullets, media }) {
  const bulletsHTML = bullets && bullets.length > 0 
    ? `<ul class="card-bullets">${bullets.map(b => `<li>${b}</li>`).join('')}</ul>` 
    : '';

  const mediaHTML = media && media.length > 0
    ? `<div class="media-showcase">
        ${media.map(m => `
          <div class="media-item" data-media='${JSON.stringify(m).replace(/'/g, "&apos;")}'>
            <img src="${m.thumbnail || 'assets/media/placeholder.png'}" alt="${m.title}">
            <div class="media-title">${m.title}</div>
          </div>
        `).join('')}
       </div>`
    : '';

  return `
    <article class="card">
      <img class="card-logo" src="${logo || 'assets/default_logo.png'}" alt="logo" />
      <div class="card-body">
        <div class="card-header">
          <h3>${title}</h3>
          <div class="subtitle">${subtitle}</div>
          <div class="meta-text">${meta}</div>
        </div>
        ${bulletsHTML}
        ${mediaHTML}
      </div>
    </article>
  `;
}

/* Modal Management */
function openModal(media) {
  const modal = document.getElementById('media-modal');
  document.getElementById('modal-img').src = media.thumbnail || '';
  document.getElementById('modal-title').textContent = media.title;
  document.getElementById('modal-desc').textContent = media.description || '';
  
  const linkBtn = document.getElementById('modal-link');
  if (media.url && media.url.trim() !== '') {
    linkBtn.href = media.url;
    linkBtn.classList.remove('hidden');
  } else {
    linkBtn.classList.add('hidden');
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('media-modal').classList.add('hidden');
}