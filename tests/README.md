# Version 2 – mobil och arbets-PDF

Kör `node tests/v2.cjs` med Playwright och Chromium installerade. Testet använder riktiga PDF.js 3.11.174, jsPDF 2.5.1 och pdf-lib 1.17.1. Placera deras pdf.min.js, pdf.worker.min.js, jspdf.umd.min.js och pdf-lib.min.js i /tmp eller ange PDFJS_DIR.

Testet kontrollerar stående mobilvy i 320, 390 och 430 pixlar, modellkoder och dörr-ID, dubbla ID, gemensam tekniker/signatur, riktig PDF-export, rapportordning, återställning utan lokal lagring och nästa service. En ny export ska behålla originalritningen utan att tidigare rapporter staplas.

De äldre testfilerna gäller version 1 och dess tidigare navigation. v2.cjs är det aktuella integrationstestet. Chromium ersätter inte kontroll på fysisk iPhone med Safari.

Arbets-PDF innehåller originalritningen och strukturerade serviceuppgifter. Appen sparar också lokalt per PDF-innehåll som skydd under arbetet. Ingen projektdata skickas till en server. Använd Spara PDF för att överföra arbetet till en annan person eller enhet. PDF-redigerare kan ta bort de inbäddade uppgifterna när filen skrivs om.
