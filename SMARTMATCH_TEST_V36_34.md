# SmartMatch TEST v36.34 – zoomfokus, mobilverktyg och tidpanel

Datum: 2026-10-10. Endast SmartMatch TEST; inga ändringar i ordinarie app, Kontrollflöde, iOS eller TestFlight.

## Nyheter
- Ritningszoom med +/− zoomar vid mitten av **synliga** ritningsområdet, mushjul kring muspekaren och två fingrar kring nypgestens centrum.
- Nypgesten följer fingrarnas förflyttning; efter rendering återställs positionen i samma bildruta för att minska hopp.
- Pågående mushjulszoom avbryts vid nytt zoomkommando, sidbyte och Passa.
- Safari/iOS: lägre tillfälligt canvas-minne för stora PDF-filer; storleksändringar från adressfältet orsakar inte längre hel omrendering av PDF:en. Systemet kan trots detta omstarta fliken under minnestryck. Ingen annan automatisk omladdning än uppdateringsknappen identifierades i egen appkod.
- Dubbel våningsetikett i nederkanten bort, behålls upptill.
- Verktygsmenyn är ett kompakt ikonrutnät: Text, Text + pil, Pil, Kamera, Koppla DA och Ta bort. Samma händelsehanterare och noteringar behålls.
- Tid-panelen har kortare introduktion, tydligare sammanfattningskort och luftigare små kort för kategorier. Själva tidsberäkningen är oförändrad.

## Kräver mobiltest
1. Zoomen vid GS i olika hörn på stor PDF, släpp två fingrar och kontrollera att samma GS förblir i fokus.
2. Zoom med +/- efter att ha panorerat långt ut i ritningen samt mushjulszoom på dator.
3. Safari adressfältet fram/åter, växla sidor, se att PDF inte blinkar/omrenderas i onödan.
4. Testa alla sex verktyg i ikonmenyn inklusive Ta bort markerad.
5. Tid: öppna kategorier, lägg till egen, justera tider och återställ; kontrollera samma totalsummor.
6. Testa lokal autosparning och PDF export/återöppning. Version v36.33 kvar som återgång.

JavaScript-syntax kontrollerad, men faktisk iPhone/iPad och projekt-PDF behöver fortfarande kontrolleras.
