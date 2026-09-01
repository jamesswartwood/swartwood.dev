let portfolioData = {}; // Global variable to feed the Puter AI context

async function initPortfolio() {
  try {
    const response = await fetch(`profile.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    portfolioData = await response.json();
    renderPage(portfolioData);
    setupSidebarNavigation();
    setupScrollSpy();
  } catch (error) {
    console.error('Failed to load profile.json:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPortfolio);
} else {
  initPortfolio();
}

function renderPage(data) {
  const b = data.basics;

  document.getElementById('nav-avatar').src = b.avatar || '';
  document.getElementById('nav-name').textContent = b.name;
  document.getElementById('nav-title').textContent = b.title;
  document.getElementById('nav-linkedin').href = b.linkedin;
  
  // Save form URL to the iframe immediately
  document.getElementById('contact-iframe').src = b.contactFormUrl;

  const resumeLink = document.getElementById('nav-resume');
  if (resumeLink) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const safeName = (b.name || 'JamesSwartwood').replace(/\s+/g, '');
    resumeLink.setAttribute('download', `${safeName}_Resume_${yyyy}${mm}${dd}.pdf`);
    resumeLink.href = b.resumePath || 'resume.pdf';
  }

  // 2. About - Handle Array of Strings
  const aboutHtml = Array.isArray(b.about) 
    ? b.about.map(p => `<p style="font-size: 0.95rem; color: #cfd3dc; margin-bottom: 0.8rem;">${p}</p>`).join('')
    : `<p style="font-size: 0.95rem; color: #cfd3dc;">${b.about}</p>`;
  
  document.getElementById('about-content').innerHTML = aboutHtml;

  const expContainer = document.getElementById('experience-container');
  const groupedExperience = groupConsecutiveItems(data.experience, 'company');
  expContainer.innerHTML = groupedExperience.map(renderExperienceGroup).join('');

  const volContainer = document.getElementById('volunteering-container');
  const groupedVolunteering = groupConsecutiveItems(data.volunteering, 'organization');
  volContainer.innerHTML = groupedVolunteering.map(group => {
    if (group.length === 1) {
      const item = group[0];
      return createSingleCardHTML({
        logo: item.logo, title: item.role, subtitle: item.organization, meta: `${item.period} | ${item.cause || ''}`, bullets: item.bullets, media: item.media
      });
    } else {
      return renderGroupedTimeline(group, group[0].organization);
    }
  }).join('');

  const honContainer = document.getElementById('honors-container');
  honContainer.innerHTML = data.honors.map(item => createSingleCardHTML({
    logo: item.logo, title: item.title, subtitle: `Issued by ${item.issuer} · ${item.date}`, meta: item.description, bullets: [], media: item.media
  })).join('');

  if (data.projects && data.projects.length > 0) {
    renderCategorizedSection({
      categories: data.projects, wrapperId: 'projects-categories-wrapper', subnavId: 'projects-subnav', renderItemFn: item => createSingleCardHTML({
        logo: item.logo, title: item.title, subtitle: item.role, meta: item.period, bullets: item.bullets, media: item.media
      })
    });
  }

  if (data.organizations && data.organizations.length > 0) {
    renderCategorizedSection({
      categories: data.organizations, wrapperId: 'organizations-categories-wrapper', subnavId: 'organizations-subnav', renderItemFn: item => createSingleCardHTML({
        logo: item.logo, title: item.name, subtitle: item.role, meta: item.period, bullets: item.bullets, media: item.media
      })
    });
  }

  document.querySelectorAll('.media-item').forEach(el => {
    el.addEventListener('click', () => openModal(JSON.parse(el.dataset.media)));
  });
}

function renderCategorizedSection({ categories, wrapperId, subnavId, renderItemFn }) {
  const wrapper = document.getElementById(wrapperId);
  const subnav = document.getElementById(subnavId);
  if (!wrapper || !subnav) return;

  wrapper.innerHTML = categories.map(cat => `
    <section id="${cat.id}" class="content-section">
      <h2>${cat.categoryName}</h2>
      ${cat.note && cat.note.trim() !== '' ? `<p class="section-note">${cat.note}</p>` : ''}
      <div class="card-list">${cat.items.map(renderItemFn).join('')}</div>
    </section>
  `).join('');

  subnav.innerHTML = categories.map(cat => `<li><a href="#${cat.id}">${cat.categoryName}</a></li>`).join('');
}

function groupConsecutiveItems(items, key) {
  if (!items || items.length === 0) return [];
  const groups = [];
  let currentGroup = [items[0]];
  for (let i = 1; i < items.length; i++) {
    if (items[i][key] === items[i - 1][key]) currentGroup.push(items[i]);
    else { groups.push(currentGroup); currentGroup = [items[i]]; }
  }
  groups.push(currentGroup);
  return groups;
}

function renderExperienceGroup(group) {
  if (group.length === 1) {
    const item = group[0];
    return createSingleCardHTML({
      logo: item.logo, title: item.role, subtitle: `${item.company} ${item.employmentType ? '· ' + item.employmentType : ''}`, meta: `${item.period} | ${item.location}`, bullets: item.bullets, media: item.media
    });
  }
  return renderGroupedTimeline(group, group[0].company);
}

function renderGroupedTimeline(group, entityName) {
  const logo = group[0].logo || 'assets/default_logo.png';
  return `
    <article class="company-group">
      <img class="card-logo" src="${logo}" alt="${entityName} logo" />
      <div class="card-body">
        <div class="company-group-header"><h3>${entityName}</h3><div class="company-tenure">${group.length} roles progression</div></div>
        <div class="timeline-roles">
          ${group.map(role => `
            <div class="timeline-role-item">
              <span class="timeline-dot"></span>
              <div class="card-header"><h3>${role.role}</h3><div class="meta-text">${role.period} ${role.location ? '· ' + role.location : ''}</div></div>
              ${renderBullets(role.bullets)}
              ${renderMedia(role.media)}
            </div>
          `).join('')}
        </div>
      </div>
    </article>
  `;
}

function createSingleCardHTML({ logo, title, subtitle, meta, bullets, media }) {
  return `
    <article class="card">
      <img class="card-logo" src="${logo || 'assets/default_logo.png'}" alt="logo" />
      <div class="card-body">
        <div class="card-header"><h3>${title}</h3>${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}${meta ? `<div class="meta-text">${meta}</div>` : ''}</div>
        ${renderBullets(bullets)}
        ${renderMedia(media)}
      </div>
    </article>
  `;
}

function renderBullets(bullets) {
  if (!bullets || bullets.length === 0) return '';
  return `<ul class="card-bullets">${bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
}

function renderMedia(media) {
  if (!media || media.length === 0) return '';
  return `<div class="media-showcase">${media.map(m => `
        <div class="media-item" data-media='${JSON.stringify(m).replace(/'/g, "&apos;")}'>
          <img src="${m.thumbnail || 'assets/media/placeholder.png'}" alt="${m.title}">
          <div class="media-title">${m.title}</div>
        </div>`).join('')}</div>`;
}

function switchTab(targetId) {
  document.querySelectorAll('.category-btn').forEach(b => b.classList.toggle('active', b.dataset.target === targetId));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.toggle('active', pane.id === targetId));

  const subnavMap = { 'tab-summary': 'summary-subnav', 'tab-projects': 'projects-subnav', 'tab-organizations': 'organizations-subnav' };
  Object.entries(subnavMap).forEach(([tab, subnavId]) => {
    const el = document.getElementById(subnavId);
    if (el) el.style.display = (tab === targetId) ? 'block' : 'none';
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupSidebarNavigation() {
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
  });
}

// Scrollspy for sidebar link highlighting
function setupScrollSpy() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.sub-nav-links a').forEach(link => {
          link.classList.toggle('active-section', link.getAttribute('href') === `#${entry.target.id}`);
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  document.querySelectorAll('.content-section').forEach(sec => observer.observe(sec));
}

