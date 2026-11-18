const cars = window.CARS;
const $ = s => document.querySelector(s);
const money = n => "$" + Math.round(n).toLocaleString("en-US");
let type = "all", favs = new Set(JSON.parse(localStorage.favs || "[]")), cmp = [];
cars.forEach(c => c.slug = c.name.toLowerCase().replace("aurora ", "").replace(/\s+/g, "-"));
const find = id => cars.find(c => c.id == id);
const FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="#222"/><text x="50%" y="50%" fill="#888" font-size="28" text-anchor="middle">Image unavailable</text></svg>');
const img = (c, cls = "") => `<img class="${cls}" src="${c.img.replace(".webp", "-sm.webp")}" alt="${c.name} electric ${c.type.toLowerCase()}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK}'">`;

function render() {
  const q = $("#search").value.toLowerCase(), max = +$("#price").value;
  $("#priceVal").textContent = money(max);
  const list = cars.filter(c => (type == "all" || c.type == type) && c.price <= max && c.name.toLowerCase().includes(q));
  const [k, d] = $("#sort").value.split("-");
  list.sort((a, b) => (d == "asc" ? 1 : -1) * (a[k] - b[k]));
  $("#grid").innerHTML = list.map((c, i) => `<article class="card" style="animation-delay:${i * 60}ms">
    <div class="thumb" data-open="${c.id}">${img(c)}<span class="tag">${c.type}</span>
      <button class="heart ${favs.has(c.id) ? "on" : ""}" data-fav="${c.id}" aria-label="Favorite">♥</button></div>
    <div class="info"><h3>${c.name}</h3><p class="muted tl">${c.tagline}</p>
      <div class="specs"><span>🔋 ${c.range} km</span><span>⏱ ${c.speed}s</span><span>⚡ ${c.power} hp</span></div>
      <div class="row"><span class="price"><small>From</small> ${money(c.price)}</span>
        <button class="btn sm" data-open="${c.id}">Details</button></div>
      <label class="cmp"><input type="checkbox" data-cmp="${c.id}" ${cmp.includes(c.id) ? "checked" : ""}> Compare</label></div></article>`).join("");
  $("#empty").hidden = list.length > 0;
  $("#favCount").textContent = favs.size;
  renderFavs(); syncURL();
}

function renderCompare() {
  const l = cmp.map(find);
  if (!l.length) { $("#compareBox").innerHTML = '<p class="muted">Nothing selected yet.</p>'; return; }
  // [label, getter, formatter, better: "min"|"max"|null]
  const rows = [
    ["Price", c => c.price, money, "min"], ["Range (km)", c => c.range, null, "max"],
    ["0-100 km/h (s)", c => c.speed, null, "min"], ["Top speed (km/h)", c => c.top, null, "max"],
    ["Power (hp)", c => c.power, null, "max"], ["Battery (kWh)", c => c.battery, null, "max"],
    ["DC charging (kW)", c => c.dc, null, "max"], ["Cargo (L)", c => c.cargo, null, "max"],
    ["Weight (kg)", c => c.weight, null, "min"], ["Seats", c => c.seats, null, "max"],
    ["Drive", c => c.drive, null, null]];
  $("#compareBox").innerHTML = "<table><tr><th></th>" + l.map(c => `<th>${img(c, "cmp-img")}<br>${c.name}</th>`).join("") + "</tr>" +
    rows.map(([n, g, f, b]) => {
      const vals = l.map(g), best = b && l.length > 1 ? Math[b](...vals) : null;
      return `<tr><th>${n}</th>${vals.map(v => `<td class="${v === best ? "best" : ""}">${f ? f(v) : v}</td>`).join("")}</tr>`;
    }).join("") + "</table>";
}

