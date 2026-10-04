# Molnkällor för PDF

Dörrservice har stöd för fyra källor i **Öppna PDF**:

- Enhetens filer
- OneDrive
- Google Drive
- Dropbox

All provider-konfiguration finns i `cloud-config.js`. Lägg aldrig client secrets eller andra hemligheter i den filen.

## OneDrive

1. Registrera Dörrservice som app i Microsoft Entra / Azure App registrations.
2. Lägg till den/de webbadresser där Dörrservice körs som redirect URI.
3. Kopiera appens **Application (client) ID** till:
   `DOORSERVICE_CLOUD_CONFIG.onedrive.clientId`
4. Filväljaren är begränsad till PDF och hämtar endast den fil användaren väljer.

## Google Drive

1. Skapa/öppna ett Google Cloud-projekt.
2. Aktivera **Google Picker API** och **Google Drive API**.
3. Skapa ett OAuth 2.0 Client ID för webbapp och lägg till Dörrservices origin som godkänd JavaScript-origin.
4. Skapa en API key och begränsa den till rätt webb-origin/API:er.
5. Använd projektets project number som App ID.
6. Fyll i:
   - `googleDrive.clientId`
   - `googleDrive.apiKey`
   - `googleDrive.appId`

## Dropbox

1. Skapa en Dropbox-app som får använda Chooser.
2. Lägg till Dörrservices domän bland tillåtna domäner.
3. Kopiera appens **App key** till:
   `DOORSERVICE_CLOUD_CONFIG.dropbox.appKey`

## Säkerhet

Client ID, API key och Dropbox App key är publika identifierare och ska begränsas till rätt domän/API när leverantören stödjer det.
Lägg aldrig OAuth client secrets, access tokens eller andra privata nycklar i GitHub.
