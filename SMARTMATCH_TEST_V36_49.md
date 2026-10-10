# SmartMatch TEST v36.49 – jämförelse endast när dörrkort öppnas

**Datum:** 2026-10-10. **Endast SmartMatch TEST.** Versionsfil v36.48 är kvar oförändrad. Ordinarie Tillsyno, Kontrollflöde, iOS och TestFlight berörs inte.

## Användarens återkoppling

I v36.48 låg den delade mobilvyn framme även när teknikerna inte öppnat något dörrkort. Den ska endast visas när ett faktiskt hittat/kopplat dörrkort öppnas. Båda halvorna ska vara kompaktare, med mindre ikoner, knappar och text. Kryssrutorna ska förbli tydliga och lätta att träffa.

## Rotorsak och rättning

- V36.48 hade CSS-regeln `.pwProtocol{display:flex!important}` inom mobilt brytpunkt. Den kunde övertrumfa webbläsarens standardskydd för stängda HTML-`dialog`-element och göra fönstret synligt hela tiden.
- V36.49 kräver ett verkligt öppnat fönster: `dialog#pwProtocol:not([open]){display:none!important}`. Den synliga flexlayouten är uttryckligen knuten till `pwCardCompareMode[open]`.
- `openProtocol(o)` kontrollerar nu att GS/position har en giltig sida i `protocolMap` inom öppnad PDF **innan** jämförelseläget och dialogen visas. Det finns ingen delad vy under ritningssökning och inget fönster visas utan ett matchat dörrkort.
- Vid stängning tas `pwCardCompareMode` bort, även via dialogens close-händelse. Läget lever inte kvar när projektet avslutas.
- Mobil 50/50-layoutens v36.48-specifika regler är avgränsade till dialogen med klassen `pwCardCompareMode`; den ändrar inte ritningens normala arbetsyta eller andra protokoll.
- På iPhone: original till vänster, kontroller till höger, separata rullningar, pinchzoom i originalet. På iPad: båda kolumner samtidigt.
- Kompaktare etiketter, rubriker, zoomknappar, åtgärdsknappar och kontrollrader. Kortare knappar: `✓ Alla`, `Rensa`, `＋ Punkt`.
- Bockrutorna behåller fingerstorlek 22×22 CSS-pixlar och det går fortfarande att trycka på hela kontrollpunktsraden.

## Versions- och säkerhetsregler

- `project-workspace-smartmatch-v36-49.html`, `.css`, `.js`.
- `project-workspace-smartmatch-test.html` är identisk med versionerade HTML-filen och är den fasta TEST-URL:en.
- PDF-export-/sessions-/DA-moduler återanvänds oförändrade från v36.47/v36.46.
- Ändrar inga GS-matchningsalgoritmer, PDF-bäddad projektdata, protokollexport eller Kontrollflöde.

## Kvarvarande verifiering

Öppna SmartMatch TEST i Safari på iPhone. Bekräfta att ritningen inte har någon synlig delad panel, tryck en GS-position som har dörrkort och kontrollera att 50/50-vyn öppnas först då. Stäng (× och Till ritningen) och bekräfta att den **försvinner helt**. Testa även GS utan dörrkort, samt zoom, oberoende rullning och markering/avmarkering. Praktisk iPhone/iPad-test har inte körts från ChatGPT; statisk kodkontroll räcker inte för slutgodkännande.
