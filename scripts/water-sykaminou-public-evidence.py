"""Decode published invitation QR evidence; an unreadable code is not a location."""
import io
import json
import urllib.request
import urllib.error
from PIL import Image, ImageOps
import zxingcpp

published = "https://www.elemesos.com/wp-content/uploads/2026/10/843835321_3038293389838689_2339852792039999142_n-819x1024.png"
sources = [published, published.replace("-819x1024", "")]
values = []
attempts = []
for source in sources:
    try:
        request = urllib.request.Request(source, headers={"User-Agent": "Pantavion-public-project-research/1.0"})
        with urllib.request.urlopen(request, timeout=45) as response:
            content = response.read(5_000_001)
        if len(content) > 5_000_000:
            raise ValueError("invitation_image_too_large")
        image = Image.open(io.BytesIO(content)).convert("RGB")
        crops = [image, image.crop((0, image.height // 2, image.width // 2, image.height))]
        for crop in crops:
            enlarged = crop.resize((crop.width * 3, crop.height * 3))
            gray = ImageOps.autocontrast(ImageOps.grayscale(enlarged))
            red = ImageOps.autocontrast(enlarged.getchannel("R"))
            variants = [enlarged, gray, red]
            for channel in [gray, red]:
                for threshold in [80, 120, 160, 200]:
                    variants.append(channel.point(lambda x, t=threshold: 255 if x > t else 0))
            for variant in variants:
                for code in zxingcpp.read_barcodes(variant):
                    if code.text not in values:
                        values.append(code.text)
        attempts.append({"source": source, "width": image.width, "height": image.height, "decoded": bool(values)})
    except (urllib.error.URLError, ValueError, OSError) as error:
        attempts.append({"source": source, "error": str(error)})
    if values:
        break
print(json.dumps({"source": published, "qrValues": values, "attempts": attempts, "georeferenceVerified": False}, ensure_ascii=False))
