"""Assemble ten review units of 50; retain pilot items by reference, never copy.

No environment, network, database, publication manifest or runtime bank access.
"""
import json
import runpy
import subprocess
from collections import Counter
from pathlib import Path

root = Path(__file__).resolve().parent
authoring = runpy.run_path(str(root / 'author-vihaan-expansion.py'))
runpy.run_path(str(root / 'vihaan-reading-data.py'), init_globals={'reading':authoring['reading']})
runpy.run_path(str(root / 'vihaan-writing-data.py'), init_globals={'add':authoring['add']})
items = authoring['ITEMS']
pilot = json.loads(Path('content/vihaan-scholarship/pilot-01/draft.json').read_text())

assert len(items) == 480, Counter(i['question']['metadata']['subject'] for i in items)
assert Counter(i['question']['metadata']['subject'] for i in items + pilot['items']) == {
    'numeracy':120, 'numerical_reasoning':120, 'verbal_reasoning':120, 'reading':100, 'writing':40}

for item in items:
    q = item['question']
    assert len({o['text'].lower().strip() for o in q['options']}) == len(q['options']), q['id']
    if q['metadata']['subject']=='writing':
        # Pilot already has the rubric, but no onboarded writing skill registry.
        # Do not invent a registered identifier or change the taxonomy here.
        mode = q['metadata'].pop('skill').removeprefix('scholarship.writing-')
        q['metadata']['tags'] += [mode,'planning','cohesion','editing']
    else:
        q['metadata']['tags'].append(q['metadata']['skill'].removeprefix('scholarship.'))

base = Path('content/vihaan-scholarship/expansion-500')
base.mkdir(parents=True, exist_ok=True)

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')

# Spread subjects through the review units. The first unit has 20 retained pilot
# references and 30 new items. The following nine units each have 50 new items.
pools = {s:[i for i in items if i['question']['metadata']['subject']==s] for s in
         ['numeracy','numerical_reasoning','verbal_reasoning','reading','writing']}
ordered = []
while any(pools.values()):
    for subject, pool in pools.items():
        take = 1 if subject=='writing' else 3
        for _ in range(min(take,len(pool))):
            ordered.append(pool.pop(0))

manifest = dict(bankId='vihaan-scholarship-500',version=1,status='draft',approvedBy=None,
               targets=dict(numeracy=120,numerical_reasoning=120,verbal_reasoning=120,reading=100,writing=40),
               difficultyTargets=dict(easy=75,medium=225,challenging=200),
               retainedPilot='content/vihaan-scholarship/pilot-01/draft.json',batches=[])
offset = 0
for index in range(1,11):
    retained = [i['question']['id'] for i in pilot['items']] if index==1 else []
    length = 50-len(retained)
    drafted = ordered[offset:offset+length]
    offset += length
    batch_id = f'vihaan-expansion-{index:02}'
    batch = dict(batchId=batch_id,version=1,status='draft',approvedBy=None,
        provenance=dict(adapter='manual_external',author='OpenAI Codex session',model=None,
            generatedOn='2026-11-16',originalGenerationEvidence='Session-authored problems, passages and prompts; deterministic assembly from checked-in authoring rows.',
            externalQuestionMaterialUsed=False,formatReference='https://www.edutest.com.au/tests_parents.html',
            formatReferenceUse='Public assessment areas and writing modes only; no sample test questions used.',
            promptFile='authoring-brief.md'),
        retainedPilotIds=retained,items=drafted)
    filename = f'batch-{index:02}.draft.json'
    write(base / filename,batch)
    manifest['batches'].append(dict(batchId=batch_id,file=filename))
    # Stop before emitting the next review unit if this unit (including all
    # preceding units as duplicate peers) fails the independent validator.
    subprocess.run(['node','--import','tsx','scripts/validate-vihaan-expansion.mts',
                    '--batch',str(index),'--write-report'],check=True)
assert offset==480
write(base/'bank.draft.json',manifest)
subprocess.run(['node','--import','tsx','scripts/validate-vihaan-expansion.mts',
                '--write-report'],check=True)
print(json.dumps(dict(newItems=len(items),total=500,subjects=Counter(i['question']['metadata']['subject'] for i in items+pilot['items']),
                     difficulties=Counter(i['question']['metadata']['difficulty'] for i in items+pilot['items'])),indent=2))
