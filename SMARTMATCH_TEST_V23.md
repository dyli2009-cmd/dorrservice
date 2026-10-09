# SmartMatch TEST v23 – Granska & optimera PDF innan delning

Fast testlänk: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

**Ny exportdialog:** Spara projekt/Spara som öppnar PDF-granskning. Visar originalets storlek och färdig PDF-storlek, komprimeringsresultat, öppen PDF-förhandsgranskning (webbläsarfönster), samt separata knappar Spara/dela och Ladda ner. Filen byggs bara när användaren väljer format och trycker Optimera & beräkna storlek; inga automatiska bilagor eller mejlutskick. Under/över ~18 MiB visas mejlrisk på grund av e-postkodning och 25 MB-gräns.

**Kompakt (standard):** Inga per-position-dörrkortskopior. Huvudritningen är klickbar direkt till originaldörrkortet. På dörrkortet finns en 'TILL RITNING'-länk direkt tillbaka om kortet används en gång; för kort som delas av flera positioner går länken till en klickbar lista i statusdelen. Exporten innehåller arbetsstatus, GS-punkter, anteckningar och sparad projektdata. Kompakt sparar med pdf-lib objektströmmar. Varken bilder eller vektorritningar görs suddiga genom omritning.

**Fullständig:** Behåller TEST v22:s egen dörrkortskopia per position med direkt retur till exakt position; sparar som tidigare utan objektströmmar och kan bli betydligt större.

**Kompatibilitet:** TEST v23 läser inbäddade projektdata från tidigare versioner, och exporten tar bort äldre genererade navigerings-/statussidor vid omsparning. Kända gamla TEST v22-HTML/JS/CSS rörs inte. Låst Kontrollflöde och ordinarie iOS/TestFlight rörs inte.

**Begränsningar:** Kompakt PDF får inte garanterat under 25 MB; gamla inbäddade skannade bilder kan dominera storleken. Mail kan koda bilagan större. Besparing behöver mätas på verklig användar-PDF; iPhone PDF-visare och mobildelning behöver praktiskt testas.
