/* Titan Members' Portal — PREVIEW mock data store (example data only, no backend). */
(function () {
  'use strict';
  var KEY = 'titanPortalDemo.v3';
  var VERSION = 6;

  var EVENTS = [
    { id: '50SF', name: '50m Surface', kind: 'Surface' },
    { id: '100SF', name: '100m Surface', kind: 'Surface' },
    { id: '200SF', name: '200m Surface', kind: 'Surface' },
    { id: '400SF', name: '400m Surface', kind: 'Surface' },
    { id: '50BF', name: '50m Bifin', kind: 'Bifin' },
    { id: '100BF', name: '100m Bifin', kind: 'Bifin' },
    { id: '200BF', name: '200m Bifin', kind: 'Bifin' },
    { id: '50AP', name: '50m Apnea', kind: 'Apnea' },
    { id: '100IM', name: '100m Immersion', kind: 'Immersion' }
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
      { first: 'Mia', last: 'Tan', dob: '2016-03-14', gender: 'F', group: 'Junior', venueIds: ['v1'], coachIds: ['c1'], email: 'swimmer@example.com', rel: .9, base: { '50BF': 38.6, '100BF': 86.4, '50SF': 34.2 }, imp: .045 },
      { first: 'Ethan', last: 'Tan', dob: '2013-07-02', gender: 'M', group: 'Development', venueIds: ['v1', 'v3'], coachIds: ['c1'], rel: .82, base: { '50SF': 24.9, '100SF': 55.6, '200SF': 125.4, '50AP': 22.7 }, imp: .03 },
      { first: 'Nur Aisyah', last: 'Rahman', dob: '2012-05-21', gender: 'F', group: 'Performance', venueIds: ['v1', 'v4'], coachIds: ['c1'], rel: .94, base: { '50SF': 23.5, '100SF': 52.1, '400SF': 268.4, '100IM': 50.6 }, imp: .025 },
      { first: 'Haziq', last: 'Iskandar', dob: '2011-12-30', gender: 'M', group: 'Performance', venueIds: ['v3', 'v1'], coachIds: ['c1'], rel: .88, base: { '50SF': 21.7, '100SF': 48.3, '200SF': 110.6, '50AP': 19.9 }, imp: .022 },
      { first: 'Chloe', last: 'Lim', dob: '2018-01-09', gender: 'F', group: 'Junior', venueIds: ['v4'], coachIds: ['c2'], rel: .8, base: { '50BF': 46.2, '100BF': 102.5 }, imp: .06 },
      { first: 'Arjun', last: 'Nair', dob: '2015-09-17', gender: 'M', group: 'Junior', venueIds: ['v2'], coachIds: ['c2'], rel: .86, base: { '50BF': 36.1, '100BF': 80.7, '50SF': 32.1 }, imp: .05 },
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
      { name: 'Example State Meet 2026', date: new Date(2026, 7, 23) },
      { name: 'Example Junior Open 2026', date: new Date(2026, 8, 27) },
      { name: 'Example Club Invitational 2026', date: new Date(2026, 10, 8) }
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
          results.push({ id: id('r'), swimmerId: s.id, competition: c.name, date: iso(c.date), event: ev, time: r2(t), place: place, medal: place === 1 ? 'gold' : place === 2 ? 'silver' : place === 3 ? 'bronze' : '' });
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

    return { version: VERSION, events: EVENTS, venues: venues, coaches: coaches, admins: admins, swimmers: swimmers, parents: parents, attendance: attendance, times: times, results: results, remarks: remarks, nextId: uid + 1 };
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
