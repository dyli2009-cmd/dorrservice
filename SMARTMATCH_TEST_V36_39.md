# SmartMatch TEST v36.39 – avsluta projekt och öppna nästa PDF utan att starta om appen

## Nytt användarflöde
1. På aktiv PDF finns **✓ Avsluta** högst upp i projektraden.
2. I dialogen kan teknikern **Fortsätta arbeta**, **Spara projekt-PDF** via den befintliga exportdialogen, eller **✓ Spara lokalt och avsluta**.
3. Lokal arkivering sparar original-PDF-bytes, projektets nuvarande skroll/vy och samtliga lokala utkast/checkboxändringar i **IndexedDB på enheten** (separata poster per PDF-hash).
4. Först när både lokal utkastskrivning och arkivering lyckas lämnar appen projektet och visar samma startsida utan någon `location.reload()`. Vid fel ligger projektet kvar.
5. Startsidan visar **Öppna ny PDF** och **Senaste projekt på den här enheten**. Tidigare lokala projekt kan öppnas där och deras PDF/arbetsutkast återställs; det gamla projektet har ingen aktiv-sessionpekare kvar efter att det avslutats.
6. Vid PDF-export fungerar allt som tidigare; inga nya PDF-annoteringar eller statusändringar tillkommer.

## Säkerhet och begränsningar
- **Lokal arkivering är inte en sparad fil i Filer, Dropbox, OneDrive eller annan mapp** och synkas inte mellan enheter. Använd den vanliga 'Spara projekt-PDF' innan du lämnar om du behöver en fristående fil.
- Lokal webbläsardata kan försvinna om användaren rensar webbplatsdata eller iOS frigör lagring. Utgå inte från att lokal arkivering motsvarar en arkiverad kundfil.
- Projektets PDF-byte-array lämnas orörd; ändringarna är ett separat autosparat arbetsutkast tills användaren exporterat dem. Ingen PDF skrivs över utan särskilt kommando/behörighet.
- Alla tidigare versionsfiler behålls. Ordinarie app, Kontrollflöde och TestFlight orörda.

## Testfall
- Slutför 3 kontroller på A, avsluta lokalt, öppna B, avsluta, öppna A från Senaste projekt. Kontrollera att alla kontroller finns kvar efter återställningsprompten.
- Prova samma scenario med en 30 MB PDF, iPhone, iPad och Safari. Öppna A, B fram och tillbaka flera gånger, inga sammanblandade GS/DA.
- Verifiera att **Spara projekt-PDF** öppnar vanliga PDF-dialogen och att den exporterade filen kan öppnas separat.
- Bryt IndexedDB-behörigheten/testa privat läge: fel ska stoppa avslut och behålla pågående arbete.
- Ladda om webbläsaren på startsidan: inget gammalt projekt ska öppnas automatiskt.
- Kontrollera att mobilknappen inte döljer projektnamn eller zoomkontroller.

Automatisk statisk JS-kontroll utförd; fysiska användartester återstår.
