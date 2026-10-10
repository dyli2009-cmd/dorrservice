# SmartMatch TEST v36.45 – manuell och exakt dörrautomatikplacering

**Datum:** 2026-10-10. **Enbart SmartMatch TEST.**

## Ändrat arbetsflöde
- Verktyg → **Koppla dörrautomatik** öppnar kompakt dialog med endast märkningsnummer (t.ex. `1-28-24-1`) och **＋ Placera manuellt**. Långa exempel- och familjbeskrivningar samt synlig knapp `Analysera märkningar` tas bort från dialogen; resultaten döljs. Familj- och objektanalysfunktionens historiska kod finns kvar internt men kan inte längre startas från dialogen. Automatiska GS-/dörrkortssökningar utanför denna dialog påverkas inte.
- **＋ Placera manuellt** visar ett tydligt plus/kryss på ritningen och en kort instruktion med Avbryt. Tryck i rutans första hörn, **dra** runt hela märkningens verkliga synliga storlek och **släpp**. Under drag syns samma blå streckade rektangel som i Ändra storlek. Både plus och ruta följer fingret/musen.
- Kort tryck utan drag **skapar ingen förskjuten standardrektangel**; användaren kan försöka igen. Minsta accepterade rektangel 12 × 9 skärmpunkter. PDF-rektangeln beräknas med `viewport.convertToPdfPoint` för båda hörn, vilket stödjer roterade ritningssidor.
- Varje nytt manuellt DA-objekt får unikt ID. Ingen automatisk GS-koppling görs på löst gissad närhet; GS kopplas med val eller genom att peka ut den fysiska dörren efteråt.
- Escape eller Avbryt ångrar pågående placering. Byte till redigering eller nytt projekt städar markör, pekargester och informationslist. Befintlig flytt/ändra rektangellogik finns kvar separat.

## Sparning
Utgår från senaste v36.44-koden som redan rättar PDF-verifieringsfelet `PDF-statuslagret saknas` för projekt med noll procentstämplar (det skapas ett tomt index). Ingen försvagning av kontrollen för faktiska procentstämplar. Behåll PDF-filnamn och projektdata som tidigare. Vid varje manuell placering körs appens `addItem` → `save` och lokal draft-sparning.

## Rekommenderat användartest
1. Skriv 1-28-24-1, välj Placera manuellt. Dra mycket liten ruta exakt runt ritningens nummer och släpp. Verifiera markeringsstorlek och sida.
2. Enstaka tryck ska inte skapa för stor eller förskjuten rektangel.
3. Testa zoom, iPad/telefon och roterade ritningar. Testa Avbryt och Escape.
4. Koppla GS och öppna revision, spara projekt-PDF, kontrollera projektdata och att inte `PDF-statuslagret saknas` visas.
5. Flera manuella märkningar på samma sida får egna identiteter.

**Begränsning:** Riktig iPad/telefon och användarens PDF behöver kontrolleras efter publicering. Ordinarie Dörrservice, Kontrollflöde och TestFlight orörda.
