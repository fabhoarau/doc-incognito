# One-shot setup for doc-incognito on Windows (PowerShell, from the repo root):
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
#
# Prerequisites (winget):
#   winget install Python.Python.3.12          # any 3.11-3.14; presidio 2.2.366 rejects 3.15+
#   winget install UB-Mannheim.TesseractOCR     # add the "fra" language in the installer,
#                                                # or drop fra.traineddata into
#                                                #   C:\Program Files\Tesseract-OCR\tessdata\
#   winget install ArtifexSoftware.Ghostscript  # required by ocrmypdf
#   pip install ocrmypdf                         # inside the venv, done below
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Find-Python {
    foreach ($c in @('py -3.14', 'py -3.13', 'py -3.12', 'py -3.11', 'python', 'python3')) {
        $out = cmd /c "$c --version 2>nul"
        if ($out -match 'Python 3\.(11|12|13|14)\.') { return $c }
    }
    return $null
}

$py = Find-Python
if (-not $py) {
    Write-Error "No Python 3.11-3.14 found. Install one (winget install Python.Python.3.12) and retry."
    exit 1
}
Write-Host "Using: $py"

Push-Location backend
cmd /c "$py -m venv venv"
$venvPy = Join-Path $PSScriptRoot 'backend\venv\Scripts\python.exe'
& $venvPy -m pip install --upgrade pip
& $venvPy -m pip install -r requirements.txt
& $venvPy -m pip install ocrmypdf   # Homebrew on macOS; pip works on Windows (needs ghostscript + tesseract on PATH)
& $venvPy -m spacy download fr_core_news_lg
Pop-Location

foreach ($tool in @('tesseract', 'ocrmypdf', 'gswin64c', 'gs')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Warning "'$tool' not found on PATH - OCR will fail. Install it (see README > Requirements > Windows)."
    }
}
if ((& tesseract --list-langs 2>$null) -notmatch 'fra') {
    Write-Warning 'tesseract has no "fra" language - OCR runs with -l fra. Add fra.traineddata to the tessdata dir.'
}

if (-not (Test-Path perso.txt)) {
    Copy-Item perso.txt.example perso.txt
    Write-Host "Created perso.txt - fill it with your personal data."
}

Write-Host ""
Write-Host "Setup complete. Start the API with:"
Write-Host "  backend\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000   (from backend\)"
Write-Host "Then the web UI:  cd frontend ; npm install ; npm run dev   -> http://127.0.0.1:5173"
