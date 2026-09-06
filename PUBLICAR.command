#!/bin/bash
# ================================================================
# PUBLICAR.command — Herramienta de publicación a www.somoshispanidad.es
# Flujo: rama única 'main' → push GitHub → deploy automático Vercel
# Las credenciales se leen de .vercel-config (fichero local, no en git)
# ================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

CONFIG_FILE="$SCRIPT_DIR/.vercel-config"
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "❌ No se encuentra .vercel-config en la raíz del proyecto."
    read -n 1 -s; exit 1
fi
source "$CONFIG_FILE"

echo "=========================================================="
echo "🚀  PUBLICAR EN WWW.SOMOSHISPANIDAD.ES  🚀"
echo "=========================================================="
echo ""
echo "  1. Guarda tus cambios locales en 'main'"
echo "  2. Sube el código a GitHub"
echo "  3. Despliega en Vercel (producción)"
echo ""
read -p "¿Publicar ahora? (s/n): " conf
[[ "$conf" != "s" && "$conf" != "S" && "$conf" != "si" && "$conf" != "sí" ]] && echo "❌ Cancelado." && read -n 1 -s && exit 0

echo ""
echo "⏳ Iniciando... no cierres esta ventana."
echo ""

# 1. Asegurarse de estar en main
BRANCH=$(git rev-parse --abbrev-ref HEAD)
[[ "$BRANCH" != "main" ]] && echo "⚠ Cambiando a 'main'..." && git checkout main -q

# 2. Commit de cambios locales
git add .
git commit -m "Publicación desde PUBLICAR.command — $(date '+%Y-%m-%d %H:%M')" -q > /dev/null 2>&1
[[ $? -eq 0 ]] && echo "✅ 1/3  Cambios guardados." || echo "✅ 1/3  Sin cambios nuevos."

# 3. Push a GitHub
git push origin main -q
if [[ $? -ne 0 ]]; then
    echo "❌ Error al subir a GitHub. Revisa tu conexión."
    read -n 1 -s; exit 1
fi
echo "✅ 2/3  Código subido a GitHub (main)."

# 4. Deploy en Vercel vía API
SHA=$(git rev-parse HEAD)
RESP=$(curl -s -X POST \
  "https://api.vercel.com/v13/deployments?teamId=${VERCEL_TEAM_ID}&forceNew=1" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"somos-hispanidad-web\",\"project\":\"${VERCEL_PROJECT_ID}\",\"target\":\"production\",\"gitSource\":{\"type\":\"github\",\"repoId\":\"${VERCEL_REPO_ID}\",\"ref\":\"main\",\"sha\":\"$SHA\"}}")

DID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

if [[ -z "$DID" || "$DID" == "None" ]]; then
    echo "⚠️  Deploy no pudo iniciarse. Tus cambios SÍ están en GitHub."
    echo "   Reintenta desde: https://vercel.com"
else
    echo "✅ 3/3  Deploy iniciado en Vercel ($DID)"
    echo ""
    echo "⏳ Esperando confirmación (máx. 90s)..."
    for i in $(seq 1 18); do
        sleep 5
        ST=$(curl -s "https://api.vercel.com/v13/deployments/$DID?teamId=${VERCEL_TEAM_ID}" \
          -H "Authorization: Bearer ${VERCEL_TOKEN}" \
          | python3 -c "import sys,json; print(json.load(sys.stdin).get('readyState','?'))" 2>/dev/null)
        [[ "$ST" == "READY" ]] && echo "   ✅ READY — ¡deploy completado!" && break
        [[ "$ST" == "ERROR" ]] && echo "   ❌ ERROR — revisa Vercel." && break
        echo "   $((i*5))s — $ST"
    done
fi

echo ""
echo "=========================================================="
echo "🎉  ¡PUBLICACIÓN COMPLETADA! — www.somoshispanidad.es"
echo "=========================================================="
echo ""
read -n 1 -s
exit 0
