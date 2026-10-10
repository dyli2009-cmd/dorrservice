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

## v36.6 – reparerad död knapp "Koppla dörrautomatik" (2026-10-10)

**Rapporterat fel:** Efter att användaren öppnat en ritning hände inget vid tryck på Verktyg → Koppla dörrautomatik.

**Orsak:** `SmartMatchDALink.init()` anropades först när all PDF-skanning, rendering, GS-rapporter och uppdateringar hade slutförts. Om något led fastnade, eller undantag uppstod, kopplades aldrig klickfunktionen till menyalternativet.

**Korrigering:**
- `smartmatch-da-v36-module.js` kopplar **klickhändelsen direkt vid modulens inläsning** (före SmartMatch huvudskript och före PDF-filens skanning).
- Klick öppnar kopplingsdialogen även om SmartMatch ännu inte blivit färdig; då visar den ett tydligt meddelande.
- Modulens övriga funktioner initieras vid programstart när dess beroenden finns, och idempotent även efter avslutad skanning.
- Verktyg-menyn har nu rullning på små telefoner så att det går att nå alla alternativ.
- Den befintliga GS-skanningen, dörrkortsläsningen och ritningspositionerna körs fortfarande i samma ordning. Ingen automatikanalys startar förrän teknikern trycker Analysera.
- Versionsnumret höjs samtidigt i titel, skärmrubrik, CSS/JS-cache och intern releasekonstant: **TEST v36.6**.
- Test genomfört med simulerade DOM-klick: knappen öppnar dialogen före och efter initiering; båda JS-filerna klarar syntaxkontroll. Verklig användar-PDF/iPhone/iPad återstår att verifiera.


## v36.7 – GS-märkning bakom originalstämpel (2026-10-10)

- **Position → Flytta / storlek** har korrigerats: den extra GS1-etiketten som v36.5 skapade ovanpå ritningens egen GS-text ritas inte längre.
- De flyttade och manuella positionerna visas i stället som en **diskret, lätt transparent gul fyrkant/ram**, så att **PDF:ens ursprungliga färgade GS1-stämpel förblir läsbar**. Att "ligga bakom" den tryckta stämpeln åstadkoms visuellt genom transparent hitbox, inte genom att lägga klickytan under canvasen (då skulle den inte kunna tryckas).
- Förhandsvisningen när användaren drar rutan är också textlös och gul.
- Den underliggande GS-koden finns fortsatt i data, tillgänglighetsnamn, menytitel och positionens dörrkortslänk. Klickbarhet, val av GS-position och storlekssparning behålls.
- Inga ändringar av GS-scannern, dörrkortsmatchningen, revisionsdata eller andra applikationsmoduler.
- Synligt versionsnummer, CSS/JS-resurser och uppdateringslänk: **TEST v36.7**.
- Statisk JavaScript- och HTML-kontroll genomförd. Praktiskt iPad-/kund-PDF-test återstår.

## v36.8 – Koppla dörrautomatik känner igen öppnad PDF + familjeanalys (2026-10-10)

**Fel:** "Verktyget öppnades, men ingen färdig ritning finns ännu" även när SmartMatch visar en PDF. Analysera och Placera manuellt saknade åtkomst till filen.

