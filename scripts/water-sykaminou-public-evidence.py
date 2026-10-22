"""Decode the location QR on the published Sykaminou inauguration invitation."""
import io
import json
import urllib.request
from PIL import Image
import zxingcpp

source = "https://www.elemesos.com/wp-content/uploads/2026/10/843835321_3038293389838689_2339852792039999142_n-819x1024.png"
request = urllib.request.Request(source, headers={"User-Agent": "Pantavion-public-project-research/1.0"})
with urllib.request.urlopen(request, timeout=45) as response:
    content = response.read(5_000_001)
if len(content) > 5_000_000:
    raise RuntimeError("invitation_image_too_large")
image = Image.open(io.BytesIO(content)).convert("RGB")
codes = zxingcpp.read_barcodes(image)
print(json.dumps({"source": source, "qrValues": [c.text for c in codes], "georeferenceVerified": False}, ensure_ascii=False))
if not codes:
    raise RuntimeError("invitation_qr_not_decoded")
