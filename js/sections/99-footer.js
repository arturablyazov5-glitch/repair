// Подвал · владелец: Афанасий. Актуальный год в копирайте.
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
