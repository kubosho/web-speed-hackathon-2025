#!/bin/bash

# 各ストリームに対してメタデータを生成
for stream in caminandes2 dailydweebs glasshalf wing-it; do
  echo "Generating metadata for ${stream}..."

  # メタデータを生成
  cat > "public/thumbnails/${stream}_sprite.json" << EOF
{
  "spriteUrl": "/public/thumbnails/${stream}_sprite.jpg",
  "interval": 1,
  "thumbnailWidth": 160,
  "thumbnailHeight": 90,
  "columns": 250
}
EOF
done

echo "All metadata generated!"
