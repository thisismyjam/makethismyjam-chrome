import sys
import json

app_id = sys.argv[2]
crx_url = "https://dl.dropbox.com/u/166030/jamlet/extension.crx"

manifest_path = sys.argv[1]
manifest = json.loads(open(manifest_path).read())
version = manifest['version']

xml_template = """<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='%s'>
    <updatecheck codebase='%s' version='%s' />
  </app>
</gupdate>
"""

xml = xml_template % (app_id, crx_url, version)

print(xml)