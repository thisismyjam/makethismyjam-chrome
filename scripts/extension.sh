extension_dir=$1
key_path=$2
build_dir=$3

if [[ ! -e $key_path ]]; then
  echo
  echo "I need the key file to sign the extension package (expected to find it at $key_path)."
  echo "Get it off someone else and put it there!"
  echo
  exit 1
fi

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --pack-extension=$extension_dir --pack-extension-key=$key_path
mv extension.crx $build_dir