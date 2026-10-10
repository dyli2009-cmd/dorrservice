# SmartMatch TEST v36.36 – ta bort PDF-exportens extra procent från arbetsritningen

2026-10-10. Användaren rapporterade **dubbla 100 % på arbetsritningen** efter v36.35.

## Orsak och åtgärd
v36.35 dolde det nya optional-content-lagret på PDF.js arbetsritning, men äldre PDF-filer som tidigare exporterats kunde fortfarande bära gamla **SM35:progress** FreeText-annoteringar. Dessa syntes ovanpå den korrekta, klickbara positionsstatusen.

v36.36 skapar därför en särskild, *endast för läsning/visning*, arbetskopia av PDF-källan när SmartMatch-stämplar upptäcks:
- Tar bort gamla `SM35:progress:`-FreeText-anteckningar från arbetskopian.
- Tar bort SmartMatch-genererade `SmartMatch36ProgressStreams` från arbetskopian. Dessa markeringar var avsedda enbart för exporterad PDF.
- Den **ursprungliga PDF-byte-arrayen förblir helt orörd**. Den är fortfarande källan när användaren väljer Spara PDF, och `appendCompactProjectPdf()` bygger upp aktuell horisontell statusstämpel bredvid GS igen.
- Den **vanliga, klickbara GS-positionen och dess procentstatus i arbetsvyn** ändras inte, inte heller kontrollpunktens sparade status.
- PDF-cleanup görs som del av redan existerande PDFLib-inläsning, bara om stämplar fanns. Om det misslyckas öppnas filen som tidigare och felet loggas i konsolen.
- PDF.js:s valfria statuslagersynlighet från v36.35 behålls som extra skydd.

## Testa
1. Öppna **en äldre projekt-PDF med dubbla 100 %** i v36.36 utan att först spara om den. Kontrollera att bara positionsstatusen syns.
2. Exportera samma PDF och öppna filen i Filer/Acrobat: en horisontell 100 %-stämpel nära respektive GS, inte en klickbar redigerbar kommentar.
3. Öppna exporterad PDF i v36.36: PDF-exportstämpeln syns inte i arbetsritningen; den klickbara GS-statusen syns.
4. Ändra 100 till 50 %, spara igen och kontrollera att ingen gammal 100 %-stämpel finns kvar.
5. 30 MB PDF och många dörrkort: testa öppningstid och minnesanvändning på iPad och iPhone samt att projektdata och GS-kopplingar inte har ändrats.

**Ingen ändring** av original PDF, skanneralgoritm, sparade checklistor, produktion, Kontrollflöde eller TestFlight. v36.35 finns kvar för jämförelse. Fysiska mobila PDF-tester återstår.
