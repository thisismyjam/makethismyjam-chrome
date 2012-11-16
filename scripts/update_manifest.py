import json

app_id = "dapeicgaignkankkcfaefaaikcdpmkac"
crx_url = "https://dl.dropbox.com/u/166030/jamlet/extension.crx"

manifest = json.loads(open("extension/manifest.json").read())
version = manifest['version']

xml_template = """<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='%s'>
    <updatecheck codebase='%s' version='%s' />
  </app>
</gupdate>
"""

xml = xml_template % (app_id, crx_url, version)

open("updates.xml", "w").write(xml)