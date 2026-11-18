const cars=[
{id:1,name:"Aurora Nova",type:"Sedan",price:48000,range:610,speed:4.9,top:225,seats:5,emoji:"🚗",c:["#7c5cff","#00d4ff"]},
{id:2,name:"Aurora Terra",type:"SUV",price:62000,range:540,speed:5.6,top:200,seats:7,emoji:"🚙",c:["#11998e","#38ef7d"]},
{id:3,name:"Aurora Volt GT",type:"Sport",price:135000,range:480,speed:2.1,top:300,seats:2,emoji:"🏎️",c:["#f12711","#f5af19"]},
{id:4,name:"Aurora Pico",type:"Hatch",price:26000,range:350,speed:8.2,top:150,seats:4,emoji:"🚘",c:["#ff9a9e","#fad0c4"]},
{id:5,name:"Aurora Lux",type:"Sedan",price:89000,range:650,speed:3.4,top:250,seats:5,emoji:"🚖",c:["#3a1c71","#d76d77"]},
{id:6,name:"Aurora Ridge",type:"SUV",price:54000,range:500,speed:6.1,top:190,seats:5,emoji:"🛻",c:["#2193b0","#6dd5ed"]}];
const $=s=>document.querySelector(s),money=n=>"$"+Math.round(n).toLocaleString();
let type="all",favs=new Set(JSON.parse(localStorage.favs||"[]")),cmp=[];
const grad=c=>`background:linear-gradient(135deg,${c[0]},${c[1]})`;

function render(){
  const q=$("#search").value.toLowerCase(),max=+$("#price").value;
  $("#priceVal").textContent=money(max);
  let list=cars.filter(c=>(type=="all"||c.type==type)&&c.price<=max&&c.name.toLowerCase().includes(q));
  const [k,d]=$("#sort").value.split("-");
  list.sort((a,b)=>(d=="asc"?1:-1)*(a[k]-b[k]));
  $("#grid").innerHTML=list.map((c,i)=>`<article class="card" style="animation-delay:${i*60}ms">
   <div class="thumb" style="${grad(c.c)}" data-open="${c.id}"><span class="tag">${c.type}</span>${c.emoji}
   <button class="heart ${favs.has(c.id)?"on":""}" data-fav="${c.id}" aria-label="Favorite">♥</button></div>
   <div class="info"><h3>${c.name}</h3>
   <div class="specs"><span>🔋 ${c.range} km</span><span>⏱ ${c.speed}s</span><span>💺 ${c.seats}</span></div>
   <div class="row"><span class="price">${money(c.price)}</span>
   <label class="cmp"><input type="checkbox" data-cmp="${c.id}" ${cmp.includes(c.id)?"checked":""}> Compare</label></div></div></article>`).join("");
  $("#empty").hidden=list.length>0;
  $("#favCount").textContent=favs.size;
}
function renderCompare(){
  const l=cmp.map(id=>cars.find(c=>c.id==id));
  if(!l.length){$("#compareBox").innerHTML='<p class="muted">Nothing selected yet.</p>';return}
  const rows=[["Type","type"],["Price","price",money],["Range (km)","range"],["0-100 km/h (s)","speed"],["Top speed (km/h)","top"],["Seats","seats"]];
  $("#compareBox").innerHTML="<table><tr><th></th>"+l.map(c=>`<th>${c.name}</th>`).join("")+"</tr>"+
   rows.map(([n,k,f])=>`<tr><th>${n}</th>${l.map(c=>`<td>${f?f(c[k]):c[k]}</td>`).join("")}</tr>`).join("")+"</table>";
}
function openModal(id){
  const c=cars.find(x=>x.id==id);
  const bar=(l,v,m)=>`<small>${l}</small><div class="bar"><i style="width:${v/m*100}%"></i></div>`;
  $("#modalBody").innerHTML=`<div class="thumb" style="${grad(c.c)}">${c.emoji}</div><div class="info"><h3>${c.name} · ${money(c.price)}</h3>
   <p class="muted">${c.type} · ${c.seats} seats</p>${bar("Range "+c.range+" km",c.range,700)}${bar("Top speed "+c.top+" km/h",c.top,300)}${bar("Acceleration 0-100: "+c.speed+"s",10-c.speed,10)}
   <a class="btn" href="#finance" data-fin="${c.id}">Calculate finance</a></div>`;
  $("#modal").hidden=false;
}
function calc(){
  const c=cars.find(x=>x.id==$("#calcCar").value),dp=+$("#dp").value,n=+$("#term").value,r=+$("#apr").value/1200;
  const loan=c.price*(1-dp/100);
  const m=r?loan*r/(1-Math.pow(1+r,-n)):loan/n;
  $("#dpVal").textContent=dp+"% ("+money(c.price*dp/100)+")";$("#termVal").textContent=n+" months";$("#aprVal").textContent=$("#apr").value+"%";
  $("#monthly").textContent=money(m)+"/mo";
}
document.addEventListener("click",e=>{
  const t=e.target;
  if(t.dataset.fav){const id=+t.dataset.fav;favs.has(id)?favs.delete(id):favs.add(id);localStorage.favs=JSON.stringify([...favs]);render();return}
  if(t.dataset.open||t.closest("[data-open]")&&!t.dataset.fav)openModal(t.dataset.open||t.closest("[data-open]").dataset.open);
  if(t.dataset.fin){$("#calcCar").value=t.dataset.fin;calc();$("#modal").hidden=true}
  if(t.id=="modal"||t.id=="closeModal")$("#modal").hidden=true;
  if(t.classList.contains("chip")){document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));t.classList.add("active");type=t.dataset.type;render()}
});
document.addEventListener("change",e=>{
  if(e.target.dataset.cmp){const id=+e.target.dataset.cmp;
    if(e.target.checked){if(cmp.length>=3){e.target.checked=false;return alert("Max 3 cars")}cmp.push(id)}else cmp=cmp.filter(x=>x!=id);
    renderCompare()}
});
["search","price","sort"].forEach(i=>$("#"+i).addEventListener("input",render));
["calcCar","dp","term","apr"].forEach(i=>$("#"+i).addEventListener("input",calc));
$("#calcCar").innerHTML=cars.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
$("#burger").onclick=()=>$("#menu").classList.toggle("open");
$("#menu").onclick=()=>$("#menu").classList.remove("open");
$("#favBtn").onclick=()=>{type="all";alert(favs.size?"Favorites: "+[...favs].map(i=>cars.find(c=>c.id==i).name).join(", "):"No favorites yet")};
$("#themeBtn").onclick=()=>{const d=document.documentElement;d.dataset.theme=d.dataset.theme=="light"?"dark":"light";localStorage.theme=d.dataset.theme};
document.addEventListener("keydown",e=>{if(e.key=="Escape")$("#modal").hidden=true});
document.documentElement.dataset.theme=localStorage.theme||"dark";
document.querySelectorAll("[data-count]").forEach(el=>{const t=+el.dataset.count;let v=0;const s=Math.max(1,t/40);
  const i=setInterval(()=>{v+=s;if(v>=t){v=t;clearInterval(i)}el.textContent=Math.round(v)},30)});
render();renderCompare();calc();
