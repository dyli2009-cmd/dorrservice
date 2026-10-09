# SmartMatch TEST v20 – kopplade dörrkort och selektiv skanning
Fast adress: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

- Endast positioner med faktiskt kopplade dörrkort visas i ritningens markörer, arbetslistan och statistiken. Mappen Saknar dörrkort döljs och den äldre PDF-exportlistan med okopplade tas bort.
- Scanning börjar med dörrkorts-ID. PDF-text utan något identifierat dörrkorts-ID skippas före dyra bildrenderingar och färgscanning, utom sidor där en godkänd kortmarkering redan hittats. Godkända manuella kortlänkar räknas också.
- Kontrollprocent räknas bara på kopplade dörrkort. Återöppning av sparad projektstatus från v19/v18 stöds utan att ta bort äldre lagrade uppgifter.
- Använd Placera / koppla för att registrera dörrar som saknas vid skanningen. Bildbaserade PDF utan läsbar text kan kräva OCR eller manuell hjälp.
- Hastighetsvinsten är inte uppmätt på verklig ritning ännu. Testa särskilt att faktiskt kopplade kort inte missas i v20 jämfört med v19.
- Fast länk uppdaterad. V19 och ordinarie app, Kontrollflöde och TestFlight oförändrade.
