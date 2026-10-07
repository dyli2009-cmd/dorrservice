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
2. markerade dörr-/projekt-ID:n
3. dörrkort/protokollsidor

Projektflödet ska:
- läsa flera typer av PDF-markeringar och deras exakta koordinater, inklusive Stamp, Highlight, Square, Circle, FreeText, Ink, Underline och Squiggly
- färgen på markeringen ska inte styra identifieringen
- om markeringen inte själv innehåller ett läsbart ID ska Projektflödet försöka läsa den markerade texten innanför markeringens rektangel
- behandla varje fysisk markering som en egen position
- räkna hur många positioner som finns per ID
- matcha dörr-/projekt-ID mot dörrkortet eller protokollsidan med samma ID i samma PDF
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
- Projektflödet får använda både befintliga GS-ID:n och generella dörr-/kort-ID:n.
- GS-exempel: `GS1`, `GSTD1`, `GSID`, `GSIDW`, `GSIW`.
- Generella exempel: `140`, `815 C`, `815A`, `310 A`, `310 B`.
- Mellanrum, bindestreck och utspridda tecken normaliseras så att exempelvis `815 C`, `815-C`, `815C` och `8 1 5 C` kan matchas mot samma dörrkort.
- För rena nummer som `140` används dörrkorts-/protokollmatchningen som extra signal för att minska risken att vanliga måttsiffror misstolkas.
- samma normaliserade ID används för position, räkning, klickyta och matchning mot dörrkort/protokoll i samma PDF

## Egenkontroll dörrautomatik i Projektflödet
- **Positionering är helt separerad från GS-systemet.** GS1/GS2 och övriga projektstämplar fortsätter använda `instances` + `pwMarkers`. Dörrautomatik använder `automationItems` + ett eget `pwAutomationMarkers`-lager och får aldrig ärva koordinater från GS-positioner.
- Dörrautomatik skapas endast när Projektflödet kan läsa en strukturerad märkning som består av objektnummer + känd automatkod + löpnummer/antal, exempelvis `7-0-54-28-24-2`.
- Texten `DA`/`DH` används inte längre som positionsankare eller fallback för egenkontrollen. Om den strukturerade märkningen inte kan läsas skapas ingen automatikposition hellre än att den placeras fel.
- Klickytans PDF-rektangel byggs endast från de textobjekt som tillsammans bildar den strukturerade märkningen. GS-markeringar påverkar varken upptäckt, koordinater eller klickyta.
- Projektflödet har en fristående kopia av den befintliga `Egenkontroll dörrautomatik`-definitionen och får inte läsa eller importera Kontrollflödets runtime-kod.
- Kontrollflödets källfiler används endast som referens när kopian skapas; de skyddade filerna ändras inte.
- Kopian innehåller samma sex kontrollpunkter och samma listade dörrautomatikmodeller (kod 11–48) som befintlig Egenkontroll dörrautomatik.
- Projektflödet söker i första hand efter den strukturerade automatikmärkningen på ritningen. Exempel: `7-0-54-28-24-2` tolkas som objektdel `7-0-54-28`, automatkod `24` och löpnummer `2`. Automatkod måste finnas i Projektflödets kopierade automatlista.
- När en strukturerad märkning hittas byggs klickytans rektangel från exakt de PDF-textobjekt som tillsammans bildar märkningen, inte från hela textraden eller DA-positionen. Marginalen hålls liten så klickytan följer objektnummer + automatkod + löpnummer visuellt. En liten `EK`-indikering visar att egenkontroll finns. Texten `DA` används endast som reservsignal när strukturerad märkning inte kan hittas.
- Strukturerade ID:n accepteras bara på rader som i huvudsak består av själva märkningen/DA, så att motsvarande ID inne på protokollsidor inte felaktigt skapar nya ritningspositioner.
- Varje hittad automatik får en egen klickbar Egenkontroll på ritningen och i Positioner-panelen.
- Avlästa värden får korrigeras manuellt inne i egenkontrollen.
- Projektuppgifterna följer samma grundstruktur som checklistversionen: projekt/objekt, objektnummer, AO, datum/nästa provning, beställare/kund, avtalsnummer, kontaktperson/telefon/adress/postadress, serviceföretag med motsvarande kontaktuppgifter samt tekniker/signatur.
- Alla projekt-/kund-/företagsuppgifter och logotyp lagras en gång på projektnivå och används automatiskt av samtliga egenkontroller.
- En logotyp som väljs från valfri egenkontroll sparas därför för hela projektet.
- Egenkontrollens resultat använder samma tre val: `Ingår ej`, `Klart utan anmärkning` och `Klart med anmärkning`.
- Projekt-PDF-statusen använder schema 5 och bäddar in projektuppgifter, logga och samtliga DA-egenkontroller tillsammans med övrig Projektflöde-status.
- Inne i varje egenkontroll finns `Kundmall`, som förhandsgranskar exakt samma PDF-layout som används vid export.
- `Egenkontroller PDF` ligger i huvudmenyn `Spara`, visar alla hittade automatiker, kan välja alla eller endast klara och skapar en separat kund-PDF för varje vald automatik. På plattformar som stöder delning av flera filer kan filerna delas tillsammans.

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

