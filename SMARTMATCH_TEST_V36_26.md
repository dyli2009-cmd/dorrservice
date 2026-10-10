# SmartMatch TEST v36.26 – Progress 0–100% + kaffeskämt

Vid öppning av projekt-PDF visas en centrerad laddningsvy med procentsiffra, progressbar, riktig fasetikett och lättsamma svenska statusmeddelanden. Procenten är **en viktad andel avslutade skanningssteg**, inte en timer, påhittad rörelse eller exakt återstående tid.

Stegen: fil/projekt 0–12; kortindex sida för sida 12–35; annotationsanalys 35–42; färganalys/rasterisering 42–71; GS-positioner 71–78; ritningens dörr-ID 78–90; objekt/dörrkort och kontrollberäkning 91–96; befintlig GS-avstämning 97–98; ritningen renderas och 100 visas först när allt är avslutat.

Första ritningssidan ritas upp bakom den delvis genomskinliga laddningspanelen efter att PDF:en öppnats. Gamla projektmarkörer töms innan första renderingen, så att en annan PDF:s positioner inte syns. Användargränssnittet blockeras av laddningspanelen fram till 100 %. För att skona iPhone/iPad pausas extra detaljrendering av zoomad PDF under skanningen och återgår när skanningen avslutats.

SLR, checklistor, GS-sökning, auto-koppling och PDF-export är oförändrade. Enda justeringen av GS-modulen är att 100%-stegen väntar på dess existerande återkoppling och inte öppnar arbetsytan mitt i pilavstämningen. Har ingen ny skanningsprestandaoptimering och ingen serveruppladdning. Återöppning via Uppdatera använder samma visning.

Testa på en liten och stor PDF, särskilt steg som har tung rasterisering. Procenten kan stå still kort tid när en hel sida bearbetas; den ska aldrig gå bakåt eller visa 100 före skanningen är klar. Vid fel stängs progresspanelen så att normal felhantering fungerar. v36.25 finns kvar. Ordinarie TestFlight oförändrad.