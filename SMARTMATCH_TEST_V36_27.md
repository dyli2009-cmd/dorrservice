# SmartMatch TEST v36.27 – busig kollegahumor under PDF-skanningen

- Laddningsvyn har nu **30 korta, lättsamma skämt**, fem för varje skanningsfas. Exempel: "Jag jobbar. Du ser upptagen ut. 😉", "Vem beställde alla de här dörrarna? 😂", "Färdigt! Kafferasten är officiellt slut."
- Vid öppning av varje ny PDF väljs olika skämt ur de aktuella faserna. Samma skämt ska inte upprepas direkt nästa gång samma fas förekommer.
- När skanningen är lång och procenten står still byter laddningsvyn bara skämt **var 12:e sekund**, inte procent eller skanningsfas. Texterna byts även när arbetsfasens procentgräns passeras.
- Korta texter tar inte onödig skärmyta; skämtraden har en stabil höjd på iPhone/iPad för att förhindra att laddningskortet hoppar när text byts.
- Den riktiga stegvis beräknade 0–100%-visningen från v36.26 är helt oförändrad. Skanningsmotor, GS-matchning, dörrkort, statusfärger, ritningspilar, SLR, PDF-export och lokal PDF-återöppning är oförändrade.
- TEST v36.26 bevaras som separat tidigare version. Ordinarie TestFlight/kontrollflöde påverkas inte.

**Testa:** öppna samma PDF minst två gånger och jämför humorfraserna, prova en stor PDF som tar mer än 12 sekunder för att se växlande fraser medan procenten följer verkligt arbete.