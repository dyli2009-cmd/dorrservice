# SmartMatch TEST v17

- GS-arbetsrader visas som kompakta kontroller **vid sidan av originaldörrkortet**, inte ovanpå originalritningen.
- Varje faktisk GS-rad har Monterat / Drift / Provat och ANM. Informationsfält, DT och tillverkarens rader filtreras bort av befintlig konservativ GS-tolkning.
- Tre steg sparas separat per ritningsposition i v17-PDF:ens projektdata. En GS-rad är 100 % klar först när samtliga tre steg är markerade.
- Dörrkortet kan zoomas med +, −, Passa, 300 %, nypzoom eller Ctrl+hjul. Växla mellan synlig del av originalkortet och kontrollkolumnen med Dörrkort / GS-kontroller.
- Återgång i appen går till tidigare ritningssida, scroll och zoom. PDF-export har standard-PDF-länkar från ritning till kort och från kort till bilagans status, med länkbara rapportposter vidare till ritning.
- PDF-exporten behåller originalritning och originalkort och lägger till GS-resultat och anmärkningar som separata sidor. Generiska PDF-läsare kan inte automatiskt minnas exakt vilken av flera GS-positioner som öppnade samma dörrkort. Den exakta återgången gäller i appen.
- Samma PDF kan återöppnas i v17. Öppnar även sparad v16-, v15- eller v13-PDF. TEST v16-filerna ändras inte.
- Syntax och HTML-ID-kontroller körs inför commit. Kräver praktisk test på kundritning, iPhone/iPad och PDF-läsare före ordinarie publicering.
