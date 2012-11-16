import sys
import json

manifest_path = sys.argv[1]
app_id        = sys.argv[2]
package_url   = sys.argv[3]

manifest = json.loads(open(manifest_path).read())
version  = manifest['version']

xml_template = """<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='%s'>
    <updatecheck codebase='%s' version='%s' />
  </app>
</gupdate>
"""

xml = xml_template % (app_id, package_url, version)

print(xml)