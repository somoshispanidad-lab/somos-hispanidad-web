#!/bin/bash
# ================================================================
# migrate-escorial-photos.sh
# Descarga las 24 fotos del Escorial desde Supabase Storage,
# las comprime y las guarda en assets/images/escorial/
# REQUISITO: El servicio Supabase debe estar activo
# ================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

OUTPUT_DIR="assets/images/escorial"
mkdir -p "$OUTPUT_DIR"

BASE_URL="https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial"

declare -a FOTOS=(
  "IMG_2058.jpeg"
  "IMG_6003.jpeg"
  "IMG_6004.jpeg"
  "IMG_6006.jpeg"
  "IMG_6007.jpeg"
  "IMG_6008.jpeg"
  "IMG_6009.jpeg"
  "IMG_6010.jpeg"
  "IMG_6013.jpeg"
  "IMG_6014.jpeg"
  "IMG_6015.jpeg"
  "IMG_6016.jpeg"
  "IMG_6017.jpeg"
  "IMG_6018.jpeg"
  "IMG_6019.jpeg"
  "WhatsApp Image 2026-06-20 at 12.36.42 (1).jpeg"
  "WhatsApp Image 2026-06-20 at 12.36.42 (2).jpeg"
  "WhatsApp Image 2026-06-20 at 12.36.42.jpeg"
  "WhatsApp Image 2026-06-20 at 12.40.08.jpeg"
  "WhatsApp Image 2026-06-20 at 21.11.30 (1).jpeg"
  "WhatsApp Image 2026-06-20 at 21.11.30 (2).jpeg"
  "WhatsApp Image 2026-06-20 at 21.11.30.jpeg"
  "WhatsApp Image 2026-06-20 at 21.11.31.jpeg"
  "WhatsApp Image 2026-06-20 at 16.05.08.jpeg"
)

echo "Descargando ${#FOTOS[@]} fotos del Escorial..."
echo ""

SUCCESS=0
FAIL=0

for foto in "${FOTOS[@]}"; do
  LOCAL_NAME=$(echo "$foto" | sed 's/ /_/g' | sed 's/[()]//g')
  LOCAL_PATH="$OUTPUT_DIR/$LOCAL_NAME"
  ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$foto'))")
  URL="$BASE_URL/$ENCODED"

  echo -n "  Descargando $LOCAL_NAME ... "
  HTTP_CODE=$(curl -s -o "$LOCAL_PATH" -w "%{http_code}" "$URL")

  if [[ "$HTTP_CODE" == "200" ]]; then
    sips -Z 800 --setProperty formatOptions 80 "$LOCAL_PATH" > /dev/null 2>&1
    SIZE=$(du -sh "$LOCAL_PATH" | cut -f1)
    echo "OK ($SIZE)"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "FALLO HTTP $HTTP_CODE"
    rm -f "$LOCAL_PATH"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "Descargadas: $SUCCESS | Fallidas: $FAIL"
echo "Fotos en: $OUTPUT_DIR/"
