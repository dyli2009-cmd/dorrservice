# SmartMatch TEST v28 – Inga extra SmartMatch-rapportsidor i PDF

Fast testlänk: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

## Problem
TEST v27 exporterade flera PDF-sidor med rubriken "SmartMatch TEST v27 / Ritningspositioner & kontroll". Dessa sidor kunde bli många när varje position hade checklistor och kommentarer. Användaren vill skicka ritning + originaldörrkort, inte en utökad synlig statusrapport.

## Ändring
- Kompakt export skapar nu **noll extra PDF-sidor**. Ritning och dörrkort finns kvar exakt i ursprungligt antal sidor. Äldre SmartMatch-tilläggssidor från v17–v27 tas bort vid ny export.
- Fasta PDF GoTo-länkar från alla ritningspositioner till sitt gemensamma dörrkort behålls, med en enda originalkortsida, aldrig kopierade kort.
- För att kunna navigera mellan flera positioner för samma GS8 skapas en grupp **SmartMatch – Ritningspositioner** i PDF:ens **bokmärken/outline** med länkar till exakta ritningssidor och koordinater. Detta skapar inga extrasidor. Befintliga kundbokmärken bevaras; v28 bokmärken återanvänds vid omsparning utan upprepade grupper.
- På originaldörrkort finns en liten "TILL RITNING" länk. För ett enda ställe går den till exakt den positionen. Om flera delar kort går en knapp till **första** kända ritningspositionen som fallback; för exakt senaste position använder man PDF-läsarens **Föregående vy** eller positionsbokmärket. Det finns ingen universell dynamisk "till senast klickade" PDF-länk i vanliga PDF-läsare. Inne i SmartMatch återgår användaren fortfarande till exakt senast öppnade position.
- Arbetsstatus, checklista och projektdata finns fortfarande i inbäddad SmartMatch PDF-data för senare återöppning i systemet, men visas inte som extra sidor i kund-PDF.
- Gammalt oanvänt PDF-innehåll rensas med v25-v27 reachability-prune, men ursprungliga kopplade PDF-resurser bevaras. Inga bilder renderas om till raster.

## QA (syntetiska PDF:er)
- 22 positionslänkar till GS8, samma tre original-PDF-sidor före och efter export. v27 med två extra reportsidor konverteras till v28 med noll extrasidor.
- Omsparning ger inte fler PDF-sidor, samma antal länkar och ingen extra SmartMatch-bokmärkesgrupp. Bookmark-navigation skapad och PDF går att läsa in igen.
- Två dörrkort med existerande kundbokmärke: befintligt bokmärke kvar, ny SmartMatch-grupp tillagd, inga extrasidor.
- JS syntax / unika DOM-id / v28-statiska versioner kontrollerade. Kräver slutligt test av kunden med riktig PDF och respektive PDF-läsare, framför allt på iPhone/Safari.
- Enbart TEST v28 berörs, inte ordinarie iOS/TestFlight/Kontrollflöde.
