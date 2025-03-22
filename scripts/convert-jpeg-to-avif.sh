#!/bin/bash

# JPEG形式の画像があるディレクトリを設定
IMAGES_DIR="$(pwd)/public/images"

# 出力ディレクトリが存在しない場合は作成
if [ ! -d "$IMAGES_DIR" ]; then
  mkdir -p "$IMAGES_DIR"
  echo "Created output directory: $IMAGES_DIR"
fi

# FFmpegのバージョンを確認
FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
echo "Using $FFMPEG_VERSION"

# JPEGファイルを取得
JPEG_FILES=$(find "$IMAGES_DIR" -name "*.jpeg")
FILE_COUNT=$(echo "$JPEG_FILES" | wc -l | tr -d ' ')

echo "Found $FILE_COUNT JPEG files to convert"

# 変換カウンター
SUCCESS_COUNT=0
FAIL_COUNT=0

# 各JPEGファイルをAVIFに変換
for INPUT_FILE in $JPEG_FILES; do
  FILENAME=$(basename "$INPUT_FILE")
  OUTPUT_FILENAME="${FILENAME%.jpeg}.avif"
  OUTPUT_FILE="$IMAGES_DIR/$OUTPUT_FILENAME"

  echo "Converting $FILENAME to AVIF..."

  # ffmpegコマンドを実行してJPEGをAVIFに変換
  if ffmpeg -i "$INPUT_FILE" -c:v libaom-av1 -crf 30 -b:v 0 "$OUTPUT_FILE" 2>/dev/null; then
    echo "Converted $FILENAME to $OUTPUT_FILENAME"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "Error converting $FILENAME"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

echo "Conversion completed: $SUCCESS_COUNT/$FILE_COUNT files converted successfully!"
if [ $FAIL_COUNT -gt 0 ]; then
  echo "$FAIL_COUNT files failed to convert."
fi
