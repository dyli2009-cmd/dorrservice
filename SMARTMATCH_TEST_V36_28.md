# SmartMatch TEST v36.28 – fler unika skämt, 6 sek, grov tidsuppskattning

Ändringar av laddningsvyn, utan ändring av scanner, sparat arbete, positioner eller kontrollpunkter:
- En ny uppsättning med **60 korta** och **24 längre** kollegaskämt. Den tidigare v36.27-uppsättningen ersätts.
- Normal rotation sker efter **minst 6 verkliga sekunder**. Vid PDF-sida som inte uppdaterat faktisk procent under minst 12 sekunder används i första hand ett längre roligt skämt. Det byter fortfarande efter 6 sekunder så det går att läsa.
- En skanning använder varje fras högst EN gång, även om laddningen passerar flera faser. 18 nyligen visade skämt sparas i sessionStorage för att undvika omedelbara reprisfraser över nya PDF-öppningar/uppdateringar på samma enhet.
- När hela skämtförrådet är slut behålls sista frasen i stället för att visa en redan använd.
- Tiden under skämtet är **grov uppskattning**, beräknad på faktisk förfluten tid och andelen redan avslutade viktade arbetssteg. Visas först från minst 8 sekunder och 12% progress. ETA kan ändras och är inte en garanti. Om verklig procent står still mer än 25 sekunder ersätts ETA med "Tung sida – tiden är svår att uppskatta".
- Inga fake-procent, skämt-timer påverkar aldrig skanningens riktiga 0–100 %. SLR, GS, protokoll, PDF, pilkopplingar och ordinarie TestFlight oförändrade.

Verifiering: JavaScript parsas, versionsref och nya UI-element finns, 60+24 fraser unika, texten ändras aldrig på samma progress-tick av en fras som tidigare visats under skanningen. För långtids-, iPhone- och stallingtest behövs körning med riktig PDF.