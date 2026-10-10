# SmartMatch TEST v36.52 – rätta öppning av nästa PDF efter Stäng ritning

**Datum:** 2026-10-11. **Omfattning:** Endast SmartMatch TEST. v36.51 finns kvar. Ingen ändring i ordinarie Tillsyno, Kontrollflöde, iOS/TestFlight eller PDF-export.

## Fel från fysisk iPhone
Efter att användaren hade öppnat en PDF och klickat **Stäng ritning**, försök att öppna en annan PDF gav i Safari:

`SmartMatch kunde inte öppna ritningen. null is not an object (evaluating "$('pmCancel').hidden=true")`

Knappen `pmCancel` finns i HTML ursprungligen, men försvann efter föregående projektstängning. Detta är ett programfel och säger inget om den nya PDF-filens skick.

## Fastställd rotorsak
`renderGroups()` flyttar med avsikt `<details id="pwPositionEditor">` inklusive `pmCancel`, `pmCode`, `pmCard`, `pmCodes`, `pmAdd` och `pmLink` **inuti `#pwGroups`** för att visa den tillsammans med "Ritning & dörrkort".

I `smartResetWorkspace()` (körs efter Stäng ritning) gjordes `el.groups.replaceChildren()` **utan att först ta tillbaka den återanvända DOM-noden**. Alla element i `#pwPositionEditor` kopplades därmed bort från DOM. När nästa PDF öppnades anropade `analyze()` `pmCancel()`, som gjorde `$('pmCancel').hidden=true` på `null` och kastade ett TypeError innan den nya filen analyserats.

## Åtgärd
- Innan `el.groups.replaceChildren()` i `smartResetWorkspace()` flyttas **exakt samma `drawingManualEditor`-nod** tillbaka som direkt barn till `el.side`, placerad före `el.groups`. Ingen ny nod/klon används, så event handlers och kopplingar bevaras.
- Placeringens tillfälliga värden nollställs (märkning, dörrkortssida, Avbryt-knapp, hjälptext, editor stängd), men det sparade projektets PDF-data ändras inte.
- `pmCancel()` hanterar även ett eventuellt saknat `pmCancel`-element defensivt utan krasch.
- Vid nästa `renderGroups()` flyttas det bevarade editor-elementet in i aktuellt ritning/dörrkort-grupp på nytt.
- Ändrar inte knappen **Stäng ritning**, lokala arkiveringen, tidigare tidsmallar, 50/50-mobiljämförelsen eller export.

## Tester utförda
- Syntaxvalidering av ny versionerad JavaScript-fil.
- Simulerad DOM-reparenting där samma editor flyttas in i `#pwGroups` och hela gruppen sedan rensas, **två gånger i följd**. Alla `pmCode`, `pmCodes`, `pmCard`, `pmAdd`, `pmCancel`, `pmHelp`, `pmLink` återfinns därefter korrekt från DOM vid båda avsluten.
- Versions-HTML och fasta TEST-HTML ska vara identiska.
- Fysisk Safari-test med verkliga ritningar kvarstår. Testsekvens: ladda fil A → Stäng ritning → ladda fil B → Stäng ritning → ladda fil A eller C. Kontrollera att den gamla ritningen rensas, nya PDF-texten matchas och tidigare arkiverad version kan öppnas separat.

## Versionsfiler
- `project-workspace-smartmatch-v36-52.js`
- `project-workspace-smartmatch-v36-52.html`
- `project-workspace-smartmatch-test.html` (fast testlänk)
- CSS `project-workspace-smartmatch-v36-51.css` och session `smartmatch-session-v36-46.js` återanvänds oförändrade.
