// Общий JS. Владелец: прораб. Секционный JS — в js/sections/NN-имя.js
document.documentElement.classList.add('js');
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // reveal при скролле
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 }) : null;
  $$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('is-in'));

  // модалки: <button data-modal-open="id">, <div class="modal" id="id">, закрытие: [data-modal-close], Esc, клик по фону
  const open = (id) => { const m = document.getElementById(id); if (!m) return; m.classList.add('is-open'); document.body.classList.add('no-scroll'); m.querySelector('input,select,textarea,button')?.focus(); };
  const close = (m) => { m.classList.remove('is-open'); if (!$$('.modal.is-open').length) document.body.classList.remove('no-scroll'); };
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-modal-open]'); if (o) { e.preventDefault(); open(o.dataset.modalOpen); return; }
    const c = e.target.closest('[data-modal-close]'); if (c) { close(c.closest('.modal')); return; }
    if (e.target.classList?.contains('modal')) close(e.target);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.modal.is-open').forEach(close); });

  // маска телефона: <input data-phone>
  const fmt = (v) => { let d = v.replace(/\D/g, ''); if (d[0] === '8') d = '7' + d.slice(1); if (d[0] !== '7') d = '7' + d; d = d.slice(0, 11);
    let r = '+7'; if (d.length > 1) r += ' (' + d.slice(1, 4); if (d.length >= 5) r += ') ' + d.slice(4, 7); if (d.length >= 8) r += '-' + d.slice(7, 9); if (d.length >= 10) r += '-' + d.slice(9, 11); return r; };
  document.addEventListener('input', (e) => { if (e.target.matches?.('[data-phone]')) e.target.value = e.target.value ? fmt(e.target.value) : ''; });

  // Единая отправка: <form data-lead-form data-source="hero"> с полями name, phone, [device, brand, problem], consent(checkbox), website(honeypot .hp)
  window.submitLead = async (form) => {
    const data = Object.fromEntries(new FormData(form)); data.source = form.dataset.source || 'site'; data.page = location.href;
    if (data.website) return { ok: true }; // honeypot
    if (window.SITE.leadEndpoint) {
      const r = await fetch(window.SITE.leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      return { ok: r.ok && j.ok !== false, error: j.error };
    }
    const text = `${window.SITE.whatsappText}\n\nИмя: ${data.name || ''}\nТелефон: ${data.phone || ''}` + (data.device ? `\nТехника: ${data.device}` : '') + (data.brand ? `\nБренд: ${data.brand}` : '') + (data.problem ? `\nПроблема: ${data.problem}` : '');
    window.open(`https://wa.me/${window.SITE.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    return { ok: true, via: 'whatsapp' };
  };
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-lead-form]'); if (!form) return; e.preventDefault();
    const st = form.querySelector('.form__status'); let bad = false;
    $$('.field', form).forEach(f => f.classList.remove('is-invalid'));
    const mark = (name, msg) => { const el = form.elements[name]; if (!el) return; const f = el.closest('.field'); f?.classList.add('is-invalid'); const er = f?.querySelector('.field__error'); if (er) er.textContent = msg; bad = true; };
    if (form.elements.name && !form.elements.name.value.trim()) mark('name', 'Укажите имя');
    if (form.elements.phone && form.elements.phone.value.replace(/\D/g, '').length < 11) mark('phone', 'Введите телефон полностью');
    if (form.elements.consent && !form.elements.consent.checked) { bad = true; if (st) { st.className = 'form__status is-err'; st.textContent = 'Поставьте галочку согласия на обработку персональных данных.'; } }
    if (bad) return;
    const btn = form.querySelector('[type=submit]'); btn && (btn.disabled = true);
    try { const r = await window.submitLead(form);
      if (st) { st.className = 'form__status ' + (r.ok ? 'is-ok' : 'is-err'); st.textContent = r.ok ? (r.via === 'whatsapp' ? 'Открываем WhatsApp — отправьте сообщение, и мы ответим.' : 'Заявка принята! Перезвоним в рабочее время.') : 'Не удалось отправить. Позвоните нам или напишите в WhatsApp.'; }
      if (r.ok) { document.dispatchEvent(new CustomEvent('lead:sent', { detail: { source: form.dataset.source || 'site', via: r.via || 'endpoint' } })); form.reset(); }
    } catch { if (st) { st.className = 'form__status is-err'; st.textContent = 'Ошибка сети. Позвоните нам или напишите в WhatsApp.'; } }
    btn && (btn.disabled = false);
  });
})();
