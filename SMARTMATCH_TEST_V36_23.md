# SmartMatch TEST v36.23: Ångra checklistval och färg på ritningen

Tryck samma markerade svar igen i Checklista revision dörrautomatik för att göra just den punkten **Ej kontrollerad**. Det gäller alla tre alternativen: Ingår ej, Klart utan anmärkning och Klart med anmärkning. Återställning av anmärkning tar också bort dess anmärkningstext. Byte mellan olika alternativ fortsätter fungera som tidigare.

Varje dörrautomatik på RITNINGEN har en tydlig statusram i grått/grönt/rött och en liten procentbricka utanför märkningens övre högra hörn. PDF:ens befintliga ID-text dubbleras inte. Status/procent uppdateras omedelbart när checklistan ändras, även om dialogen är öppen. Nyritning av varje markör krävs inte. 100% med anmärkning = röd; alla punkter utan anmärkning = grön; i annat fall grå.

Tidigare DA-lista förblir färgkodad. GS-pilar/positioner, sökning efter 17 automatiker, PDF-export och lokal reload-cache är oförändrade. v36.22 finns kvar för återgång. Ordinarie TestFlight-appen och Kontrollflöde är inte uppdaterade.

Kontrollera att 0% = grå på ritning; välj godkänd på en punkt => grå cirka 6%; tryck samma igen => grå 0%; alla 18 godkända => grön 100%; ändra en till anmärkning => röd 100%; tryck samma anmärkning igen => grå cirka 94%.