function openModal(id, color = 0) {
  const c = find(id), bar = (l, v, m) => `<div class="barlbl"><span>${l}</span></div><div class="bar"><i style="width:${Math.min(100, v / m * 100)}%"></i></div>`;
  const d = c.dims, spec = (a, b) => `<div><small>${a}</small><b>${b}</b></div>`;
  $("#modalBody").innerHTML = `
  <div class="m-img"><img id="mImg" src="${c.img}" alt="${c.name}" style="filter:hue-rotate(${c.colors[color][1]}deg)" onerror="this.onerror=null;this.src='${FALLBACK}'"></div>
  <div class="m-info">
    <p class="eyebrow">${c.year} · ${c.type}</p>
    <h3>${c.name}</h3><p class="muted">${c.desc}</p>
    <div class="m-price">${money(c.price)} <small>MSRP</small></div>
    <h4>Colour: <span id="colName">${c.colors[color][0]}</span></h4>
    <div class="swatches">${c.colors.map((x, i) => `<button class="sw ${i == color ? "on" : ""}" data-col="${i}" data-id="${c.id}" title="${x[0]}" style="background:hsl(${(x[1] + 220) % 360},45%,${i == 1 ? 85 : i == 2 ? 30 : 50}%)"></button>`).join("")}</div>
    <div class="tabs"><button class="tab on" data-tab="perf">Performance</button><button class="tab" data-tab="batt">Battery</button><button class="tab" data-tab="dim">Dimensions</button><button class="tab" data-tab="feat">Features</button></div>
    <div class="pane on" id="p-perf">${bar("Power " + c.power + " hp", c.power, 1100)}${bar("Torque " + c.torque + " Nm", c.torque, 1300)}${bar("Top speed " + c.top + " km/h", c.top, 320)}${bar("0-100 km/h in " + c.speed + " s", 10 - c.speed, 8)}<div class="specgrid">${spec("Drive", c.drive)}${spec("Seats", c.seats)}</div></div>
    <div class="pane" id="p-batt"><div class="specgrid">${spec("Range (WLTP)", c.range + " km")}${spec("Battery", c.battery + " kWh")}${spec("DC fast charge", c.dc + " kW")}${spec("Charge time", c.charge)}${spec("AC charging", c.ac)}${spec("Warranty", c.warranty)}</div></div>
    <div class="pane" id="p-dim"><div class="specgrid">${spec("Length", d.length + " mm")}${spec("Width", d.width + " mm")}${spec("Height", d.height + " mm")}${spec("Wheelbase", d.wheelbase + " mm")}${spec("Curb weight", c.weight + " kg")}${spec("Cargo", c.cargo + " L")}</div></div>
    <div class="pane" id="p-feat"><ul class="feat">${c.features.map(f => `<li>✓ ${f}</li>`).join("")}</ul></div>
    <div class="cta"><a class="btn" href="#finance" data-fin="${c.id}">Finance this car</a><a class="btn ghost" href="#contact" data-td="${c.id}">Test drive</a><button class="btn ghost" data-share="${c.id}">🔗 Share</button></div>
  </div>`;
  $("#modal").hidden = false; document.body.style.overflow = "hidden";
  lastFocus = lastFocus || document.activeElement; $("#closeModal").focus(); syncURL();
}
let lastFocus = null;
const closeModal = () => { $("#modal").hidden = true; document.body.style.overflow = ""; syncURL(); if (lastFocus) { lastFocus.focus && lastFocus.focus(); lastFocus = null; } };

function calc() {
  const c = find($("#calcCar").value), dp = +$("#dp").value, n = +$("#term").value, r = +$("#apr").value / 1200;
  const loan = c.price * (1 - dp / 100), m = r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
  $("#dpVal").textContent = dp + "% (" + money(c.price * dp / 100) + ")";
  $("#termVal").textContent = n + " months"; $("#aprVal").textContent = $("#apr").value + "%";
  $("#monthly").textContent = money(m) + "/mo";
  $("#totalInfo").textContent = `Loan ${money(loan)} · total interest ${money(m * n - loan)}`;
}

