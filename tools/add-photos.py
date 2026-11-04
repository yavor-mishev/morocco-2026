#!/usr/bin/env python3
"""Add your own photos to the diary.

1. Drop photos (HEIC, JPG, PNG straight from the phone) into  inbox/
   - They are sorted into days automatically by the date they were taken
     (31 Oct = Day 1 ... 7 Nov = Day 8).
   - To force a day, put them in a subfolder instead: inbox/day-3/
2. Run:  python3 tools/add-photos.py
3. Each photo is rotated correctly, resized (2000 px + 640 px thumbnail),
   stripped of ALL metadata (GPS location, camera, time stamps in the file)
   and listed in photos/photos.json, which the site reads.
   Originals are moved to inbox/_done/ (never deleted, never uploaded).

Captions: edit "en" / "bg" for a photo in photos/photos.json (optional).
"""
import json, os, re, subprocess, shutil, sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INBOX = os.path.join(ROOT, 'inbox')
DONE = os.path.join(INBOX, '_done')
FULL = os.path.join(ROOT, 'photos', 'full')
THUMB = os.path.join(ROOT, 'photos', 'thumb')
MANIFEST = os.path.join(ROOT, 'photos', 'photos.json')
TOOL_SRC = os.path.join(ROOT, 'tools', 'photo.swift')
TOOL = os.path.join(ROOT, 'tools', '.bin', 'photo')
DAY1 = date(2026, 10, 31)
EXTS = {'.heic', '.heif', '.jpg', '.jpeg', '.png', '.tif', '.tiff'}


def build_tool():
    if os.path.exists(TOOL) and os.path.getmtime(TOOL) >= os.path.getmtime(TOOL_SRC):
        return
    os.makedirs(os.path.dirname(TOOL), exist_ok=True)
    print('Compiling the image tool (first run only)…')
    subprocess.run(['swiftc', '-O', TOOL_SRC, '-o', TOOL], check=True)


def day_for(path, taken):
    m = re.search(r'day-?([1-8])$', os.path.basename(os.path.dirname(path)), re.I)
    if m:
        return int(m.group(1))
    m = re.match(r'(\d{4}):(\d{2}):(\d{2})', taken or '')
    if m:
        n = (date(int(m.group(1)), int(m.group(2)), int(m.group(3))) - DAY1).days + 1
        if 1 <= n <= 8:
            return n
    return None


def main():
    for d in (INBOX, DONE, FULL, THUMB):
        os.makedirs(d, exist_ok=True)
    build_tool()
    data = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else []
    names = {p['src'].rsplit('/', 1)[-1] for p in data}
    added, skipped = 0, []

    files = []
    for dp, dns, fns in os.walk(INBOX):
        dns[:] = [x for x in dns if x != '_done' and not x.startswith('.')]
        files += [os.path.join(dp, f) for f in sorted(fns) if os.path.splitext(f)[1].lower() in EXTS]

    for f in files:
        tmp_full, tmp_thumb = os.path.join(FULL, '.tmp.jpg'), os.path.join(THUMB, '.tmp.jpg')
        r = subprocess.run([TOOL, f, tmp_full, tmp_thumb, '2000', '640'], capture_output=True, text=True)
        if r.returncode != 0:
            skipped.append((f, r.stderr.strip() or 'could not read'))
            continue
        w, h, taken = r.stdout.strip().split(' ', 2)
        day = day_for(f, taken)
        if not day:
            os.remove(tmp_full); os.remove(tmp_thumb)
            skipped.append((f, 'no date in the photo; put it in inbox/day-N/'))
            continue
        stamp = re.sub(r'\D', '', taken)[:14] if taken != '-' else re.sub(r'\W', '', os.path.splitext(os.path.basename(f))[0])[:20]
        base = f'd{day}-{stamp}'
        name, i = base + '.jpg', 2
        while name in names:
            name, i = f'{base}-{i}.jpg', i + 1
        names.add(name)
        os.replace(tmp_full, os.path.join(FULL, name))
        os.replace(tmp_thumb, os.path.join(THUMB, name))
        data.append({'src': f'photos/full/{name}', 'thumb': f'photos/thumb/{name}', 'day': day,
                     'w': int(w), 'h': int(h), 'taken': taken if taken != '-' else '', 'en': '', 'bg': ''})
        dest = os.path.join(DONE, os.path.basename(f))
        k = 2
        while os.path.exists(dest):
            root, ext = os.path.splitext(os.path.basename(f)); dest = os.path.join(DONE, f'{root}-{k}{ext}'); k += 1
        shutil.move(f, dest)
        added += 1
        print(f'  Day {day}  {name}')

    data.sort(key=lambda p: (p['day'], p['taken'] or '~', p['src']))
    with open(MANIFEST, 'w') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
        fh.write('\n')
    per_day = {}
    for p in data:
        per_day[p['day']] = per_day.get(p['day'], 0) + 1
    print(f'\nAdded {added} photo(s). On the site now: ' + (', '.join(f'Day {d}: {n}' for d, n in sorted(per_day.items())) or 'none'))
    for f, why in skipped:
        print(f'  Skipped {os.path.relpath(f, ROOT)}: {why}')


if __name__ == '__main__':
    sys.exit(main())
