' Launches auto-enrich-push.ps1 with NO visible window (the "0" = hidden).
' The scheduled task runs this via wscript.exe, which itself has no console,
' so nothing flashes on screen or steals focus every 15 minutes.
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh  = CreateObject("WScript.Shell")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
ps1 = scriptDir & "\auto-enrich-push.ps1"
sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & ps1 & """", 0, False
