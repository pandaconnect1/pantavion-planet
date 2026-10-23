import json, urllib.request, hashlib, pathlib, datetime
out={"checkedAt":datetime.datetime.now(datetime.timezone.utc).isoformat(),"services":{}}
base="https://eservices.dls.moi.gov.cy/inspire/rest/services/INSPIRE/"
for name in ["TN_TransportNetwork/MapServer","AD_Addresses/MapServer","AU_AdministrativeUnit/MapServer"]:
    url=base+name+"?f=pjson"
    try:
        with urllib.request.urlopen(url,timeout=45) as r: raw=r.read()
        data=json.loads(raw)
        out["services"][name]={"url":url,"ok":"error" not in data,"data":data}
    except Exception as e: out["services"][name]={"url":url,"ok":False,"error":str(e)}
url="https://download.geofabrik.de/europe/cyprus-latest.osm.pbf"
try:
    with urllib.request.urlopen(url,timeout=90) as r: raw=r.read()
    if len(raw)<1000000: raise ValueError("invalid PBF download")
    path="/tmp/pantavion-cyprus.osm.pbf"; pathlib.Path(path).write_bytes(raw)
    import osmium
    class Inspect(osmium.SimpleHandler):
        def __init__(self): super().__init__(); self.boundaries=[]; self.namedHighways=0
        def relation(self,r):
            t=dict(r.tags)
            if t.get("boundary")=="administrative" and t.get("admin_level") in ["4","5","6"]:
                self.boundaries.append({"id":r.id,"tags":t})
        def way(self,w):
            if w.tags.get("highway") and any(w.tags.get(k) for k in ["name","name:el","name:en"]): self.namedHighways+=1
    h=Inspect(); h.apply_file(path)
    out["osm"]={"ok":True,"url":url,"bytes":len(raw),"sha256":hashlib.sha256(raw).hexdigest(),"boundaries":h.boundaries,"namedHighways":h.namedHighways}
except Exception as e: out["osm"]={"ok":False,"url":url,"error":str(e)}
pathlib.Path("data/water/external-road-source-probe.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({"services":{k:v["ok"] for k,v in out["services"].items()},"osm":{k:v for k,v in out["osm"].items() if k!="boundaries"}},ensure_ascii=False))
