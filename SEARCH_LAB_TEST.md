# Tillsyno Söklabb – separat test av ritningssökning

## Säker avgränsning
- Öppnas direkt genom `search-lab.html`, inte via ordinarie Projektflöde.
- Testkoden, HTML och CSS finns enbart i `search-lab.js`, `search-lab.html` och `search-lab.css`. Ingen befintlig appfil behöver ändras.
- Testets localStorage är prefixat med `tillsyno-search-lab:v1:` och läser/skriver `TillsynoSearchLabData` separat i PDF.
- Testets sparfunktion skapar `-soktest.pdf` som separat fil; originalet skrivs inte över.
- Ordinarie Projektflöde/Kontrollflöde påverkas inte.

## Regler att prova
1. Utgå enbart från **färgmarkerade positioner** i PDF (markeringsannoteringar: highlight, stamp, color square/free text).
2. Läs märkningstexten i markeringen: `GS14`, `140D`, `A101`, `1` etc. Färgen kan variera.
3. Registrera varje plats som separat position, även upprepade koder.
4. Läs igenom samma PDF och bygg kandidatregister över dörrkort. Matcha **endast de första fyra relevanta identifieringsraderna**; vanliga sidhuvuden ignoreras.
5. Acceptera t.ex. `WC GS14` för `GS14`, aldrig `GS140` för `GS14`.
6. Uteslut beslagstexter som låshus, slutbleck, cylinder, trycke, artikelnummer etc. från matchningsrader.
7. Unik protokollsida kopplas automatiskt; om flera sidor matchar går det att välja manuellt; om ingen sida matchar ligger positionen kvar.
8. Kopplade positioner öppnar originalkortet och den ordinarie projektchecklistan, med separat status per position.

## Begränsningar (testversion 1)
- Ingen OCR och ingen bildanalys av inskannade/utplattade färgmarkeringar. Testet kräver åtkomliga PDF-annoteringar och läsbar text eller koder i annotationernas metadata.
- En dörrkortsida med flera separata dörrkort i olika kolumner kan behöva bättre geometrisk uppdelning.
- Textordningen i vissa PDF:er kan skilja från visuell ordning; den heuristiska fyrstegsradsgränsen kan behöva justeras med verkliga ritningar.
- Denna testlänk är en fristående webbsida, inte en ny TestFlight-version.

## Testfall
- En färgmarkerad `GS14` på ritning + dörrkort vars övre rad säger `WC GS14` = match.
- Flera färgmarkerade `GS14` på olika platser = flera positioner, samma länkade dörrkort och separata statusar.
- `WC GS1` med `Slutbleck GS14` längre ner = ingen falsk GS14-koppling.
- `WC 140D`, `Dörr 1` samt saknade/ambivalenta matchningar.
