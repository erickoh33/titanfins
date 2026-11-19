/* Titan Members' Portal — PREVIEW mock data store (example data only, no backend). */
(function () {
  'use strict';
  var KEY = 'titanPortalDemo.v9';
  var VERSION = 13;

  var EVENTS = [
    { id: '50BF', name: '50m Bifins', kind: 'Bifins' },
    { id: '100BF', name: '100m Bifins', kind: 'Bifins' },
    { id: '200BF', name: '200m Bifins', kind: 'Bifins' },
    { id: '400BF', name: '400m Bifins', kind: 'Bifins' },
    { id: '800BF', name: '800m Bifins', kind: 'Bifins' },
    { id: '1500BF', name: '1500m Bifins', kind: 'Bifins' },
    { id: '50SF', name: '50m Surface', kind: 'Surface' },
    { id: '100SF', name: '100m Surface', kind: 'Surface' },
    { id: '200SF', name: '200m Surface', kind: 'Surface' },
    { id: '400SF', name: '400m Surface', kind: 'Surface' },
    { id: '800SF', name: '800m Surface', kind: 'Surface' },
    { id: '1500SF', name: '1500m Surface', kind: 'Surface' },
    { id: '100IM', name: '100m Immersion', kind: 'Immersion' },
    { id: '200IM', name: '200m Immersion', kind: 'Immersion' },
    { id: '50AP', name: '50m Apnea', kind: 'Apnea' }
  ];

  function rng(seed) { // mulberry32
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function iso(d) { var m = d.getMonth() + 1, day = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day; }
  function r2(x) { return Math.round(x * 100) / 100; }

  function seed() {
    var R = rng(20261119);
    var uid = 0; function id(p) { uid++; return p + uid; }

    var venues = [
      { id: 'v1', name: 'Section 51A PJ', area: 'Petaling Jaya', slots: [{ dow: 1, start: '19:00', end: '21:00' }, { dow: 6, start: '18:30', end: '20:30' }] },
      { id: 'v2', name: 'UPSI Tanjung Malim', area: 'Tanjung Malim', slots: [{ dow: 2, start: '16:30', end: '18:30' }] },
      { id: 'v3', name: 'KSAS Shah Alam', area: 'Shah Alam', slots: [{ dow: 5, start: '20:30', end: '22:30' }] },
      { id: 'v4', name: 'TARUMT KL', area: 'Kuala Lumpur', slots: [{ dow: 0, start: '12:00', end: '14:00' }] }
    ];
    var coaches = [
      { id: 'c1', name: 'Coach Kilian', email: 'coach@example.com', venueIds: ['v1', 'v3', 'v4'] },
      { id: 'c2', name: 'Coach Farah (example)', email: 'farah@example.com', venueIds: ['v2', 'v1'] }
    ];
    var admins = [{ id: 'a1', name: 'Club Admin', email: 'admin@example.com' }];

    // Fictional example swimmers. base = approx race time (s) in early August; imp = fractional improvement by mid-Nov.
    var defs = [
      { first: 'Mia', last: 'Tan', dob: '2016-03-14', gender: 'F', group: 'Junior', venueIds: ['v1'], coachIds: ['c1'], email: 'swimmer@example.com', rel: .9, base: { '50SF': 34.2, '100SF': 76.8, '50BF': 38.6 }, imp: .045 },
      { first: 'Ethan', last: 'Tan', dob: '2013-07-02', gender: 'M', group: 'Development', venueIds: ['v1', 'v3'], coachIds: ['c1'], rel: .82, base: { '100BF': 79.4, '200BF': 172.8, '50AP': 22.7 }, imp: .03 },
      { first: 'Nur Aisyah', last: 'Rahman', dob: '2012-05-21', gender: 'F', group: 'Performance', venueIds: ['v1', 'v4'], coachIds: ['c1'], rel: .94, base: { '50SF': 23.5, '100SF': 52.1, '200SF': 118.4, '400SF': 268.4 }, imp: .025 },
      { first: 'Haziq', last: 'Iskandar', dob: '2011-12-30', gender: 'M', group: 'Performance', venueIds: ['v3', 'v1'], coachIds: ['c1'], rel: .88, base: { '50SF': 21.7, '100SF': 48.3, '200SF': 110.6, '50AP': 19.9 }, imp: .022 },
      { first: 'Chloe', last: 'Lim', dob: '2018-01-09', gender: 'F', group: 'Junior', venueIds: ['v4'], coachIds: ['c2'], rel: .8, base: { '50BF': 46.2, '100BF': 102.5 }, imp: .06 },
      { first: 'Arjun', last: 'Nair', dob: '2015-09-17', gender: 'M', group: 'Junior', venueIds: ['v2'], coachIds: ['c2'], rel: .86, base: { '50BF': 36.1, '100BF': 80.7, '200BF': 176.2 }, imp: .05 },
      { first: 'Sofia', last: 'Wong', dob: '2014-02-25', gender: 'F', group: 'Development', venueIds: ['v1', 'v4'], coachIds: ['c2'], rel: .9, base: { '50SF': 27.6, '100SF': 61.2, '100BF': 75.3, '200BF': 165.4 }, imp: .035 },
      { first: 'Daniel', last: 'Chong', dob: '2012-12-04', gender: 'M', group: 'Development', venueIds: ['v2', 'v3'], coachIds: ['c2'], rel: .78, base: { '50SF': 25.6, '100SF': 56.9, '200SF': 126.8, '400SF': 275.2 }, imp: .028 }
    ];
    var swimmers = defs.map(function (d, i) {
      return { id: 's' + (i + 1), first: d.first, last: d.last, dob: d.dob, gender: d.gender, group: d.group, venueIds: d.venueIds.slice(), coachIds: (d.coachIds || []).slice(), events: Object.keys(d.base), email: d.email || '' };
    });
    var parents = [
      { id: 'p1', name: 'Jason Tan (example parent)', email: 'parent@example.com', phone: '012-000 0001', swimmerIds: ['s1', 's2'] },
      { id: 'p2', name: 'Rahman family (example)', email: 'rahman.family@example.com', phone: '012-000 0002', swimmerIds: ['s3'] },
      { id: 'p3', name: 'Iskandar family (example)', email: 'iskandar@example.com', phone: '012-000 0003', swimmerIds: ['s4'] },
      { id: 'p4', name: 'Lim family (example)', email: 'lim.family@example.com', phone: '012-000 0004', swimmerIds: ['s5'] },
      { id: 'p5', name: 'Nair family (example)', email: 'nair@example.com', phone: '012-000 0005', swimmerIds: ['s6'] },
      { id: 'p6', name: 'Wong family (example)', email: 'wong.family@example.com', phone: '012-000 0006', swimmerIds: ['s7'] },
      { id: 'p7', name: 'Chong family (example)', email: 'chong@example.com', phone: '012-000 0007', swimmerIds: ['s8'] }
    ];

    var START = new Date(2026, 7, 1), END = new Date(2026, 10, 18);
    var span = END - START;
    function frac(dt) { return Math.max(0, Math.min(1, (dt - START) / span)); }
    function expected(d, ev, dt) { return d.base[ev] * (1 - d.imp * frac(dt)); }

    // Attendance: every scheduled slot between START and END.
    var attendance = [];
    var times = [];
    var rot = {};
    for (var dt = new Date(START); dt <= END; dt.setDate(dt.getDate() + 1)) {
      venues.forEach(function (v) {
        v.slots.forEach(function (sl) {
          if (sl.dow !== dt.getDay()) return;
          var marks = {}, any = false;
          swimmers.forEach(function (s, i) {
            if (s.venueIds.indexOf(v.id) < 0) return;
            any = true;
            var present = R() < defs[i].rel;
            marks[s.id] = present;
            // Time trial roughly every 3rd attended session
            if (present && R() < 0.42) {
              var evs = s.events, ev = evs[(rot[s.id] = (rot[s.id] || 0) + 1) % evs.length];
              var t = expected(defs[i], ev, dt) * (1.025 + R() * 0.03) * (1 + (R() - .5) * 0.012);
              times.push({ id: id('t'), swimmerId: s.id, event: ev, time: r2(t), date: iso(dt), coachId: v.id === 'v2' ? 'c2' : 'c1', note: '' });
            }
          });
          if (any) attendance.push({ id: id('a'), date: iso(dt), venueId: v.id, slot: sl.start + '–' + sl.end, marks: marks, coachId: v.id === 'v2' ? 'c2' : 'c1' });
        });
      });
    }

    // Competitions (generic example names)
    var comps = [
      { name: 'Example State Meet 2026', date: new Date(2026, 7, 23), country: 'Malaysia', representing: 'KL' },
      { name: 'Example Junior Open 2026', date: new Date(2026, 8, 27), country: 'Malaysia', representing: 'Malaysia' },
      { name: 'Example Club Invitational 2026', date: new Date(2026, 10, 8), country: 'Malaysia', representing: '' }
    ];
    var results = [];
    comps.forEach(function (c, ci) {
      swimmers.forEach(function (s, i) {
        if (ci === 1 && i === 7) return; // one swimmer skipped a meet
        var evs = s.events.slice();
        var pick = [evs[ci % evs.length], evs[(ci + 1) % evs.length]];
        pick.forEach(function (ev) {
          var t = expected(defs[i], ev, c.date) * (1 + (R() - .45) * 0.018);
          var place = 1 + Math.floor(Math.pow(R(), 1.3) * 8);
          results.push({ id: id('r'), swimmerId: s.id, competition: c.name, date: iso(c.date), event: ev, time: r2(t), place: place, medal: place === 1 ? 'gold' : place === 2 ? 'silver' : place === 3 ? 'bronze' : '', record: '', representing: c.representing || '', country: c.country || 'Malaysia' });
        });
      });
    });

    var R_TXT = {
      Bifin: [
        ['Kick is getting stronger and more even between both legs.', 'Keep knees soft — kick from the hips, not the knees.\nTighter streamline off every wall.'],
        ['Great attitude in the hard sets this week.', 'Breathing pattern: hold to 3 strokes on the last 15m.\nFinish into the wall without a glide.'],
        ['Big improvement on starts — reaction off the block is quicker.', 'Keep fins together on the dive entry.\nCount kicks underwater so pacing is the same every lap.']
      ],
      Surface: [
        ['Monofin rhythm is much smoother; body wave starts from the chest now.', 'Keep the snorkel still — head is moving on each kick.\nHold the arm lock longer on turns.'],
        ['Strong second half on the 100m today.', 'Faster underwater phase after the start (aim for 15m).\nPacing: first 50 is still too fast.'],
        ['Turns are cleaner and more consistent now.', 'Arms stay locked overhead for the whole lap.\nBuild endurance: two extra 400m aerobic sets a week.']
      ],
      Apnea: [['Calm and controlled on breath-hold sets.', 'Smoother entry — less splash on the start.\nKeep the arms locked in streamline the whole length.']],
      Immersion: [['Tank handling is improving.', 'Hold the tank further forward to reduce drag.\nWork on the turn: tuck tighter.']]
    };
    R_TXT.Bifins = R_TXT.Bifin;
    var remarks = [];
    var rDates = ['2026-08-30', '2026-10-04', '2026-11-14'];
    swimmers.forEach(function (s, i) {
      var kind = EVENTS.filter(function (e) { return e.id === s.events[0]; })[0].kind;
      var pool = R_TXT[kind];
      var n = i % 3 === 0 ? 3 : 2;
      for (var k = 0; k < n; k++) {
        var t = pool[k % pool.length];
        var cid = s.venueIds[0] === 'v2' ? 'c2' : 'c1';
        var cname = (coaches.filter(function (c) { return c.id === cid; })[0] || {}).name || 'Coach';
        remarks.push({ id: id('m'), swimmerId: s.id, date: rDates[3 - n + k], coachId: cid, authorRole: 'coach', authorId: cid, authorName: cname, type: '', text: t[0], improve: t[1], replies: [] });
      }
    });

    remarks.push({ id: id('m'), swimmerId: 's1', date: '2026-11-12', authorRole: 'parent', authorId: 'p1', authorName: 'Jason Tan (example parent)', type: 'Feedback', text: 'Mia has been practising her starts at home in the mirror. Thank you for the extra work on Saturday.', improve: '', replies: [{ id: id('y'), date: '2026-11-13', authorRole: 'coach', authorId: 'c1', authorName: 'Coach Kilian', text: 'Glad it stuck — we will keep a few start reps in Saturday’s set.' }] });
    remarks.push({ id: id('m'), swimmerId: 's1', date: '2026-11-16', authorRole: 'finswimmer', authorId: 's1', authorName: 'Mia Tan', type: 'Goal', text: 'I want my 50m bifin under 37 seconds before the next meet.', improve: '', replies: [] });
    var coachThread = remarks.filter(function (r) { return r.swimmerId === 's1' && r.authorRole === 'coach' && r.date === '2026-11-14'; })[0];
    if (coachThread) coachThread.replies = [
      { id: id('y'), date: '2026-11-15', authorRole: 'parent', authorId: 'p1', authorName: 'Jason Tan (example parent)', text: 'We saw the same thing on Saturday. She was much calmer off the block.' },
      { id: id('y'), date: '2026-11-15', authorRole: 'finswimmer', authorId: 's1', authorName: 'Mia Tan', text: 'I will count the kicks underwater like you said.' },
      { id: id('y'), date: '2026-11-16', authorRole: 'coach', authorId: 'c1', authorName: 'Coach Kilian', text: 'Good. We will check the start again this Saturday.' }
    ];

    function exampleSlip(label) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="280"><rect width="100%" height="100%" fill="#f4f1ea"/><text x="28" y="54" font-family="sans-serif" font-size="22" fill="#111">EXAMPLE PAYMENT SLIP</text><text x="28" y="98" font-family="sans-serif" font-size="16" fill="#333">' + label + '</text><text x="28" y="140" font-family="sans-serif" font-size="14" fill="#666">Not a real bank receipt</text></svg>';
      return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }
    var plans = [
      { id: 'pl1', name: '1 per week', sessions: 1, amount: 150, example: true },
      { id: 'pl2', name: '2 trainings per week', sessions: 2, amount: 250, example: false },
      { id: 'pl3', name: '3 per week', sessions: 3, amount: 350, example: true }
    ];
    swimmers.forEach(function (s) { s.planId = (s.id === 's1' || s.id === 's2' || s.id === 's7') ? 'pl2' : (s.id === 's5' || s.id === 's6' || s.id === 's8') ? 'pl1' : 'pl3'; });
    function planAmt(s) { var p = plans.filter(function (x) { return x.id === s.planId; })[0]; return p ? p.amount : 180; }
    var fees = [];
    swimmers.forEach(function (s, i) {
      var amt = planAmt(s);
      [['2026-10', true], ['2026-11', false], ['2026-12', false]].forEach(function (pair) {
        var ym = pair[0], cash = pair[1];
        var mon = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][+ym.slice(5) - 1];
        fees.push({ id: id('f'), swimmerId: s.id, title: 'Monthly training fee — ' + mon + ' ' + ym.slice(0, 4), amount: amt, due: ym + '-05', cashPaid: cash ? amt : 0, rewardApplied: 0, status: cash ? 'paid' : 'unpaid', paidOn: cash ? ym + '-04' : '', method: cash ? (s.id === 's1' ? 'DuitNow' : (i % 2 ? 'Cash' : 'Bank transfer')) : '', reference: cash ? 'EXAMPLE-OCT-' + (i + 1) : '', paidBy: cash ? 'cash' : '', verifiedBy: cash && s.id === 's1' ? 'Club Admin' : '', verifiedOn: cash && s.id === 's1' ? '2026-10-05' : '' });
      });
    });
    var miaGold = results.filter(function (r) { return r.swimmerId === 's1' && r.medal === 'gold'; })[0];
    var rewards = [{ id: id('rw'), swimmerId: 's1', amount: 400, date: '2026-11-02', reason: 'Example Junior Invitational 2026 — gold medal', resultId: miaGold ? miaGold.id : '' }];
    var planRequests = [];
    var slips = [
      { id: id('ps'), swimmerId: 's1', months: ['2026-10'], amount: 250, paidOn: '2026-10-04', method: 'DuitNow', reference: 'EXAMPLE-OCT', note: 'Example verified transfer for October.', slipName: 'example-oct-slip.svg', slipHref: exampleSlip('Mia Tan · Oct 2026 · RM 250.00'), status: 'verified', verifiedBy: 'Club Admin', verifiedOn: '2026-10-05', rejectReason: '', submittedBy: 'Jason Tan (example parent)' },
      { id: id('ps'), swimmerId: 's1', months: ['2026-11'], amount: 150, paidOn: '2026-11-06', method: 'Bank transfer', reference: 'EXAMPLE-NOV', note: 'Example rejected slip.', slipName: 'example-nov-slip.svg', slipHref: exampleSlip('Mia Tan · Nov 2026 · RM 150.00'), status: 'rejected', verifiedBy: '', verifiedOn: '', rejectReason: 'Example: the amount on the slip does not match the RM 250 plan. Please re-upload.', submittedBy: 'Jason Tan (example parent)' },
      { id: id('ps'), swimmerId: 's5', months: ['2026-12'], amount: 150, paidOn: '2026-11-18', method: 'DuitNow', reference: 'EXAMPLE-DEC', note: 'Example slip waiting for the club to check.', slipName: 'example-dec-slip.svg', slipHref: exampleSlip('Chloe Lim · Dec 2026 · RM 150.00'), status: 'pending', verifiedBy: '', verifiedOn: '', rejectReason: '', submittedBy: 'Lim family (example)' }
    ];

    var competitions = [
      { id: 'k1', name: 'Example Junior Invitational 2026', start: '2026-12-06', end: '2026-12-07', venue: 'Example Aquatic Centre, Kuala Lumpur', deadline: '2026-11-28', fee: 45, notes: 'Fictional example meet — not a real competition.', country: 'Malaysia', representing: 'KL', docs: [{ name: 'Example invite (link)', href: 'https://example.com/example-junior-invite', kind: 'link' }], entries: [{ swimmerId: 's1', events: ['50SF', '100SF', '50BF'] }, { swimmerId: 's2', events: ['100BF', '200BF', '50AP'] }, { swimmerId: 's3', events: ['50SF', '100SF'] }] },
      { id: 'k2', name: 'Example Club Time Trial 2027', start: '2027-01-17', end: '2027-01-17', venue: 'Section 51A, Petaling Jaya', deadline: '2027-01-08', fee: 0, notes: 'Example in-house time trial. Not a real meet.', country: 'Malaysia', representing: '', docs: [{ name: 'Example schedule (link)', href: 'https://example.com/example-time-trial', kind: 'link' }], entries: [{ swimmerId: 's1', events: ['50SF', '50BF'] }, { swimmerId: 's5', events: ['50BF', '100BF'] }, { swimmerId: 's6', events: ['50BF', '100BF'] }] }
    ];

    var targets = [];
    ['s1', 's2'].forEach(function (sid) {
      var s = swimmers.filter(function (x) { return x.id === sid; })[0];
      s.events.forEach(function (ev, j) {
        var best = null;
        results.forEach(function (r) { if (r.swimmerId === sid && r.event === ev && (best == null || r.time < best)) best = r.time; });
        times.forEach(function (t) { if (t.swimmerId === sid && t.event === ev && (best == null || t.time < best)) best = t.time; });
        if (best == null) return;
        targets.push({ id: id('g'), swimmerId: sid, event: ev, time: r2(j === 0 ? best * 1.015 : best * 0.985), editedBy: 'Jason Tan (example parent)', editedOn: '2026-11-01' });
      });
    });

    function qtBase(ev) { return ({ '50SF': 32, '100SF': 72, '200SF': 160, '400SF': 340, '800SF': 720, '1500SF': 1400, '50BF': 36, '100BF': 82, '200BF': 180, '400BF': 390, '800BF': 820, '1500BF': 1600, '100IM': 70, '200IM': 155, '50AP': 28 })[ev] || 40; }
    var qtTables = [
      { id: 'q1', name: 'Example State QT 2026', note: 'Fictional example standards — not real qualifying times.', rows: [] },
      { id: 'q2', name: 'Example National QT 2026', note: 'Fictional example standards, stricter than the state example. Not real.', rows: [] },
      { id: 'q3', name: 'Example CMAS QT 2026', note: 'Fictional example CMAS cut. Not a real CMAS qualifying time.', rows: [] }
    ];
    EVENTS.forEach(function (e) {
      ['F', 'M'].forEach(function (g) {
        [[8, 11], [12, 14], [15, 18]].forEach(function (ag) {
          var state = qtBase(e.id) * (g === 'F' ? 1.05 : 1) * (ag[0] === 8 ? 1.1 : ag[0] === 12 ? 1 : 0.93);
          qtTables[0].rows.push({ event: e.id, gender: g, ageMin: ag[0], ageMax: ag[1], time: r2(state) });
          qtTables[1].rows.push({ event: e.id, gender: g, ageMin: ag[0], ageMax: ag[1], time: r2(state * 0.9) });
          qtTables[2].rows.push({ event: e.id, gender: g, ageMin: ag[0], ageMax: ag[1], time: r2(state * 0.78) });
        });
      });
    });

    var pbs = [];
    ['s1', 's2'].forEach(function (sid) {
      var s = swimmers.filter(function (x) { return x.id === sid; })[0];
      s.events.forEach(function (ev, j) {
        var best = null;
        results.forEach(function (r) { if (r.swimmerId === sid && r.event === ev && (best == null || r.time < best)) best = r.time; });
        if (best == null) return;
        var cur = r2(best * (j === 0 ? 1.012 : 0.99));
        pbs.push({ id: id('pb'), swimmerId: sid, event: ev, time: cur, date: '2026-10-18', note: 'Example PB entered by the coach.', editedBy: 'Coach Kilian', history: [{ time: cur, date: '2026-10-18', note: 'Example PB entered by the coach.' }] });
      });
    });
    results.forEach(function (r) {
      var newer = results.some(function (o) { return o !== r && o.swimmerId === r.swimmerId && o.event === r.event && o.date > r.date; });
      if (!newer && (r.swimmerId === 's1' || r.swimmerId === 's2')) r.note = 'Example — imported from results PDF';
    });

    function setRate(sid, ym, rate) {
      var list = attendance.filter(function (a) { return Object.prototype.hasOwnProperty.call(a.marks, sid) && a.date.slice(0, 7) === ym; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      var keep = Math.round(list.length * rate);
      list.forEach(function (a, i) { a.marks[sid] = i < keep; });
    }
    ['2026-08', '2026-09', '2026-10'].forEach(function (m) { setRate('s1', m, 1); });
    setRate('s1', '2026-11', 0.8);
    setRate('s2', '2026-08', 0.7);
    setRate('s2', '2026-09', 1);
    setRate('s2', '2026-10', 0.92);
    setRate('s2', '2026-11', 0.6);
    var extraDay = new Date(2026, 0, 4);
    var extraN = 0;
    while (extraN < 56 && extraDay < new Date(2026, 7, 1)) {
      attendance.push({ id: id('a'), date: iso(extraDay), venueId: 'v1', slot: '09:00–10:00', marks: { s1: true }, coachId: 'c1' });
      extraN++;
      extraDay.setDate(extraDay.getDate() + 4);
    }
    results.push({ id: id('r'), swimmerId: 's1', competition: 'Example Singapore Invitational 2026', date: '2026-10-12', event: '50SF', time: 34.9, place: 4, medal: '', record: '', representing: 'Malaysia', country: 'Singapore', note: 'Example — imported from results PDF' });
    results.push({ id: id('r'), swimmerId: 's1', competition: 'Example Junior Open 2026', date: '2026-09-27', event: '800SF', time: 748.2, place: 5, medal: '', record: '', representing: 'Malaysia', country: 'Malaysia', note: 'Example distance swim' });
    function clearMedals(sid) { results.forEach(function (r) { if (r.swimmerId === sid) { r.medal = ''; r.record = ''; } }); }
    clearMedals('s1'); clearMedals('s2');
    var miaRes = results.filter(function (r) { return r.swimmerId === 's1'; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var early = miaRes.filter(function (r) { return r.date < '2026-09-01'; })[0];
    var mid = miaRes.filter(function (r) { return r.date >= '2026-09-01' && r.date < '2026-11-01'; })[0];
    var late = miaRes.filter(function (r) { return r.date >= '2026-11-01'; })[0];
    if (early) early.medal = 'bronze';
    if (mid) mid.medal = 'silver';
    if (late) { late.medal = 'gold'; late.record = 'state'; }
    var eth = results.filter(function (r) { return r.swimmerId === 's2'; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (eth[0]) eth[0].medal = 'silver';
    if (eth[1]) eth[1].medal = 'bronze';
    var ethAp = eth.filter(function (r) { return r.event === '50AP'; }).pop();
    if (ethAp) ethAp.record = 'national';
    function setPb(sid, ev, prev, prevDate, cur, curDate) {
      var p = pbs.filter(function (x) { return x.swimmerId === sid && x.event === ev; })[0];
      if (!p) { p = { id: id('pb'), swimmerId: sid, event: ev, editedBy: 'Coach Kilian' }; pbs.push(p); }
      p.time = cur; p.date = curDate; p.note = 'Example PB entered by the coach.'; p.editedBy = 'Coach Kilian';
      p.history = [{ time: prev, date: prevDate, note: 'Earlier PB' }, { time: cur, date: curDate, note: 'Example PB entered by the coach.' }];
    }
    setPb('s1', '50SF', 36.8, '2026-09-12', 35.2, '2026-11-08');
    setPb('s2', '100BF', 80.4, '2026-10-02', 79.9, '2026-11-04');
    setPb('s2', '50AP', 24.1, '2026-09-20', 23.4, '2026-10-18');
    var miaTarget = targets.filter(function (t) { return t.swimmerId === 's1' && t.event === '50SF'; })[0];
    if (miaTarget) miaTarget.time = 36;
    var ethTarget = targets.filter(function (t) { return t.swimmerId === 's2' && t.event === '100BF'; })[0];
    if (ethTarget) ethTarget.time = 80.5;

    function exThumb(label) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="#141414"/><rect width="14" height="100%" fill="#CE0037"/><text x="40" y="168" fill="#ffffff" font-family="sans-serif" font-size="30">' + label + '</text><text x="40" y="210" fill="#CE0037" font-family="sans-serif" font-size="16">EXAMPLE — not a real photo</text></svg>';
      return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }
    var exercises = [
      { id: 'ex1', title: 'Streamline hold', category: 'Dryland', level: 'Beginner', cues: 'Lock the hands, ribs in, squeeze the glutes. Example clip — not a real video.', duration: '30 seconds', reps: '4', kind: 'link', src: 'https://www.youtube.com/watch?v=example-streamline-hold', name: 'Example YouTube link', thumb: exThumb('Streamline hold') },
      { id: 'ex2', title: 'Hip-driven bifin kick', category: 'Kick drills', level: 'Intermediate', cues: 'Kick from the hips. Knees stay soft. Example clip — not a real video.', duration: '25 metres', reps: '8', kind: 'link', src: 'https://www.youtube.com/watch?v=example-bifin-kick', name: 'Example YouTube link', thumb: exThumb('Bifin kick') },
      { id: 'ex3', title: 'Block start sequence', category: 'Starts & turns', level: 'Pre-Comp', cues: 'Track the back foot, drive the hips forward, then lock the streamline. Example clip — not a real video.', duration: '', reps: '6', kind: 'link', src: 'https://www.youtube.com/watch?v=example-block-start', name: 'Example YouTube link', thumb: exThumb('Block start') },
      { id: 'ex4', title: 'Breath-hold comfort', category: 'Apnea', level: 'Beginner', cues: 'Sit tall, relax the shoulders, and stop if it feels sharp. Example photo only.', duration: '20 seconds', reps: '4', kind: 'image', src: exThumb('Breath-hold'), name: 'Example photo', thumb: exThumb('Breath-hold') },
      { id: 'ex5', title: 'Shoulder openers', category: 'Stretching', level: 'Beginner', cues: 'Slow circles, then a gentle doorway stretch. Example Drive link — not a real file.', duration: '8 minutes', reps: '', kind: 'link', src: 'https://drive.google.com/file/d/example-shoulder-openers/view', name: 'Example Drive link', thumb: exThumb('Shoulder openers') },
      { id: 'ex6', title: 'Monofin body wave', category: 'Technique', level: 'Intermediate', cues: 'The wave starts at the chest, not the knees. Example clip — not a real video.', duration: '10 minutes', reps: '', kind: 'link', src: 'https://www.youtube.com/watch?v=example-body-wave', name: 'Example YouTube link', thumb: exThumb('Body wave') },
      { id: 'ex7', title: 'Turn tuck', category: 'Starts & turns', level: 'Intermediate', cues: 'Chin to chest, heels to the seat, then plant the feet. Example photo only.', duration: '', reps: '8', kind: 'image', src: exThumb('Turn tuck'), name: 'Example photo', thumb: exThumb('Turn tuck') },
      { id: 'ex8', title: 'Core hollow hold', category: 'Dryland', level: 'Pre-Comp', cues: 'Lower back stays on the floor. Example clip — not a real video.', duration: '20 seconds', reps: '5', kind: 'link', src: 'https://www.youtube.com/watch?v=example-hollow-hold', name: 'Example YouTube link', thumb: exThumb('Hollow hold') }
    ];

    var media = [
      { id: 'md1', swimmerIds: ['s1', 's2'], date: '2026-11-08', event: 'Training', caption: 'Example: kick set at Section 51A', comment: 'Mia — keep the knees soft on the bifin kick.', kind: 'image', src: '../assets/web/gal1.webp', name: 'gal1.webp' },
      { id: 'md2', swimmerIds: ['s1'], date: '2026-10-18', event: '50m Surface', caption: 'Example: Mia streamline off the wall', comment: 'Hold the streamline a beat longer off each wall.', kind: 'image', src: '../assets/web/prog1.webp', name: 'prog1.webp' },
      { id: 'md3', swimmerIds: ['s1'], date: '2026-09-27', event: 'Example Junior Open 2026', caption: 'Example: Mia at the Junior Open', comment: 'Example meet clip — not a real video.', kind: 'link', src: 'https://www.youtube.com/watch?v=example-mia-junior-open', name: 'Example YouTube link' },
      { id: 'md4', swimmerIds: ['s2'], date: '2026-11-08', event: 'Example Club Invitational 2026', caption: 'Example: Ethan 100m bifins', comment: 'Example race photo.', kind: 'image', src: '../assets/web/gal2.webp', name: 'gal2.webp' },
      { id: 'md5', swimmerIds: ['s2'], date: '2026-10-12', event: '50m Apnea', caption: 'Example: Ethan apnea start', comment: 'Example training clip — not a real video.', kind: 'link', src: 'https://www.youtube.com/watch?v=example-ethan-apnea', name: 'Example YouTube link' }
    ];

    return { version: VERSION, events: EVENTS, venues: venues, coaches: coaches, admins: admins, swimmers: swimmers, parents: parents, attendance: attendance, times: times, results: results, remarks: remarks, plans: plans, planRequests: planRequests, allowPlanRequests: true, rewards: rewards, fees: fees, slips: slips, competitions: competitions, targets: targets, pbs: pbs, qtTables: qtTables, exercises: exercises, media: media, nextId: uid + 1 };
  }

  var db = null;
  function load() {
    try { db = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { db = null; }
    if (!db || db.version !== VERSION) { db = seed(); save(); }
    return db;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* storage unavailable: keep in memory */ } }
  function reset() { db = seed(); save(); return db; }
  function newId(p) { db.nextId = (db.nextId || 1000) + 1; return p + db.nextId; }

  window.TP = { load: load, save: save, reset: reset, newId: newId, get db() { return db; }, EVENTS: EVENTS, KEY: KEY };
})();
