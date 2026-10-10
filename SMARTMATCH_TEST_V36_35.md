# SmartMatch TEST v36.35 – fasta färdighetsstämplar i sparad PDF

## Överenskommen funktion
- Procentstatusen på arbetspositionen och kontrollistorna finns kvar.
- Den extra statusetiketten i PDF ska inte vara en redigerbar FreeText-anteckning eller klickbar knapp.
- Exporten lägger till en **liggande statusstämpel som vanlig PDF-grafik nära rätt GS-position**. Fullt klar position visar 100 %, delvis klar visar motsvarande procentsiffra.
- Procentlagret syns i vanlig PDF-läsare och vid utskrift men döljs på SmartMatch-ritningens arbetsyta. Den klickbara positionens status och checklista består.
- Tidigare SmartMatch-genererade PDF-strömmar identifieras via katalogen `SmartMatch36ProgressStreams`, avlägsnas och ersätts vid omexport. Äldre redigerbara `SM35:progress`-anteckningar avlägsnas av befintlig exportstädning.
- Ingen extra PDF-sida tillkommer; originalets ritningar och dörrkort behåller sina data.
- PDF kan fortfarande ändras med professionell PDF-redigering, men statusstämpeln är inte längre en fristående PDF-anteckning.

## Teknisk verifiering
Projektets PDF-metadata kontrolleras fortfarande efter export. Från v36.35 kontrolleras även att PDF-statusens strömreferenser är inbäddade i rätt PDF-sidans innehåll. Export stoppas vid avvikelse.

## Mobil- och rundresetest
1. Gör GS4 100 %, spara projekt-PDF, öppna PDF i Filer och Acrobat. Stämpeln ska vara liggande nära GS4 och inte öppna redigering vid tryck.
2. Öppna exporterad PDF i SmartMatch: extra exportstämpel ska inte synas på ritningen. Klickbar GS och procentstatus i arbetsflödet ska finnas kvar.
3. Ändra status till exempelvis 50 %, exportera igen, kontrollera att 100 % inte ligger kvar.
4. Exportera samma projekt flera gånger; kontrollera inga dubbla stämplar, ingen extra ritnings-/dörrkortssida.
5. Prova stora och roterade PDF-ritningar; kontrollera projektdata, 17 automatiker, GS-kopplingar och korrekt zoom.

Endast SmartMatch TEST. Produktion, Kontrollflöde, iOS och TestFlight oförändrade. v36.34 kvar som återgång. Manuell PDF-läsartestning återstår.
