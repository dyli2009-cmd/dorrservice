# Projektflöde TEST v14 – rätta positioner

Öppna `project-workspace-smartmatch-v14.html`. Versionen är isolerad med egna
HTML-, CSS-, JavaScript- och lagringsfiler. Ingen produktionsversion ändras.

1. Öppna ritnings-PDF:en och granska positionslistan till höger.
2. Skriv eller välj exempelvis **GS 1** (normaliseras till **GS1**).
3. Välj **Placera ny position** och tryck på dörren på aktuell ritningssida.
   Finns exakt ett identifierat dörrkort kopplas det automatiskt. Saknas placering
   för ett identifierat dörrkort visas även en rad att placera från.
4. Vid fel koppling: välj positionen, ange dörrkortets sidnummer i PDF:en och
   välj **Koppla dörrkort till beteckningen**. Kontrollera sedan kortet genom
   att trycka på markeringen. Kopplingen gäller alla dörrar med samma beteckning;
   varje dörr behåller egna kontroller och sin egen placering.
5. Använd **Flytta**, **Ändra beteckning** eller **Ta bort** vid respektive position.
   Avbryt placering med **Avbryt placering**. Placera med ett finger; avsluta
   placering för att panorera/zooma normalt.
6. Välj **Spara projekt**. Öppna den nya `-smartmatch-v14.pdf`-kopian i TEST v14
   för att återställa placeringar, rättelser, borttagningar och kortkopplingar.

PDF:ens originalinnehåll och sidor bevaras. Rättelser lagras som inbäddad
projektdata och visas av TEST v14; de skrivs inte in som synliga markeringar i
andra PDF-läsare. Originalets gamla tryckta text kan därför finnas kvar efter
flytt/ändring/borttagning. V13-projektdata kan läsas, men V13 kan inte läsa de
nya rättelserna. Spara alltid en separat kopia.

Automatisk igenkänning är ett förslag som behöver granskas. Exakt tryckt GS1
eller GS 1 kan läsas utan färg. GS i ansvarskolumner och GS 230v räknas inte
som positions-ID. Färgträffar med enbart måtttal utan dörrkort läggs inte till.
PDF-markeringar med exakt beteckning kräver inte längre färgmetadata.
Otydliga bilder och andra beteckningar kan behöva placeras manuellt.

## Validering

Använd befintliga miljöberoenden utanför repot:

```
NODE_PATH=/workspace/.tillsyno-tools/node_modules node tests/project-position-tools-v14.cjs
```

Testet kör Chromium med touch: textigenkänning, ofärgad PDF-markering,
GS-normalisering, separata placeringar för samma kod, manuell kortkoppling,
flytt av automatisk och manuell position, ändrad beteckning, borttagning samt
PDF-återöppning efter tömd localStorage. `SAMPLE_PDF` kan sättas till en lokal
PDF för att även kontrollera ett verkligt underlag. Kundens PDF ingår inte i repot.
Fysisk telefon har inte testats.
