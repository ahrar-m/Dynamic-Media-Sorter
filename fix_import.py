import re

with open("Dynamic Media Sorter.html", "r") as f:
    html = f.read()

bad_script = '<script src="https://cdn.jsdelivr.net/npm/openskill/dist/openskill.min.js"></script>'
good_script = """<script type="module">
import { rate, rating, ordinal } from 'https://cdn.jsdelivr.net/npm/openskill@4.1.1/dist/index.js';
window.openskill = { rate, rating, ordinal };
</script>"""

html = html.replace(bad_script, good_script)

with open("Dynamic Media Sorter.html", "w") as f:
    f.write(html)
