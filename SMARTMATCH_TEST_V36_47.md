# SmartMatch TEST v36.47 – kompakt sparning av projekt och protokoll

**Datum:** 2026-10-10. **Endast SmartMatch TEST.** Ordinarie Tillsyno, Kontrollflöde och iOS/TestFlight är orörda.

## Beslutat med användaren

- En tydlig **Spara**-knapp öppnar en liten dialog för telefon, iPad och dator.
- Två synliga dokumentval: **Projekt-PDF** och **Protokoll**.
- Två synliga åtgärder: **Spara fil** och **Skicka mejl**.
- Ingen manuell **Analysera PDF**, ingen storleks-/optimeringsmeny och inget synligt val mellan objekt, lokal kopia, Spara som eller skriv över.
- **PDF-filens originalnamn** förval, med filväljarens normala möjligheter att välja plats. På iPhone/iPad används delningsrutan för Filer/Dropbox/mejl, där den stöds.
- Enstaka eller flera valda revisionsprotokoll blir en separat PDF med befintliga GS-/ritningslänkar om man väljer att ta med ritningen.

## Implementerat

- TEST-sidans HTML och CSS har en kompakt sparruta (cirka 392 px på större skärmar, nästan full bredd på telefon) och protokollväljare med de två stora åtgärderna.
- Projekt-PDF förbereds **automatiskt när sparrutan öppnas**. `buildPortableProjectPdf` och `verifyPortableProjectPdf` används fortfarande; export får inte passera om alla projektdata inte kan läsas tillbaka. Först efter godkänd kontroll aktiveras knapparna.
- Kontrollen körs **före** användarens klick på Spara fil/Skicka mejl för att bevara den användaraktivering som krävs för iOS/Apple Web Share API. Ingen extra text bifogas vid delning.
- Protokollens PDF förbereds automatiskt när urvalsdialogen visas eller när valet ändras. Den färdiga filen återanvänds vid nästa direkta Spara/mejl-klick, så `navigator.share` kan anropas från själva klicket.
- I webbläsare med `showSaveFilePicker` öppnar Spara fil den vanliga dialogen. På iPhone/iPad används plattformens delning/Filer; övriga webbläsare faller tillbaka till .pdf-nedladdning.
- Ursprunglig interna exportlogik och verifiering bevarad. Dolda äldre DOM-id:n finns kvar för kompatibilitet med befintliga programhändelser.

## Viktig datasäkerhet

- Autosparning i IndexedDB är **inte** samma sak som att användarens PDF i Filer/Dropbox uppdaterats. På iOS kan inte appen alltid kontrollera var en delad PDF sparats; den får därför inte ge falskt kvitto på att den gamla filen skrivits över.
- Hela projektfilen innehåller ritningar, dörrkort, DA-/GS-objekt och checklistornas projektdata. Protokoll-export är en separat kund-PDF.
- Känd risk: äldre projekt med 17 automatiker måste fortfarande **återöppningstestas** i Chrome/Safari/iPad med samma exporterade PDF. PDF-förlust får inte markeras löst utan detta test.

## Versionsfiler

- `project-workspace-smartmatch-v36-47.{html,css,js}`
- `smartmatch-protocol-export-v36-47.js`
- Fast testadress `project-workspace-smartmatch-test.html` är en identisk kopia av v36.47-HTML.
- DA-placering och sessionshantering återanvänder säkert `smartmatch-da-v36-46-module.js` och `smartmatch-session-v36-46.js`.
- TEST v36.46 ligger kvar för återgång.

## Verifierat och ännu inte verifierat

**Statiskt verifierat:** JS-syntax för projekt- och protokollmodulerna, alla refererade DOM-id:n finns exakt en gång, inga dubbla HTML-id:n, och fast TEST-HTML är exakt lika med v36.47-HTML.

**Kvar på fysisk enhet:** Öppna 30 MB-PDF, spara hela projektet på iPad till Dropbox/Filer, öppna samma sparade PDF igen och kontrollera alla DA/GS/checklistor. Gör även ett separat protokoll till Filer, skicka via Mail och kontrollera att bilagan är med och att ingen .txt-fil skapas. Kontrollera datorns Save As-upplevelse och kortvarig stäng/öppna-återställning.
