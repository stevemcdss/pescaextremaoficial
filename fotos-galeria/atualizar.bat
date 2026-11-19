@echo off
chcp 65001 > nul
(
  echo const listaFotos = [
  for %%i in (*.jpg *.jpeg *.png *.webp *.JPG *.JPEG *.PNG *.WEBP) do echo   "fotos-galeria/%%i",
  echo ];
) > fotos.js
echo Fotos listadas com sucesso em fotos.js!