**Åtgärder**
- Huvudappen exponerar `window.SmartMatchAppBridge` direkt efter att variabler och datakällor deklarerats, **före själva PDF-inläsningen**. Bryggan ger uppdaterad PDF, aktuell sida, GS-positioner, markerade automatikobjekt och projektsparning. Den använder samma state som SmartMatch, inte ett separat kopierat PDF-objekt.
- Dörrautomatikmodulen binder sina dialogknappar redan när modulen laddas. Varje handling hämtar bryggans senaste PDF, även om försenad `init()` misslyckas. En särskild fix gör att den valda märkningen också läses från bryggan och går att GS-koppla.
- "Analysera märkningar" tolkar valfri siffergruppering med bindestreck enligt **märkningsfamiljen före sista strecket**, t.ex. `70154-78-24-10`, `70154-78-24-11`, `70154-78-24-12`. Identifierar **separata** fysisk märkningar, utan att hårdkoda en enda nummerkombination.
- Positionslokalisering går igenom PDF.js textdelar även när en märkning sträcker sig över flera textitems eller ligger i en längre textrad. Genererar separata klickbara hitboxar i originalkoordinater, utan att skriva en dubblett över ritningens färgade tryckta text.
- Verktyget visar en träfflista med sida, löpnummer och GS-status. "Visa" lokaliserar märkningen på ritningen; tryck på märkningen öppnar revisionschecklista/SLR.
- Länkar tydliga närmaste GS-positioner automatiskt; vid osäker träff väljer teknikern GS i listan eller väljer **Peka ut GS på ritningen**, trycker på GS-positionen och godkänner en bekräftelsedialog. Efter godkänd koppling visas pil mellan märkning och GS; befintliga manuella kopplingar skrivs inte över.
- Markeringarna har tunn transparent klickyta med liten blå markör. PDF-originaltexten blir synlig i bakgrunden.
- Existerande GS-/dörrkortsskanning och grundflödet från v35 är oförändrade. Ingen analys sker förrän teknikern väljer Analysera.

**Kontroll:** JS-parsning av huvud- och modulfilerna, kontroll av HTML-ID, tre märkningar i samma familj och dubbelanalys utan dubbletter, samt GS-val med bekräftelse, ändrad koppling och sparning testade med simulerat PDF/DOM. Verklig test på användarens iPhone/iPad och egen ritning återstår.

## v36.9 – kritisk startkrasch: Öppna projekt-PDF fungerar inte (2026-10-10)

**Orsak hittad:** I v36.8 lades `window.SmartMatchAppBridge` till. Där fanns fältet `setStatus` utan tilldelat värde, men huvudappen har bara den verkliga funktionen `setState`. Den fristående referensen gav `ReferenceError: setStatus is not defined` direkt när huvudskriptet kördes, innan `el.openProjectEmpty.onclick=openProjectPdf` nåddes. Därför var hela startsidan och PDF-knappen oklickbar.

**Korrigering:** Ändrat bryggans fält till `setStatus:setState`. Bibehåller nya familjeanalysen och manuella GS-kopplingen från v36.8 utan att röra scanner, filinläsning, positionsstatus eller PDF-sparlogik. Versionsnummer höjt till **TEST v36.9** med konsekvent cacheparametrar för HTML, JS och CSS.

**Kontroller:** Koden parsar. Bryggans alla fristående funktionsreferenser har verifierats mot verkliga funktionsdeklarationer. Den ursprungliga filknappshanteraren och door-card-first-scannern finns kvar. Praktisk browser-/iPad-verifiering med användarens PDF återstår.

## v36.10 – tydlig egenkontroll: projekt, utförande företag och kund (2026-10-10)

**Mål:** Renare fältordning i `Checklista revision dörrautomatik`, utan att påverka checkpunkter, val av anmärkning, `Godkänn alla`, kundmall, logotyp eller sparade projektdata.

### Formulär och gemensamma projektuppgifter
- Gemensam projektdel överst med **Anläggning/objekt**, **Anläggningsnummer**, **Bokat datum**, **Nästa provning**, **AO-nummer**, **ID-märkning (automatisk, skrivskyddad)** och **Placering/dörrlittra**.
- Därefter **två tydliga kolumner** på större skärmar: **Utförande företag till vänster**, **Kund/beställare till höger**.
- Båda sidorna har relevant kontaktperson, telefonnummer, adress, postnummer och postadress. Företagets logotyp ligger i företagets kolumn och signaturen i kundkolumnens nedre högra del.
- På mindre mobilskärmar visas kolumnerna ovanför/under varandra, med tydliga rubriker.
- `Typ av automatik`, `Antal/löpnummer` och objekt-ID-del finns kvar i en nedfällbar **Tekniska ändringar** så att projekten fortfarande kan korrigeras. Tidigare avtalsnummer/teknikernamn behålls som dolda kompatibilitetsvärden i det sparade projektet, men skapar inte onödiga fält i denna checklista.
- Formuläret använder samma gamla `projectMeta`-fält och lokala/PDF-inbäddade projektdata så att tidigare sparade projekt kan öppnas oförändrade.

