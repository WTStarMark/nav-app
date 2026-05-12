@echo off
powershell -Command "Start-Process -WindowStyle Hidden -FilePath 'cmd.exe' -ArgumentList '/c npm start'"