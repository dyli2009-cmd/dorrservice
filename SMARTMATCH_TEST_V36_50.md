# SmartMatch TEST v36.50 – korrekta standardtider och projektspecifik tidsöversikt

**Datum:** 2026-10-11. **Omfattning:** Endast SmartMatch TEST (Projektflöde), inte ordinarie Tillsyno, Kontrollflöde eller iOS/TestFlight. **Föregående v36.49 ligger kvar orörd.**

## Användarens beslutade tider

| Tidstyp | Ny standard | Föregående standard |
|---|---:|---:|
| Magnet / dragmagnet | 30 min | 480 min |
| Armbågskontakt | 30 min | 150 min |
| Dörrautomatik | 480 min (8 h) | 480 min |
| Dörrstängare | 30 min | 30 min |
| Låshus | 20 min | 30 min |
| Trycke / handtag | 10 min | 10 min |
| Slutbleck / elslutbleck | 10 min | 10 min |
| Cylinder | 20 min | 15 min |
| WC-/toalettbehör | 10 min | 10 min |
| 179 utrymningsbehör / utrymningsbeslag | **Ingen tid ännu** | Fanns inte |

För **179** registreras kategorin när relevant text hittas i ett arbetsmoment. Ingen montagetid är påhittad. Tills teknikern anger en tid visas det som *utan tidsestimat* och ska inte räknas som noll-minutersinstallation i den totala tidsberäkningen.

## Ändringar i koden

- Uppdaterad `TIME_CATEGORY_DEFS`: exakt standardvärdena ovan, samt starkare igenkänning av dragmagnet och utrymningsbeslag. Cylinder identifieras inte längre från allmänna "gångjärnssida"/"anslagssida" – dessa ord innebär inte att cylinder ska monteras.
- `calculateTimeReport()` bygger tidsrader från **faktiskt förekommande arbetsmoment i de detekterade/kopplade dörrkortens kontrollpunkter och eventuellt manuellt tillagda moment**, inte en lista med alla möjliga tidstyper. Kategorier med `count === 0` visas inte. En helt tom träfflista har ett tydligt statusmeddelande.
- Angiven tid på en enskild punkt (`item.minutes`) har högst prioritet, precis som tidigare.
- Projektets tidsinställningar i PDF (`smartProjectTimeConfig.minutes`) har prioritet för det projektet, så att manuella projektspecifika val inte skrivs över.
- Användarjusterade standardtider lagras dessutom i **samma webbläsares lokala appinställningar** under `smartmatch-worktime-defaults-v1`. Nästa nytt projekt på samma enhet får dessa standarder. På iPhone Safari, iPad Safari, annan dator och fristående iOS-app finns **ingen automatisk molnsynkronisering** mellan lokala standarder. Ett sparat projekt bär däremot med sig projektets tider i PDF.
- Null/ingen tid skiljs från 0 minuter. T.ex. `179 utrymningsbehör` utan beslutad standard ökar "Utan tidsestimat" i tidsöversikten och fältet kan fyllas i senare.
- `renderTimeReport()` visar hur många i projektet som saknar tid i respektive tidstyp. Sammanfattningen räknar aktiva *förekommande* tidstyper, inte alla förinstallerade typer.
- Knappen `＋ Ny tidstyp` och personliga per-punktstider finns kvar.

## Versionsfiler och publicering

- `project-workspace-smartmatch-v36-50.js` ny fil
- `project-workspace-smartmatch-v36-50.html` ny fil
- `project-workspace-smartmatch-test.html` kopia av v36.50 för fasta test-URL:en
- CSS `project-workspace-smartmatch-v36-49.css` återanvänds oförändrad
- DA-, export- och session-modulerna återanvänds från tidigare versioner utan ändringar

## Testat i kod

- JS-syntax godkänd.
- 10 tidstyper har exakt förväntade standardvärden.
- Matchningstester för Magnet, Dragmagnet, AK, Dörrautomatik SW300, Dörrstängare, Låshus, Trycke, Elslutbleck, Cylinder, WC-behör och 179-utrymningsbehör lyckades; enbart märkningen "GS5 179" gav **inte** falsk utrymningsbehörsträff.
- Standardjusteringar sparas i appens lokala inställning och läses i nya projekt, medan uttryckliga projektinställningar väger tyngre.
- Syntetisk rapport med magnet, WC, låshus och 179 ger totalt 60 minuter, 30 minuter klart, 1 utan tidsestimat och **inga** tomma kategorier.

## Kvar på fysisk enhet

Öppna en riktig ritning med dörrkort i TEST och gå till Tidsöversikt: kontrollera att ett enskilt magnetmoment är 30 minuter och att en frånvarande dörrstängare inte får egen rad. Ändra t.ex. magnet till 45 min, öppna en helt annan PDF och verifiera att ändringen gäller på **samma enhet**. Återöppna ett tidigare sparat projekt och kontrollera att en explicit projekttid fortfarande prioriteras. Exportera projekt-PDF och återöppna, kontrollera att tidkonfigurationen finns kvar. **Dessa faktiska mobil-/PDF-tester är inte körda av ChatGPT.**

**Begränsning:** Tidsöversikten läser de arbetsmoment som finns i protokoll-/kontrollpunkterna i SmartMatch. Den tolkar inte automatiskt varje utrustningssymbol i alla typer av ritningar; utrustning utan igenkänd kontrollpunkt kan behöva läggas till manuellt.
