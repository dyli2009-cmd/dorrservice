# SmartMatch TEST v36.41 – förenkla Revision dörrautomatik

2026-10-10. Användaren vill ha mindre rörig revisionsvy, ett tydligt "Klart" som sparar och en enda "Kundmall"-funktion för PDF-förhandsgranskning. Text vid 1.5 och 1.12 ska hålla en linje.

## Ändringar
- I modal **Revision dörrautomatik** visas **Klart**, **Kundmall** och stängkryss. Tidigare **Förhandsgranska PDF** heter nu **Kundmall**. De duplicerade knapparna **Spara lokalt** och **Skicka mejl** finns kvar dolda i DOM för bakåtkompatibilitet med exportmodulen, men syns inte.
- PDF-förhandsgranskningen har rubriken **KUNDMALL** och visar bara stängknapp i headern. Spara/skicka-knapparna döljs där också. Själva kund-PDF:ens innehåll och den separata PDF-exporten ändras inte.
- **Klart** gör redan `save()` men väntar nu dessutom på `SmartMatchSession.flushDraft()` (IndexedDB) innan revisionen stängs. Vid sparfel lämnas revisionen öppen med begripligt fel. **OBS:** lokal sparning ≠ exporterad PDF i Filer/Dropbox; separat **Spara projekt-PDF** finns kvar.
- **Anläggning / objekt** med `T.ex. Snidaren` tas bort från synligt formulär. Det underliggande `pwProjectName`-fältet flyttas till dold befintlig `pwRevisionLegacy` så redan sparade projektnamn och PDF-projektmetadata inte förstörs.
- Kontroll **1.5** i revisionen visar kort `Öppning: kraft, dämpning, hastighet`. **1.12** visar `Lås: slutbleck, motorlås, låshus`. Båda får en rad (CSS no-wrap). Fullständiga lagrade kontrolltexter används fortfarande i PDF och som aria-label/title. Mycket smala skärmar kan trunkera istället för att skapa felaktiga extra rader.
- Samtliga ändringar är i SmartMatch TEST. Skanner, GS, andra protokoll, ordinarie Dörrservice, Kontrollflöde och iOS/TestFlight är oförändrade.

## Testa på iPhone/iPad
1. Öppna dörrautomatikens revision: kontrollera två huvudknappar, ingen placeholder Snidaren och en rad för 1.5/1.12.
2. Gör en kontroll och tryck **Klart**. Kontrollera grön status, öppna samma revision igen och kontrollera sparad check.
3. Tryck **Kundmall**. PDF visas; spara/skicka döljs. Stäng och fortsätt utan att något exporterats.
4. Spara separat **projekt-PDF** via övergripande Spara och kontrollera alla fullständiga 1.5/1.12-beskrivningar.
5. Stäng av lokal lagring: Klart ska inte stänga modal utan varning.
