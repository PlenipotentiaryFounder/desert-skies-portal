import re
import json

with open('endorsement_appendix_a_raw.txt', encoding='latin-1') as f:
    txt = f.read()

# Replace the observed line break sequence with \n
# '਍ഀ' is U+0A4D U+0D00
# If this doesn't work, try replacing with the actual string
# txt = txt.replace('\u0a4d\u0d00', '\n')
txt = txt.replace('਍ഀ', '\n')

pattern = re.compile(r'(?m)^(?:A-\d+\s+)?(A\.\d+)\s+([^\n]+)\n([\s\S]*?)(?=^(?:A-\d+\s+)?A\.\d+\s|\Z)', re.MULTILINE)
result = []
for m in pattern.finditer(txt):
    code = m.group(1)
    title = m.group(2).strip()
    block = m.group(3).strip()
    ref_match = re.search(r'(§|º)\s*[\d\.\(\)a-zA-Z,\s]+', block)
    ref = ref_match.group(0) if ref_match else ''
    template = block
    result.append({'code': code, 'title': title, 'faa_reference': ref, 'template_text': template})

with open('endorsement_templates_sample.json', 'w', encoding='utf-8') as f:
    json.dump(result[:5], f, indent=2) 