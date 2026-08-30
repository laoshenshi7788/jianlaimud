$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# 替换地图手势块：支持 双指捏合缩放（锚定双指中点）+ 单指平移
$old=@'
  let panStartX=0, panStartY=0, panMoved=false;
  svg.addEventListener('pointerdown',function(e){
    // 只响应左键
    if(e.button!==0 && e.pointerType==='mouse') return;
    panStartX=e.clientX; panStartY=e.clientY; panMoved=false;
    mapZoom.dragging=true; mapZoom.lx=e.clientX; mapZoom.ly=e.clientY;
  });
  svg.addEventListener('pointermove',function(e){
    if(!mapZoom.dragging) return;
    const dx=e.clientX-mapZoom.lx, dy=e.clientY-mapZoom.ly;
    if(!panMoved && Math.abs(e.clientX-panStartX)+Math.abs(e.clientY-panStartY)<8) return; // 未达拖动阈值（指尖微动不误触平移）
    if(!panMoved){ panMoved=true; svg.classList.add('dragging'); try{ svg.setPointerCapture(e.pointerId); }catch(err){} }
    mapPanTo(dx, dy);
    mapZoom.lx=e.clientX; mapZoom.ly=e.clientY;
  });
  function endPan(e){
    if(!mapZoom.dragging) return;
    mapZoom.dragging=false;
    svg.classList.remove('dragging');
    if(panMoved){ try{ svg.releasePointerCapture(e.pointerId); }catch(err){} }
  }
  svg.addEventListener('pointerup',endPan);
  svg.addEventListener('pointercancel',endPan);
'@
$new=@'
  // —— 指针管理：单指平移，双指捏合缩放（锚定双指中点，手机上直接捏开放大） ——
  const pts=new Map();
  let pinch=null; // {d:当前指距}
  svg.addEventListener('pointerdown',function(e){
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===2){
      // 进入双指捏合：结束平移
      mapZoom.dragging=false; svg.classList.remove('dragging');
      const a=[...pts.values()];
      pinch={d:Math.hypot(a[0].x-a[1].x, a[0].y-a[1].y)||1};
      return;
    }
    if(e.button!==0 && e.pointerType==='mouse') return;
    panStartX=e.clientX; panStartY=e.clientY; panMoved=false;
    mapZoom.dragging=true; mapZoom.lx=e.clientX; mapZoom.ly=e.clientY;
  });
  svg.addEventListener('pointermove',function(e){
    if(pts.has(e.pointerId)) pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch && pts.size>=2){
      // 双指捏合：按指距比例缩放，锚定双指中点
      const a=[...pts.values()];
      const d=Math.hypot(a[0].x-a[1].x, a[0].y-a[1].y)||1;
      const rect=svg.getBoundingClientRect();
      const vb=svg.viewBox.baseVal;
      const mx=(a[0].x+a[1].x)/2, my=(a[0].y+a[1].y)/2;
      let ax=vb.x, ay=vb.y;
      try{ if(rect.width>0){ ax=vb.x+(mx-rect.left)*(vb.width/rect.width); ay=vb.y+(my-rect.top)*(vb.height/rect.height); } }catch(err){}
      mapZoomBy(d/pinch.d, ax, ay);
      pinch.d=d;
      return;
    }
    if(!mapZoom.dragging) return;
    const dx=e.clientX-mapZoom.lx, dy=e.clientY-mapZoom.ly;
    if(!panMoved && Math.abs(e.clientX-panStartX)+Math.abs(e.clientY-panStartY)<8) return; // 未达拖动阈值（指尖微动不误触平移）
    if(!panMoved){ panMoved=true; svg.classList.add('dragging'); try{ svg.setPointerCapture(e.pointerId); }catch(err){} }
    mapPanTo(dx, dy);
    mapZoom.lx=e.clientX; mapZoom.ly=e.clientY;
  });
  function endPan(e){
    pts.delete(e.pointerId);
    if(pts.size<2) pinch=null;
    if(mapZoom.dragging){
      mapZoom.dragging=false;
      svg.classList.remove('dragging');
      if(panMoved){ try{ svg.releasePointerCapture(e.pointerId); }catch(err){} }
    }
  }
  svg.addEventListener('pointerup',endPan);
  svg.addEventListener('pointercancel',endPan);
'@
if(-not $html.Contains($old)){ throw 'gesture block not found' }
$html=$html.Replace($old,$new)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'PINCH ZOOM INSTALLED'
