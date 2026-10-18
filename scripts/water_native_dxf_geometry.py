#!/usr/bin/env python3
"""Conservative streaming DXF -> private SQLite source-CAD candidate.

No network, no production publication, no CRS claim, no raw geometry logging.
Every unprocessed CAD entity type is counted; approximations are explicit.
"""
import sys, json, math, sqlite3
from collections import Counter

def records(path):
    section = None
    expect_section = False
    current = None
    tags = []
    eof = False
    with open(path, "rb", buffering=1048576) as file:
        while True:
            raw_code = file.readline()
            if not raw_code: break
            raw_val = file.readline()
            if not raw_val: break
            if len(raw_code) > 2000000 or len(raw_val) > 2000000:
                raise RuntimeError("DXF_TAG_LENGTH_EXCEEDED")
            code = int(raw_code.strip())
            val = raw_val.strip().decode("utf-8", "replace")
            if code == 0:
                if current and section in ("BLOCKS", "ENTITIES"):
                    yield section, current, tags
                current = None
                tags = []
                if val == "SECTION": expect_section = True
                elif val == "ENDSEC": section = None
                elif val == "EOF":
                    eof = True
                    break
                elif section in ("BLOCKS", "ENTITIES"): current = val
            elif code == 2 and expect_section:
                section = val
                expect_section = False
            elif current:
                tags.append((code, val))
    if not eof: raise RuntimeError("DXF_EOF_MISSING")

def get(tags, key, default=None):
    for code, value in tags:
        if code == key: return value
    return default

def number(value, default=None):
    try:
        x = float(value)
        return x if math.isfinite(x) and abs(x) < 1e13 else default
    except (ValueError, TypeError): return default

def xy(tags, xcode=10, ycode=20):
    x, y = number(get(tags,xcode)), number(get(tags,ycode))
    return (x,y) if x is not None and y is not None else None

IDENTITY = (1,0,0,1,0,0)
def apply(pt, matrix):
    x,y=pt;a,b,c,d,e,f=matrix
    return (a*x+c*y+e,b*x+d*y+f)

def multiply(m,n):
    a,b,c,d,e,f=m;u,v,w,x,y,z=n
    return (a*u+c*v,b*u+d*v,a*w+c*x,b*w+d*x,a*y+c*z+e,b*y+d*z+f)

def insertion(tags, base):
    pos=xy(tags) or (0,0)
    sx=number(get(tags,41),1);sy=number(get(tags,42),1)
    angle=math.radians(number(get(tags,50),0))
    co,si=math.cos(angle),math.sin(angle)
    return (co*sx,si*sx,-si*sy,co*sy,
            pos[0]-co*sx*base[0]+si*sy*base[1],
            pos[1]-si*sx*base[0]-co*sy*base[1])

