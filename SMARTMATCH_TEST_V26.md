# SmartMatch TEST v26 – Granska PDF och faktisk storlek i MB

Fast testlänk: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

- Ny mindre knapp **Granska PDF** direkt i verktygsraden mellan **Analys & rapporter** och **Lägg till dörrkort-PDF**.
- Knappen blir aktiv när en PDF är öppnad; genom ett tryck öppnas granskningen och originalfilens verkliga storlek i MB visas direkt. Sidantal, ritningssidor, dörrkort, filnamn och antalet kopplade ritningspositioner visas i sammanfattningen.
- Kompaktexporten, utan dubbletter av dörrkort, skapas automatiskt vid granskning. När analysen är färdig visas faktisk storlek efter export, sparade MB och procentuell förändring. Om filen inte blev mindre visas detta.
- PDF:n sparas inte eller skickas automatiskt under analysen. Från samma dialog kan man välja förhandsgranska, Spara objekt, Spara lokalt, Spara som eller Skicka mejl, med samma säkerhetsbegränsningar som tidigare.
- Granskningsdialogen har behållit **Analysera igen** så att man manuellt kan uppdatera efter ändringar. Mejlvårt ca 18 MB för 25 MB-tjänster är fortfarande försiktighetsgräns, inte garanti.
- Tidigare v25 sparad i separat versionerad fil; ordinarie Kontrollflöde, iOS/TestFlight och andra produktionsfiler oförändrade.

## Verifiering
- Syntax och unika HTML-id, versionsresurser, granska-knapp kopplad till exportflödet och att gammal duplicerad dörrkorts-export inte återkommit.
- Praktiska mobil-/datorupplevelser och verklig filstorleksbesparing bör verifieras med användarens riktiga projekt-PDF.
