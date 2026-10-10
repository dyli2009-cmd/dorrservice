# SmartMatch TEST v36.48 – delad originalprotokoll och kontrollpunkter

**Datum:** 2026-10-10. **Ändrad modul:** Enbart SmartMatch TEST / Projektflöde. Ordinarie Tillsyno, Kontrollflöde, Säkerhetsservice, Ritningsverktyg, iOS/TestFlight och exportsystem lämnas orörda.

## Användarens önskemål

På telefonen ska teknikerna se originalprotokollet och de avbockningsbara kontrollpunkterna samtidigt, inte behöva växla mellan separata helskärmslägen. Cirka 50 % av skärmen ska användas för originalet till vänster och 50 % för kontrollpunkterna till höger. Det ska gå att jämföra och bocka av direkt.

## Byggt i v36.48

- För skärmbredder upp till 699 px: alltid **två synliga samtidiga kolumner, 50/50** när GS/dörrkortets projektprotokoll visas, oavsett äldre klass `pwMobileCard` eller `pwMobileChecks`.
- Originalprotokollet visas till **vänster**, kan zoomas med +/−/Passa och flyttas med fingret utan att checklistan flyttas. Överflödiga mobila växlingsknappar och 300 %-genvägen döljs.
- **Kontrollpunkter till höger** med separat vertikal rullning, rubrik och kompakt hantering av Markera alla, Avmarkera och Lägg till.
- Varje checklistpunkt är enklare att träffa med fingret: tryck på punktens text/kort för att markera/avmarkera; **Ändra** och **Ta bort** påverkas inte. Kryssrutor är 22×22 CSS-pixlar.
- På smal telefon ligger varje punkts egna ändringsknappar på en andra rad så att själva kontrolltexten får plats. Ingen nedskalning av PDF-filen som ändrar koordinater eller underliggande PDF-data.
- Den inledande originalvyn anpassas till vänsterkolumnens bredd genom PDF.js viewport. Zoom kan minskas till 20 % på smal telefon, medan äldre minst 40 % gäller bredare skärmar. Pinch zoom fungerar fortsatt.
- Mellan 700 och 1100 px (bl.a. iPad) används 50/50-vy. Större datorer behåller sin tidigare proportionering.
- Header- och panelhöjd hanteras med en dialog i flexkolumn för att båda panelerna ska kunna rulla oberoende under rubriken.
- Protokollets rubrik i högerspalten kortas till **Kontrollpunkter**.

## Versionsfiler och publicering

- `project-workspace-smartmatch-v36-48.html`
- `project-workspace-smartmatch-v36-48.css`
- `project-workspace-smartmatch-v36-48.js`
- Samma HTML i `project-workspace-smartmatch-test.html`, fast testlänk: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html
- Tidigare v36.47 lämnas intakt för återgång. Versionsnummer `SmartMatch TEST v36.48` i HTML/JS.
- Tidigare `smartmatch-protocol-export-v36-47.js`, `smartmatch-da-v36-46-module.js` och `smartmatch-session-v36-46.js` återanvänds utan förändringar.

## Verifiering och tester

**Kodkontroller:** Syntax i v36.48-JavaScript, statisk kontroll av HTML-id:n, tillgång till rätt CSS/JS-version och identiskt innehåll mellan versions-HTML och fasta test-HTML.

**Måste testas i Safari på iPhone:** Öppna ritning → klicka GS/dörrkort → säkerställ vänster original och höger kryssruta samtidigt i porträtt och landskap. Dra/zooma originalet utan att kontrollpunkter scrollas, scrolla checklistan separat, bocka av via text och kryssruta, prova Ändra/Ta bort, testa Passa, kontrollera att status sparas i projekt-PDF. Kontrollera också iPad och dator, på smal iPhone med längre textrader.

**Känt:** På stående iPhone är varje halva smal. Originalet kommer att vara litet vid Passa och kan behöva förstoras med nyp/zoom. Det är avsikten med användarens 50/50-val, inte felaktig skanning.