### Kund-PDF
- **Utförande företag** skrivs till vänster, **Kund / beställare** till höger, direkt under datum/anläggning.
- **ID-märkning** och **AO-nummer** får varsin bred kolumn.
- **Placering/dörrlittra** har ett brett fält. Modellnamnet kan stå efter placeringen, men en separat "Typ av automatik"-ruta finns inte.
- Separat **Utförd av / tekniker** tas bort från PDF-kundmallen. I stället finns **Signatur** längst till höger och den sedan tidigare befintliga **Signatur**-kolumnen till höger om kontrollpunkterna.
- Kundmallens logotyp, kontrollresultat, anmärkningsval, sammanställning av anmärkningar och PDF-export är kvar.

**Kontroll före publicering:** statisk JS-syntax, unika/behållna HTML-ID, existerande projekthändelser och PDF-rubrikernas layout. Verklig PDF-granskning på iPad måste göras med kundens PDF.

## v36.11 – SERVICE och positioner med ⋯-meny (2026-10-10)

**Kundmall**
- Rubriken i revisions-PDF är nu **SERVICE** i stället för PROJEKT.
- Extra signaturruta i övre informationsdelen tas bort. Enbart den befintliga signaturkolumnen längst till höger på varje kontrollrad används.
- Fältordningen är **ID-märkning | Placering / dörrlittra | AO-nummer** på samma rad.
- Placering i kundmallen visar endast teknikerangiven placering (ex. `Dörr till garaget`), inte modell, ID eller annat som systemet har härlett.
- När en egenkontroll öppnas med tomt anläggningsnummer fyller systemet i läsbar anläggningsdel från automatik-ID (objektnummer exklusive modell/löpnummer): `70154-78-24-11` -> `70154-78`, `2001-54-28` -> `2001`. Manuellt angivet nummer skrivs aldrig över.
- Ordinarie projektnamn, datum, AO och placering matas fortsatt in manuellt. Projektsparning, företagslogga, anmärkningsknappar, godkänn alla och revisions-PDF är oförändrade i övrigt.

**Positionsverktygen**
- **GS-/projektpositioner:** menyn `⋯` behåller `Flytta / storlek`, `Ändra`, `Ta bort`. Alternativet `Ändra dörrkort` tas bort från just denna meny (annan dörrkortsfunktion finns kvar separat).
- **DA / Egenkontroller:** varje position får en `⋯`-meny med `Flytta / storlek`, `Ändra`, `Justera pil` och `Ta bort`.
- När en DA-märkning justeras kan man trycka för att flytta eller dra ut rektangeln. Rektangelstorleken används som gemensam visuell mall för andra redan hittade automatiker i **samma märkningsfamilj**; varje märkning förblir centrerad på sin egen plats och behåller sitt eget unika ID, sin checklista och GS-koppling.
- Klickytor är genomskinliga och döljer inte originaltexten i PDF-filen.

**Pilar**
- Automatisk pil börjar vid automatiksymbolens kant och slutar vid närmaste kant på GS-rutan, så texten som står i mitten inte täcks.
- Alternativet `Justera pil` visar ett runt blått draghandtag på pilspetsen. Dra med mus/finger mot lämplig kant på GS-stämpeln. Pilspetsen snäpper till kanten och sparas som normaliserad koordinat `arrowTip` per automatik.
- `arrowTip` sparas i projektstatus/PDF-data och laddas tillbaka; zoom eller byte av ritningssida påverkar inte relativa pilspetsens position.
- En GS-koppling behöver finnas innan pilen kan justeras. Både standardpil och manuellt justerad pil fortsätter att tillhöra rätt unika GS-position.

**Säkerhet:** Huvudflödet för PDF-inläsning och GS-/dörrkortsskanning är oförändrat. De nya funktionerna lever i den isolerade SmartMatch-testversionen, inte i produktion eller iOS. Verkligt test med användarens ritning återstår.
