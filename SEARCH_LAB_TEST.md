# Projektflöde test – fristående testkopia

**Öppna:** `project-workspace-test.html` på samma GitHub Pages-adress som ordinarie Projektflöde.

## Avgränsning
- Testsidan är visuellt en kopia av **hela Projektflödet** med samma ritningsyta, verktyg, positioner, dörrkort och checklistor.
- Inga produktionsfiler (`project-workspace.html/js/css`, `index.html`, Kontrollflöde, iOS) är ändrade.
- Testsidan använder separata **project-workspace-test.html/js/css**.
- Ursprungliga länken `search-lab.html` skickar vidare till nya testsidan.
- Lagring och återöppning är separerade genom `tillsyno-project-workspace-test:v1:` och PDF-nyckeln `TillsynoProjectTestData`. Originalets `TillsynoProjectData` läses/skrivs inte av testet.
- Spara projekt skapar alltid en separat `-soktest.pdf`. Ingenting skrivs över i originalfilen.

## Vad som testas i den VANLIGA ritningsvyn
1. Öppna en PDF som vanligt.
2. Motorn hittar separata färgmarkeringar med läsbar beteckning, t.ex. `GS14`, `140D`, `1`, även om färgen skiljer.
3. Varje annoterad markering blir egen position med sida och PDF-koordinater.
4. Motorn läser hela PDF:en och matchar kod i dörrkortets högst fyra första relevanta identifieringsrader, inte artikel-/beslagsrader.
5. Säkert matchade positioner får klickbar dörrkorts-/protokollvy och checklista.
6. Ej matchade positioner visas också på ritningen och i **den befintliga positionslistan**, med status.
7. Om flera dörrkort innehåller samma identifierare får användaren välja korrekt dörrkort när positionen öppnas.
8. Testpositioner och bockad checklista sparas separat per position.

## Testgränser
- PDF-färg måste vara tillgänglig som en läsbar markering/annotering med text. Färg inbakad i en bild är inte avläsbar i denna version (ingen OCR).
- Matchning av dokument med flera dörrkort per PDF-sida och ovanlig layout kan behöva utvecklas vidare efter verkliga tester.
- Testversionen finns som separat webbsida, inte som TestFlight-installation.
