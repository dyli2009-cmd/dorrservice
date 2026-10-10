# SmartMatch TEST v36.51 – kompakt mobilvy och "Stäng ritning"

**Datum:** 2026-10-11. **Enbart SmartMatch TEST**, inte ordinarie Tillsyno, Kontrollflöde, Säkerhetsservice, iOS eller TestFlight. V36.50 finns kvar.

## Användarens önskan
- Gör ikoner, etiketter, knappar och text mindre i SmartMatch på telefon; prioritera en stor synlig yta för själva ritningen.
- Knappen **Avsluta projekt** och dialogen med långa beskrivningar om tekniskt underlag och lokal lagring var onödigt krångliga.
- Efter att en PDF sparats ska det vara enkelt att **stänga aktuell ritning och direkt komma till startsidan där en ny PDF kan öppnas**, utan att stänga webbläsarfliken.

## Genomförande
- Bytt rubrik på arbetsytans knapp från `✓ Avsluta` till **Stäng ritning**.
- **Ett tryck** startar stängningen. Den tidigare `pwFinishDialog` visas **inte normalt**.
- Appen gör en **tyst lokal säkerhetskopiering** genom redan befintlig `SmartMatchSession.archiveCurrentProject()`, som bevarar ursprungliga PDF-bytes, lokal projektstatus, checklistor och lokala arbetsutkast i IndexedDB. Detta **ändrar inte** originalfilen i Filer/Dropbox; användaren ska använda **Spara → Projekt-PDF** för den portabla, uppdaterade filen.
- När kopieringen har lyckats återställs arbetsytan genom `smartResetWorkspace()`, projektets PDF-framvisning släpps, startsidans PDF-import visas och `smartShowRecentProjects()` laddar lokalt arkiverade projekt. Viktigt: växlingsspärren `smartProjectSwitchBusy` återställs **före** listan läses in.
- Om säkerhetskopieringen misslyckas stannar ritningen kvar. Då och **endast då** visas en **liten felruta** med **Fortsätt**, **Spara PDF** och **Stäng ändå**. Valet *Stäng ändå* tar bort sessionens återöppningsmarkörer så att ritningen inte oavsiktligt dyker upp vid uppdatering. Användaren har själv valt att riskera lokala ändringar.
- Rubrikerna efter normal stängning säger **"Ritningen är stängd. Öppna en ny PDF"**, utan teknisk information.
- Telefonstilar uppdaterade för skärmar högst 699 px: minskade visuella ikoner, menyrubriker, etiketter, topp-/bottenfält, ritytans paneler, tidsöversikt och filrad. Kritiska knappar har fortfarande ungefär 27–29 px minsta klickyta; checkrutorna i mobilens protokoll behåller tidigare 22 px.
- Den tidigare rättningen som håller dörrkorts-/protokolldialogen dold när den inte är öppnad finns kvar.

## Versionsfiler
- `project-workspace-smartmatch-v36-51.html`
- `project-workspace-smartmatch-v36-51.css`
- `project-workspace-smartmatch-v36-51.js`
- `project-workspace-smartmatch-test.html` är exakt samma HTML och laddar nya JS/CSS.
- Session `smartmatch-session-v36-46.js` återanvänds, ingen ändring av inloggning, PDF-exportrutiner eller SmartMatch-matchning.

## Verifiering
- JavaScript-koden parsat utan syntaxfel; CSS-klamrar matchar; alla befintliga HTML-id:n unika och efterfrågade element finns.
- Simulerat "Stäng ritning" med lyckad säkerhetskopiering: händelser `archive → reset → recent:false` (listan får laddas). Knappen får tillbaka sin text och växlingsspärren frigörs.
- Simulerat misslyckad säkerhetskopiering: ingen reset, ritningen finns kvar och felrutan öppnas.
- Praktiska tester återstår på fysisk iPhone/iPad: att menyn inte klipper knappar, att lokal lagring ger korrekt återöppning, att "Stäng ritning" fungerar med stora 30 MB PDF-filer, att en redan sparad projekt-PDF går att öppna om, och att inga osparade ritningsändringar försvinner när knappen används.

**Begränsning:** När stora PDF:er arkiveras lokalt kan stängningen behöva lite tid för IndexedDB. Då visar knappen `Stänger…`. Den lokala arkiveringen är inte ett kvitto på att användarens fil i Filer/Dropbox har uppdaterats.