## Startvy
- Innan en projekt-PDF öppnas visas en ren Projektflöde-startvy utan projektstatistik, arbetsverktyg eller positionspanel.
- Sidhuvudets `Projektflöde` är centrerat; den extra `Öppna projekt-PDF`-knappen uppe till höger är borttagen.
- Startsidan har endast huvudknappen `Öppna projekt-PDF` i mitten.
- De tidigare förklarande styckena om PDF-matchning och Kontrollflödet visas inte på startsidan.
- Bakgrunden är en diskret teknisk projektillustration med planlinjer, dörrsymboler och projektmarkeringar. Den försvinner när ritningen öppnas.
- `Passa` och övriga ritverktyg visas först efter att en PDF har öppnats.

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
- huvudknappen heter `Spara` och öppnar en Spara-meny.
- `Aktuell ritningssida` finns inte längre som separat export i Projektflödet.
- På dator med stöd för File System Access API öppnas projekt-PDF via systemets filväljare och filhandtaget behålls, så `Spara projekt` kan skriva arbetsstatus tillbaka till samma PDF-fil.
- `Spara som…` öppnar datorns riktiga filväljare så användaren kan välja exempelvis Skrivbord/Desktop och valfritt filnamn; den valda filen blir därefter den aktuella projektfilen för fortsatt `Spara projekt`.
- `PDF-kopia` sparar en oförändrad kopia och byter inte aktuell projektfil.
- I webbläsare utan stöd för systemets filskrivning används vanlig nedladdning som reserv. På iOS används delningsbladet när det stöds så användaren kan välja Files, iCloud eller annan tillgänglig destination.

## Ritningsanteckningar
- Ritverktygen ligger samlade under en kompakt `Verktyg`-meny med `Text`, `Text + pil`, `Pil`, `Bild` och `Ta bort markerad`; `Ångra` och `Gör om` ligger direkt bredvid.
- Text kan flyttas efter placering. `Text + pil` är en sammanhållen markering där textläget och pilspetsen kan flyttas separat; hela markeringen kan också flyttas via linjen. Fristående pilar kan flyttas och finjusteras via ändpunkterna.
- Verktyget heter `Ta kort` och använder enhetens kamera när den stöds. Fotot komprimeras innan det läggs i projektstatusen, placeras på ritningen och kan flyttas, storleksändras eller tas bort igen.
- Ångra/gör om använder vänster/höger historikpilar och omfattar nya ritanteckningar, bilder och flyttningar i den aktuella arbetssessionen.
- Text, text+pilar, pilar och bilder sparas i Projektflödets projektstatus (schema 4) och följer med när `Projekt-PDF med status` sparas och öppnas igen i Tillsyno.
- Ritanteckningar och bilder är i denna version inte plattade som synliga objekt i en vanlig kund-PDF eller i `Aktuell ritningssida`; kundexport/klart-markering lämnas till senare beslut.

## Massmarkering och tidsrapport
- `Välj` gör GS-positioner valbara utan att öppna protokollet. På dator kan användaren dra en markeringsruta över flera positioner; på touch kan positioner väljas en och en. `Alla på sidan` väljer alla positioner på aktuell ritningssida.
- `Klarmarkera` bockar automatiskt av alla effektiva GS-kontrollpunkter för de valda positionerna. När positionens protokoll öppnas efteråt ska samma punkter redan vara ikryssade och progressen vara 100% när alla punkter finns.
- `Tid` öppnar en beräknad projektrapport baserad endast på effektiva GS-kontrollpunkter. Rapporten visar total beräknad tid, beräknat utfört, kvar, tidsvägd projektprocent samt antal punkter utan tidsestimat.
- Grundvärden: WC/toalettbehör 10 min, cylinder 15 min, slutbleck 10 min, trycke 10 min, låshus 30 min, dörrstängare 30 min, dörrautomatik 480 min, armbågskontakt 150 min och magnet 480 min.
- Standardtider kan ändras direkt i tidsrapporten. En inbyggd tidskategori kan tas bort från beräkningen och senare återställas utan att kontrollpunkterna tas bort.
- Egna tidstyper kan läggas till med namn, minuter och ett eller flera sökord, till exempel `Dörrstopp` eller `Handikapptoalett`. Egna tidstyper kan ändras och tas bort.
- Tidsrapporten visar antal punkter och sammanlagd tid per tidstyp samt en kompakt sammanfattning av arbetsmoment, klart, kvar och aktiva tidstyper.
- Tidsfält skrivs som `timmar,minuter`: `8` = 8 timmar, `0,10` = 10 minuter, `0,15` = 15 minuter och `3,10` = 3 timmar 10 minuter. Appen konverterar detta till minuter internt för all beräkning.
- Varje enskild kontrollpunkt kan få en egen tid via `Ändra`. Tomt tidsfält använder standardtiden för kategorin; `0` gör att punkten inte väger tid i beräkningen.
- Projekt- och positionsprocent vägs efter beräknade minuter i stället för att varje kontrollpunkt väger lika. En position kan dock bara bli 100% när alla dess kontrollpunkter är klarmarkerade.
- Positioner utan effektiva GS-kontrollpunkter räknas inte in i projektprocenten eller den tidsvägda färdigställandegraden.
- Tidsinställningarna är uppskattad arbetstid, inte en faktisk tidsstämpel/timer.
