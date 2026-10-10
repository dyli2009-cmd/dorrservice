# SmartMatch TEST v36.24 – två färghalvor på ritningen

Varje befintlig dörrautomatik på ritningen visar två visuella halvor:
- **Vänster: Checklista revision dörrautomatik.** Grå (ej färdig), grön (alla 18 kontroller klara utan anmärkning) eller röd (minst en anmärkning). Revisionens befintliga procentbricka visas ovanför vänstra delen.
- **Höger: SLR.** Alltid grå/inte färdig tills den separata SLR-uppbyggnaden med mallar och dokumentkontroller har beslutats. SLR:s dokumentdata påverkas INTE. Ingen automatisk eller manuell färdigmarkering av SLR skapas nu.
- Tvåfärgad genomskinlig markering på samma PDF-koordinater, utan att dölja original-ID eller justera den befintliga GS-pilen.
- Ändrad kontrollstatus uppdaterar vänstra halvan direkt; SLR förblir grå. Inget ändras av skanningen, egenkontrollerna, protokoll, PDF-export eller sessionshantering.
- DA-listan fortsätter visa revisionens färg och procent som tidigare. Den tvådelade statusen avser ritningsmarkeringen.
- SmartMatch v36.23 och ordinarie TestFlight/kontrollflöde förblir oförändrade.

Testa med befintliga automatiker: revision ej färdig = grå/grå; revision klar = grön/grå; anmärkning = röd/grå.