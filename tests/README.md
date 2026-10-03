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

Åtgärdsdatum och åtgärdssignatur kontrolleras i tabellen och efter omladdning. De lagras separat från signaturen för själva provningen.

Testa även med riktig PDF.js 3.11.174:

```sh
mkdir -p /tmp/dorrservice-pdfjs
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js -o /tmp/dorrservice-pdfjs/pdf.min.js
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js -o /tmp/dorrservice-pdfjs/pdf.worker.min.js
PDFJS_DIR=/tmp/dorrservice-pdfjs node tests/real-pdf.cjs
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js -o /tmp/dorrservice-pdfjs/jspdf.umd.min.js
PDFJS_DIR=/tmp/dorrservice-pdfjs node tests/problem-pdf.cjs
```

Det testet skapar en giltig PDF med två ritningssidor och kontrollerar uppladdning, dörrplacering, zoom, anpassning till skärmen och sidbyte. En bild av mobilvyn sparas som `mobile-preview.png`.

PDF-testet för anmärkningslistan använder riktig jsPDF och läser den nedladdade PDF:en med PDF.js. Det kontrollerar objekt/datum/order, urval och sortering av problemdörrar, åtgärdsdatum/signatur och sidbrytning för mycket långa anmärkningar. Exempelfilen sparas som `anmarkningslista-example.pdf`, med förhandsbilder av tabellen och PDF:en.

Tester i Chromium ersätter inte provning på en fysisk telefon. Kontrollera särskilt nypzoom och läsbarhet med verkliga stora ritningar. Rastertaket begränsar minnet för sidbilder; mycket komplexa PDF-filer kan fortfarande ta tid att tolka. Den äldre exporten av fullständiga provningsprotokoll och flera separata projekt omfattas inte av dessa tester.
