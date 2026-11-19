/* Titan Members' Portal — PREVIEW app (vanilla JS, mock data in localStorage). */
(function () {
  'use strict';
  var db = TP.load();
  var SESSION_KEY = 'titanPortalDemo.session';
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var GROUPS = ['Junior', 'Development', 'Performance'];
  var DEMO_PASSWORD = 'demo1234';

  var S = { user: null, tab: null, childId: null, viewSwimmer: null, calMonth: null, filter: { q: '', venue: '', group: '', mine: true }, manage: 'swimmers', editId: null, prefill: {}, att: null, remFilter: 'all', editRemark: null, replyTo: null };

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function todayISO() { var d = new Date(); return isoOf(d); }
  function isoOf(d) { var m = d.getMonth() + 1, x = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (x < 10 ? '0' : '') + x; }
  function parseISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtDate(s) { var d = parseISO(s); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function fmtShort(s) { var d = parseISO(s); return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function fmtTime(sec) {
    if (sec == null || isNaN(sec)) return '—';
    var m = Math.floor(sec / 60), s = sec - m * 60;
    var ss = s.toFixed(2); if (m > 0 && s < 10) ss = '0' + ss;
    return m > 0 ? m + ':' + ss : ss;
  }
  function parseTime(str) {
    str = String(str || '').trim();
    var m = /^(?:(\d{1,2}):)?(\d{1,2}(?:[.,]\d{1,2})?)$/.exec(str);
    if (!m) return null;
    var sec = (m[1] ? +m[1] * 60 : 0) + parseFloat(m[2].replace(',', '.'));
    if (m[1] && parseFloat(m[2]) >= 60) return null;
    return sec > 0 ? Math.round(sec * 100) / 100 : null;
  }
  function age(dob) { var d = parseISO(dob), n = new Date(); var a = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--; return a; }
  function ord(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function evName(id) { var e = db.events.filter(function (x) { return x.id === id; })[0]; return e ? e.name : id; }
  function sw(id) { return db.swimmers.filter(function (s) { return s.id === id; })[0]; }
  function venue(id) { return db.venues.filter(function (v) { return v.id === id; })[0]; }
  function coachName(id) { var c = db.coaches.filter(function (x) { return x.id === id; })[0] || db.admins.filter(function (x) { return x.id === id; })[0]; return c ? c.name : 'Coach'; }
  function coachIdsOf(s) { return (s && s.coachIds) || []; }
  function coachNames(s) { return coachIdsOf(s).map(function (id) { var c = db.coaches.filter(function (x) { return x.id === id; })[0]; return c ? c.name : ''; }).filter(Boolean); }
  function coachMeta(s) { var n = coachNames(s); return n.length ? n.join(', ') : 'Not assigned'; }
  function isAssignedTo(s, cid) { return coachIdsOf(s).indexOf(cid) >= 0; }
  function isMine(s) { return !!(S.user && S.user.role === 'coach' && isAssignedTo(s, S.user.id)); }
  function fullName(s) { return s.first + ' ' + s.last; }
  function initials(s) { return (s.first[0] + s.last[0]).toUpperCase(); }
  function medalWord(m) { return m ? '<span class="m-' + m + '">' + m.charAt(0).toUpperCase() + m.slice(1) + '</span>' : ''; }
  function byDate(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id < b.id ? -1 : 1); }
  function save() { TP.save(); }
  var toastT;
  function toast(msg, pb) {
    var t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (pb ? ' pb' : '');
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = 'toast'; }, 2600);
  }

  /* ---------- derived data (PBs recompute from raw records every render) ---------- */
  function resultsOf(sid) { return db.results.filter(function (r) { return r.swimmerId === sid; }).sort(byDate); }
  function timesOf(sid) { return db.times.filter(function (t) { return t.swimmerId === sid; }).sort(byDate); }
  function pbFlags(sid) { // result is a PB if faster than every earlier competition time in that event
    var best = {}, flags = {};
    resultsOf(sid).forEach(function (r) {
      if (best[r.event] == null || r.time < best[r.event]) { flags[r.id] = best[r.event] == null ? 'first' : 'pb'; best[r.event] = r.time; }
    });
    return flags;
  }
  function pbTable(sid) {
    var s = sw(sid), rows = {};
    resultsOf(sid).forEach(function (r) { if (!rows[r.event] || r.time < rows[r.event].pb.time) rows[r.event] = { pb: r, tb: rows[r.event] ? rows[r.event].tb : null }; });
    timesOf(sid).forEach(function (t) { rows[t.event] = rows[t.event] || { pb: null, tb: null }; if (!rows[t.event].tb || t.time < rows[t.event].tb.time) rows[t.event].tb = t; });
    var order = db.events.map(function (e) { return e.id; });
    return Object.keys(rows).sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); }).map(function (k) { return { event: k, pb: rows[k].pb, tb: rows[k].tb }; });
  }
  function bestComp(sid, ev, beforeId) { var b = null; db.results.forEach(function (r) { if (r.swimmerId === sid && r.event === ev && r.id !== beforeId && (b == null || r.time < b)) b = r.time; }); return b; }
  function bestTrain(sid, ev) { var b = null; db.times.forEach(function (r) { if (r.swimmerId === sid && r.event === ev && (b == null || r.time < b)) b = r.time; }); return b; }
  function attOf(sid) {
    var list = [];
    db.attendance.forEach(function (a) { if (Object.prototype.hasOwnProperty.call(a.marks, sid)) list.push({ date: a.date, venueId: a.venueId, slot: a.slot, present: !!a.marks[sid] }); });
    list.sort(byDate);
    var p = list.filter(function (x) { return x.present; }).length;
    return { list: list, present: p, total: list.length, pct: list.length ? Math.round(p * 100 / list.length) : 0 };
  }
  function medals(sid) { var m = { gold: 0, silver: 0, bronze: 0 }; resultsOf(sid).forEach(function (r) { if (r.medal) m[r.medal]++; }); return m; }

  /* ---------- auth ---------- */
  function findUser(email) {
    email = String(email || '').trim().toLowerCase();
    if (!email) return null;
    var p = db.parents.filter(function (x) { return x.email.toLowerCase() === email; })[0]; if (p) return { role: 'parent', id: p.id, name: p.name, email: p.email };
    var c = db.coaches.filter(function (x) { return x.email.toLowerCase() === email; })[0]; if (c) return { role: 'coach', id: c.id, name: c.name, email: c.email };
    var a = db.admins.filter(function (x) { return x.email.toLowerCase() === email; })[0]; if (a) return { role: 'admin', id: a.id, name: a.name, email: a.email };
    var swimmer = db.swimmers.filter(function (x) { return (x.email || '').toLowerCase() === email; })[0]; if (swimmer) return { role: 'finswimmer', id: swimmer.id, name: swimmer.first + ' ' + swimmer.last, email: swimmer.email, swimmerId: swimmer.id };
    return null;
  }
  function homeTab(role) { return role === 'parent' || role === 'finswimmer' ? 'report' : 'swimmers'; }
  function login(u) {
    S.user = u; S.tab = homeTab(u.role); S.viewSwimmer = null; S.childId = null; S.calMonth = null; S.prefill = {}; S.editRemark = null; S.replyTo = null; S.remFilter = 'all';
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(u)); } catch (e) { }
    render(); window.scrollTo(0, 0);
  }
  function logout() { S.user = null; try { localStorage.removeItem(SESSION_KEY); } catch (e) { } render(); }
  function myChildren() {
    if (!S.user || S.user.role !== 'parent') return [];
    var p = db.parents.filter(function (x) { return x.id === S.user.id; })[0];
    return p ? p.swimmerIds.map(sw).filter(Boolean) : [];
  }

  /* ---------- views ---------- */
  function banner() { return '<div class="preview-banner">Preview — example data<span>Prototype only · no real swimmers · edits stay in this browser</span></div>'; }

  function viewLogin() {
    return banner() + '<div class="login"><div class="login-card">' +
      '<img class="wordmark" src="assets/titan-word-dark.svg" alt="Titan Finswimming Club">' +
      '<h1>Members\' <em>Portal</em></h1>' +
      '<p class="sub">Report cards, training progress, competition results and attendance for Titan swimmers, parents and coaches.</p>' +
      '<form id="loginForm" novalidate>' +
      '<label for="em">Email</label><input id="em" name="email" type="email" autocomplete="username" placeholder="you@example.com" required>' +
      '<label for="pw">Password</label><input id="pw" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required>' +
      '<button class="btn" type="submit">Sign in</button><div class="err" id="loginErr" role="alert"></div></form>' +
      '<div class="demo-row"><b>Try a demo account</b><div class="demo-btns">' +
      '<button type="button" data-demo="parent@example.com">Parent demo</button>' +
      '<button type="button" data-demo="coach@example.com">Coach demo</button>' +
      '<button type="button" data-demo="admin@example.com">Admin demo</button>' +
      '<button type="button" data-demo="swimmer@example.com">Finswimmer demo</button></div>' +
      '<p class="fine">Demo password for every account: <b class="pw">' + DEMO_PASSWORD + '</b>. This is a mock sign-in — nothing is sent anywhere. ' +
      '<button class="linkbtn" type="button" data-act="reset">Reset demo data</button></p></div>' +
      '</div></div><div id="toast" class="toast"></div>';
  }

  function tabsFor(role) {
    if (role === 'parent' || role === 'finswimmer') return [['report', 'Report card']];
    var t = [['swimmers', 'Swimmers'], ['attendance', 'Attendance'], ['time', 'Log training time'], ['result', 'Add result'], ['remark', 'Write remark']];
    if (role === 'admin') t.push(['manage', 'Manage']);
    return t;
  }

  function shell(inner) {
    var u = S.user, tabs = tabsFor(u.role);
    return '<div class="shell-head">' + banner() +
      '<header class="top"><div class="wrap"><a class="brand" href="#" data-act="home"><img src="assets/titan-mark-crimson.svg" alt=""><span class="bw">TITAN<small>MEMBERS\' PORTAL</small></span></a>' +
      '<div class="who"><span class="pill">' + esc(u.role) + '</span><span class="nm">' + esc(u.name) + '</span><button data-act="logout">Sign out</button></div></div></header>' +
      (tabs.length > 1 ? '<nav class="tabs" aria-label="Sections"><div class="wrap">' + tabs.map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (S.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div></nav>' : '') +
      '</div><main><div class="wrap">' + inner + '</div></main>' +
      '<footer class="foot"><div class="wrap"><span>Titan Finswimming Club · Members\' Portal <b>preview</b> — all swimmers, parents and results shown are fictional examples.</span>' +
      '<button class="btn ghost sm" data-act="reset">Reset demo data</button></div></footer><div id="toast" class="toast"></div>';
  }

  /* --- line chart (SVG, faster = higher) --- */
  function chart(sid, ev) {
    var tr = timesOf(sid).filter(function (t) { return t.event === ev; });
    var cp = resultsOf(sid).filter(function (r) { return r.event === ev; });
    var all = tr.concat(cp);
    if (!all.length) return '';
    var W = 520, H = 210, L = 52, Rr = 12, T = 14, B = 28;
    var xs = all.map(function (p) { return parseISO(p.date).getTime(); }), ys = all.map(function (p) { return p.time; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs); if (x1 - x0 < 864e5 * 14) { x0 -= 864e5 * 7; x1 += 864e5 * 7; }
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), pad = Math.max((y1 - y0) * 0.12, y0 * 0.01); y0 -= pad; y1 += pad;
    function X(t) { return L + (t - x0) / (x1 - x0) * (W - L - Rr); }
    function Y(v) { return T + (v - y0) / (y1 - y0) * (H - T - B); } // smaller time -> nearer top
    var g = '';
    for (var i = 0; i <= 3; i++) { var v = y0 + (y1 - y0) * i / 3, y = Y(v); g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y + '" y2="' + y + '" stroke="#ececec"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="#888">' + fmtTime(v) + '</text>'; }
    var d0 = new Date(x0); d0 = new Date(d0.getFullYear(), d0.getMonth() + 1, 1);
    for (; d0.getTime() <= x1; d0 = new Date(d0.getFullYear(), d0.getMonth() + 1, 1)) { var x = X(d0.getTime()); g += '<line x1="' + x + '" x2="' + x + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#f3f3f3"/><text x="' + x + '" y="' + (H - 9) + '" text-anchor="middle" font-size="11" fill="#888">' + MONTHS[d0.getMonth()] + '</text>'; }
    var pb = cp.length ? Math.min.apply(null, cp.map(function (r) { return r.time; })) : null;
    if (pb != null) g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(pb) + '" y2="' + Y(pb) + '" stroke="#CE0037" stroke-dasharray="5 4" stroke-width="1.5"/>';
    if (tr.length > 1) g += '<polyline fill="none" stroke="#000" stroke-width="2.2" stroke-linejoin="round" points="' + tr.map(function (p) { return X(parseISO(p.date).getTime()) + ',' + Y(p.time); }).join(' ') + '"/>';
    tr.forEach(function (p) { g += '<circle cx="' + X(parseISO(p.date).getTime()) + '" cy="' + Y(p.time) + '" r="3.6" fill="#000"><title>Training ' + fmtShort(p.date) + ': ' + fmtTime(p.time) + '</title></circle>'; });
    cp.forEach(function (p) { var cx = X(parseISO(p.date).getTime()), cy = Y(p.time); g += '<rect x="' + (cx - 5) + '" y="' + (cy - 5) + '" width="10" height="10" fill="#CE0037" stroke="#fff" stroke-width="1.5" transform="rotate(45 ' + cx + ' ' + cy + ')"><title>' + esc(p.competition) + ' ' + fmtShort(p.date) + ': ' + fmtTime(p.time) + '</title></rect>'; });
    var first = tr[0], last = tr[tr.length - 1], delta = '';
    if (tr.length > 1) { var dd = last.time - first.time; delta = '<span class="small ' + (dd < 0 ? '' : 'muted') + '" style="color:' + (dd < 0 ? 'var(--ok)' : '') + ';font-weight:800">' + (dd < 0 ? '▲ ' + fmtTime(-dd) + 's faster' : '▼ ' + fmtTime(dd) + 's slower') + ' in training</span>'; }
    return '<div class="chart"><div class="ct"><b>' + evName(ev) + '</b>' + delta + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + evName(ev) + ' progress chart">' + g + '</svg></div>';
  }

  function calendar(sid, att) {
    var m = S.calMonth;
    if (!m) { var last = att.list.length ? parseISO(att.list[att.list.length - 1].date) : new Date(); m = S.calMonth = [last.getFullYear(), last.getMonth()]; }
    var first = new Date(m[0], m[1], 1), days = new Date(m[0], m[1] + 1, 0).getDate();
    var map = {}; att.list.forEach(function (a) { map[a.date] = a; });
    var lead = (first.getDay() + 6) % 7, h = '', t = todayISO();
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(function (d) { h += '<div class="dh">' + d + '</div>'; });
    for (var i = 0; i < lead; i++) h += '<div></div>';
    for (var d = 1; d <= days; d++) {
      var iso = isoOf(new Date(m[0], m[1], d)), a = map[iso];
      var cls = 'd' + (a ? (a.present ? ' pres' : ' abs') : '') + (iso === t ? ' today' : '');
      h += '<div class="' + cls + '" title="' + (a ? (a.present ? 'Present' : 'Absent') + ' · ' + esc(venue(a.venueId) ? venue(a.venueId).name : '') : '') + '">' + d + '</div>';
    }
    var mp = att.list.filter(function (a) { var dt = parseISO(a.date); return dt.getFullYear() === m[0] && dt.getMonth() === m[1]; });
    var mpp = mp.filter(function (a) { return a.present; }).length;
    return '<div class="cal-h"><button data-act="cal-prev" aria-label="Previous month">‹</button><b>' + MONTHS[m[1]] + ' ' + m[0] + ' <span class="muted small">· ' + mpp + '/' + mp.length + ' sessions</span></b><button data-act="cal-next" aria-label="Next month">›</button></div>' +
      '<div class="cal">' + h + '</div><div class="key"><span><i style="background:var(--ok)"></i>Present</span><span><i style="border:2px solid var(--crimson)"></i>Absent</span><span><i style="outline:2px dashed #000;outline-offset:-2px"></i>Today</span></div>';
  }

  function remarkRole(r) { return r.authorRole || 'coach'; }
  function remarkAuthor(r) { return r.authorName || coachName(r.authorId || r.coachId); }
  function badgeRole(role) { return role === 'parent' || role === 'finswimmer' ? role : 'coach'; }
  function roleLabel(role) { return badgeRole(role) === 'finswimmer' ? 'Finswimmer' : badgeRole(role) === 'parent' ? 'Parent' : 'Coach'; }
  function canWriteRemark(sid) {
    if (!S.user) return false;
    if (S.user.role === 'finswimmer') return (S.user.swimmerId || S.user.id) === sid;
    if (S.user.role === 'parent') return myChildren().some(function (k) { return k.id === sid; });
    return false;
  }
  function ownsRemark(r) {
    if (!S.user || !r) return false;
    if (S.user.role === 'parent') return remarkRole(r) === 'parent' && r.authorId === S.user.id;
    if (S.user.role === 'finswimmer') return remarkRole(r) === 'finswimmer' && r.authorId === (S.user.swimmerId || S.user.id);
    return false;
  }
  function canReplyRemark() { return !!(S.user && (S.user.role === 'coach' || S.user.role === 'admin')); }
  function remarkComposer(sid, existing) {
    var e = existing || { text: '', type: '' };
    return '<form class="form" id="cardRemForm" data-sid="' + sid + '"' + (existing ? ' data-id="' + existing.id + '"' : '') + ' style="margin-bottom:12px">' +
      '<div class="f"><label>' + (existing ? 'Edit your remark' : 'Your remark') + '</label><textarea name="text" placeholder="Share feedback, a goal, or a question">' + esc(e.text || '') + '</textarea></div>' +
      '<div class="f"><label>Type (optional)</label><select name="type"><option value="">No type</option>' + ['Feedback', 'Goal', 'Question'].map(function (t) { return '<option value="' + t + '"' + (e.type === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' +
      '<div class="actions"><button class="btn sm" type="submit">' + (existing ? 'Save changes' : 'Post remark') + '</button>' + (existing ? '<button class="btn sm ghost" type="button" data-act="cancel-rem">Cancel</button>' : '') + '<span class="small" id="crErr" style="color:var(--crimson);font-weight:800"></span></div></form>';
  }
  function reportCard(sid, staff) {
    var s = sw(sid); if (!s) return '<p class="empty">Swimmer not found.</p>';
    var att = attOf(sid), md = medals(sid), pbs = pbTable(sid), flags = pbFlags(sid);
    var pbCount = pbs.filter(function (r) { return r.pb; }).length;
    var h = '<section class="hero"><div class="top-l"><div class="av">' + initials(s) + '</div><div><h2>' + esc(fullName(s)) + '</h2>' +
      '<div class="meta"><span>Age <b>' + age(s.dob) + '</b></span><span>Group <b>' + esc(s.group) + '</b></span><span>Venue <b>' + s.venueIds.map(function (v) { return esc(venue(v) ? venue(v).name : v); }).join(', ') + '</b></span>' + (!staff ? '<span>Coach: <b>' + esc(coachNames(s).map(function (n) { return n.replace(/^Coach\s+/, ''); }).join(', ') || 'Not assigned') + '</b></span>' : '') + '</div></div></div>' +
      '<div class="stats"><div class="stat"><div class="n">' + att.pct + '%</div><div class="l">Attendance</div></div>' +
      '<div class="stat"><div class="n">' + pbCount + '</div><div class="l">Events with a PB</div></div>' +
      '<div class="stat"><div class="medalcount"><span class="m-gold">' + md.gold + '</span><span class="m-silver">' + md.silver + '</span><span class="m-bronze">' + md.bronze + '</span></div><div class="l"><span class="m-gold">Gold</span> · <span class="m-silver">Silver</span> · <span class="m-bronze">Bronze</span></div></div>' +
      '<div class="stat"><div class="n">' + db.times.filter(function (t) { return t.swimmerId === sid; }).length + '</div><div class="l">Training times logged</div></div></div></section>';
    if (staff) h += '<div class="quick"><button class="btn sm" data-go="time" data-sid="' + sid + '">+ Log training time</button><button class="btn sm dark" data-go="result" data-sid="' + sid + '">+ Add result</button><button class="btn sm ghost" data-go="remark" data-sid="' + sid + '">+ Write remark</button></div>';
    else h += '<div class="readonly-note">🔒 Read-only — your coaches update this report card.</div>';

    // PBs
    h += '<div class="grid g-rc" style="margin-top:4px"><div class="card"><h3 class="card-t">Personal bests</h3>' + (pbs.length ? '<div class="scroll-x"><table class="t"><thead><tr><th>Event</th><th>PB (competition)</th><th>Training best</th></tr></thead><tbody>' +
      pbs.map(function (r) {
        return '<tr><td><b>' + evName(r.event) + '</b></td><td>' + (r.pb ? '<span class="time">' + fmtTime(r.pb.time) + '</span><div class="small muted">' + esc(r.pb.competition) + ' · ' + fmtShort(r.pb.date) + '</div>' : '<span class="muted">—</span>') + '</td><td>' + (r.tb ? '<span class="time" style="font-weight:700">' + fmtTime(r.tb.time) + '</span><div class="small muted">' + fmtShort(r.tb.date) + '</div>' : '<span class="muted">—</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="empty">No times yet.</p>') + '</div>';

    // Remarks — coaches, parents and finswimmers share one timeline
    var roleOf = remarkRole, filter = S.remFilter || 'all';
    var rem = db.remarks.filter(function (r) { return r.swimmerId === sid && (filter === 'all' || badgeRole(roleOf(r)) === filter); }).sort(byDate).reverse();
    var editing = S.editRemark ? db.remarks.filter(function (r) { return r.id === S.editRemark && r.swimmerId === sid && ownsRemark(r); })[0] : null;
    h += '<div class="card"><h3 class="card-t">Remarks</h3>' + (canWriteRemark(sid) && !editing ? remarkComposer(sid) : '') +
      '<div class="rem-filters" role="group" aria-label="Filter remarks">' + ['all', 'coach', 'parent', 'finswimmer'].map(function (k) { return '<button type="button" data-remfilter="' + k + '" class="' + (filter === k ? 'on' : '') + '">' + (k === 'all' ? 'All' : roleLabel(k)) + '</button>'; }).join('') + '</div>' +
      (editing ? remarkComposer(sid, editing) : '') +
      (rem.length ? rem.map(function (r) {
        var role = roleOf(r), imp = role === 'coach' || !r.authorRole ? String(r.improve || '').split(/\n+/).filter(Boolean) : [];
        var replies = r.replies || [];
        return '<div class="remark"><div class="rh"><b>' + esc(remarkAuthor(r)) + '</b>' + '<span class="role-badge role-' + badgeRole(role) + '">' + roleLabel(role) + '</span><span>' + fmtDate(r.date) + '</span></div>' +
          (r.type ? '<div class="rem-type">' + esc(r.type) + '</div>' : '') + '<div>' + esc(r.text) + '</div>' +
          (imp.length ? '<div class="imp"><b>What to improve</b><ul>' + imp.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '') +
          replies.map(function (y) { return '<div class="reply"><div class="rh"><b>' + esc(y.authorName || 'Coach') + '</b><span class="role-badge role-' + badgeRole(y.authorRole || 'coach') + '">' + roleLabel(y.authorRole || 'coach') + '</span><span>' + fmtDate(y.date) + '</span></div><div>' + esc(y.text) + '</div></div>'; }).join('') +
          '<div class="row-actions">' + (ownsRemark(r) ? '<button type="button" data-editrem="' + r.id + '">Edit</button><button type="button" data-delrem="' + r.id + '">Delete</button>' : '') + (canReplyRemark() ? '<button type="button" data-reply="' + r.id + '">Reply</button>' : '') + '</div>' +
          (S.replyTo === r.id && canReplyRemark() ? '<form class="form" id="replyForm" data-rid="' + r.id + '" style="margin-top:8px"><div class="f"><label>Reply</label><textarea name="text" placeholder="Reply to this remark"></textarea></div><div class="actions"><button class="btn sm" type="submit">Post reply</button><button class="btn sm ghost" type="button" data-act="cancel-reply">Cancel</button></div></form>' : '') +
          '</div>';
      }).join('') : '<p class="empty">No remarks' + (filter === 'all' ? ' yet' : ' in this filter') + '.</p>') + '</div></div>';

    // Progress charts
    var evs = pbs.map(function (r) { return r.event; });
    h += '<div class="card" style="margin-top:14px"><h3 class="card-t">Training progress</h3><div class="legend"><span><i></i>Training time</span><span><i class="c"></i>Competition</span><span><i class="pb"></i>Current PB</span><span>Higher on the chart = faster</span></div><div class="charts">' + evs.map(function (e) { return chart(sid, e); }).join('') + '</div></div>';

    // Competition results + attendance
    var res = resultsOf(sid), comps = {};
    res.forEach(function (r) { var k = r.date + '|' + r.competition; (comps[k] = comps[k] || []).push(r); });
    var keys = Object.keys(comps).sort().reverse();
    h += '<div class="grid g2" style="margin-top:14px"><div class="card"><h3 class="card-t">Competition results</h3>' + (keys.length ? keys.map(function (k) {
      var list = comps[k], c = list[0];
      return '<div class="comp"><div class="ch"><span>' + esc(c.competition) + '</span><span class="muted small">' + fmtDate(c.date) + '</span></div>' + list.map(function (r) {
        var f = flags[r.id];
        return '<div class="res"><div><div class="ev">' + evName(r.event) + '</div><div class="small muted">' + (r.place ? ord(r.place) + ' place' : '') + (r.medal ? ' · ' + medalWord(r.medal) : '') + '</div></div>' +
          '<div class="rt"><div class="time">' + fmtTime(r.time) + '</div>' + (f === 'pb' ? '<span class="badge">PB</span>' : f === 'first' ? '<span class="badge soft">First swim</span>' : '') + '</div>' +
          (staff ? '<div style="grid-column:1/-1"><button class="del" data-del="results" data-id="' + r.id + '">Delete</button></div>' : '') + '</div>';
      }).join('') + '</div>';
    }).join('') : '<p class="empty">No competitions yet.</p>') + '</div>';

    h += '<div class="card"><h3 class="card-t">Attendance</h3><div class="att-top"><div class="ring" style="--p:' + att.pct + '"><span>' + att.pct + '%</span></div><div><b>' + att.present + ' of ' + att.total + '</b> sessions attended<div class="small muted">Since ' + (att.list[0] ? fmtDate(att.list[0].date) : '—') + '</div></div></div>' +
      calendar(sid, att) + '<div style="margin-top:12px">' + att.list.slice(-6).reverse().map(function (a) {
        var v = venue(a.venueId); return '<div class="sess"><span>' + fmtDate(a.date) + ' <span class="muted small">· ' + esc(v ? v.name : '') + ' ' + esc(a.slot || '') + '</span></span>' + (a.present ? '<span class="p">Present</span>' : '<span class="a">Absent</span>') + '</div>';
      }).join('') + '</div></div></div>';
    return h;
  }

  function viewParent() {
    var kids = myChildren();
    if (!kids.length) return shell('<p class="empty">No swimmers are linked to this account yet. Please ask the club admin.</p>');
    if (!S.childId || !kids.some(function (k) { return k.id === S.childId; })) S.childId = kids[0].id;
    var h = '<div class="h-row"><h2 class="sec">Report <em>card</em></h2></div>';
    if (kids.length > 1) h += '<div class="switch" role="tablist">' + kids.map(function (k) { return '<button data-child="' + k.id + '" class="' + (k.id === S.childId ? 'on' : '') + '"><span class="av">' + initials(k) + '</span>' + esc(k.first) + '</button>'; }).join('') + '</div>';
    return shell(h + reportCard(S.childId, false));
  }

  function viewFinswimmer() {
    var s = sw(S.user.swimmerId || S.user.id);
    if (!s) return shell('<p class="empty">This login is not linked to a swimmer yet. Please ask the club admin.</p>');
    return shell('<div class="h-row"><h2 class="sec">Hi <em>' + esc(s.first) + '</em></h2></div>' + reportCard(s.id, false));
  }

  function swimmerOptions(sel) { return db.swimmers.slice().sort(function (a, b) { return fullName(a) < fullName(b) ? -1 : 1; }).map(function (s) { return '<option value="' + s.id + '"' + (s.id === sel ? ' selected' : '') + '>' + esc(fullName(s)) + ' (' + age(s.dob) + ', ' + esc(s.group) + ')</option>'; }).join(''); }
  function eventOptions(sid, sel) {
    var s = sw(sid), mine = s ? s.events : [];
    var a = db.events.filter(function (e) { return mine.indexOf(e.id) >= 0; }), b = db.events.filter(function (e) { return mine.indexOf(e.id) < 0; });
    function o(e) { return '<option value="' + e.id + '"' + (e.id === sel ? ' selected' : '') + '>' + e.name + '</option>'; }
    return (a.length ? '<optgroup label="Usual events">' + a.map(o).join('') + '</optgroup>' : '') + '<optgroup label="Other events">' + b.map(o).join('') + '</optgroup>';
  }
  function venueOptions(sel, any) { return (any ? '<option value="">All venues</option>' : '') + db.venues.map(function (v) { return '<option value="' + v.id + '"' + (v.id === sel ? ' selected' : '') + '>' + esc(v.name) + '</option>'; }).join(''); }

  function viewSwimmers() {
    if (S.viewSwimmer) return '<button class="back" data-act="back">‹ All swimmers</button>' + reportCard(S.viewSwimmer, true);
    var f = S.filter, q = f.q.toLowerCase(), coach = S.user && S.user.role === 'coach', mine = coach && f.mine !== false;
    var list = db.swimmers.filter(function (s) {
      return (!mine || isMine(s)) && (!q || fullName(s).toLowerCase().indexOf(q) >= 0) && (!f.venue || s.venueIds.indexOf(f.venue) >= 0) && (!f.group || s.group === f.group);
    }).sort(function (a, b) { return fullName(a) < fullName(b) ? -1 : 1; });
    var toggle = coach ? '<div class="scope" role="group" aria-label="Which swimmers"><button type="button" data-scope="mine" class="' + (mine ? 'on' : '') + '">My swimmers</button><button type="button" data-scope="all" class="' + (mine ? '' : 'on') + '">All swimmers</button></div>' : '';
    return '<div class="h-row"><h2 class="sec">' + (mine ? 'My <em>swimmers</em>' : 'All <em>swimmers</em>') + '</h2><span class="muted small">' + list.length + ' of ' + db.swimmers.length + ' shown</span></div>' + toggle +
      '<div class="toolbar"><input id="fq" type="search" placeholder="Search by name…" value="' + esc(f.q) + '" aria-label="Search swimmers"><select id="fv" aria-label="Filter by venue">' + venueOptions(f.venue, true) + '</select><select id="fg" aria-label="Filter by group"><option value="">All groups</option>' + GROUPS.map(function (g) { return '<option' + (g === f.group ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select></div>' +
      '<div class="slist">' + (list.length ? list.map(function (s) {
        var a = attOf(s.id);
        return '<button class="sc" data-open="' + s.id + '"><span class="av">' + initials(s) + '</span><span><span class="nm">' + esc(fullName(s)) + '</span><br><span class="sub">' + age(s.dob) + ' yrs · ' + esc(s.group) + ' · ' + s.venueIds.map(function (v) { return esc(venue(v) ? venue(v).name : ''); }).join(', ') + '</span></span><span class="att">' + a.pct + '%<small>ATTEND.</small></span></button>';
      }).join('') : '<p class="empty">' + (mine ? 'No swimmers are assigned to you yet. Switch to All swimmers, or ask an admin to assign some.' : 'No swimmers match.') + '</p>') + '</div>';
  }

  function slotFor(vid, iso) { var v = venue(vid); if (!v) return null; var d = parseISO(iso).getDay(); return v.slots.filter(function (s) { return s.dow === d; })[0] || null; }
  function viewAttendance() {
    if (!S.att) {
      var t = todayISO(), d = parseISO(t).getDay(), v = db.venues.filter(function (x) { return x.slots.some(function (s) { return s.dow === d; }); })[0] || db.venues[0];
      S.att = { date: t, venueId: v.id, showAll: false, marks: null };
    }
    var A = S.att, existing = db.attendance.filter(function (a) { return a.date === A.date && a.venueId === A.venueId; })[0];
    if (!A.marks) A.marks = existing ? JSON.parse(JSON.stringify(existing.marks)) : {};
    var slot = slotFor(A.venueId, A.date);
    var roster = db.swimmers.filter(function (s) { return A.showAll || isMine(s) || s.venueIds.indexOf(A.venueId) >= 0 || Object.prototype.hasOwnProperty.call(A.marks, s.id); }).sort(function (a, b) { var am = isMine(a), bm = isMine(b); if (am !== bm) return am ? -1 : 1; return fullName(a) < fullName(b) ? -1 : 1; });
    var nP = roster.filter(function (s) { return A.marks[s.id]; }).length;
    var recent = db.attendance.slice().sort(byDate).reverse().slice(0, 8);
    return '<div class="h-row"><h2 class="sec">Take <em>attendance</em></h2></div><div class="grid g-rc"><div class="card"><div class="form"><div class="row c2">' +
      '<div class="f"><label for="ad">Session date</label><input id="ad" type="date" value="' + A.date + '"></div>' +
      '<div class="f"><label for="av">Venue</label><select id="av">' + venueOptions(A.venueId) + '</select></div></div>' +
      '<div class="callout' + (slot ? ' ok' : '') + '">' + (slot ? '✓ Scheduled session: ' + DAYS[slot.dow] + ' ' + slot.start + '–' + slot.end + ' at ' + esc(venue(A.venueId).name) : 'No regular session at this venue on ' + DAYS[parseISO(A.date).getDay()] + ' — you can still record an extra session.') + (existing ? ' · <span style="font-weight:800">Already recorded — editing it.</span>' : '') + '</div>' +
      '<div class="actions" style="justify-content:space-between"><span><span class="counter">' + nP + '</span> / ' + roster.length + ' present</span><span class="actions"><button class="btn sm ghost" data-act="att-all">Mark all present</button><button class="btn sm ghost" data-act="att-none">Clear</button></span></div>' +
      '<label class="chk' + (A.showAll ? ' on' : '') + '" style="justify-self:start"><input type="checkbox" id="aall"' + (A.showAll ? ' checked' : '') + '> Show swimmers from other venues</label>' +
      '<div class="roster">' + roster.map(function (s) { var on = !!A.marks[s.id], mine = isMine(s); return '<label class="rs' + (on ? ' on' : '') + (mine ? ' mine' : '') + '"><input type="checkbox" data-mark="' + s.id + '"' + (on ? ' checked' : '') + '><span class="tick">' + (on ? '✓' : '') + '</span><span><span class="nm">' + esc(fullName(s)) + '</span><br><span class="sub">' + age(s.dob) + ' yrs · ' + esc(s.group) + (mine && s.venueIds.indexOf(A.venueId) < 0 ? ' · other venue' : '') + '</span></span>' + (mine ? '<span class="tag">Yours</span>' : '') + '</label>'; }).join('') + '</div>' +
      '<div class="actions"><button class="btn" data-act="att-save">Save attendance</button><span class="small muted">Unticked swimmers are recorded as absent.</span></div></div></div>' +
      '<div class="card"><h3 class="card-t">Recent sessions</h3>' + recent.map(function (a) {
        var k = Object.keys(a.marks), p = k.filter(function (x) { return a.marks[x]; }).length;
        return '<div class="sess"><span><b>' + fmtDate(a.date) + '</b><br><span class="small muted">' + esc(venue(a.venueId) ? venue(a.venueId).name : '') + ' · ' + esc(a.slot || '') + '</span></span><span><b>' + p + '</b>/' + k.length + '</span></div>';
      }).join('') + '</div></div>';
  }

  function pf(k, d) { return S.prefill[k] != null ? S.prefill[k] : d; }
  function viewTime() {
    var sid = pf('sid', db.swimmers[0].id), s = sw(sid), ev = pf('ev', s.events[0]);
    var tb = bestTrain(sid, ev), pb = bestComp(sid, ev);
    var recent = db.times.slice().sort(byDate).reverse().slice(0, 10);
    return '<div class="h-row"><h2 class="sec">Log training <em>time</em></h2></div><div class="grid g-rc"><div class="card"><form class="form" id="timeForm" novalidate>' +
      '<div class="f"><label for="ts">Swimmer</label><select id="ts" name="sid">' + swimmerOptions(sid) + '</select></div>' +
      '<div class="row c3"><div class="f"><label for="te">Event</label><select id="te" name="ev">' + eventOptions(sid, ev) + '</select></div>' +
      '<div class="f"><label for="tt">Time</label><input id="tt" name="time" inputmode="decimal" placeholder="e.g. 34.52 or 1:05.30" value="' + esc(pf('time', '')) + '" autocomplete="off"><div class="hint">mm:ss.hh or ss.hh</div></div>' +
      '<div class="f"><label for="td">Date</label><input id="td" name="date" type="date" value="' + pf('date', todayISO()) + '"></div></div>' +
      '<div class="f"><label for="tn">Note (optional)</label><input id="tn" name="note" placeholder="e.g. from push start, 3rd rep of 4"></div>' +
      '<div class="callout" id="tHint">Training best: <b>' + fmtTime(tb) + '</b> · Competition PB: <b>' + fmtTime(pb) + '</b></div>' +
      '<div class="actions"><button class="btn" type="submit">Save time</button><span class="err small" id="tErr" style="color:var(--crimson);font-weight:800"></span></div></form></div>' +
      '<div class="card"><h3 class="card-t">Recently logged</h3>' + recent.map(function (t) { var x = sw(t.swimmerId); return '<div class="sess"><span><b>' + esc(x ? fullName(x) : '') + '</b> · ' + evName(t.event) + '<br><span class="small muted">' + fmtDate(t.date) + ' · ' + esc(coachName(t.coachId)) + '</span></span><span style="text-align:right"><span class="time">' + fmtTime(t.time) + '</span><br><button class="del" data-del="times" data-id="' + t.id + '">Delete</button></span></div>'; }).join('') + '</div></div>';
  }

  function viewResult() {
    var sid = pf('sid', db.swimmers[0].id), s = sw(sid), ev = pf('ev', s.events[0]);
    var comps = {}; db.results.forEach(function (r) { comps[r.competition] = r.date; });
    var recent = db.results.slice().sort(byDate).reverse().slice(0, 10);
    var pb = bestComp(sid, ev);
    return '<div class="h-row"><h2 class="sec">Add competition <em>result</em></h2></div><div class="grid g-rc"><div class="card"><form class="form" id="resForm" novalidate>' +
      '<div class="row c2"><div class="f"><label for="rc">Competition</label><input id="rc" name="comp" list="compList" placeholder="e.g. Example State Meet 2026" value="' + esc(pf('comp', '')) + '"><datalist id="compList">' + Object.keys(comps).map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist></div>' +
      '<div class="f"><label for="rd">Date</label><input id="rd" name="date" type="date" value="' + pf('date', todayISO()) + '"></div></div>' +
      '<div class="row c2"><div class="f"><label for="rs">Swimmer</label><select id="rs" name="sid">' + swimmerOptions(sid) + '</select></div>' +
      '<div class="f"><label for="re">Event</label><select id="re" name="ev">' + eventOptions(sid, ev) + '</select></div></div>' +
      '<div class="row c3"><div class="f"><label for="rt">Time</label><input id="rt" name="time" inputmode="decimal" placeholder="e.g. 36.80" value="' + esc(pf('time', '')) + '" autocomplete="off"></div>' +
      '<div class="f"><label for="rp">Placing</label><input id="rp" name="place" type="number" min="1" max="99" placeholder="e.g. 2" value="' + esc(pf('place', '')) + '"></div>' +
      '<div class="f"><label for="rm">Medal</label><select id="rm" name="medal"><option value="">None</option><option value="gold">Gold</option><option value="silver">Silver</option><option value="bronze">Bronze</option></select><div class="hint">Auto-set from placing (1st–3rd)</div></div></div>' +
      '<div class="callout" id="pbHint">Current PB in ' + evName(ev) + ': <b>' + fmtTime(pb) + '</b>. Enter a time to check for a new PB.</div>' +
      '<div class="actions"><button class="btn" type="submit">Save result</button><span class="small" id="rErr" style="color:var(--crimson);font-weight:800"></span></div></form></div>' +
      '<div class="card"><h3 class="card-t">Recent results</h3>' + recent.map(function (r) { var x = sw(r.swimmerId), fl = pbFlags(r.swimmerId)[r.id]; return '<div class="sess"><span><b>' + esc(x ? fullName(x) : '') + '</b> · ' + evName(r.event) + '<br><span class="small muted">' + esc(r.competition) + ' · ' + (r.place ? ord(r.place) : '') + (r.medal ? ' · ' + medalWord(r.medal) : '') + '</span></span><span style="text-align:right"><span class="time">' + fmtTime(r.time) + '</span>' + (fl === 'pb' ? '<br><span class="badge">PB</span>' : '') + '</span></div>'; }).join('') + '</div></div>';
  }

  function viewRemark() {
    var sid = pf('sid', db.swimmers[0].id);
    var recent = db.remarks.slice().sort(byDate).reverse().slice(0, 6);
    return '<div class="h-row"><h2 class="sec">Write a <em>remark</em></h2></div><div class="grid g-rc"><div class="card"><form class="form" id="remForm" novalidate>' +
      '<div class="row c2"><div class="f"><label for="ms">Swimmer</label><select id="ms" name="sid">' + swimmerOptions(sid) + '</select></div><div class="f"><label for="md">Date</label><input id="md" name="date" type="date" value="' + todayISO() + '"></div></div>' +
      '<div class="f"><label for="mt">Remark</label><textarea id="mt" name="text" placeholder="How is the swimmer doing? What went well?"></textarea></div>' +
      '<div class="f"><label for="mi">What to improve</label><textarea id="mi" name="improve" placeholder="One point per line, e.g.&#10;Tighter streamline off the wall&#10;Hold breathing pattern on the last 15m"></textarea><div class="hint">Each line shows as a bullet on the parent\'s report card. Signed as ' + esc(S.user.name) + '.</div></div>' +
      '<div class="actions"><button class="btn" type="submit">Save remark</button><span class="small" id="mErr" style="color:var(--crimson);font-weight:800"></span></div></form></div>' +
      '<div class="card"><h3 class="card-t">Latest remarks</h3>' + recent.map(function (r) { var x = sw(r.swimmerId); return '<div class="remark"><div class="rh"><b>' + esc(x ? fullName(x) : '') + '</b><span>' + fmtShort(r.date) + ' · ' + esc(coachName(r.coachId)) + '</span></div>' + esc(r.text) + '</div>'; }).join('') + '</div></div>';
  }

  /* --- admin manage --- */
  function viewManage() {
    var m = S.manage, subs = [['swimmers', 'Swimmers'], ['parents', 'Parents'], ['coaches', 'Coaches'], ['venues', 'Venues & schedule']];
    var h = '<div class="h-row"><h2 class="sec">Manage <em>club</em></h2></div><div class="subtabs">' + subs.map(function (s) { return '<button data-sub="' + s[0] + '" class="' + (m === s[0] ? 'on' : '') + '">' + s[1] + '</button>'; }).join('') + '</div>';
    if (m === 'swimmers') h += manageSwimmers(); else if (m === 'parents') h += manageParents(); else if (m === 'coaches') h += manageCoaches(); else h += manageVenues();
    return h;
  }
  function checks(name, items, selected) { return '<div class="checks">' + items.map(function (it) { var on = selected.indexOf(it[0]) >= 0; return '<label class="chk' + (on ? ' on' : '') + '"><input type="checkbox" name="' + name + '" value="' + it[0] + '"' + (on ? ' checked' : '') + '>' + esc(it[1]) + '</label>'; }).join('') + '</div>'; }
  function manageSwimmers() {
    var e = S.editId ? sw(S.editId) : null; e = e || { first: '', last: '', dob: '', gender: 'F', group: 'Junior', venueIds: [], coachIds: [], events: [], email: '' };
    var parentsOf = function (sid) { return db.parents.filter(function (p) { return p.swimmerIds.indexOf(sid) >= 0; }).map(function (p) { return p.email; }).join(', '); };
    return '<div class="grid g-rc"><div class="card"><h3 class="card-t">Swimmers (' + db.swimmers.length + ')</h3><div class="scroll-x"><table class="t"><thead><tr><th>Name</th><th>Age / group</th><th>Coach</th><th>Venues</th><th>Parent login</th><th>Swimmer login</th><th></th></tr></thead><tbody>' +
      db.swimmers.map(function (s) { return '<tr><td><b>' + esc(fullName(s)) + '</b></td><td>' + age(s.dob) + ' · ' + esc(s.group) + '</td><td class="small">' + (esc(coachMeta(s)) === 'Not assigned' ? '<span class="muted">Not assigned</span>' : esc(coachMeta(s))) + '</td><td class="small">' + s.venueIds.map(function (v) { return esc(venue(v) ? venue(v).name : ''); }).join(', ') + '</td><td class="small">' + (esc(parentsOf(s.id)) || '<span class="muted">Not linked</span>') + '</td><td class="small">' + (s.email ? esc(s.email) : '<span class="muted">Not linked</span>') + '</td><td><button class="btn sm ghost" data-edit="' + s.id + '">Edit</button></td></tr>'; }).join('') +
      '</tbody></table></div></div><div class="card"><h3 class="card-t">' + (S.editId ? 'Edit swimmer' : 'Add swimmer') + '</h3><form class="form" id="swForm" novalidate>' +
      '<div class="row c2"><div class="f"><label>First name</label><input name="first" value="' + esc(e.first) + '" required></div><div class="f"><label>Last name</label><input name="last" value="' + esc(e.last) + '" required></div></div>' +
      '<div class="row c3"><div class="f"><label>Date of birth</label><input name="dob" type="date" value="' + esc(e.dob) + '" required></div><div class="f"><label>Gender</label><select name="gender"><option value="F"' + (e.gender === 'F' ? ' selected' : '') + '>Female</option><option value="M"' + (e.gender === 'M' ? ' selected' : '') + '>Male</option></select></div>' +
      '<div class="f"><label>Group</label><select name="group">' + GROUPS.map(function (g) { return '<option' + (g === e.group ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="f"><label>Coach</label>' + checks('coachIds', db.coaches.map(function (c) { return [c.id, c.name]; }), coachIdsOf(e)) + '<div class="hint">A swimmer can have more than one coach. Parents and the swimmer see these names on the report card.</div></div>' +
      '<div class="f"><label>Swimmer login email</label><input name="email" type="email" value="' + esc(e.email || '') + '" placeholder="swimmer@example.com"><div class="hint">Optional. They sign in with this email and the demo password, and see only their own report card.</div></div>' +
      '<div class="f"><label>Venues</label>' + checks('venueIds', db.venues.map(function (v) { return [v.id, v.name]; }), e.venueIds) + '</div>' +
      '<div class="f"><label>Main events</label>' + checks('events', db.events.map(function (v) { return [v.id, v.name]; }), e.events) + '</div>' +
      '<div class="actions"><button class="btn" type="submit">' + (S.editId ? 'Save changes' : 'Add swimmer') + '</button>' + (S.editId ? '<button class="btn ghost" type="button" data-act="cancel-edit">Cancel</button>' : '') + '<span class="small" id="swErr" style="color:var(--crimson);font-weight:800"></span></div></form></div></div>';
  }
  function manageParents() {
    var e = S.editId ? db.parents.filter(function (p) { return p.id === S.editId; })[0] : null; e = e || { name: '', email: '', phone: '', swimmerIds: [] };
    return '<div class="grid g-rc"><div class="card"><h3 class="card-t">Parent accounts (' + db.parents.length + ')</h3><div class="scroll-x"><table class="t"><thead><tr><th>Parent</th><th>Login email</th><th>Linked swimmers</th><th></th></tr></thead><tbody>' +
      db.parents.map(function (p) { return '<tr><td><b>' + esc(p.name) + '</b><div class="small muted">' + esc(p.phone || '') + '</div></td><td class="small">' + esc(p.email) + '</td><td class="small">' + p.swimmerIds.map(function (i) { var s = sw(i); return s ? esc(fullName(s)) : ''; }).join(', ') + '</td><td><button class="btn sm ghost" data-edit="' + p.id + '">Edit</button></td></tr>'; }).join('') +
      '</tbody></table></div></div><div class="card"><h3 class="card-t">' + (S.editId ? 'Edit parent' : 'Add parent & link swimmers') + '</h3><form class="form" id="parForm" novalidate>' +
      '<div class="f"><label>Name</label><input name="name" value="' + esc(e.name) + '"></div><div class="row c2"><div class="f"><label>Login email</label><input name="email" type="email" value="' + esc(e.email) + '"></div><div class="f"><label>Phone</label><input name="phone" value="' + esc(e.phone || '') + '"></div></div>' +
      '<div class="f"><label>Can see these swimmers</label>' + checks('swimmerIds', db.swimmers.map(function (s) { return [s.id, fullName(s)]; }), e.swimmerIds) + '<div class="hint">A parent only ever sees the swimmers ticked here. In the real build an invite email lets them set a password.</div></div>' +
      '<div class="actions"><button class="btn" type="submit">' + (S.editId ? 'Save changes' : 'Add parent') + '</button>' + (S.editId ? '<button class="btn ghost" type="button" data-act="cancel-edit">Cancel</button>' : '') + '<span class="small" id="pErr" style="color:var(--crimson);font-weight:800"></span></div></form></div></div>';
  }
  function manageCoaches() {
    var e = S.editId ? db.coaches.filter(function (p) { return p.id === S.editId; })[0] : null; e = e || { id: '', name: '', email: '', venueIds: [] };
    var assignedIds = e.id ? db.swimmers.filter(function (s) { return isAssignedTo(s, e.id); }).map(function (s) { return s.id; }) : [];
    return '<div class="grid g-rc"><div class="card"><h3 class="card-t">Coaches (' + db.coaches.length + ')</h3><table class="t"><thead><tr><th>Coach</th><th>Venues</th><th>Assigned swimmers</th><th></th></tr></thead><tbody>' +
      db.coaches.map(function (c) { var list = db.swimmers.filter(function (s) { return isAssignedTo(s, c.id); }); return '<tr><td><b>' + esc(c.name) + '</b><div class="small muted">' + esc(c.email) + '</div></td><td class="small">' + c.venueIds.map(function (v) { return esc(venue(v) ? venue(v).name : ''); }).join(', ') + '</td><td class="small"><b>' + list.length + '</b>' + (list.length ? ' · ' + list.map(function (s) { return esc(fullName(s)); }).join(', ') : ' · <span class="muted">None</span>') + '</td><td><button class="btn sm ghost" data-edit="' + c.id + '">Edit</button></td></tr>'; }).join('') +
      '</tbody></table><p class="small muted" style="margin-top:10px">Coaches can still open every swimmer. Their list defaults to the swimmers assigned here.</p></div><div class="card"><h3 class="card-t">' + (S.editId ? 'Edit coach' : 'Add coach') + '</h3><form class="form" id="coForm" novalidate>' +
      '<div class="row c2"><div class="f"><label>Name</label><input name="name" value="' + esc(e.name) + '"></div><div class="f"><label>Login email</label><input name="email" type="email" value="' + esc(e.email) + '"></div></div>' +
      '<div class="f"><label>Usual venues</label>' + checks('venueIds', db.venues.map(function (v) { return [v.id, v.name]; }), e.venueIds) + '</div>' +
      '<div class="f"><label>Assigned swimmers</label>' + checks('swimmerIds', db.swimmers.map(function (s) { return [s.id, fullName(s)]; }), assignedIds) + '<div class="hint">Tick to assign, untick to unassign. A swimmer can stay assigned to other coaches.</div></div>' +
      '<div class="actions"><button class="btn" type="submit">' + (S.editId ? 'Save changes' : 'Add coach') + '</button>' + (S.editId ? '<button class="btn ghost" type="button" data-act="cancel-edit">Cancel</button>' : '') + '<span class="small" id="cErr" style="color:var(--crimson);font-weight:800"></span></div></form></div></div>';
  }
  function manageVenues() {
    var e = S.editId ? db.venues.filter(function (p) { return p.id === S.editId; })[0] : null; e = e || { name: '', area: '', slots: [{ dow: 1, start: '19:00', end: '21:00' }] };
    var rows = e.slots.concat([{ dow: '', start: '', end: '' }]);
    return '<div class="grid g-rc"><div class="card"><h3 class="card-t">Venues & training schedule</h3><table class="t"><thead><tr><th>Venue</th><th>Sessions</th><th></th></tr></thead><tbody>' +
      db.venues.map(function (v) { return '<tr><td><b>' + esc(v.name) + '</b><div class="small muted">' + esc(v.area) + '</div></td><td>' + v.slots.map(function (s) { return DAYS[s.dow] + ' ' + fmt12(s.start) + '–' + fmt12(s.end); }).join('<br>') + '</td><td><button class="btn sm ghost" data-edit="' + v.id + '">Edit</button></td></tr>'; }).join('') +
      '</tbody></table></div><div class="card"><h3 class="card-t">' + (S.editId ? 'Edit venue' : 'Add venue') + '</h3><form class="form" id="veForm" novalidate>' +
      '<div class="row c2"><div class="f"><label>Venue name</label><input name="name" value="' + esc(e.name) + '"></div><div class="f"><label>Area</label><input name="area" value="' + esc(e.area) + '"></div></div>' +
      rows.map(function (s, i) { return '<div class="row c3"><div class="f"><label>Session ' + (i + 1) + ' day</label><select name="dow' + i + '"><option value="">—</option>' + DAYS.map(function (d, k) { return '<option value="' + k + '"' + (String(s.dow) === String(k) ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select></div><div class="f"><label>Start</label><input type="time" name="start' + i + '" value="' + s.start + '"></div><div class="f"><label>End</label><input type="time" name="end' + i + '" value="' + s.end + '"></div></div>'; }).join('') +
      '<div class="hint small muted">Leave the day blank to remove a session. Save to add another row.</div>' +
      '<div class="actions"><button class="btn" type="submit">' + (S.editId ? 'Save changes' : 'Add venue') + '</button>' + (S.editId ? '<button class="btn ghost" type="button" data-act="cancel-edit">Cancel</button>' : '') + '<span class="small" id="vErr" style="color:var(--crimson);font-weight:800"></span></div></form></div></div>';
  }
  function fmt12(t) { var p = t.split(':'), h = +p[0], m = p[1]; var ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + (m === '00' ? '' : '.' + m) + ap; }

  /* ---------- render ---------- */
  function render() {
    var app = $('#app');
    if (!S.user) { app.innerHTML = viewLogin(); return; }
    if (S.user.role === 'parent') { app.innerHTML = viewParent(); return; }
    if (S.user.role === 'finswimmer') { app.innerHTML = viewFinswimmer(); return; }
    var inner = S.tab === 'attendance' ? viewAttendance() : S.tab === 'time' ? viewTime() : S.tab === 'result' ? viewResult() : S.tab === 'remark' ? viewRemark() : S.tab === 'manage' && S.user.role === 'admin' ? viewManage() : viewSwimmers();
    app.innerHTML = shell(inner);
    if (S.tab === 'result') updatePbHint();
    if (S.tab === 'time') updateTimeHint();
  }

  function updatePbHint() {
    var f = $('#resForm'); if (!f) return;
    var sid = f.sid.value, ev = f.ev.value, t = parseTime(f.time.value), pb = bestComp(sid, ev), h = $('#pbHint');
    var place = parseInt(f.place.value, 10);
    if (!f.dataset.medalTouched) f.medal.value = place === 1 ? 'gold' : place === 2 ? 'silver' : place === 3 ? 'bronze' : '';
    if (t == null) { h.className = 'callout'; h.innerHTML = 'Current PB in ' + evName(ev) + ': <b>' + fmtTime(pb) + '</b>. Enter a time to check for a new PB.'; return; }
    if (pb == null) { h.className = 'callout pb'; h.innerHTML = '★ First competition swim in ' + evName(ev) + ' — this becomes the PB.'; return; }
    if (t < pb) { h.className = 'callout pb'; h.innerHTML = '★ New PB! ' + fmtTime(t) + ' is ' + fmtTime(pb - t) + 's faster than the previous best (' + fmtTime(pb) + ').'; }
    else { h.className = 'callout'; h.innerHTML = 'Not a PB — current best is <b>' + fmtTime(pb) + '</b> (' + fmtTime(t - pb) + 's off).'; }
  }
  function updateTimeHint() {
    var f = $('#timeForm'); if (!f) return;
    var sid = f.sid.value, ev = f.ev.value, t = parseTime(f.time.value), tb = bestTrain(sid, ev), pb = bestComp(sid, ev), h = $('#tHint');
    var base = 'Training best: <b>' + fmtTime(tb) + '</b> · Competition PB: <b>' + fmtTime(pb) + '</b>';
    if (t != null && (tb == null || t < tb)) { h.className = 'callout pb'; h.innerHTML = '★ New training best! ' + base; } else { h.className = 'callout'; h.innerHTML = base; }
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-demo],[data-act],[data-tab],[data-child],[data-open],[data-go],[data-sub],[data-edit],[data-del],[data-scope],[data-remfilter],[data-editrem],[data-delrem],[data-reply]');
    if (!el) return;
    if (el.dataset.demo) { var u = findUser(el.dataset.demo); if (u) login(u); return; }
    if (el.dataset.scope) { S.filter.mine = el.dataset.scope !== 'all'; render(); return; }
    if (el.dataset.tab) { S.tab = el.dataset.tab; S.viewSwimmer = null; S.editId = null; S.prefill = {}; render(); window.scrollTo(0, 0); return; }
    if (el.dataset.child) { S.childId = el.dataset.child; S.calMonth = null; S.editRemark = null; S.replyTo = null; render(); return; }
    if (el.dataset.remfilter) { S.remFilter = el.dataset.remfilter; render(); return; }
    if (el.dataset.editrem) { S.editRemark = el.dataset.editrem; S.replyTo = null; render(); var rf = $('#cardRemForm'); if (rf) rf.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (el.dataset.delrem) { var rr = db.remarks.filter(function (x) { return x.id === el.dataset.delrem; })[0]; if (!ownsRemark(rr) || !confirm('Delete this remark?')) return; db.remarks = db.remarks.filter(function (x) { return x.id !== rr.id; }); if (S.editRemark === rr.id) S.editRemark = null; save(); render(); toast('Remark deleted'); return; }
    if (el.dataset.reply) { S.replyTo = el.dataset.reply; S.editRemark = null; render(); var rp = $('#replyForm'); if (rp) rp.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (el.dataset.open) { S.viewSwimmer = el.dataset.open; S.calMonth = null; render(); window.scrollTo(0, 0); return; }
    if (el.dataset.go) { S.tab = el.dataset.go; S.prefill = { sid: el.dataset.sid }; render(); window.scrollTo(0, 0); return; }
    if (el.dataset.sub) { S.manage = el.dataset.sub; S.editId = null; render(); return; }
    if (el.dataset.edit) { S.editId = el.dataset.edit; render(); var fm = $('form'); if (fm) fm.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (el.dataset.del) { if (!confirm('Delete this entry?')) return; db[el.dataset.del] = db[el.dataset.del].filter(function (x) { return x.id !== el.dataset.id; }); save(); render(); toast('Deleted — PBs recalculated'); return; }
    var a = el.dataset.act;
    if (a === 'home') { e.preventDefault(); if (S.user) { S.tab = homeTab(S.user.role); S.viewSwimmer = null; render(); } }
    else if (a === 'logout') logout();
    else if (a === 'reset') { if (confirm('Reset all demo data to the original examples? Any changes you made will be lost.')) { db = TP.reset(); S.att = null; S.calMonth = null; S.editId = null; S.prefill = {}; S.editRemark = null; S.replyTo = null; S.remFilter = 'all'; if (S.user && !findUser(S.user.email)) S.user = null; render(); toast('Demo data reset'); } }
    else if (a === 'back') { S.viewSwimmer = null; render(); }
    else if (a === 'cal-prev' || a === 'cal-next') { var m = S.calMonth, d = new Date(m[0], m[1] + (a === 'cal-next' ? 1 : -1), 1); S.calMonth = [d.getFullYear(), d.getMonth()]; render(); }
    else if (a === 'att-all' || a === 'att-none') { $$('[data-mark]').forEach(function (c) { S.att.marks[c.dataset.mark] = a === 'att-all'; }); render(); }
    else if (a === 'att-save') {
      var A = S.att, ex = db.attendance.filter(function (x) { return x.date === A.date && x.venueId === A.venueId; })[0];
      var marks = {}; $$('[data-mark]').forEach(function (c) { marks[c.dataset.mark] = c.checked; });
      var sl = slotFor(A.venueId, A.date), slot = sl ? sl.start + '–' + sl.end : 'Extra session';
      if (ex) { ex.marks = marks; ex.slot = slot; } else db.attendance.push({ id: TP.newId('a'), date: A.date, venueId: A.venueId, slot: slot, marks: marks, coachId: S.user.id });
      save(); var n = Object.keys(marks).filter(function (k) { return marks[k]; }).length; toast('Attendance saved — ' + n + ' present'); A.marks = null; render();
    }
    else if (a === 'cancel-edit') { S.editId = null; render(); }
    else if (a === 'cancel-rem') { S.editRemark = null; render(); }
    else if (a === 'cancel-reply') { S.replyTo = null; render(); }
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-mark]')) { S.att.marks[t.dataset.mark] = t.checked; render(); return; }
    if (t.id === 'ad' || t.id === 'av') { S.att.date = $('#ad').value || todayISO(); S.att.venueId = $('#av').value; S.att.marks = null; render(); return; }
    if (t.id === 'aall') { S.att.showAll = t.checked; render(); return; }
    if (t.id === 'fv') { S.filter.venue = t.value; render(); return; }
    if (t.id === 'fg') { S.filter.group = t.value; render(); return; }
    if (t.matches('.chk input')) { t.closest('.chk').classList.toggle('on', t.checked); return; }
    if (t.id === 'ts' || t.id === 'rs') { var f = t.form; var keep = { sid: t.value, time: f.time.value, date: f.date.value }; if (f.comp) { keep.comp = f.comp.value; keep.place = f.place.value; } var sw0 = sw(t.value); keep.ev = sw0.events[0]; S.prefill = keep; render(); return; }
    if (t.id === 'te' || t.id === 're') { updatePbHint(); updateTimeHint(); return; }
    if (t.id === 'rm') { t.form.dataset.medalTouched = '1'; return; }
  });
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'fq') { S.filter.q = t.value; var pos = t.selectionStart; render(); var n = $('#fq'); n.focus(); n.setSelectionRange(pos, pos); return; }
    if (t.form && t.form.id === 'resForm') updatePbHint();
    if (t.form && t.form.id === 'timeForm') updateTimeHint();
  });

  document.addEventListener('submit', function (e) {
    var f = e.target; e.preventDefault();
    function err(id, m) { var x = $('#' + id); if (x) x.textContent = m; }
    function vals(name) { return $$('input[name="' + name + '"]:checked', f).map(function (c) { return c.value; }); }
    if (f.id === 'loginForm') {
      var u = findUser(f.email.value);
      if (!u || f.password.value !== DEMO_PASSWORD) { err('loginErr', 'Email or password not recognised. Use a demo button, or password ' + DEMO_PASSWORD + '.'); return; }
      login(u); return;
    }
    if (f.id === 'timeForm') {
      var t = parseTime(f.time.value); if (t == null) { err('tErr', 'Enter a time like 34.52 or 1:05.30'); f.time.focus(); return; }
      if (!f.date.value) { err('tErr', 'Pick a date'); return; }
      var prev = bestTrain(f.sid.value, f.ev.value);
      db.times.push({ id: TP.newId('t'), swimmerId: f.sid.value, event: f.ev.value, time: t, date: f.date.value, coachId: S.user.id, note: f.note.value });
      save(); S.prefill = { sid: f.sid.value, ev: f.ev.value, date: f.date.value };
      render(); toast(prev == null || t < prev ? '★ New training best for ' + fullName(sw(f.sid.value)) + ': ' + fmtTime(t) : 'Training time saved', prev == null || t < prev); return;
    }
    if (f.id === 'resForm') {
      var tt = parseTime(f.time.value), place = parseInt(f.place.value, 10);
      if (!f.comp.value.trim()) { err('rErr', 'Enter the competition name'); f.comp.focus(); return; }
      if (tt == null) { err('rErr', 'Enter a time like 36.80 or 1:12.40'); f.time.focus(); return; }
      if (!f.date.value) { err('rErr', 'Pick a date'); return; }
      var pbBefore = bestComp(f.sid.value, f.ev.value);
      var r = { id: TP.newId('r'), swimmerId: f.sid.value, competition: f.comp.value.trim(), date: f.date.value, event: f.ev.value, time: tt, place: isNaN(place) ? null : place, medal: f.medal.value };
      db.results.push(r); save();
      var isPB = pbFlags(r.swimmerId)[r.id];
      S.prefill = { sid: f.sid.value, ev: f.ev.value, comp: r.competition, date: r.date };
      render(); toast(isPB === 'pb' ? '★ New PB for ' + fullName(sw(r.swimmerId)) + ' — ' + evName(r.event) + ' ' + fmtTime(tt) : isPB === 'first' ? 'Result saved — first ' + evName(r.event) + ' PB set' : 'Result saved' + (pbBefore != null ? ' (PB stays ' + fmtTime(pbBefore) + ')' : ''), !!isPB); return;
    }
    if (f.id === 'cardRemForm') {
      var ctxt = f.text.value.trim();
      if (!ctxt) { err('crErr', 'Write a remark'); return; }
      if (!canWriteRemark(f.dataset.sid)) return;
      if (f.dataset.id) {
        var mine = db.remarks.filter(function (x) { return x.id === f.dataset.id; })[0];
        if (!ownsRemark(mine)) return;
        mine.text = ctxt; mine.type = f.type.value; S.editRemark = null; toast('Remark updated');
      } else {
        db.remarks.push({ id: TP.newId('m'), swimmerId: f.dataset.sid, date: todayISO(), authorRole: S.user.role, authorId: S.user.role === 'finswimmer' ? (S.user.swimmerId || S.user.id) : S.user.id, authorName: S.user.name, type: f.type.value, text: ctxt, improve: '', replies: [] });
        toast('Remark posted');
      }
      save(); render(); return;
    }
    if (f.id === 'replyForm') {
      var rtxt = f.text.value.trim(); if (!rtxt || !canReplyRemark()) return;
      var target = db.remarks.filter(function (x) { return x.id === f.dataset.rid; })[0]; if (!target) return;
      target.replies = target.replies || [];
      target.replies.push({ id: TP.newId('y'), date: todayISO(), authorRole: S.user.role === 'admin' ? 'coach' : S.user.role, authorId: S.user.id, authorName: S.user.name, text: rtxt });
      S.replyTo = null; save(); render(); toast('Reply posted'); return;
    }
    if (f.id === 'remForm') {
      if (!f.text.value.trim() && !f.improve.value.trim()) { err('mErr', 'Write a remark or something to improve'); return; }
      db.remarks.push({ id: TP.newId('m'), swimmerId: f.sid.value, date: f.date.value || todayISO(), coachId: S.user.id, authorRole: 'coach', authorId: S.user.id, authorName: S.user.name, type: '', text: f.text.value.trim(), improve: f.improve.value.trim(), replies: [] });
      save(); S.prefill = { sid: f.sid.value }; render(); toast('Remark saved — parents can see it now'); return;
    }
    if (f.id === 'swForm') {
      if (!f.first.value.trim() || !f.last.value.trim() || !f.dob.value) { err('swErr', 'Name and date of birth are required'); return; }
      var sem = f.email.value.trim().toLowerCase();
      if (sem && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(sem)) { err('swErr', 'Enter a valid swimmer login email, or leave it blank'); return; }
      if (sem) { var taken = findUser(sem); if (taken && !(taken.role === 'finswimmer' && taken.id === S.editId)) { err('swErr', 'That email is already used by another account'); return; } }
      var data = { first: f.first.value.trim(), last: f.last.value.trim(), dob: f.dob.value, gender: f.gender.value, group: f.group.value, venueIds: vals('venueIds'), coachIds: vals('coachIds'), events: vals('events'), email: sem };
      if (S.editId) { Object.assign(sw(S.editId), data); toast('Swimmer updated'); } else { data.id = TP.newId('s'); db.swimmers.push(data); toast('Swimmer added'); }
      S.editId = null; save(); render(); return;
    }
    if (f.id === 'parForm') {
      var em = f.email.value.trim().toLowerCase();
      if (!f.name.value.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { err('pErr', 'Name and a valid email are required'); return; }
      var clash = findUser(em); if (clash && !(clash.role === 'parent' && clash.id === S.editId)) { err('pErr', 'That email is already used by another account'); return; }
      var pd = { name: f.name.value.trim(), email: em, phone: f.phone.value.trim(), swimmerIds: vals('swimmerIds') };
      if (S.editId) { Object.assign(db.parents.filter(function (p) { return p.id === S.editId; })[0], pd); toast('Parent updated'); } else { pd.id = TP.newId('p'); db.parents.push(pd); toast('Parent added — they can sign in with ' + DEMO_PASSWORD + ' in this demo'); }
      S.editId = null; save(); render(); return;
    }
    if (f.id === 'coForm') {
      var ce = f.email.value.trim().toLowerCase();
      if (!f.name.value.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ce)) { err('cErr', 'Name and a valid email are required'); return; }
      var cc = findUser(ce); if (cc && !(cc.role === 'coach' && cc.id === S.editId)) { err('cErr', 'That email is already used by another account'); return; }
      var cd = { name: f.name.value.trim(), email: ce, venueIds: vals('venueIds') };
      var cid = S.editId, want = vals('swimmerIds');
      if (cid) { Object.assign(db.coaches.filter(function (p) { return p.id === cid; })[0], cd); toast('Coach updated'); }
      else { cid = cd.id = TP.newId('c'); db.coaches.push(cd); toast('Coach added'); }
      db.swimmers.forEach(function (s) {
        s.coachIds = coachIdsOf(s).filter(function (id) { return id !== cid; });
        if (want.indexOf(s.id) >= 0) s.coachIds.push(cid);
      });
      S.editId = null; save(); render(); return;
    }
    if (f.id === 'veForm') {
      if (!f.name.value.trim()) { err('vErr', 'Venue name is required'); return; }
      var slots = [];
      for (var i = 0; f['dow' + i]; i++) { if (f['dow' + i].value !== '' && f['start' + i].value && f['end' + i].value) slots.push({ dow: +f['dow' + i].value, start: f['start' + i].value, end: f['end' + i].value }); }
      var vd = { name: f.name.value.trim(), area: f.area.value.trim(), slots: slots };
      if (S.editId) { Object.assign(db.venues.filter(function (p) { return p.id === S.editId; })[0], vd); toast('Venue updated'); } else { vd.id = TP.newId('v'); db.venues.push(vd); toast('Venue added'); }
      S.editId = null; save(); render(); return;
    }
  });

  // restore session
  try { var su = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); if (su) { var fu = findUser(su.email); if (fu) { S.user = fu; S.tab = homeTab(fu.role); } } } catch (e) { }
  window.TPApp = { state: S, render: render, login: function (email) { var u = findUser(email); if (u) login(u); return !!u; } };
  render();
})();
