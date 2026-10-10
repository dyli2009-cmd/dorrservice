# SmartMatch TEST v36.33 – Verktyg på iPhone/iPad, kompakt analys och revisionsformulär

Datum: 2026-10-10. Endast SmartMatch TEST. Inga ändringar i ordinarie app, Kontrollflöde eller TestFlight.

## Åtgärdat
- **Verktyg-menyn** lyfts till document.body utanför verktygsradens horisontella scrollbehållare, vilket förhindrar att Safari på iPhone/iPad klipper bort menyn. Den placeras relativt Verktyg-knappen ovanför/under beroende på plats. Klick utanför stänger; menyns egna klick stänger inte innan valet hunnit köras.
- **Ritnings-/våningsetikett** behålls i projektraden uppe och visas dessutom kompakt **mellan Sida och Zoom** i nedre navigeringen, med kort text och avklippning utan att bryta layouten. PDF-ritningens egna sida/zoom påverkas inte.
- **Analys** förenklas: kvar är antal ritningssidor/dörrkort/originalsidor, Dörrkort med antal kort och olika ID samt GS-positioner med kopplingar. Onödiga instruktioner och positionstext tas bort. Teknisk PDF-analys döljs, men dess data och felsökningskomponenter fortsätter att genereras internt.
- **Revisionens projektuppgifter och kontroller** får varsin separat A−/A+-styrning för textstorlek. Kompaktare labels, rubriker och kontrollknappar utan att ändra kontrollpunkternas innehåll eller protokollexport.
- **Datumen** får bättre iOS-anpassning; på smalaste telefoner visas datumen på egna fullbreda rader för att undvika krockande kalenderikoner. **Placering/dörrlittra** blir fullbrett och rätt linjerat. Telefonens fält behåller minst 16 px text så att Safari inte zoomar hela sidan vid fokus.

## Testa manuellt
1. iPhone/iPad: öppna PDF → Verktyg; kontrollera att alla val syns och går att trycka. Scrolla verktygsraden, prova igen.
2. Testa knapparnas placering och att menyn stängs vid klick utanför utan att bryta andra verktyg.
3. Analys: Dörrkort och GS-rapporter visar korrekt data; kontrollera kompakta rubriker, sidantal.
4. Revision: A−/A+ för uppgifter respektive kontrollpunkter, ändra datum, placering och kundfält på 320–430 px och iPad.
5. Byt ritningssida/våning; etiketten i nederkanten ska följa nuvarande ritningssida.
6. Regressionsprov: spara/importera projekt-PDF, lokalt utkast, DA-skanning och GS-pilar fungerar som v36.32.

**Ingen ändring** av PDF-datamodell, skanner, sparning, kund-PDF, SLR-mallar eller TestFlight. v36.32 kvar.
