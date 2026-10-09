# Добавляет data-label (из <thead>) в ячейки таблиц .legal__table — для карточного вида на мобиле.
import re, pathlib
for p in pathlib.Path('/home/user/repair/src/legal').glob('*.html'):
    s = p.read_text()
    def fix(m):
        t = m.group(0)
        heads = re.findall(r'<th scope="col">(.*?)</th>', t)
        def row(r):
            i = iter(heads)
            return re.sub(r'<td(?: data-label="[^"]*")?>', lambda _: f'<td data-label="{next(i)}">', r.group(0))
        return re.sub(r'<tr>(?:(?!</tr>).)*<td.*?</tr>', row, t, flags=re.S)
    s2 = re.sub(r'<table class="legal__table">.*?</table>', fix, s, flags=re.S)
    if s2 != s: p.write_text(s2); print('labels', p.name)
