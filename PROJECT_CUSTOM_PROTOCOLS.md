# Egna koder och protokoll i Projektflöde

Tillagt i version 2.4.260. Funktionen ligger separat i `project-custom-protocols.js` och `project-custom-protocols.css`. Den används av både den vanliga och den licensierade Projektflöde-sidan. Kontrollflöde och dess befintliga protokoll ändras inte.

## Användning

1. Öppna Egna protokoll, före eller efter att projekt-PDF:en valts.
2. Lägg till en mall med kod/nummer, protokollnamn och kontrollpunkter (en per rad).
3. Välj kodfamilj för exempelvis GZ-01/GZ-02, eller exakt kod för exempelvis 14-18.
4. Läs PDF:en på alla, aktuella eller valda sidor. Granska och välj träffarna innan protokollen skapas.
5. Klicka på markeringen i ritningen eller på objektet i listan för att fylla i protokollet. Varje position har egen arbetsstatus.
6. Spara projekt för att få med mallar och protokoll i projekt-PDF:en. Spara protokoll PDF ger ett läsbart separat kontrollprotokoll.

## Sparande och offline

Mallbiblioteket sparas lokalt. Projektets egna mallar och protokoll ligger även i `customProtocols` under den befintliga PDF-postens `TillsynoProjectData`. En sparad projekt-PDF kan därför öppnas på en ny enhet. Malländringar påverkar nya protokoll; redan skapade protokoll behåller sina egna punkter, som kan ändras separat.

Appfilerna måste hämtas med internet en gång, tills statusen säger Redo för offline. Därefter kan en lokal PDF väljas, läsas och arbetas med utan internet. PDF-läsningen och kodmatchningen sker på enheten. Skannade bilder utan PDF-text behöver textigenkänning och stöds inte av denna läsfunktion.

Exakta kodgränser används för att exempelvis GZ-01 inte ska matcha XGZ-01 och 14-18 inte ska matcha 114-18. När PDF-text är uppdelad i närliggande fragment på samma rad kan fragmenten läsas tillsammans. Träffarnas läge beräknas från PDF-textens koordinater och ska granskas av användaren. Återläsning skapar inte nya kopior av redan skapade positioner.

## Verifiering

`tests/project-custom-protocols.cjs` kontrollerar dator och mobil, exakta koder/kodfamiljer, delad PDF-text, val av sidor, granskning före skapande, klickbara markeringar, separata protokollstatusar, PDF-export, portabel projektstatus, återöppning och nya PDF-träffar helt offline, samt import på en ny enhet.

## Dörrkort och befintliga egenkontroller (2.4.261)

Mallen har tre mål: eget protokoll, dörrkort från PDF och egenkontroll från befintlig mall. De nio befintliga kontrollmallarna kopieras till en separat projektfil, utan ändringar i Kontrollflöde. Användaren väljer vilken mall som ska användas.

Nummerserie GS1 och uppåt söker även GS2 och GS100. Varje kod matchas därefter exakt mot en dörrkortssida. Kortens egna sidor skapar inte ritningspositioner. Saknat dörrkort kan inte väljas; flera matchande kort kräver att användaren väljer sida. Originaldörrkortet visas i protokollet och följer med vid separat PDF-export.

Objekt–modellkod–antal läser exempelvis 1111-45-3 till objekt 1111, modellkod 45 (SW300) och antal/löpnummer 3. Kända modellkoder används; saknade uppgifter kan granskas och kompletteras före skapandet. Objektuppgifterna sparas per position.

Företag och installatör använder Projektflödets gemensamma projectMeta. Datum, tekniker och signatur delas mellan de nya egenkontrollerna. Kund- och projektuppgifter stannar i projektet; företags- och installatörsuppgifter kan användas som förval från enheten. Gemensamma uppgifter följer med i projekt-PDF och egenkontrollens PDF-export.

`tests/project-linked-protocols.cjs` verifierar mallkopiorna, nummerserier, exakta kortkopplingar, val vid flera kort, saknade kort, originalkort vid PDF-export, automatisk avläsning av modell/antal, gemensamma uppgifter, offline och portabelt projekt i den licensierade sidan.

## Guidad avläsning av markeringar (2.4.262)

Egna protokoll läser även Stamp, Highlight, FreeText och Square, deras kodfält och texten under markeringen. GS-koder normaliseras med Projektflödets befintliga funktion. Hela objektnumret–modellkoden–antalet bevaras för egenkontroller. Samma position som också finns som PDF-text skapar bara en träff; upprepad avläsning lämnar redan skapade protokoll och deras status kvar.

Dörrkort matchas med samma exakta GS-kod och avgränsning som originalflödet på alla sidor utanför ritningssidorna. Kortet behöver ingen särskild rubrik. En unik träff kan öppnas direkt; vid flera träffar väljer användaren rätt sida. Det befintliga flödets extraktion, protokoll och kontroller ändras inte.
