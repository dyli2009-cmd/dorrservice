# Mobiltester

Installera Playwright lokalt med `npm install --no-save playwright` och ange sökvägen till Chromium med miljövariabeln `CHROMIUM_PATH` (standard: `/usr/bin/chromium`).

Kör från projektets rot:

```sh
node --check app.js
node tests/mobile.cjs
node tests/overview.cjs
```

Mobiltestet använder en simulerad PDF-renderare med stora sidmått och fördröjda renderingar. Det kontrollerar dörrplacering, tryck på markeringar, checklistor, rasterstorlek, avbruten rendering, nypzoom, sidbyte och felhantering. Inga externa anrop behövs; sidan och biblioteken levereras via Playwrights lokala routing.

Översiktstestet kontrollerar att felmarkeringar och problemstatus samlas även när de skiljer sig åt, att tomma felbeskrivningar fortfarande syns, sökning och filtrering, säker visning av användartext, fingerskrollning, navigation till rätt protokoll och PDF-sida samt uppdatering efter rättade fel och omladdning.

Testa även med riktig PDF.js 3.11.174:

```sh
mkdir -p /tmp/dorrservice-pdfjs
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js -o /tmp/dorrservice-pdfjs/pdf.min.js
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js -o /tmp/dorrservice-pdfjs/pdf.worker.min.js
PDFJS_DIR=/tmp/dorrservice-pdfjs node tests/real-pdf.cjs
```

Det testet skapar en giltig PDF med två ritningssidor och kontrollerar uppladdning, dörrplacering, zoom, anpassning till skärmen och sidbyte. En bild av mobilvyn sparas som `mobile-preview.png`.

Tester i Chromium ersätter inte provning på en fysisk telefon. Kontrollera särskilt nypzoom och läsbarhet med verkliga stora ritningar. Rastertaket begränsar minnet för sidbilder; mycket komplexa PDF-filer kan fortfarande ta tid att tolka. PDF-export och flera separata projekt omfattas inte av dessa tester.
