# SmartMatch TEST v36.40 – renare skanningsruta

**2026-10-10 – designjustering i SmartMatch TEST.**

- Ta bort ETA-raden "Beräknar återstående tid…", "Ungefär X sek/min kvar", och tekniska varianter som "Tung sida – tiden är svår att uppskatta".
- Ta bort hjälptexten "Procenten följer skanningen. Tiden är ungefärlig."
- Behåll den faktiska skanningsprocenten, progressbaren och vilken fas skanningen befinner sig i.
- Gör skämttexterna ca 15–17 px, med tydligare radavstånd och tillräcklig höjd för 2–3 rader utan att rutan hoppar vid byte.
- Ta bort oanvänd ETA-uppskattningslogik. Skämten byts ungefär var sjätte sekund under aktiv skanning utan koppling till tidsuppskattningar.
- Ingen förändring i skanningsmotor, projektbyte, GS-detektion, dörrkort eller PDF-export. Endast SmartMatch TEST; v36.39 behålls.

**Validering:** JavaScript-syntax, unik skanningsruta och versionskoppling kontrolleras. Användartest på mobil återstår.
