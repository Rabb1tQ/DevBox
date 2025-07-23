!macro customInstall
  WriteRegStr HKCR "Directory\Background\shell\DevBox" "" "Open DevBox Here"
  WriteRegStr HKCR "Directory\Background\shell\DevBox" "Icon" "$INSTDIR\DevBox.exe"
  WriteRegStr HKCR "Directory\Background\shell\DevBox\command" "" '"$INSTDIR\DevBox.exe" "%V"'
!macroend

!macro customUnInstall
  DeleteRegKey HKCR "Directory\Background\shell\DevBox"
!macroend
