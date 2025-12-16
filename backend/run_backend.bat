@echo off
echo Starting FastAPI server...
echo ============================

REM Move to backend folder
cd /d "%~dp0"

REM Activate venv (אם יש לך סביבה)
IF EXIST venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Run backend server
python -m uvicorn app:app --reload --host 0.0.0.0 --port 5000

pause
