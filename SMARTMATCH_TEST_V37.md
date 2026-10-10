# SmartMatch TEST v37 – hopfällda kategorier och separat revisions-PDF

Testadress: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

- Ritning & dörrkort och DA · Egenkontroller börjar hopfällda när en projekt-PDF öppnas. Vid fortsatt arbete håller de användarens visa/dölj-val.
- Mindre rubriktext och positionsräknare i sidopanelen, även på iPhone.
- GS-placering, manuell dörrkortskoppling, sökning, borttagning och protokollskanning bibehålls.
- Tryck på en identifierad dörrautomatik och välj enbart mellan Checklista revision dörrautomatik och SLR – dokumentmapp. Koppla/ändra GS ligger i ⋯-menyn.
- Checklistan visar befintliga 18 punkter med avvikelseval, fritext, kunduppgifter, signatur och kundmall.
- **Spara PDF** inne i checklistan skapar enbart ett separat revisionsprotokoll för exakt vald automatik med dess ID. Ingen projekt-PDF, ritning, dörrkort eller andra automatikprotokoll inkluderas.
- På iOS/mobil används navigator.share med en enda PDF-fil när det stöds; annars laddas filen ner. Statusmeddelande visas vid lyckad export, avbruten delning och fel.
- Samma SmartMatch-projektstatus och lagringsprefix bibehålls. Äldre sparade checklistor påverkas inte.

## Isolering och kontroll
Nya snapshots: project-workspace-smartmatch-v37.html, .js, .css samt smartmatch-da-v37-module.js. Fast testadress pekar på v37, samma HTML. v36 är oförändrad. Kontrollflöde, ordinarie Dörrservice och TestFlight ändras inte.

Kontrollera praktiskt: öppna projekt, se båda grupperna stängda, testa GS1 till dörrkortssida 11, välj automatik -> revision, fyll i anmärkning, tryck Spara PDF, kontrollera att enbart rätt revisions-PDF skapas med märkning och anmärkning. Test på faktisk iPad och verklig PDF återstår.
