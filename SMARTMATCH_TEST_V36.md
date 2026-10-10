# SmartMatch TEST v36 – Koppla dörrautomatik i ritningsvyn

**Status:** Första integrerade testversion. Det tidigare fristående testet `smartmatch-automatik-koppling-test.html` finns kvar, men nu ligger funktionen i den ordinarie SmartMatch TEST-vyn.

## Funktion i v36
- Öppna vilken ritning/PDF som helst i SmartMatch TEST.
- Öppna **Verktyg → Koppla dörrautomatik** och skriv ett exempel, t.ex. `70154-78-24-11`.
- Tryck **Analysera märkningar**. Analysen letar på ritningens PDF-text efter samma **märkningsfamilj**, dvs. allt före sista bindestrecket. Även `70154-78-24-10`, `70154-78-24-12` osv. får **egna knappar**.
- Olika märkningar med samma familj får inte blandas ihop: varje märkningsknapp har egen identitet, individuellt GS-länkfält, revisionschecklista och SLR-struktur.
- SmartMatch använder sina **redan hittade GS-positioner** för att föreslå en koppling om en närmaste dörr är tydlig. Oklara kopplingar lämnas utan länk och väljs i dörrknappens GS-lista.
- Blå pil markerar koppling på ritningen. Anpassas när ritning zoomas eller sida byts.
- Verktygets **Placera manuellt** fungerar när den automatiska textextraktionen inte känner igen en märkning: skriv märkningen och tryck på platsen i ritningen.
- Tryck på knappen för att öppna **Checklista revision dörrautomatik** (redan existerande mall med anmärkningar, projektuppgifter och Kundmall) eller **SLR**.
- Revisionen har nu **Spara** och **Spara PDF** (den aktuella revisionen). SLR visar dokumentmappens avsedda rubriker, men mallarna är ännu inte byggda.
- Märkningar, GS-kopplingar, revisionsstatus och SLR-datafält sparas i projektstatus och följer med när projekt-PDF exporteras. Befintlig v35-status används fortsatt via samma lagringsnyckel för kompatibilitet.

## Viktiga begränsningar och tester
- **Automatisk märkning kräver läsbar text i PDF.** Skannade bilder behöver OCR eller manuell placering.
- När flera GS-positioner ligger nära märkningen ska kopplingen **kontrolleras manuellt**. Avstånd är ett förslag, inte garanti.
- Endast första etappen med knappar och dokumentmappens grund är klar; SLR-dokumentens formulär, produktlista och fullständiga CE-underlag är inte färdiga.
- Samarbete tre tekniker/offlinesynkronisering är fortfarande endast planerat i `SMARTMATCH_SAMARBETE_OFFLINE_PLAN.md`.
- Syntax och unika HTML-ID har kontrollerats. Riktig iPad/PDF-test och återimporttest återstår.
- **Huvudappen Dörrservice, Kontrollflödet och TestFlight är inte ändrade.** v35-filerna är kvar oförändrade.

## v36 korrigering – PDF-filväljaren öppnas igen (2026-10-10)

- Felorsak hittad: `openProjectPdf()` hade ett enda `try/catch` för både `showOpenFilePicker()` och `analyze(file)`. Om PDF-analysen kastade ett fel behandlades det felaktigt som ett filväljarfel, och den vanliga filväljaren öppnades igen.
- Korrigering: separera valet av fil från PDF-analysen. När en fil valts anropas inte någon ytterligare filväljare automatiskt. Vid fel visas faktiskt felmeddelande istället.
- Robusthet: om den nya dörrautomatikmodulen misslyckats med att laddas ska grundläggande PDF-inläsning och GS-funktioner inte avbrytas på grund av ett direkt modulupprop.
- Uppdaterade cacheversionsparametrar för JS till `36-2` så telefon/iPad laddar om korrigerad kod.
- Ingen ändring i tidigare v35-snapshot. Ingen schemaändring eller rensning av sparade projekt.
- Kontroll: JS-syntax och HTML-ID kontrollerade. Praktiskt test med användarens riktiga PDF på iPad återstår.

## v36-3 – rättad PDF-skanning och initieringsordning (2026-10-10)
- Rättat JavaScript-fel `Cannot access 'pmPointer' before initialization`: `pmPointer` initialiseras nu tidigt innan några PDF-filer kan analyseras.
- Dörrautomatikmodulens `init` sker **efter** den vanliga SmartMatch-skanningen och rendering av GS-positioner, inte vid sidans uppstart.
- Om dörrautomatikmodulen saknas eller får fel under initiering skrivs en varning, men det tidigare GS-/dörrkortflödet fortsätter.
- Den vanliga filuppladdningen, dörrkortsskanningen, ID-positioneringen och PDF-projektlogiken behålls.
- Ny JS-cacheversion `v=36-3` för att undvika äldre mobilcache.
- Ingen förändring av PDF-projektstatus eller v35-snapshots. Kodens syntax kontrollerad; iPad-test med användarens PDF återstår.

## Versionsnummer på skärmen – TEST v36.4 (2026-10-10)

- Alltid synligt i SmartMatch-överdelen: **TEST v36.4** på dator, iPad och iPhone.
- När huvudskriptet laddats och initierats färdigt visas **TEST v36.4 ✓**. Om ✓ saknas efter laddning har inte hela appskriptet slutförts.
- Bredvid versionsnumret finns **↻ Uppdatera**. Den läser om appens startsida med ny URL-parameter för att undvika att samma HTML returneras från webbläsarens vanliga sidcache.
- Om en PDF redan är öppen varnar uppdateringsknappen om att ritningen måste väljas på nytt. Användaren bör spara sina aktuella ändringar innan uppdatering.
- Skript och CSS får versionsstämplade adressparametrar `v=36-4` och rubriken innehåller samma versionsnummer. Versionen identifierar den **faktiskt laddade appkoden**, inte den senaste commit som eventuellt finns på nätet.
- Vid varje framtida ändring ska den synliga versionsbeteckningen, dokumentets titel, JS-releasekonstanten samt resursparametrarna höjas tillsammans, t.ex. `v36.5`, `v36.6` och därefter `v37.0` om en ny huvudversion skapas.
- Behåller v36.3:s PDF-öppningskorrigering och sena initiering av dörrautomatikverktyget; tidigare v35-filer oförändrade.

## v36.5 – Flytta och ändra storlek på GS-/projektpositioner (2026-10-10)

- **Position 1 → ⋯ → Flytta / storlek** kan nu användas för både exakt flytt och rektangelstorlek.
- **Kort klick/tryck:** flyttar positionen men behåller föregående storlek; om markeringen var minimalt liten används en rimlig storlek som rymmer positionskoden.
- **Klicka + dra med mus eller finger:** ritar själv en rektangel i samma storlek som märkningen på ritningen. En förhandsvisning syns under draget; efter släpp lagras exakt rektangel och plats i PDF-koordinater. Storleken består vid byte av ritningssida och zoom och ingår i projektsparningen.
- Texten för flyttade och manuellt placerade märkningar skalar efter rutans dimensioner.
- Vid Flytta/Storlek på en position som tillhör en annan ritningssida växlar verktyget automatiskt till rätt sida.
- Ingen ändring av SmartMatch GS-/dörrkortsskanning, kontrollstatus, projektschema eller huvudappen.
- JS syntaxkontroll genomförd; verkligt test med användarens PDF och iPad återstår.