document.addEventListener("click", e => {
  const t = e.target, open = t.closest("[data-open]");
  if (t.dataset.fav) { const id = +t.dataset.fav; favs.has(id) ? favs.delete(id) : favs.add(id); localStorage.favs = JSON.stringify([...favs]); render(); return; }
  if (open) openModal(open.dataset.open);
  if (t.dataset.col) openModal(t.dataset.id, +t.dataset.col);
  if (t.dataset.tab) { document.querySelectorAll(".tab,.pane").forEach(x => x.classList.remove("on")); t.classList.add("on"); $("#p-" + t.dataset.tab).classList.add("on"); }
  if (t.dataset.fin) { $("#calcCar").value = t.dataset.fin; calc(); closeModal(); }
  if (t.dataset.td) { $("#tdCar").value = t.dataset.td; closeModal(); }
  if (t.id == "modal" || t.id == "closeModal") closeModal();
  if (t.classList.contains("chip")) { document.querySelectorAll(".chip").forEach(x => x.classList.remove("active")); t.classList.add("active"); type = t.dataset.type; render(); }
});
document.addEventListener("change", e => {
  if (e.target.dataset.cmp) {
    const id = +e.target.dataset.cmp;
    if (e.target.checked) { if (cmp.length >= 3) { e.target.checked = false; return alert("You can compare up to 3 cars."); } cmp.push(id); }
    else cmp = cmp.filter(x => x != id);
    renderCompare();
  }
});
["search", "price", "sort"].forEach(i => $("#" + i).addEventListener("input", render));
["calcCar", "dp", "term", "apr"].forEach(i => $("#" + i).addEventListener("input", calc));
const opts = cars.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
$("#calcCar").innerHTML = opts; $("#tdCar").innerHTML = opts;
$("#burger").onclick = () => $("#menu").classList.toggle("open");
$("#menu").onclick = () => $("#menu").classList.remove("open");
$("#favBtn").onclick = () => toggleDrawer(true);
$("#closeDrawer").onclick = $("#scrim").onclick = () => toggleDrawer(false);
$("#themeBtn").onclick = () => { const d = document.documentElement; d.dataset.theme = d.dataset.theme == "light" ? "dark" : "light"; localStorage.theme = d.dataset.theme; };
document.addEventListener("keydown", e => {
  if (e.key == "Escape") { closeModal(); toggleDrawer(false); }
  if (e.key == "Tab" && !$("#modal").hidden) { // focus trap
    const f = [...$("#modal").querySelectorAll("button,a[href],input,select")].filter(x => !x.disabled);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement == first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement == last) { e.preventDefault(); first.focus(); }
  }
});
$("#tdForm").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target, m = $("#tdMsg");
  if (!f.name.value.trim() || !/^\S+@\S+\.\S+$/.test(f.email.value) || !f.date.value) { m.className = "form-msg err"; m.textContent = "Please enter your name, a valid email and a date."; return; }
  m.className = "form-msg ok"; m.textContent = `Thanks ${f.name.value.split(" ")[0]}! ${find(f.car.value).name} test drive requested for ${f.date.value} at ${f.time.value}. (Demo – no data is sent.)`;
  f.reset();
});
$("#tdForm").date.min = new Date().toISOString().slice(0, 10);
document.documentElement.dataset.theme = localStorage.theme || "dark";
document.querySelectorAll("[data-count]").forEach(el => {
  const t = +el.dataset.count; let v = 0; const s = Math.max(1, t / 40);
  const i = setInterval(() => { v += s; if (v >= t) { v = t; clearInterval(i); } el.textContent = Math.round(v); }, 30);
});

/* ===== Favorites drawer ===== */
function toggleDrawer(on) {
  $("#drawer").classList.toggle("open", on); $("#drawer").setAttribute("aria-hidden", !on);
  $("#scrim").hidden = !on; if (on) $("#closeDrawer").focus();
}
function renderFavs() {
  const l = [...favs].map(find).filter(Boolean);
  $("#favList").innerHTML = l.length ? l.map(c => `<div class="fav-item">${img(c, "fav-img")}
    <div><b>${c.name}</b><br><small class="muted">${money(c.price)} · ${c.range} km</small>
    <div class="fav-actions"><button class="btn sm" data-open="${c.id}" data-closedrawer="1">View</button><button class="btn sm ghost" data-fav="${c.id}">Remove</button></div></div></div>`).join("")
    : '<p class="muted">No favorites yet. Tap the ♥ on any car.</p>';
}
document.addEventListener("click", e => { if (e.target.dataset.closedrawer) toggleDrawer(false); });

