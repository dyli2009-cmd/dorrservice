# SmartMatch TEST v36.15 – Hitta DA-position före dokumentval

Fast testadress: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

## Flöde
1. Öppna projekt-PDF och expandera DA · Egenkontroller.
2. Tryck på valfri **automatik i listan**. Systemet går till rätt ritningssida, centrerar på automatikens faktiska rektangel och markerar positionen med en gul/orange ram. Listklicket öppnar **ingen** dokumentdialog.
3. Tryck på den **markerade dörrautomatiken på ritningen**. Dialogen visar endast **Checklista revision dörrautomatik** och **SLR – dokumentmapp**.
4. Tryck Checklista revision dörrautomatik för att öppna befintligt revisionsprotokoll. **Spara PDF** exporterar fortfarande endast det enskilda protokollet.
5. DA-menyn ⋯ innehåller samma flytta/justera pil/koppla GS/ta bort som tidigare.

## Teknik
- Sidopanelens klick binder till `focusAutomationOnDrawing` i stället för `openDoor`.
- PDF-sidbyte och scroll använder befintlig `SmartMatchAppBridge.locate` och omrendering av automatikmarkörer.
- Markering på ritningen behåller `SmartMatchDALink.openDoor(o)` och dess tvåvalsdialog.
- Muspanorering undantar även `.pwAutomationMarker`, så markeringen förblir klickbar med mus.
- Fokusmarkeringen är en tillfällig UI-markering, påverkar inte checklistans sparade data eller GS-koppling.
- Fällbara kategorier börjar fortsatt stängda; v36.14 förblir intakt.

## Isolering
- Nya testfiler med suffix v36-15. Fast testadressen använder samma HTML som v36-15 i samma commit.
- Inga ändringar i Kontrollflöde, ordinarie Dörrservice eller TestFlight.

## Kontroll på iPad/telefon
- Testa automatik på annan ritningssida än aktuell sida.
- Se att listklicket flyttar dig till ritningen och **inte** öppnar modal.
- Tryck gul/orange DA-markering på ritningen: välj revision eller SLR.
- Testa Spara PDF från revisionen och kontrollera att enbart valt protokoll ingår.
- Kontrollera att tidigare manuella GS-positioner, pilar, revisioner och sparade projektdata är oförändrade.