def main(src,dest,metricsfile):
    db=sqlite3.connect(dest)
    db.executescript("""
    CREATE TABLE segments(x1 REAL,y1 REAL,x2 REAL,y2 REAL,layer TEXT);
    CREATE TABLE points(x REAL,y REAL,layer TEXT,kind TEXT);
    CREATE TABLE labels(x REAL,y REAL,layer TEXT,label TEXT,kind TEXT);
    """)
    count=Counter();unknown=Counter();approx=Counter()
    blocks={}; current_block=None; pending=None; row_count=0; total_entities=0

    def line(p,q,layer,transform):
        if p is None or q is None:return
        a=apply(p,transform);b=apply(q,transform)
        if not all(map(math.isfinite,(*a,*b))) or math.dist(a,b)<1e-9:return
        db.execute("INSERT INTO segments VALUES (?,?,?,?,?)",(*a,*b,layer))
        count["segments"]+=1
        if count["segments"] > 12000000:raise RuntimeError("CAD_SEGMENT_CAP_EXCEEDED")

    def arc(center,radius,start,sweep,layer,transform):
        if not center or radius is None or not 0<radius<1e10:return
        steps=max(5,min(256,math.ceil(abs(sweep)/(math.pi/60))))
        last=(center[0]+radius*math.cos(start),center[1]+radius*math.sin(start))
        for i in range(1,steps+1):
            angle=start+sweep*i/steps
            nxt=(center[0]+radius*math.cos(angle),center[1]+radius*math.sin(angle))
            line(last,nxt,layer,transform);last=nxt
        approx["sampled_arc"]+=1

    def vertices(tags):
        result=[];active=None
        for c,v in tags:
            if c==10:
                if active:result.append(active)
                active={"x":number(v),"y":None,"bulge":0}
            elif c==20 and active:active["y"]=number(v)
            elif c==42 and active:active["bulge"]=number(v,0)
        if active:result.append(active)
        return [v for v in result if v["x"] is not None and v["y"] is not None]

    def poly(verts,closed,layer,transform):
        if len(verts)<2:return
        for i in range(len(verts) if closed else len(verts)-1):
            va,vb=verts[i],verts[(i+1)%len(verts)]
            p=(va["x"],va["y"]);q=(vb["x"],vb["y"])
            bulge=va.get("bulge",0)
            if abs(bulge)<1e-10:
                line(p,q,layer,transform);continue
            theta=4*math.atan(bulge);chord=math.dist(p,q)
            if chord<1e-9 or abs(math.sin(theta/2))<1e-10:
                line(p,q,layer,transform);continue
            radius=abs(chord/(2*math.sin(theta/2)))
            height=chord/(2*math.tan(theta/2))
            cx=(p[0]+q[0])/2-(q[1]-p[1])/chord*height
            cy=(p[1]+q[1])/2+(q[0]-p[0])/chord*height
            start=math.atan2(p[1]-cy,p[0]-cx)
            steps=max(2,min(256,math.ceil(abs(theta)/(math.pi/60))))
            last=p
            for j in range(1,steps+1):
                a=start+theta*j/steps
                nxt=(cx+radius*math.cos(a),cy+radius*math.sin(a)) if j<steps else q
                line(last,nxt,layer,transform);last=nxt
            approx["bulge_chord"]+=1

    def draw(typ,tags,transform=IDENTITY,inherited="0",depth=0):
        count[typ]+=1
        layer=get(tags,8,"0") or "0"
        if layer=="0":layer=inherited
        if typ=="LINE":
            line(xy(tags),xy(tags,11,21),layer,transform)
        elif typ=="LWPOLYLINE":
            poly(vertices(tags),bool(int(get(tags,70,0))&1),layer,transform)
        elif typ in ("ARC","CIRCLE"):
            c=xy(tags);r=number(get(tags,40))
            start=math.radians(number(get(tags,50),0))
            end=math.radians(number(get(tags,51),360))
            sweep=math.tau if typ=="CIRCLE" else (end-start)%(math.tau)
            arc(c,r,start,sweep,layer,transform)
        elif typ=="ELLIPSE":
            c=xy(tags);major=xy(tags,11,21);ratio=number(get(tags,40))
            begin=number(get(tags,41),0);finish=number(get(tags,42),math.tau)
            if c and major and ratio and 0<ratio<=1 and finish>begin:
                steps=max(8,min(256,math.ceil((finish-begin)/(math.pi/60))))
                def point(u):
                    return (c[0]+major[0]*math.cos(u)-major[1]*ratio*math.sin(u),
                            c[1]+major[1]*math.cos(u)+major[0]*ratio*math.sin(u))
                last=point(begin)
                for j in range(1,steps+1):
                    nxt=point(begin+(finish-begin)*j/steps)
                    line(last,nxt,layer,transform);last=nxt
                approx["sampled_ellipse"]+=1
            else:unknown["invalid_ellipse"]+=1
        elif typ=="SPLINE":
            v=vertices(tags)
            if len(v)>1:poly(v,False,layer,transform);approx["spline_chords"]+=1
            else:unknown["spline_without_fit_points"]+=1
        elif typ in ("3DFACE","SOLID"):
            pts=[xy(tags,x,y) for x,y in ((10,20),(11,21),(12,22),(13,23))]
            pts=[p for p in pts if p]
            for i,p in enumerate(pts):line(p,pts[(i+1)%len(pts)],layer,transform)
            approx["planar_3d_faces"]+=1
        elif typ=="POINT":
            p=xy(tags)
            if p:db.execute("INSERT INTO points VALUES (?,?,?,?)",(*apply(p,transform),layer,typ))
        elif typ in ("TEXT","MTEXT","ATTRIB","ATTDEF"):
            p=xy(tags);text=get(tags,1,"")
            if p and text:
                db.execute("INSERT INTO labels VALUES (?,?,?,?,?)",
                           (*apply(p,transform),layer,text[:1000],typ))
        elif typ=="INSERT":
            name=get(tags,2,"")
            if name in blocks and depth<7:
                base,children=blocks[name]
                local=multiply(transform,insertion(tags,base))
                for t,tags2 in children:draw(t,tags2,local,layer,depth+1)
            else:unknown["insert_not_expanded"]+=1
            p=xy(tags)
            if p:db.execute("INSERT INTO points VALUES (?,?,?,?)",
                            (*apply(p,transform),layer,"INSERT"))
        else:
            unknown[typ]+=1

    for section,typ,tags in records(src):
        row_count+=1
        if section=="BLOCKS":
            if typ=="BLOCK":
                current_block=get(tags,2,"")
                if current_block:blocks[current_block]=(xy(tags) or (0,0),[])
            elif typ=="ENDBLK":current_block=None
            elif current_block and current_block in blocks:
                blocks[current_block][1].append((typ,tags))
        elif section=="ENTITIES":
            total_entities+=1
            if typ=="POLYLINE":
                pending={"verts":[],"layer":get(tags,8,"0"),
                         "closed":bool(int(get(tags,70,0))&1)}
            elif typ=="VERTEX" and pending:
                p=xy(tags)
                if p:pending["verts"].append({"x":p[0],"y":p[1],
                                               "bulge":number(get(tags,42),0)})
            elif typ=="SEQEND" and pending:
                poly(pending["verts"],pending["closed"],pending["layer"],IDENTITY)
                count["POLYLINE"]+=1;pending=None
            else:draw(typ,tags)
        if row_count%50000==0:db.commit()
    db.commit()
    result={"stage":"native_dxf_geometry_candidate",
            "records":row_count,"sourceEntities":total_entities,
            "geometrySegments":count["segments"],
            "pointCount":db.execute("SELECT count(*) FROM points").fetchone()[0],
            "labelCount":db.execute("SELECT count(*) FROM labels").fetchone()[0],
            "blockDefinitions":len(blocks),
            "types":dict(count),"unsupported":dict(unknown),
            "approximations":dict(approx),
            "geographicAlignmentVerified":False,
            "completeEngineeringCoverageClaimed":False}
    if result["geometrySegments"]<1:raise RuntimeError("NO_DXF_GEOMETRY")
    with open(metricsfile,"w",encoding="utf-8") as f:json.dump(result,f,ensure_ascii=False)
    # Aggregate metadata only: never disclose source coordinate values or labels.
    print(json.dumps(result,ensure_ascii=True))
    db.close()

if __name__=="__main__":
    main(sys.argv[1],sys.argv[2],sys.argv[3])
