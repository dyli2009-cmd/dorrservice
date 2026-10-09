# SmartMatch TEST v22 – mushjul och handdragning på originaldörrkort

Fast adress: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

- På dator: när man klickar en kopplad ritningsposition och originalprotokollet öppnas, zoomar vanligt mushjul direkt in/ut inne i originalets visningsyta – utan Ctrl eller Cmd. Trackpad-zoom via Ctrl/Cmd wheel fungerar också. Steget skalas efter hur långt mushjulet rullas, högst 40–300 %, och zoompunkten följer muspekaren.
- Ett pågående mushjulsflöde visar förhandszoom och renderas i fullare PDF-kvalitet efter ca 95 ms paus; förhindrar många tunga samtidiga PDF-renderingar. Zoomnivån visar aktuellt procenttal.
- Håll vänster eller mittersta musknapp över dörrkortet och dra för att panorera åt alla håll. Grabb/grabbing-handmarkör på dator. Pointer capture gör att du kan dra kontinuerligt.
- Fit/Passa, +, − och 300 % finns kvar. Kontrollpunktslistan bredvid påverkas inte av mushjulet. Stängning/byte av dörrkort återställer pågående musdragning och zoom-förhandsvisning.
- Touch/nypzoom på iPhone och iPad samt huvudritningens musbeteende lämnas som tidigare.
- v21 och andra gamla TEST-filer finns kvar oförändrade. Fast TEST-länk uppdateras samtidigt till v22. Kontrollflöde och ordinarie Tillsyno/iOS berörs inte.

QA: syntaxgranskning och källkontroller utförda. Mus och trackpad behöver verkligt webbläsartest med användarens PDF.
