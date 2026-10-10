# SmartMatch TEST v36.37 – PDF-status ska läsas horisontellt

**2026-10-10.** Endast SmartMatch TEST. Kunden rapporterade att exporterad PDF innehöll procenttext som låg åt fel håll, exempelvis "%001" i stället för "100%".

## Rättning
Exportören `smartFlattenProgressBadges()` använde tidigare `360 - page.getRotation().angle` för att kompensera PDF-sidans rotation. Det gav fel läsriktning på roterade sidor.

- PDF-sidans `/Rotate` är medurs i läsaren, medan PDF-operatorn `cm` använder moturs rotationsvinkel i sidans koordinatsystem. Samma normaliserade vinkel (0,90,180,270 grader) används därför för att skapa en horisontellt läsbar `100%` i sparad PDF.
- För 90 och 270 grader tas hänsyn till att stämpelns bredd/höjd byter plats. Stämpelns visuella *gränsrektangel* placeras bredvid GS och hålls innanför ritningens sidgränser. `cm`-ankaret flyttas i enlighet med rotationen för att undvika att stämpeln drar i väg.
- Procenttexten sparas fortfarande som vanlig PDF-grafik, inte som redigerbar FreeText-annotering. PDF-strömmarna ersätts vid nästa export, så tidigare felvända 100%-stämplar försvinner.
- Arbetsvyn använder fortsatt v36.36:s separata PDF-visningskopia för att dölja gammal/ny exporttext. Checklistornas procentstatus och klickbara GS-markörer kvarstår.

## Verifiering och användartest
Rotationsriktning validerad med riktiga renderade PDF-fixturer i rotationerna 0°, 90°, 180° och 270°. JavaScript-syntax och versionslänkar kontrolleras. Fortsätt testa i Filer eller Acrobat med användarens *verkliga* ritning, inklusive PDF med `/Rotate 90` eller `270`.

Testa samma GS4: spara med v36.37 och öppna nya PDF-filen. Det ska stå `100%`, **vänster till höger, liggande och intill GS4**. Öppna sedan samma PDF i SmartMatch; extra statusstämplar ska vara dolda på arbetsritningen. Testa även upprepad export och olika positioner nära sidkanterna.

Ordinarie app, Kontrollflöde och TestFlight oförändrade. v36.36 sparad som återgångsversion.
