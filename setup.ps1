# One-shot setup for doc-incognito on Windows (PowerShell, from the repo root):
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
#
# Prerequisites (winget):
#   winget install Python.Python.3.12          # any 3.11-3.14; presidio 2.2.366 rejects 3.15+
#   winget install UB-Mannheim.TesseractOCR     # add the "fra" language in the installer,
#                                                # or drop fra.traineddata into
#                                                #   C:\Program Files\Tesseract-OCR\tessdata\
#   winget install ArtifexSoftware.Ghostscript  # required by ocrmypdf
# ocrmypdf itself is pip-installed into the venv below.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# Python candidates as argument arrays, so they can be splatted (no cmd /c).
$script:pythonCandidates = @(
    @('py', '-3.14'), @('py', '-3.13'), @('py', '-3.12'), @('py', '-3.11'),
    @('python'), @('python3')
)

function Find-PythonArgs {
    foreach ($c in $script:pythonCandidates) {
        try {
            $out = & $c[0] @($c | Select-Object -Skip 1) --version 2>$null
        } catch { continue }
        if ("$out" -match 'Python 3\.(11|12|13|14)\.') { return , $c }  # comma: keep array shape (no pipeline unrolling)
    }
    return $null
}

$pyArgs = Find-PythonArgs
if (-not $pyArgs) {
    Write-Error "No Python 3.11-3.14 found. Install one (winget install Python.Python.3.12) and retry."
    exit 1
}
Write-Host "Using: $($pyArgs -join ' ')"

Push-Location backend
& $pyArgs[0] @($pyArgs | Select-Object -Skip 1) -m venv venv
$venvPy = Join-Path (Get-Location) 'venv\Scripts\python.exe'
& $venvPy -m pip install --upgrade pip
& $venvPy -m pip install -r requirements.txt
& $venvPy -m pip install ocrmypdf   # Homebrew on macOS; pip on Windows (needs ghostscript + tesseract on PATH)
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
Write-Host "Setup complete. Start the API with (venv must be ACTIVATED so venv Scripts are on PATH):"
Write-Host "  cd backend ; .\venv\Scripts\Activate.ps1 ; uvicorn app.main:app --host 127.0.0.1 --port 8000"
Write-Host "Then the web UI:  cd frontend ; npm install ; npm run dev   -> http://127.0.0.1:5173"
