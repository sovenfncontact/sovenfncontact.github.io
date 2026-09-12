const config = window.SOVEN_CONFIG;
const nav = document.querySelector('.nav');
const menu = document.querySelector('.menu-toggle');
menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.textContent = open ? 'Close' : 'Menu'; nav.classList.toggle('open', open); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { menu.click(); menu.focus(); } });
const safeUrl = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
document.querySelectorAll('[data-discord]').forEach(el => { if (safeUrl(config.discord)) { el.href = safeUrl(config.discord); el.target = '_blank'; el.rel = 'noopener noreferrer'; } });
document.querySelectorAll('[data-tiktok]').forEach(el => { el.href = config.tiktok; });
function externalLink(label, url, className = '') {
  const link = document.createElement('a'); link.textContent = label; link.href = url;
  link.className = className; link.target = '_blank'; link.rel = 'noopener noreferrer'; return link;
}
if (safeUrl(config.discord)) {
  document.querySelector('[data-discord-contact]')?.replaceWith(externalLink('Join Discord ↗', safeUrl(config.discord), 'button'));
  const note = document.querySelector('.hero-community > span'); if (note) note.textContent = 'Connect with the community';
  const description = document.querySelector('[data-discord-description]'); if (description) description.textContent = 'Connect with the SOVEN community.';
}
if (config.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) {
  const email = document.createElement('a'); email.href = 'mailto:' + config.email; email.textContent = 'Email SOVEN ↗'; email.className = 'button';
  document.querySelector('[data-email-contact]')?.replaceWith(email);
  const description = document.querySelector('[data-email-description]'); if (description) description.textContent = config.email;
}
for (const social of config.otherSocials || []) {
  if (!safeUrl(social.url)) continue;
  const row = document.createElement('div'); row.className = 'social-row';
  const title = document.createElement('h2'); title.textContent = social.label;
  row.append(title, document.createElement('p'), externalLink('Visit channel ↗', safeUrl(social.url), 'button'));
  document.querySelector('#other-socials')?.append(row);
}
document.querySelectorAll('[data-roster]').forEach(container => {
  const members = config.roster[container.dataset.roster] || []; if (!members.length) return;
  container.replaceChildren(); container.className = 'roster-grid';
  for (const member of members) {
    const card = document.createElement('article'); card.className = 'profile';
    const fallback = () => { const el = document.createElement('div'); el.className = 'profile-placeholder'; el.setAttribute('aria-hidden', 'true'); el.textContent = member.name.slice(0, 2).toUpperCase(); return el; };
    if (member.image) { const img = document.createElement('img'); img.src = member.image; img.alt = member.name; img.loading = 'lazy'; img.width = 400; img.height = 500; img.addEventListener('error', () => img.replaceWith(fallback()), { once: true }); card.append(img); } else card.append(fallback());
    const body = document.createElement('div'); body.className = 'profile-body';
    const name = document.createElement('h3'); name.textContent = member.name;
    if (member.nameTag) { const tag = document.createElement('span'); tag.className = 'profile-name-tag'; tag.textContent = member.nameTag; name.prepend(tag, ' '); }
    const role = document.createElement('p'); role.textContent = member.role; body.append(name, role);
    if (member.epicName) { const epic = document.createElement('p'); epic.textContent = 'Epic: ' + member.epicName; body.append(epic); }
    const socials = document.createElement('div'); socials.className = 'profile-socials';
    for (const social of member.socials || []) if (safeUrl(social.url)) socials.append(externalLink(social.label, safeUrl(social.url)));
    body.append(socials); card.append(body); container.append(card);
  }
});
const connected = Object.values(config.applications).some(path => safeUrl(path.googleFormUrl) || safeUrl(path.postEndpoint));
if (connected) { const note = document.querySelector('#application-overview-notice'); if (note) note.textContent = 'Choose a path to see its application availability and share your work.'; }
const form = document.querySelector('.application-form');
if (form) {
  const path = form.dataset.path; const setup = config.applications[path];
  const status = document.querySelector('#form-status'); const submit = document.querySelector('#submit-application');
  const notice = document.querySelector('#connection-notice'); const privacy = document.querySelector('#form-privacy');
  const googleUrl = safeUrl(setup.googleFormUrl); const endpoint = safeUrl(setup.postEndpoint);
  if (googleUrl) {
    const link = document.querySelector('#google-form-link'); link.hidden = false; link.href = googleUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = 'Apply on Google Forms ↗';
    notice.textContent = 'Applications are open on Google Forms. You can submit there, or prepare a draft below first. Draft answers are not transferred automatically.';
    submit.hidden = true;
  } else if (endpoint) {
    submit.disabled = false; submit.textContent = 'Submit application ↗';
    notice.textContent = 'Applications are open. Review your answers before submitting. Keep a downloaded copy for your records.';
    privacy.textContent = 'Submitting sends these answers to SOVEN’s connected form provider for application review. Your answers are not stored in this browser.';
  }
  const draftText = () => {
    const sections = [`SOVEN — ${path === 'competitive' ? 'Competitive Player' : 'Content Creator'} Application`, 'DRAFT — not submitted', ''];
    for (const el of form.querySelectorAll('input, textarea, select')) {
      const label = form.querySelector(`label[for="${el.id}"]`)?.textContent.replace(/\s*\*$/, '') || el.name;
      sections.push(label, el.value.trim() || '[Not answered]', '');
    }
    return sections.join('\n');
  };
  document.querySelector('#download-draft').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([draftText()], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `soven-${path}-application-draft.txt`; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000); status.textContent = 'Draft download started. This is a local copy; your application has not been submitted.';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!endpoint || googleUrl) { status.textContent = googleUrl ? 'Please use the Google Forms link to submit your application.' : 'Online submission is not connected yet. Download your draft to keep your answers.'; return; }
    if (!form.reportValidity()) return;
    submit.disabled = true; submit.textContent = 'Sending…'; status.textContent = '';
    try {
      const data = Object.fromEntries(new FormData(form)); data.application_path = path;
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('Submission failed');
      const result = await response.json().catch(() => null);
      if (result?.success === false || result?.error || result?.errors?.length) throw new Error('Provider rejected submission');
      status.textContent = 'Application submitted. Thank you for your interest in SOVEN. You can still download a copy of your answers.';
      submit.textContent = 'Application submitted';
    } catch {
      status.textContent = 'We couldn’t confirm your submission. Your answers are still here. Download a copy before retrying.';
      submit.disabled = false; submit.textContent = 'Try submission again ↗';
    }
  });
}
