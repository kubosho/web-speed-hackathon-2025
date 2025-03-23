#!/bin/bash

# ディレクトリの作成
mkdir -p public/thumbnails

# 各ストリームに対して処理を実行
for stream in caminandes2 dailydweebs glasshalf wing-it; do
  echo "Generating thumbnail for ${stream}..."

  # 作業ディレクトリに移動
  cd "workspaces/server/streams/${stream}"

  # TSファイルを結合
  cat *.ts > combined.ts

  # サムネイルを生成
  ffmpeg -i combined.ts -vf "fps=30,select='not(mod(n\,30))',scale=160:90,tile=250x1" -frames:v 1 "../../../../public/thumbnails/${stream}_sprite.jpg"

  # 一時ファイルを削除
  rm combined.ts

  # 元のディレクトリに戻る
  cd ../../../../
done

echo "All thumbnails generated!"
