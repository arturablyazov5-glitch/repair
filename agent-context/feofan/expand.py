# Разворачивает маркеры <!-- TOC --> и <!-- DOCS --> в src/legal/*.html в статический HTML (одноразово, идемпотентно).
import re, pathlib
docs = [('privacy','Политика конфиденциальности'),('consent','Согласие на обработку ПДн'),('cookies','Политика cookie'),
        ('terms','Пользовательское соглашение'),('offer','Публичная оферта'),('warranty','Гарантия и порядок приёма')]
for name,_ in docs:
    p = pathlib.Path(f'/home/user/repair/src/legal/{name}.html'); s = p.read_text()
    secs = re.findall(r'<section class="legal__sec" id="([\w-]+)">\s*<h2>(.*?)</h2>', s)
    toc = '<nav class="legal__toc" aria-label="Содержание документа">\n  <p class="legal__toc-title">Содержание</p>\n  <ol>\n' + \
          ''.join(f'    <li><a href="#{i}">{t}</a></li>\n' for i,t in secs) + '  </ol>\n</nav>'
    nav = '  <nav class="legal__docs" aria-label="Правовые документы">\n    <h2>Другие документы</h2>\n    <ul>\n' + \
          ''.join(f'      <li><a href="{{{{root}}}}legal/{n}.html"' + (' aria-current="page"' if n==name else '') + f'>{t}</a></li>\n' for n,t in docs) + '    </ul>\n  </nav>'
    s = re.sub(r'<!-- TOC -->|<nav class="legal__toc".*?</nav>', lambda m: toc, s, count=1, flags=re.S)
    s = re.sub(r'<!-- DOCS -->|  <nav class="legal__docs".*?</nav>', lambda m: nav, s, count=1, flags=re.S)
    p.write_text(s); print(name, len(secs))
