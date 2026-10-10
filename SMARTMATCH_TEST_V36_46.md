# SmartMatch TEST v36.46 – mobil precisionsplacering av DA-märkning

- iPhone/iPad: förhindra att PDF-ritningen panorerar medan `Placera manuellt` är aktivt. Intercepta Safari touch-pan på PDF-viewern under just denna operation; normal pan/zoom återgår när den avslutas.
- Flytta plus/krysset **58 skärmpunkter ovanför fingret** vid touch-gest; fin positionering syns utan att döljas av handen. Mus/penna behåller direktkors.
- Dra en rektangel på ritningen och **släpp**. Markeringen sparas inte automatiskt. Öppna en **justerbar förhandsruta** på ritningen med fyra stora (44×44) hörnhandtag och mittgrepp.
- Anpassa rutan genom att dra mittgreppet eller ett hörn. I mobilens nedre meny finns dessutom 2-pixels nudge i fyra riktningar, minus/plus för rutstorlek, Rita om, ✓ Spara och Avbryt.
- ✓ Spara konverterar final skärmrektangel till PDF-koordinater med PDF.js viewport, sparar ett unikt DA-objekt med exakt rektangel och öppnar sedan dörrvyn. Inga GS-kopplingar gissas automatiskt.
- Avbryt och projektbyte tar bort förhandsrutan, avlägsnar touchblockering, återställer vanlig PDF-panoreringsfunktion. Kort knackning utan drag skapar inget objekt.
- Ingen ändring av GS-skanner, original-PDF, PDF-exportens v36.44-rättning, protokoll eller ordinarie Dörrservice/TestFlight.

**Tester:** Kodsyntaktisk kontroll, syntetiskt pointer/touch-scenario, förhandsruta och spar/avbryt, mobil CSS; verkliga iPhone/iPad samt stor PDF återstår att testa.
