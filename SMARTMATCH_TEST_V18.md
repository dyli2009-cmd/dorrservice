# SmartMatch TEST v18 – fast testadress och en samlad grupp utan dörrkort

**Fast länk:** https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

## Uppdatering av fast länk
Den fasta filen är en **full kopia** av senaste versionens HTML, inte en redirect eller iframe.
När v19 byggs, behåll v18-filerna orörda; skapa v19 HTML/JS/CSS, kopiera v19 HTML till `project-workspace-smartmatch-test.html` i **samma commit**. Både startsidans synliga testnummer och JS/CSS:s cachebrytning måste peka på v19.
Använd bara denna fasta adress som bokmärke eller hemskärmsikon. Vanlig omladdning kan behövas efter GitHub Pages publiceringsfördröjning och webbläsarcache.

## Positioner utan dörrkort
- Samla alla aktiva okopplade positioner under en expanderbar rubrik **Utan dörrkort**.
- Kopplade positioner visas fortfarande i separata GS-/kodgrupper.
- Dörrkortsstatus avgörs av faktisk `protocolMap[code]`; en osäker koppling är okopplad tills kortet valts.
- Alla positioner behåller sina ursprungliga koder, id, koordinater, manuella rättelser och kan fortfarande raderas individuellt.
- Spara projekt-PDF med individuella kopplade GS-statusposter samt **ett samlat avsnitt** för alla okopplade med interna länkar tillbaka till ritningarna.
- Okopplade räknas inte in i procenten, men visas i totala antalet hittade positioner.

TEST v18 återöppnar PDF-data från v17, v16, v15 och v13; tidigare testversioner ändras inte. Kräver fortsatt test på mobil, iPad och riktig kund-PDF.
