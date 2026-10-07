# Projektflöde – egen arkitektur

Status: Aktivt utvecklingsområde.

Projektflödet är ett separat system från Kontrollflödet.

## Egna filer
- `project-workspace.html`
- `project-workspace.css`
- `project-workspace.js`

## Grundprincip
En och samma projekt-PDF är källan för:
1. ritningssidor
2. gula PDF-stämplar / projekt-ID
3. protokollsidor

Projektflödet ska:
- läsa riktiga PDF Stamp-annoteringar och deras exakta koordinater
- behandla varje fysisk stämpelträff som en egen position
- räkna hur många positioner som finns per ID, oavsett om ID heter GS1, GS2 eller något annat
- matcha stämpel-ID mot protokollsidan med samma ID i samma PDF
- visa originalprotokollet utan att tappa rubriker, text eller layout
- bygga ett separat interaktivt arbetsprotokoll från originalets innehåll
- ta med ifyllda komponentrader som kontrollpunkter
- inte göra korta tomma fältnamn till kontrollpunkter
- Datum, version och administrativa leverans-/montagerader ska inte räknas som kontrollpunkter
- Arbetsprotokollets automatiska kontrollpunkter ska endast komma från originalrader där ansvar/utförande är märkt `GS`
- Rader märkta `EL`, `DT` eller andra ansvarskoder ska inte visas i egenkontrollen och ska inte påverka procenten; de går fortfarande att läsa i originalprotokollet
- varje fysisk position får egna tillagda, ändrade eller borttagna arbetskontrollpunkter samt kommentarer utan att original-PDF:en ändras
- spara avbockning och procent separat per fysisk position
- återgå till samma ritningssida, zoom och position efter protokollarbete
- projektstatus ska kunna bäddas in direkt i den sparade projekt-PDF:en, inklusive avbockningar, kommentarer, ändringar, egna punkter och procent
- när en sådan PDF öppnas igen ska Projektflödet automatiskt läsa tillbaka den inbäddade statusen
- samma projekt-PDF ska därför kunna flyttas till Files, iCloud Drive, OneDrive eller annan filplats utan separat sidofil
- lokal autosparning får användas som extra skydd, men den portabla PDF-filen är den delbara projektbäraren
- samtidig realtidsredigering av samma molnfil ingår inte i filformatet; den senast sparade filversionen är den som nästa tekniker öppnar
- i iOS-appen ska Projektflödet använda native iOS-filväljare för PDF via Capacitor och falla tillbaka till vanlig HTML-filväljare utanför iOS

## Isolering
Projektflödet får inte importera eller använda Kontrollflödets:
- `security.js`
- `security.css`
- `all-in-one.html`
- `all-in-one.css`

Kontrollflödets lås ska respekteras.

## iOS PDF-import
- använd explicit öppna-knapp i Projektflödet, inte en label som indirekt aktiverar ett dolt filfält
- kontrollera `Capacitor.isPluginAvailable('FilePicker')` innan native filväljare används
- native iOS använder FilePicker; webb använder vanligt file input
- om native-plugin saknas faller Projektflödet tillbaka till vanlig filväljare och visar tydlig status
- efter filval läses i första hand `webPath`, därefter konverterad `path`

## Projekt-ID
- gula projektstämplar får använda alla GS-prefixade ID:n, inte bara `GS` + siffra
- exempel som ska behandlas på samma sätt: `GS1`, `GSTD1`, `GSID`, `GSIDW`, `GSIW`
- ID:t normaliseras så att enkla mellanrum/bindestreck i själva stämpeln inte hindrar matchning
- samma normaliserade ID används för position, räkning, klickyta och matchning mot protokoll i samma PDF

## Originalprotokoll – zoom
- originalprotokollet ska kunna nypzoomas med två fingrar på telefon och iPad
- en-fingersdrag används för att panorera när protokollet är inzoomat
- `Passa` visar hela protokollsidan direkt och `300%` zoomar direkt till maxnivån
- plus/minus ändrar zoom i större steg upp till 300%
- på dator/trackpad kan Ctrl/Cmd + hjul/pinch zooma kring pekarens position

