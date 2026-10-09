/* Project-only snapshot of the existing control templates; originals are unchanged. */
window.TillsynoProjectTemplates={
  "alarm": {
    "label": "Inbrottslarm",
    "markerLabel": "Inbrottslarm",
    "prefix": "I",
    "checks": [
      [
        "1.1",
        "Lägg anläggningen i serviceläge på larmcentral."
      ],
      [
        "1.2",
        "Okulärbesiktning av anläggningen"
      ],
      [
        "1.3",
        "Pålarmning och stickkontroll detektor."
      ],
      [
        "1.4",
        "Kontroll att siren ljuder."
      ],
      [
        "1.5",
        "Kontroll av sabotagelarm."
      ],
      [
        "1.6",
        "Kontroll med larmcentral att larm inkommit."
      ],
      [
        "1.7",
        "Rengöring av manöverpanel och detektorer."
      ],
      [
        "1.8",
        "Kontroll att utrymmen är larmade i den utsträckning som behövs."
      ],
      [
        "1.9",
        "Inspektion av dekaler byten eller komplettering vid behov."
      ],
      [
        "1.10",
        "Kontroll av batterier."
      ]
    ],
    "faults": {
      "1.1": [
        "Kan inte lägga anläggningen i serviceläge",
        "Fel information/kontakt med larmcentral"
      ],
      "1.2": [
        "Synlig skada eller slitage",
        "Kapsling/detektor sitter löst"
      ],
      "1.3": [
        "Detektor reagerar inte",
        "Fel sektion/detektor reagerar"
      ],
      "1.4": [
        "Siren ljuder inte",
        "Låg eller avvikande ljudnivå"
      ],
      "1.5": [
        "Sabotagelarm fungerar inte",
        "Sabotagekontakt behöver justeras"
      ],
      "1.6": [
        "Larm når inte larmcentral",
        "Fel sektion visas hos larmcentral"
      ],
      "1.7": [
        "Rengöring krävs",
        "Manöverpanel/detektor kraftigt smutsig"
      ],
      "1.8": [
        "Utrymme saknar tillräcklig detektering",
        "Del av anläggningen är inte larmad"
      ],
      "1.9": [
        "Dekal saknas",
        "Dekal behöver bytas"
      ],
      "1.10": [
        "Batteri svagt",
        "Batteri behöver bytas"
      ]
    }
  },
  "lock": {
    "label": "Lås & Dörrmiljö",
    "markerLabel": "Lås & Dörrmiljö",
    "prefix": "L",
    "checks": [
      [
        "1.1",
        "Okulärbesiktning av dörrautomatik/dörrmiljö."
      ],
      [
        "1.2",
        "Funktionskontroll av låsfunktioner (dörrblad, elslutbleck, motorlås, ellås, låshus)."
      ],
      [
        "1.3",
        "Kontroll fastsättning, infästning och eventuella efterdragningar av skruvar."
      ],
      [
        "1.4",
        "Nödkåpor och plombering."
      ],
      [
        "1.5",
        "Kontroll av dörrstängare."
      ],
      [
        "1.6",
        "Prov väsentlig funktion."
      ],
      [
        "1.7",
        "Prov daglarm."
      ],
      [
        "1.8",
        "Beslagning utrymningsdörr."
      ],
      [
        "1.9",
        "Skyltning nödutgång."
      ],
      [
        "1.10",
        "Funktionskontroll impulsgivare (radar, armbågskontakter etc)."
      ],
      [
        "1.11",
        "Sensorlister och säkerhetsanordningar."
      ],
      [
        "1.12",
        "Funktionskontroll och eventuell justering av uppställningsmagnet & dörrstopp."
      ],
      [
        "1.13",
        "Behovsrengöring dörrautomatik och sensorlister"
      ]
    ],
    "faults": {
      "1.1": [
        "Skada/slitage i dörrmiljön",
        "Dörrblad/karm behöver justeras"
      ],
      "1.2": [
        "Lås öppnar inte korrekt",
        "Elslutbleck fungerar inte",
        "Motorlås/ellås fungerar inte",
        "Låshus kärvar"
      ],
      "1.3": [
        "Infästning lös",
        "Skruvar saknas eller behöver efterdras"
      ],
      "1.4": [
        "Nödkåpa saknas/skadad",
        "Plombering saknas"
      ],
      "1.5": [
        "Dörrstängare saknas",
        "Dörrstängare läcker",
        "Stänger inte hela vägen",
        "Hastighet behöver justeras"
      ],
      "1.6": [
        "Väsentlig funktion fungerar inte"
      ],
      "1.7": [
        "Daglarm fungerar inte"
      ],
      "1.8": [
        "Utrymningsbeslag fungerar inte",
        "Beslag skadat/saknas"
      ],
      "1.9": [
        "Nödutgångsskylt saknas",
        "Skylt behöver bytas"
      ],
      "1.10": [
        "Impulsgivare fungerar inte",
        "Armbågskontakt/radar behöver justeras"
      ],
      "1.11": [
        "Sensorlist fungerar inte",
        "Säkerhetsanordning behöver justeras"
      ],
      "1.12": [
        "Uppställningsmagnet fungerar inte",
        "Dörrstopp behöver justeras"
      ],
      "1.13": [
        "Rengöring krävs"
      ]
    }
  },
  "access": {
    "label": "Passer",
    "markerLabel": "Passer",
    "prefix": "P",
    "checks": [
      [
        "1.1",
        "Okulärbesiktning av anläggningen"
      ],
      [
        "1.2",
        "Kontroll fastsättning."
      ],
      [
        "1.3",
        "Kontroll av batteribackup."
      ],
      [
        "1.4",
        "Test av öppnaknapp."
      ],
      [
        "1.5",
        "Kontroll av händelselogg."
      ],
      [
        "1.6",
        "Kontroll att dörr öppnar och låser korrekt."
      ],
      [
        "1.7",
        "Rengöring av kortläsare."
      ]
    ],
    "faults": {
      "1.1": [
        "Synlig skada/slitage",
        "Kortläsare/enhet sitter löst"
      ],
      "1.2": [
        "Infästning lös",
        "Skruvar saknas"
      ],
      "1.3": [
        "Batteribackup fungerar inte",
        "Batteri svagt"
      ],
      "1.4": [
        "Öppnaknapp fungerar inte",
        "Fördröjd eller intermittent funktion"
      ],
      "1.5": [
        "Händelser saknas i logg",
        "Fel tid/registrering i logg"
      ],
      "1.6": [
        "Dörr öppnar inte",
        "Dörr låser inte",
        "Lås släpper för sent"
      ],
      "1.7": [
        "Kortläsare behöver rengöras",
        "Kortläsare skadad"
      ]
    }
  },
  "automation": {
    "label": "Checklista revision dörrautomatik",
    "markerLabel": "Checklista revision dörrautomatik",
    "prefix": "DA",
    "checks": [
      [
        "1.1",
        "Samtal med nyttjaren."
      ],
      [
        "1.2",
        "Okulärbesiktning av dörrautomatik/dörrmiljö."
      ],
      [
        "1.3",
        "Kontroll av eventuella ombyggnader."
      ],
      [
        "1.4",
        "Kontroll fastsättning, infästning och eventuella efterdragningar av skruvar."
      ],
      [
        "1.5",
        "Funktionskontroll manuell och automatisk öppning (kraft, dämpning & hastighet)."
      ],
      [
        "1.6",
        "Funktionskontroll manuell och automatisk stängning (kraft, dämpning & hastighet)."
      ],
      [
        "1.7",
        "Funktionskontroll öppnings- & stängningstider."
      ],
      [
        "1.8",
        "Funktionskontroll av nödöppning & utrymning."
      ],
      [
        "1.9",
        "Funktionskontroll/justering koordinator och armsystem."
      ],
      [
        "1.10",
        "Funktionskontroll impulsgivare (radar, armbågskontakter etc)."
      ],
      [
        "1.11",
        "Sensorlister och säkerhetsanordningar."
      ],
      [
        "1.12",
        "Funktionskontroll låsfunktioner (dörrblad, elslutbleck, motorlås, ellås, låshus)."
      ],
      [
        "1.13",
        "Kontroll/justering uppställningsmagnet & dörrstopp."
      ],
      [
        "1.14",
        "Kontroll gummiupphängningar, fjädrar, tryckslangar & tätning."
      ],
      [
        "1.15",
        "Kontroll motor, pump, hydraulik och drivaxel."
      ],
      [
        "1.16",
        "Kontroll säkringar / programväljare / styrmodul."
      ],
      [
        "1.17",
        "Behovsrengöring dörrautomatik och sensorlister."
      ],
      [
        "1.18",
        "Mindre justering."
      ]
    ],
    "faults": {
      "1.1": [
        "Nyttjaren uppger återkommande driftstörning",
        "Nyttjaren uppger avvikande funktion",
        "Användning eller förutsättningar har ändrats"
      ],
      "1.2": [
        "Skada/slitage i dörrmiljön",
        "Lösa eller skadade delar",
        "Dörrblad/karm behöver justeras"
      ],
      "1.3": [
        "Ombyggnad påverkar dörrmiljön",
        "Ändrad dörrmiljö kräver ny riskbedömning",
        "Ny eller ändrad utrustning behöver kontrolleras"
      ],
      "1.4": [
        "Infästning lös, efterdragning krävs",
        "Skruvar saknas/lösa",
        "Automatikhus/arm sitter löst"
      ],
      "1.5": [
        "För hög öppningskraft",
        "Fel öppningshastighet",
        "Dämpning behöver justeras",
        "Dörr öppnar inte fullt"
      ],
      "1.6": [
        "För hög stängningskraft",
        "Fel stängningshastighet",
        "Dämpning behöver justeras",
        "Dörr stänger inte helt"
      ],
      "1.7": [
        "Öppningstid behöver justeras",
        "Stängningstid behöver justeras",
        "Öppethållandetid behöver justeras"
      ],
      "1.8": [
        "Nödöppning fungerar ej",
        "Utrymningsfunktion behöver åtgärdas"
      ],
      "1.9": [
        "Armsystem behöver justeras",
        "Koordinator fungerar ej korrekt",
        "Glapp/slitage i armsystem"
      ],
      "1.10": [
        "Radar/impulsgivare fungerar ej",
        "Armbågskontakt fungerar ej",
        "Impulsgivare behöver justeras"
      ],
      "1.11": [
        "Säkerhetssensor saknas, komplettera enligt SS-EN 16005 och aktuell riskbedömning",
        "Klämskydd saknas, komplettera enligt SS-EN 16005 där aktuell riskbedömning visar klämrisk",
        "Säkerhetssensor/sensorlist fungerar ej",
        "Säkerhetssensor täcker inte riskområdet",
        "Klämskydd saknas eller är otillräckligt",
        "Komplettera med säkerhetssensor eller klämskydd"
      ],
      "1.12": [
        "Elslutbleck fungerar ej korrekt",
        "Lås släpper för sent/kort tid",
        "Motorlås/ellås fungerar ej",
        "Dörr/lås behöver justeras"
      ],
      "1.13": [
        "Dörrstopp saknas, komplettera med dörrstopp för att begränsa öppningsvinkeln till 90° där detta är angiven maxvinkel för aktuell automatik/installation",
        "Dörrstopp saknas eller är felplacerat",
        "Dörr öppnar för långt / fel öppningsvinkel",
        "Uppställningsmagnet fungerar ej",
        "Arm eller drivaxel belastas i öppet ändläge",
        "Dörrstopp/öppningsvinkel behöver justeras enligt tillverkarens anvisning"
      ],
      "1.14": [
        "Gummiupphängning sliten",
        "Fjäder behöver bytas/justeras",
        "Tryckslang/tätning behöver åtgärdas"
      ],
      "1.15": [
        "Motor missljud/slitage",
        "Pump/hydraulik läcker",
        "Drivaxel glapp/slitage"
      ],
      "1.16": [
        "Programväljare fungerar ej",
        "Styrmodul fel",
        "Säkring/strömförsörjning behöver åtgärdas"
      ],
      "1.17": [
        "Rengöring av automatik krävs",
        "Rengöring av sensor/sensorlist krävs"
      ],
      "1.18": [
        "Mindre justering utförd",
        "Ytterligare justering krävs"
      ]
    }
  },
  "automation_selfcheck": {
    "label": "Egenkontroll dörrautomatik",
    "markerLabel": "Egenkontroll DA",
    "prefix": "DA-E",
    "checks": [
      [
        "1.1",
        "Okulär kontroll av dörrautomatik och dörrmiljö."
      ],
      [
        "1.2",
        "Kontroll av infästning och mekaniska delar."
      ],
      [
        "1.3",
        "Funktionsprov öppning och stängning."
      ],
      [
        "1.4",
        "Kontroll av impulsgivare och säkerhetssensorer."
      ],
      [
        "1.5",
        "Kontroll av låsning och dörrfunktion."
      ],
      [
        "1.6",
        "Dokumentera avvikelse eller utförd justering."
      ]
    ],
    "faults": {
      "1.1": [
        "Skada eller slitage upptäckt",
        "Dörrmiljö behöver justeras"
      ],
      "1.2": [
        "Infästning lös",
        "Mekanisk del behöver justeras"
      ],
      "1.3": [
        "Öppning/stängning avviker",
        "Dörr går inte hela vägen"
      ],
      "1.4": [
        "Impulsgivare fungerar inte",
        "Säkerhetssensor behöver justeras"
      ],
      "1.5": [
        "Låsning fungerar inte korrekt",
        "Dörrfunktion behöver justeras"
      ],
      "1.6": [
        "Åtgärd krävs",
        "Fortsatt kontroll krävs"
      ]
    }
  },
  "fire_panel": {
    "label": "Brandcentral",
    "markerLabel": "Brandcentral",
    "prefix": "BC",
    "checks": [
      [
        "1.1",
        "Okulär kontroll av brandcentral."
      ],
      [
        "1.2",
        "Kontroll av indikeringar och felmeddelanden."
      ],
      [
        "1.3",
        "Funktionsprov av larm och återställning."
      ],
      [
        "1.4",
        "Kontroll av strömförsörjning och reservkraft."
      ],
      [
        "1.5",
        "Dokumentera avvikelser."
      ]
    ],
    "faults": {
      "1.1": [
        "Synlig skada eller slitage"
      ],
      "1.2": [
        "Felindikering finns"
      ],
      "1.3": [
        "Funktionsprov avviker"
      ],
      "1.4": [
        "Reservkraft eller strömförsörjning avviker"
      ],
      "1.5": [
        "Åtgärd krävs"
      ]
    }
  },
  "fire_detector": {
    "label": "Branddetektorer",
    "markerLabel": "Branddetektor",
    "prefix": "BD",
    "checks": [
      [
        "1.1",
        "Okulär kontroll av detektor."
      ],
      [
        "1.2",
        "Kontroll av placering och märkning."
      ],
      [
        "1.3",
        "Funktionsprov av detektor."
      ],
      [
        "1.4",
        "Kontroll av nedsmutsning eller skada."
      ],
      [
        "1.5",
        "Dokumentera avvikelser."
      ]
    ],
    "faults": {
      "1.1": [
        "Detektor skadad eller sitter löst"
      ],
      "1.2": [
        "Placering eller märkning avviker"
      ],
      "1.3": [
        "Detektor reagerar inte"
      ],
      "1.4": [
        "Rengöring eller byte krävs"
      ],
      "1.5": [
        "Åtgärd krävs"
      ]
    }
  },
  "fire_door": {
    "label": "Branddörr / dörrhållning",
    "markerLabel": "Branddörr",
    "prefix": "BR",
    "checks": [
      [
        "1.1",
        "Okulär kontroll av branddörr och dörrmiljö."
      ],
      [
        "1.2",
        "Kontroll av dörrstängning."
      ],
      [
        "1.3",
        "Kontroll av uppställningsmagnet eller hållfunktion."
      ],
      [
        "1.4",
        "Funktionsprov vid brandstyrning."
      ],
      [
        "1.5",
        "Dokumentera avvikelser."
      ]
    ],
    "faults": {
      "1.1": [
        "Skada eller slitage upptäckt"
      ],
      "1.2": [
        "Dörr stänger inte korrekt"
      ],
      "1.3": [
        "Hållfunktion fungerar inte"
      ],
      "1.4": [
        "Brandstyrning fungerar inte korrekt"
      ],
      "1.5": [
        "Åtgärd krävs"
      ]
    }
  },
  "lock_revision": {
    "label": "Checklista revision lås",
    "markerLabel": "Lås",
    "prefix": "L-R",
    "checks": [
      [
        "1.1",
        "Prata med kunden"
      ],
      [
        "1.2",
        "Funktionsprov samt smörjning av cylindrar"
      ],
      [
        "1.3",
        "Funktionsprov samt smörjning av låshus"
      ],
      [
        "1.4",
        "Funktionsprov samt smörjning av hänglås"
      ],
      [
        "1.5",
        "Orienteringsritningar och sektionsförteckningar finns på rätt plats"
      ],
      [
        "1.6",
        "Materiel väl fastsatt"
      ],
      [
        "1.7",
        "Eventuell justering av slutbleck"
      ],
      [
        "1.8",
        "Kontroll av förändringar i byggnaden eller inredningar och dess påverkan på dörrfunktioner/krav på lås"
      ],
      [
        "1.9",
        "Finns/behövs nödkåpor och plomberingsband"
      ],
      [
        "1.10",
        "Justering/kontroll dörrstängare"
      ],
      [
        "1.11",
        "Notering i kontrolljournal"
      ]
    ],
    "faults": {
      "1.1": [
        "Kunden uppger problem med låsfunktionen"
      ],
      "1.2": [
        "Cylinder kärvar",
        "Cylinder behöver smörjas",
        "Cylinder sitter löst"
      ],
      "1.3": [
        "Låshus kärvar",
        "Låshus behöver smörjas",
        "Regel eller fallkolv fungerar inte korrekt"
      ],
      "1.4": [
        "Hänglås kärvar",
        "Hänglås behöver smörjas",
        "Hänglås är skadat"
      ],
      "1.5": [
        "Orienteringsritning saknas eller ligger på fel plats",
        "Sektionsförteckning saknas eller ligger på fel plats"
      ],
      "1.6": [
        "Materiel sitter löst",
        "Infästning behöver åtgärdas"
      ],
      "1.7": [
        "Slutbleck behöver justeras",
        "Dörr låser inte korrekt"
      ],
      "1.8": [
        "Förändring påverkar dörrfunktionen",
        "Förändring behöver utredas mot kraven på lås"
      ],
      "1.9": [
        "Nödkåpa saknas eller är skadad",
        "Plomberingsband saknas eller behöver bytas"
      ],
      "1.10": [
        "Dörrstängare behöver justeras",
        "Dörr stänger inte hela vägen",
        "Dörrstängare läcker"
      ],
      "1.11": [
        "Notering i kontrolljournal saknas",
        "Kontrolljournal saknas"
      ]
    }
  }
};
