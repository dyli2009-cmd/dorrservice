# Kontrollflöde – LÅST

Status: **LÅST**

Låst från och med: **Tillsyno v2.4.215**

Kontrollflöde får inte ändras förrän användaren uttryckligen säger att det ska låsas upp.

Godkänd upplåsning är en tydlig instruktion som exempelvis:
**"Lås upp Kontrollflödet."**

Efter den beställda ändringen ska Kontrollflödet åter betraktas som låst, om användaren inte uttryckligen säger annat.

När låset är aktivt:
- ändra inte Kontrollflödets UI, funktioner, navigation, översikt, protokoll, kundmall eller PDF-logik
- ändra inte delad kod på ett sätt som påverkar Kontrollflöde
- håll Projektflöde och andra moduler separata

## Senaste beställda ändring

2026-10-08, Tillsyno v2.4.252: användaren låste upp Kontrollflöde för att lägga till **Checklista revision lås** under **Dörrautomatik / Lås**, med användarens 11 kontrollpunkter. Revision och egenkontroll dörrautomatik samt deras design behölls oförändrade. Efter denna ändring gäller status **LÅST** igen.

2026-10-08, Tillsyno v2.4.253: användaren beställde ett offlinetest av arbetsappen. Appfiler och PDF-bibliotek görs tillgängliga offline, och ritningen kan återöppnas från lokal lagring. Protokollens punkter och PDF-design ändras inte. Kontrollflöde är låst igen efter denna beställda ändring.
