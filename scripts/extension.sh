extension_dir=$1
key_path=$2
build_dir=$3

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --pack-extension=$extension_dir --pack-extension-key=$key_path
mv extension.crx $build_dir