# SmartMatch TEST v29 – En knapp för granskning och sparning

Test-URL: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

## Nytt gränssnitt
- En enda synlig **Granska PDF** i det övre högra hörnet, där den separata Spara-menyn låg.
- Knappen **Granska PDF** borttagen från raden bredvid **Analys & rapporter**. Den visar PDF-storlek och beräknar kompaktexport med ett tryck; samma dialog erbjuder Spara objekt, Spara lokalt, Spara som, Skicka mejl och Förhandsgranska.
- **Lägg till dörrkort-PDF** och dess statusetikett tas bort från den synliga verktygsraden. Bakomliggande importlogik och originalets dörrkortsmatchning behålls orörda, och båda legacy-HTML-elementen är dolda för säker initiering/kompatibilitet. Ingen ny automatisk import triggas.
- **Analys & rapporter** behålls och ändras inte, enligt användarens önskemål att avvakta med den.
- Den gamla Spara-menyn döljs, men tillhörande element och JS-bindningar lämnas kvar för att inte påverka annan kod. All kund-/fält-sparning finns i Granska PDF-dialogen. PDF-kopia som oförändrad originalkopia finns inte längre som synligt menyalternativ, men den vanliga kompaktexporten fungerar som tidigare.
- På smala iPhone-skärmar (<=620px) ligger knappen i högra översta gridkolumnen och visas inte före att en projekt-PDF har öppnats. Den kan användas på iPad och dator utan extra separat synlig spara-knapp.
- TEST v28 PDF-export utan extra SmartMatch-rapportsidor och med PDF-bokmärken kvar. Ordinarie Kontrollflöde och iOS/TestFlight oförändrade.

## Kontroll
- JS syntax, unika HTML-id, headerplacering, dolda dubbletter, kvarvarande Analys & rapporter, exportknappar och v28 inbäddad projektdatabakåtkompatibilitet verifierade.
- Separat test av granskning med och utan inläst PDF: öppnar dialog och startar kompakt-analys bara när PDF finns.
- Verklig iPhone/iPad- och PDF-test återstår i användarens webbläsare.
