# SmartMatch TEST v36.17 – klickbar GS-ritning med meny för valda revisionsprotokoll

## Alternativ A implementerat i den samlade PDF-exporten
- **Skicka protokoll** -> välj automatiker -> standardaktiverat **Ta med kopplade ritningssidor och klickbar GS-navigering**.
- De relevanta ORIGINALRITNINGSSIDORNA kopieras in en gång per sida. Varje bekräftat befintligt GS-ID på samma sida som vald automatik markeras diskret och blir en klickbar länk.
- Klick på en GS-position öppnar **en menyside per fysisk GS-position**. Har GS5 sex valda automatiker får du en lista med sex olika DA-ID:n, deras modell och procent. Bara de valda, aldrig orelaterade protokoll.
- Varje rad länkar till första sidan i rätt revisionsprotokoll, inklusive ev. fortsättningssidor.
- Alla protokollsidor har **TILL RITNING** tillbaka till exakt kopplad ritningsposition. Menyn har också TILL RITNING.
- Automatiker utan giltigt GS-ID på samma sida länkas INTE med gissning. De följer ändå med som separata protokoll med en **Utan GS-koppling**-meny och TILL LISTA i stället.
- Långa listor delas upp i max 18 poster per menyside med klickbar nästa/föregående.
- Frivilligt kryss för att exportera gamla rena checklist-PDF:en utan ritningar.
- Samma kombinerade PDF används för Förhandsgranska, Spara lokalt och Skicka via mejl. Enskilt revisionsprotokoll via revisionsdialogen är fortsatt separat och utan ritningen.
- Ingen originalritning eller faktisk projektfil skrivs över, ingen konvertering till bild. Kopierar PDF-sidor och lägger interna GoTo-annoteringar i exportfilen.
- **SmartMatch-förhandsgranskningen** har numera en klickbar HTML-annotation-layer över PDF.js-canvas, intern navigering och zoom +/−, med fokusering på GS vid återgång till ritning. Länkarna är också standard PDF GoTo-destinationer i den sparade filen.

## Begränsningar och test
- Automatisk tidigare närhetskoppling kan ha länkat fel GS; exporten använder bara befintliga länkade GS-ID:n på samma sida och gör inga nya gissningar. Teknikern måste kontrollera att befintliga GS-kopplingar är korrekta innan kundutskick.
- PDF-länkstöd kan skilja mellan PDF-läsare; testa Acrobat och Filer/iPhone/iPad.
- Verifiera med riktig PDF: sex automatiker under samma GS-position, välj bara några, kontrollera att en enda GS-meny visas med en rad per vald automatik. Testa tillbaka till ritning, zoom, enstaka export, ofullständiga checklistor och automatiker utan GS.
- Inga ändringar i Kontrollflöde, ordinarie app eller iOS/TestFlight.
