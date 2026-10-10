# SmartMatch TEST v36.32 – kompakt mobilvy och säker lokal arbetskopia

**Datum:** 2026-10-10  
**Område:** Endast SmartMatch TEST, inte produktion eller iOS/TestFlight.  
**Testadress:** https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

## Genomfört
- Huvudet är kortare: SmartMatch, version och uppdatering. **Skicka protokoll** visas inte före öppning och ligger inte längre separat i huvudmenyn.
- **Spara** öppnar en kompakt dialog med valet **Projekt-PDF** eller **Välj protokoll**. Projektflödet behåller verifieringen före export, visar original- och slutstorlek och kort bekräftelse, erbjuder **Analysera PDF**, **Förhandsgranska**, och **Spara / dela** (en kompakt meny för övriga tidigare vägar). Ursprungligt PDF-filnamn och befintliga exportsätt behålls.
- Protokoll kan filtreras efter **Alla, Godkända, Anmärkningar, Pågående**. Checkliststatus skiljs från procent: 100 % med anmärkning är röd och blir **inte** automatiskt förvald. Godkända är förvalda; alla andra kan väljas manuellt. **Välj godkända** och **Välj visade** finns.
- Valda revisionsprotokoll kan fortfarande förhandsgranskas, delas som en samlad PDF med valfria ritningar och klickbara GS-länkar, eller skickas via Mail/delning.
- **Autosparning under arbete:** programändringar köas till IndexedDB efter cirka 700 ms, med synlig status. Lokalt utkast är en säkerhetskopia, inte en färdig projekt-PDF. Vid återöppning av samma PDF föreslås lokalt utkast **bara om filens hash och basrevision matchar**, och användaren måste uttryckligen godkänna återställningen. Den öppnade PDF:ens data används alltid först.
- Efter säker direkt skrivning till en vald fil rensas det lokala utkastet och projektet markeras sparat; vid delning/nedladdning behålls utkastet eftersom ett lagringsmål inte kan verifieras av webbläsaren.

## Verifieras manuellt
1. Mobilvy 320–430 px: startsida, ritningsvy, Spara-dialog, protokollfilter och klickytor.
2. Gör ändringar, låt lokal sparindikator bli klar, uppdatera och kontrollera tydlig återställningsfråga. Testa både Ja och Avbryt.
3. Öppna nyare projekt-PDF i annan webbläsare och bekräfta att gammalt lokalt utkast inte automatiskt skriver över PDF-data.
4. Protokollurval med godkänd 100 %, anmärkning 100 %, pågående och okontrollerat. Säkerställ att PDF innehåller endast valda revisionsprotokoll.
5. Spara PDF via Dropbox/Filer/Mail på fysisk iPhone/iPad, öppna den faktiskt delade filen igen; kontrollera att projektdata, GS-kopplingar och alla 17 automatiker kvarstår.
6. Vid stor PDF och lagringskvot: autosparningsfel ska bli synligt, inte tyst.

**Oförändrat:** GS-skanner, DA-scanner, ritningssymboler, originalprotokoll, SLR-struktur, Kontrollflöde, ordinarie app, TestFlight. **v36.31** behålls intakt för återgång.
