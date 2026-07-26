#!/bin/bash
# Script para publicar los cambios de la rama 'pruebas' a 'main'
# Creado para no requerir conocimientos de terminal.

# Cambiar al directorio donde está el script (raíz del proyecto)
cd "$(dirname "$0")"

echo "=========================================================="
echo "🚀 HERRAMIENTA DE VOLCADO DE PRUEBAS A PRODUCCIÓN 🚀"
echo "=========================================================="
echo "Has ejecutado la herramienta para publicar en la web oficial."
echo "Esto guardará todos los cambios actuales en tu entorno de pruebas"
echo "y los enviará a Vercel para actualizar www.somoshispanidad.es"
echo ""

read -p "¿Estás seguro de que quieres volcar tus pruebas actuales a Producción? (s/n): " confirmacion

if [[ "$confirmacion" != "s" && "$confirmacion" != "S" && "$confirmacion" != "si" && "$confirmacion" != "sí" ]]; then
    echo "❌ Operación cancelada. No se ha modificado la versión de producción."
    echo ""
    echo "Presiona cualquier tecla para cerrar esta ventana..."
    read -n 1 -s
    exit 0
fi

echo ""
echo "⏳ Iniciando proceso... por favor no cierres la ventana."

# 1. Asegurarnos de que estamos en la rama pruebas y guardamos todo
git checkout pruebas -q
git add .
git commit -m "Autosave desde el entorno de pruebas antes de publicar" -q > /dev/null 2>&1
git push origin pruebas -q

echo "✅ 1/3 Cambios guardados en el entorno de pruebas."

# 2. Cambiar a main y fusionar
git checkout main -q
git merge pruebas -m "Pase a producción desde herramienta visual" -q

echo "✅ 2/3 Código fusionado con la rama de producción."

# 3. Subir main (desencadena Vercel) y volver a pruebas
git push origin main -q
git checkout pruebas -q

echo "✅ 3/3 Cambios enviados a Vercel. ¡La actualización está en camino!"
echo "=========================================================="
echo "🎉 ¡PROCESO COMPLETADO CON ÉXITO! 🎉"
echo "En aproximadamente un minuto tus cambios estarán en www.somoshispanidad.es"
echo "El sistema te ha devuelto a tu rama 'pruebas' para que sigas trabajando a salvo."
echo ""
echo "Presiona cualquier tecla para cerrar esta ventana..."
read -n 1 -s
exit 0
