# SmartMatch TEST v36.31 – enbart PDF när fil delas till Dropbox via iPad

**Rapporterat:** När teknikern på iPad väljer att spara ett revisionsprotokoll till Dropbox blir det ibland både en PDF och en separat textfil med rubriken "Spara revisionsprotokoll". Den textfilen är inte projektdata, utan sannolikt titel-/textmetadata från iOS-delningen.

**Ändring:** Alla Web Share-anrop som överför en eller flera PDF-filer (huvudprojekt-PDF, enstaka revisionsprotokoll, batch-protokoll, Spara lokalt och även Skicka mejl) skickar nu **endast** `{files:[...]}`. Ingen `title` eller `text` bifogas som riskerar att behandlas som separat textfil i Dropbox. På e-postknappar måste användaren ange mottagare/ämne i mejlappen efter val av delningsmål eftersom dessa avsiktligt inte längre ligger i iOS Web Share-payloaden.

**Oförändrat:** PDF-innehåll, offlineprojektdata i PDF, versionsnummer för projekt, 0–100 % laddning, humor, GS-sökning, automatiker, checklistor, SLR och TestFlight/produktion. SmartMatch TEST v36.30 kvar för återgång.

**Manuellt test behövs:** I iPad öppna TEST v36.31, välj ett revisionsprotokoll → Spara lokalt → Dropbox. Kontrollera att endast en .pdf visas, och att samma PDF öppnar rätt. Testa även PDF → Spara lokalt till Dropbox. iOS/Dropbox kan hantera delningsmenyn olika; om det fortfarande skapas textfil behövs skärmbild på Dropbox-filnamnen för vidare felsökning.