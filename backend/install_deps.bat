@echo off
echo ========================================
echo Installing Backend Dependencies
echo ========================================
echo.

cd /d D:\n8n-interface\backend

echo Checking Python version...
python --version
echo.

echo Installing dependencies from requirements.txt...
pip install -r requirements.txt

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Now run: uvicorn main:app --reload
pause