/* ===== Shareable URL (?car=nova&type=SUV&q=...&max=...&sort=...) ===== */
function syncURL() {
  const p = new URLSearchParams();
  if (type != "all") p.set("type", type);
  if ($("#search").value) p.set("q", $("#search").value);
  if ($("#price").value != $("#price").max) p.set("max", $("#price").value);
  if ($("#sort").value != "price-asc") p.set("sort", $("#sort").value);
  if (!$("#modal").hidden && window.curCar) p.set("car", window.curCar);
  const s = p.toString();
  history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + location.hash);
}
const _open = openModal;
openModal = function (id, color = 0) { window.curCar = find(id).slug; _open(id, color); };
function loadURL() {
  const p = new URLSearchParams(location.search);
  if (p.get("type")) { type = p.get("type"); document.querySelectorAll(".chip").forEach(x => x.classList.toggle("active", x.dataset.type == type)); }
  if (p.get("q")) $("#search").value = p.get("q");
  if (p.get("max")) $("#price").value = p.get("max");
  if (p.get("sort")) $("#sort").value = p.get("sort");
  render();
  const car = cars.find(c => c.slug == p.get("car"));
  if (car) openModal(car.id);
}
document.addEventListener("click", e => {
  if (e.target.dataset.share) {
    const url = location.origin + location.pathname + "?car=" + find(e.target.dataset.share).slug;
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => e.target.textContent = "✓ Link copied", () => prompt("Copy link:", url));
  }
});

/* ===== Trip & charging planner ===== */
function tripCalc() {
  const dist = +$("#dist").value, start = +$("#start").value, spd = +$("#spd").value;
  $("#distVal").textContent = dist + " km"; $("#startVal").textContent = start + "%"; $("#spdVal").textContent = spd + " km/h";
  const f = Math.max(0.6, 1 - (spd - 90) * 0.004);
  const rows = cars.map(c => {
    const full = c.range * f, first = full * (start - 10) / 100, leg = full * 0.7;
    const stops = dist <= first ? 0 : Math.ceil((dist - first) / leg);
    const mins = c.battery * 0.7 / (c.dc * 0.75) * 60;
    const drive = dist / spd * 60, total = drive + stops * (mins + 5);
    return { c, stops, chargeMin: stops * mins, total };
  }).sort((a, b) => a.total - b.total);
  const hm = m => `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, "0")}m`;
  $("#tripBox").innerHTML = "<table><tr><th>Model</th><th>Charging stops</th><th>Time charging</th><th>Total trip time</th></tr>" +
    rows.map((r, i) => `<tr class="${i == 0 ? "bestrow" : ""}"><th>${r.c.name}${i == 0 ? " 🏆" : ""}</th><td>${r.stops == 0 ? "None 🎉" : r.stops}</td><td>${r.stops ? Math.round(r.chargeMin) + " min" : "–"}</td><td>${hm(r.total)}</td></tr>`).join("") + "</table>";
}
["dist", "start", "spd"].forEach(i => $("#" + i).addEventListener("input", tripCalc));

/* ===== Running cost & savings ===== */
function savCalc() {
  const c = find($("#svCar").value), km = +$("#km").value, el = +$("#el").value, pt = +$("#pt").value, lp = +$("#lp").value;
  $("#kmVal").textContent = km.toLocaleString() + " km"; $("#elVal").textContent = "$" + el.toFixed(2) + "/kWh";
  $("#ptVal").textContent = "$" + pt.toFixed(2) + "/L"; $("#lpVal").textContent = lp + " L/100km";
  const kwh100 = c.battery / c.range * 100 * 1.15; // real-world factor
  const ev = km / 100 * kwh100 * el, gas = km / 100 * lp * pt, save = gas - ev, co2 = km / 100 * lp * 2.31 / 1000;
  $("#svOut").innerHTML = `<span>You save about</span><b>${money(Math.max(0, save))}/year</b>
    <small>EV ${money(ev)}/yr (${kwh100.toFixed(1)} kWh/100km) vs petrol ${money(gas)}/yr · 5-year savings ${money(Math.max(0, save) * 5)} · ${co2.toFixed(1)} t CO₂ avoided/yr</small>`;
}
["svCar", "km", "el", "pt", "lp"].forEach(i => $("#" + i).addEventListener("input", savCalc));
$("#svCar").innerHTML = opts;
$("#svCar").value = 1;

/* ===== init ===== */
renderCompare(); calc(); tripCalc(); savCalc(); loadURL();
