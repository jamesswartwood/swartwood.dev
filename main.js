async function initPortfolio() {
  try {
    const response = await fetch(`profile.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    renderPage(data);
    setupSidebarNavigation();
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

  // 1. Top Navbar Data
  document.getElementById('nav-avatar').src = b.avatar || '';
  document.getElementById('nav-name').textContent = b.name;
  document.getElementById('nav-title').textContent = b.title;
  document.getElementById('nav-linkedin').href = b.linkedin;
  document.getElementById('nav-contact-btn').href = b.contactFormUrl;

  // Format Dynamic Resume Download Name: JamesSwartwood_Resume_YYYYMMDD.pdf
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

  // 2. About
  document.getElementById('about-content').innerHTML = `
    <p style="font-size: 0.95rem; color: #cfd3dc;">${b.about}</p>
  `;

  // 3. Work Experience with Grouping for Consecutive Company Roles
  const expContainer = document.getElementById('experience-container');
  const groupedExperience = groupConsecutiveItems(data.experience, 'company');
  expContainer.innerHTML = groupedExperience.map(renderExperienceGroup).join('');

  // 4. Volunteering with Grouping for Consecutive Organization Roles
  const volContainer = document.getElementById('volunteering-container');
  const groupedVolunteering = groupConsecutiveItems(data.volunteering, 'organization');
  volContainer.innerHTML = groupedVolunteering.map(group => {
    if (group.length === 1) {
      const item = group[0];
      return createSingleCardHTML({
        logo: item.logo,
        title: item.role,
        subtitle: item.organization,
        meta: `${item.period} | ${item.cause || ''}`,
        bullets: item.bullets,
        media: item.media
      });
    } else {
      return renderGroupedTimeline(group, group[0].organization);
    }
  }).join('');

  // 5. Honors & Awards
  const honContainer = document.getElementById('honors-container');
  honContainer.innerHTML = data.honors.map(item => createSingleCardHTML({
    logo: item.logo,
    title: item.title,
    subtitle: `Issued by ${item.issuer} · ${item.date}`,
    meta: item.description,
    bullets: [],
    media: item.media
  })).join('');

  // 6. Projects & Showcase (Placeholder tab)
  const projContainer = document.getElementById('projects-container');
  if (projContainer && data.projects) {
    projContainer.innerHTML = data.projects.map(item => createSingleCardHTML({
      logo: item.logo,
      title: item.title,
      subtitle: item.role,
      meta: item.period,
      bullets: item.bullets,
      media: item.media
    })).join('');
  }

  // 7. Organizations (Placeholder tab)
  const orgContainer = document.getElementById('organizations-container');
  if (orgContainer && data.organizations) {
    orgContainer.innerHTML = data.organizations.map(item => createSingleCardHTML({
      logo: item.logo,
      title: item.name,
      subtitle: item.role,
      meta: item.period,
      bullets: item.bullets,
      media: item.media
    })).join('');
  }

  // Bind Media Modal triggers
  document.querySelectorAll('.media-item').forEach(el => {
    el.addEventListener('click', () => {
      openModal(JSON.parse(el.dataset.media));
    });
  });
}

/**
 * Group consecutive items sharing identical key values (e.g. consecutive jobs at same company)
 */
function groupConsecutiveItems(items, key) {
  if (!items || items.length === 0) return [];
  const groups = [];
  let currentGroup = [items[0]];

  for (let i = 1; i < items.length; i++) {
    if (items[i][key] === items[i - 1][key]) {
      currentGroup.push(items[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [items[i]];
    }
  }
  groups.push(currentGroup);
  return groups;
}

function renderExperienceGroup(group) {
  if (group.length === 1) {
    const item = group[0];
    return createSingleCardHTML({
      logo: item.logo,
      title: item.role,
      subtitle: `${item.company} ${item.employmentType ? '· ' + item.employmentType : ''}`,
      meta: `${item.period} | ${item.location}`,
      bullets: item.bullets,
      media: item.media
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
        <div class="company-group-header">
          <h3>${entityName}</h3>
          <div class="company-tenure">${group.length} roles progression</div>
        </div>
        <div class="timeline-roles">
          ${group.map(role => `
            <div class="timeline-role-item">
              <span class="timeline-dot"></span>
              <div class="card-header">
                <h3>${role.role}</h3>
                <div class="meta-text">${role.period} ${role.location ? '· ' + role.location : ''}</div>
              </div>
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
        <div class="card-header">
          <h3>${title}</h3>
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
          ${meta ? `<div class="meta-text">${meta}</div>` : ''}
        </div>
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
  return `
    <div class="media-showcase">
      ${media.map(m => `
        <div class="media-item" data-media='${JSON.stringify(m).replace(/'/g, "&apos;")}'>
          <img src="${m.thumbnail || 'assets/media/placeholder.png'}" alt="${m.title}">
          <div class="media-title">${m.title}</div>
        </div>
      `).join('')}
    </div>
  `;
}

/* Sidebar Tab Switching */
function setupSidebarNavigation() {
  const categoryBtns = document.querySelectorAll('.category-btn');
  const subnav = document.getElementById('summary-subnav');
  const tabPanes = document.querySelectorAll('.tab-pane');

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;

      // Update Active Button
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update Active Tab Content
      tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === targetId);
      });

      // Show/Hide anchors subnavigation for Summary category
      if (targetId === 'tab-summary') {
        subnav.style.display = 'block';
      } else {
        subnav.style.display = 'none';
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
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