# SmartMatch TEST v33 – synlig skanningsstatus vid filnamn

Testlänk: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

## Ändrat
- Vid inläsning och automatisk matchning av projekt-PDF syns en liten skanningsindikator centrerad under filnamn och plan/område (t.ex. Snidaren · FÖRRÅD).
- Texten visar "Skannar PDF…", "Skannar dörrkort · sida 4/25" eller "Skannar ritning…" efter aktuell status.
- Använder de redan befintliga skanningsmeddelandena; inga extra skanningar eller ändringar i PDF-matchningen.
- Skanningsindikatorn döljs automatiskt när analysen avslutas, även vid fel; detaljerad intern status förblir tillgänglig för skärmläsare.
- Mobilanpassad diskret indikator med spinner och stöd för minskade animationer.

## Avgränsning
- Endast SmartMatch TEST v33. V32 och tidigare lämnas orörda.
- Kontrollflöde, ordinarie webb/iOS och TestFlight ändras inte.
- Statisk syntax/DOM-kontroll utförd; praktiskt test på riktiga PDF:er återstår.