// Media Modal Functions
function openModal(media) {
  const modal = document.getElementById('media-modal');
  document.getElementById('modal-img').src = media.thumbnail || '';
  document.getElementById('modal-title').textContent = media.title;
  document.getElementById('modal-desc').textContent = media.description || '';
  const linkBtn = document.getElementById('modal-link');
  
  if (media.linkType === 'external' && media.target) {
    linkBtn.href = media.target; linkBtn.target = '_blank'; linkBtn.onclick = null; linkBtn.textContent = media.buttonLabel || 'Visit Link'; linkBtn.classList.remove('hidden');
  } else if (media.linkType === 'internal' && media.target) {
    linkBtn.href = 'javascript:void(0);'; linkBtn.target = '_self';
    linkBtn.onclick = () => { closeModal(); switchTab(media.target); };
    linkBtn.textContent = media.buttonLabel || 'View Section'; linkBtn.classList.remove('hidden');
  } else { linkBtn.classList.add('hidden'); }

  modal.classList.remove('hidden');
}

function closeModal() { document.getElementById('media-modal').classList.add('hidden'); }

// Contact Form Modal Functions
function openContactModal() { document.getElementById('contact-modal').classList.remove('hidden'); }
function closeContactModal() { document.getElementById('contact-modal').classList.add('hidden'); }

// Puter AI Chatbot Functions
function toggleChatbot() {
  const win = document.getElementById('chatbot-window');
  win.classList.toggle('hidden');
}

function handleChatEnter(e) {
  if (e.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
  const inputEl = document.getElementById('chatbot-input');
  const msgsEl = document.getElementById('chatbot-messages');
  const userText = inputEl.value.trim();
  
  if (!userText) return;
  inputEl.value = '';

  // Append user message
  const userDiv = document.createElement('div');
  userDiv.className = 'chat-msg msg-user';
  userDiv.textContent = userText;
  msgsEl.appendChild(userDiv);
  msgsEl.scrollTop = msgsEl.scrollHeight;

  // Show loading
  const aiDiv = document.createElement('div');
  aiDiv.className = 'chat-msg msg-ai';
  aiDiv.textContent = 'Thinking...';
  msgsEl.appendChild(aiDiv);
  msgsEl.scrollTop = msgsEl.scrollHeight;

  try {
    // Call Puter AI with context
    const contextPrompt = `You are a helpful AI assistant residing on James Swartwood's portfolio website. 
    Use the following JSON data to answer the user's questions about his experience, projects, or background. 
    Keep answers concise, friendly, and professional.

    DATA: ${JSON.stringify(portfolioData)}
    
    STRICT GUIDELINES:
    1. If the answer cannot be explicitly derived from the context above, clearly state that you do not have that specific information and invite them to reach out via our Contact Us form.
    2. Keep responses brief, polite, and encouraging.
    3. Format output cleanly with standard Markdown (e.g. bolding, bullet points).
    4. Never invent facts, prices, ranks, schedules, or locations.
    
    USER QUERY: ${userText}`;
    
    const response = await puter.ai.chat(contextPrompt);
    aiDiv.textContent = response.message.content || response;
  } catch (error) {
    console.error("AI Chat Error: ", error);
    aiDiv.textContent = "Sorry, I'm having trouble connecting right now.";
  }
  msgsEl.scrollTop = msgsEl.scrollHeight;
}