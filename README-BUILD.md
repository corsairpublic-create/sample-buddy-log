# Come Creare l'Eseguibile Windows (.exe)

## Requisiti
- Node.js installato sul sistema
- Windows (per build Windows nativi)

## Istruzioni Passo-Passo

### 1. Installare le dipendenze
```bash
npm install
cd electron
npm install
cd ..
```

### 2. Creare l'eseguibile
```bash
# Metodo automatico (consigliato)
node build.js

# Oppure manualmente:
npm run electron:dist
```

### 3. Trovare l'eseguibile
Dopo la build, troverai l'eseguibile in:
- `electron/dist/Sample Buddy Setup.exe` - Installer per Windows
- `electron/dist/win-unpacked/Sample Buddy.exe` - Eseguibile diretto

## Scripts Disponibili

- `npm run electron` - Avvia l'app in modalità sviluppo
- `npm run electron:build` - Build per distribuzione (senza installer)
- `npm run electron:dist` - Crea installer Windows (.exe)

## Personalizzazioni

### Icona dell'applicazione
Sostituisci i file icona in:
- `electron/build/icon.ico` (Windows)
- `electron/build/icon.png` (Linux)
- `electron/build/icon.icns` (macOS)

### Nome e versione
Modifica in `electron/package.json`:
- `name`: Nome dell'applicazione
- `version`: Versione dell'app
- `description`: Descrizione
- `author`: Autore

### Configurazione installer
Modifica la sezione `build` in `electron/package.json` per:
- Cambiare il nome del file di installazione
- Modificare le opzioni dell'installer NSIS
- Aggiungere/rimuovere shortcuts

## Distribuzione

L'eseguibile creato può essere distribuito su qualsiasi PC Windows senza bisogno di installare Node.js o altre dipendenze.

## Risoluzione Problemi

### Errore durante la build
- Assicurati che tutte le dipendenze siano installate
- Verifica di avere i permessi di scrittura nella directory
- Controlla che non ci siano antivirus che bloccano la creazione dell'exe

### L'app non si avvia
- Verifica che l'icona dell'app sia presente in `electron/build/`
- Controlla i log dell'applicazione in `%APPDATA%/Sample Buddy/logs/`