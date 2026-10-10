# SmartMatch TEST v36.38 – status intill rätt GS i exporterad PDF

**2026-10-10. Endast SmartMatch TEST.**

## Problem
Statusen (t.ex. 100% och 60%) kunde hamna långt ifrån dörrens GS-position i exporterade PDF:er; på ritningar med flera likadana GS riskerade man att misstolka vilken dörr som var färdig.

## Lösning
- Placera etiketten utifrån **skärmorienterade GS-rektangeln**, samma punkt som klickbar ritningsposition i arbetsytan; rätt hantering av sidrotation 0/90/180/270 och PDF CropBox med offset.
- Föredra en liggande procentstämpel **omedelbart till höger om GS, centrerad i höjdled**, alternativt lika nära vänster, under eller över vid sidkant.
- Jämför alla GS-positioner på samma sida och redan lagda procentetiketter för att undvika att dölja dörrnummer eller märka en annan dörr. En lokal kandidatpoäng ger kort förflyttning framför avlägsen placering.
- Om procenten i en tät klunga behöver placeras mer än 6 PDF-punkter från dörrens GS, rita en tunn fast förbindelselinje som pekar tillbaka på just den GS-positionen.
- Fortsatt separata procentvärden **per unik position**, inte per GS-kod. Ingen markering läggs in i arbetsritningens visningskopia. Projektdata och klickbara länkar behålls.
- Vid omexport ersätts tidigare statusinnehållsströmmar för att förebygga dubbletter. Stämplarna är vanliga PDF-grafikelement, inte redigerbara annoteringar.

## Test
1. Flera GS4 på samma sida: gör en position 100 % och en 60 %, exportera och öppna i Filer/Acrobat. Värdena ska ligga vid **respektive dörr**, inte vid en annan GS4.
2. Kontrollera hörn, smala korridorer, trånga dörrkluster och alla fyra rotationslägen.
3. Spara om exporterad PDF, ändra status och kontrollera att gammal märkning ersätts utan dubbletter.
4. Öppna exporterad PDF i SmartMatch igen: ingen extra procentstämpel syns i arbetsritningen, men positionsstatus och checklistor är kvar.

Ordinarie app, Kontrollflöde och TestFlight är orörda. Riktig PDF från användaren behöver fortfarande kontrolleras.
