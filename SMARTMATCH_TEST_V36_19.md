# SmartMatch TEST v36.19 – "Hitta alla andra automatiker" från en färdig markering

- **En kompakt meny vid klick på befintlig dörrautomatiks märkning**: visar ID och objekt-/maskinkod-/antaldelar, två oförändrade val (**Checklista revision dörrautomatik**, **SLR – dokumentmapp**) plus diskret avskild knapp **Hitta alla andra automatiker**.
- Knappen använder exakt **objektnummer** från redan korrekt placerad markering. Alla olika maskinkoder (24, 37, 45 osv) inom samma objekt är tillåtna; programmet läser varje träffs modell och löpnummer från dess ID och använder befintlig maskinlista. Okända koder flaggas och kan väljas om i checklistan.
- Söker på **samtliga PDF-ritningssidor** med exakta ID-träffar, uppdelad PDF-text, och en extra omgång med läsbara PDF-annotationer (FreeText/Stamp/etc). Dörrkortssidor och revisionsprotokollssidor undantas för att minska falska träffar.
- Fysisk position blir exakt upptäckt text-/annotationsrektangel. Samma markering kan vara både läsbar text och PDF-annotation; dubbletter tas bort, och redan befintliga automatiker med samma fullständiga märkning och fysiska position behåller checks/notes/placering/GS/arrowTip utan att skrivas över.
- **GS-förslag/pilar**: bedöms på samma ritningssida, med närhet, den första positionens GS-pil som geometrisk mall och befintlig GS→dörrkortsindex. Dörrkort med "Dörrautomatik ED100 / SW300 / ED250..." ger extra stöd och kan avvisa en uppenbart inkompatibel maskintyp; explicit "Dörrautomatik -" är negativt. Osäkra GS-förslag lämnas okopplade för teknikergranskning via ⋯.
- Nya självständiga DA-checklistor lagras med egen page/rect/modelCode/serialNumber/linkedGsId och visas via befintliga DA · Egenkontroller. Ingen befintlig position kopplas om; alla pilar kan fortfarande manuellt justeras.
- Resultat visas direkt i samma kompakta dialog med klickbara hittade positioner, antal nya, bevarade och säkra GS-pilar. En ny skanning ska inte skapa dubbletter.
- Ingen del av GS-scanning, PDF-export, Säkerhetsservice, Kontrollflöde eller TestFlight har byggts om.

## Begränsningar / tester
- Första märkningen måste ha korrekt objektnummer. Fysiska maskin-ID:n måste vara läsbara som PDF-text eller PDF-annotation med fullständigt ID; rasterbilder kräver kompletterande OCR innan positioner kan skapas säkert. Färg utan läsbart ID är inte tillräckligt.
- Dörrkortens automatikrad kan vara uppdelad/oläslig; då krävs granskning av GS-länk, inte antaganden.
- Rekommenderat test: en markering som objekt 70154-78 -> sök ID med maskinkoder 24, 37, 45, verifiera individuell position/antal, olika dörrkorts GS, pilar, checklistor, omkörning utan dubbletter och bevarade ändringar.
- Käll-PDF och befintliga protokoll ändras inte av denna scanning; endast programstatus/nyupptäckta positioner sparas.
