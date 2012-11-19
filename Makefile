EXTENSION_DIR=extension
BUILD_DIR=build
KEY_PATH=./jamlet.pem

APP_ID=dapeicgaignkankkcfaefaaikcdpmkac
PACKAGE_URL="https://dl.dropbox.com/u/166030/jamlet/extension.crx"

default: package update_manifest

build_dir:
	mkdir -p $(BUILD_DIR)

package: build_dir
	sh scripts/extension.sh $(EXTENSION_DIR) $(KEY_PATH) $(BUILD_DIR)

update_manifest: build_dir
	python scripts/update_manifest.py $(EXTENSION_DIR)/manifest.json $(APP_ID) $(PACKAGE_URL) > $(BUILD_DIR)/updates.xml

clean:
	rm -rf $(BUILD_DIR)
