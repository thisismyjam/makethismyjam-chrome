default: package update_manifest

package:
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --pack-extension=extension --pack-extension-key=extension.pem

update_manifest:
	python scripts/update_manifest.py