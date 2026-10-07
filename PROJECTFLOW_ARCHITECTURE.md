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

## Isolering
Projektflödet får inte importera eller använda Kontrollflödets:
- `security.js`
- `security.css`
- `all-in-one.html`
- `all-in-one.css`

Kontrollflödets lås ska respekteras.