## Projektpositioner på ritning
- stämpelns PDF-annoteringsrektangel ska mappas genom PDF.js viewport (`convertToViewportRectangle`) i stället för egen x/y-formel
- detta ska ta hänsyn till sidrotation, CropBox/viewBox och PDF-koordinatsystem så klickytan ligger exakt över den gula stämpeln
- samma viewport-transform ska användas när en position väljs från listan och centreras på ritningen
- alla hittade positioner visas med en diskret färgad overlay så det går att kontrollera visuellt var systemet har positionerat dem; ingen extra ID-etikett läggs ovanpå ritningens egen GS-text

## Ritning – navigation
- mushjulet zoomar ritningen in/ut kring muspekaren
- zoomförhandsvisning sker direkt och högupplöst PDF-rendering görs efter en kort paus för snabb känsla på stora ritningar
- Hand-knappen visas inte längre; på dator kan vänsterklick + dra på tom ritningsyta panorera och mittenknappen fungerar också
- på telefon och iPad kan ritningen nypzoomas med två fingrar
- en-fingersdrag panorerar när ritningen är horisontellt inzoomad; när den inte är horisontellt inzoomad används horisontell swipe för sidbyte
- enligt önskat flöde går swipe åt höger till nästa PDF-sida och swipe åt vänster till föregående
- klick på GS-markeringar ska fortfarande öppna positionen

## Positioner och sparande
- Positioner-panelen ska kunna döljas helt och öppnas igen via en liten `Positioner`-knapp så ritningen får maximal arbetsyta
- valet att dölja panelen får kommas ihåg lokalt på enheten
- huvudknappen heter `Spara` och öppnar en Spara-meny i stället för att alltid göra samma export
- Spara-menyn erbjuder: Projekt-PDF med aktuell arbetsstatus, PDF-kopia av hela filen utan nya inbäddade statusändringar, samt aktuell ritningssida som separat PDF
- på iOS används delningsbladet när det stöds så användaren kan välja Files, iCloud eller annan tillgänglig destination; på webben används nedladdning som reserv

## Ritningsanteckningar
- Projektflödet har enkla verktyg för `Text`, `Pil` och `Ångra` på ritningen.
- Text och pilar sparas i Projektflödets projektstatus (schema 4) och följer med när `Projekt-PDF med status` sparas och öppnas igen i Tillsyno.
- Text och pilar är i denna version inte plattade som synliga objekt i en vanlig kund-PDF eller i `Aktuell ritningssida`; kundexport/klart-markering lämnas till senare beslut.

## Massmarkering och tidsrapport
- `Välj` gör GS-positioner valbara utan att öppna protokollet. På dator kan användaren dra en markeringsruta över flera positioner; på touch kan positioner väljas en och en. `Alla på sidan` väljer alla positioner på aktuell ritningssida.
- `Klarmarkera` bockar automatiskt av alla effektiva GS-kontrollpunkter för de valda positionerna. När positionens protokoll öppnas efteråt ska samma punkter redan vara ikryssade och progressen vara 100% när alla punkter finns.
- `Tid` öppnar en beräknad projektrapport baserad endast på effektiva GS-kontrollpunkter. Rapporten visar total beräknad tid, beräknat utfört, kvar samt antal punkter utan tidsestimat.
- Grundvärden: WC/toalettbehör 10 min, cylinder 15 min, slutbleck 10 min, trycke 10 min, låshus 30 min, dörrstängare 30 min, dörrautomatik 480 min, armbågskontakt 150 min och magnet 480 min.
- Alla tidsvärden är redigerbara i rapporten och sparas lokalt på enheten. Detta är uppskattad arbetstid från komponenterna, inte en faktisk tidsstämpel/timer.
