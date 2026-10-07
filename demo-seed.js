/*
 * Lektoria live demo — fictional seed data.
 *
 * Runs before the app boots. If this browser has no Lektoria data yet (or the
 * URL carries ?reset-demo), it writes a believable term's worth of work for a
 * Spanish teacher: three classes, students, assignments, marks, homework, a
 * test and a retake. Every person here is invented.
 *
 * Dates are generated relative to today, so the demo never goes stale: some
 * work is marked, some is waiting to be marked, some is still upcoming.
 */
(function () {
  var KEY = 'lektoria-data';
  var reset = /[?&]reset-demo\b/.test(location.search);
  try {
    if (localStorage.getItem(KEY) && !reset) return;
  } catch (e) {
    return; // storage blocked: the app falls back to empty data
  }

  // Deterministic randomness, so every visitor sees the same class.
  var seed = 20251122;
  function rnd() {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  }
  function pick(list) {
    return list[Math.floor(rnd() * list.length)];
  }

  var DAY = 86400000;
  var now = new Date();
  function iso(offsetDays) {
    return new Date(now.getTime() + offsetDays * DAY).toISOString();
  }
  function day(offsetDays) {
    return iso(offsetDays).slice(0, 10);
  }
  // The academic year turns over in August, as in the app.
  var startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  var academicYear = startYear + '-' + (startYear + 1);
  var yearLabel = startYear + '/' + String(startYear + 1).slice(2);
  var created = iso(-60);

  var FIRST = [
    'Alva', 'Elsa', 'Maja', 'Saga', 'Astrid', 'Wilma', 'Ebba', 'Freja', 'Signe', 'Tyra',
    'Liam', 'Noah', 'Hugo', 'Oscar', 'William', 'Elias', 'Alvin', 'Melvin', 'Viggo', 'Leo',
    'Nora', 'Iris', 'Selma', 'Alice', 'Ines', 'Omar', 'Adam', 'Sami', 'Lucas', 'Theo',
  ];
  var LAST = [
    'Lindqvist', 'Bergström', 'Holm', 'Sandberg', 'Ek', 'Nyberg', 'Lund', 'Åberg', 'Forsberg',
    'Wikström', 'Dahl', 'Strand', 'Sjöberg', 'Hedlund', 'Engström', 'Björk', 'Falk', 'Nord',
  ];

  var students = [];
  var studentLevel = {}; // id -> ability, 0 (struggling) .. 1 (excellent)
  function makeStudents(prefix, count) {
    var ids = [];
    var used = {};
    for (var i = 0; i < count; i++) {
      var first, last, name;
      do {
        first = pick(FIRST);
        last = pick(LAST);
        name = first + ' ' + last;
      } while (used[name]);
      used[name] = true;
      var id = prefix + '-s' + (i + 1);
      students.push({ id: id, firstName: first, lastName: last, createdAt: created, archived: false });
      // most of a class sits around C-D, a few at each end
      studentLevel[id] = Math.min(1, Math.max(0, 0.2 + (rnd() + rnd() + rnd()) / 3 * 0.6));
      ids.push(id);
    }
    return ids;
  }

  // Reusable assignments (the app keeps them global and assigns them per group).
  var assignments = [
    { id: 'a-familia', title: 'Oral presentation: Mi familia', type: 'oral', year: '7', criteriaIds: ['speaking', 'interaction'], description: 'Present your family in Spanish, two minutes, with a photo or drawing.' },
    { id: 'a-mercado', title: 'Reading comprehension: En el mercado', type: 'reading', year: '7', criteriaIds: ['reading', 'adaptation'], description: 'Read the dialogue at the market and answer the questions.' },
    { id: 'a-tiempo', title: 'Listening: El tiempo y las estaciones', type: 'listening', year: '8', criteriaIds: ['listening'], description: 'Weather forecasts from three Spanish-speaking countries.' },
    { id: 'a-vacaciones', title: 'Writing: Mis vacaciones', type: 'written', year: '8', criteriaIds: ['writing', 'adaptation'], description: 'A short text about a holiday, past tense (pretérito indefinido).' },
    { id: 'a-muertos', title: 'Culture: Día de los Muertos', type: 'mixed', year: '8', criteriaIds: ['cultural', 'reading'], description: 'Compare Día de los Muertos with Swedish traditions around Allhelgona.' },
    { id: 'a-restaurante', title: 'Speaking test: En el restaurante', type: 'oral', year: '9', criteriaIds: ['speaking', 'interaction', 'adaptation'], description: 'Role play ordering food, in pairs.' },
    { id: 'a-podcast', title: 'Listening: Podcast sobre Latinoamérica', type: 'listening', year: '9', criteriaIds: ['listening', 'cultural'] },
    { id: 'a-carta', title: 'Writing: Una carta a un amigo', type: 'written', year: '9', criteriaIds: ['writing'], description: 'An informal letter, at least 150 words.' },
  ].map(function (a) {
    return Object.assign({ subjectCode: 'MSP', weight: 1, createdAt: created, updatedAt: created, archived: false }, a);
  });

  var COMMENTS = {
    A: ['Excellent, fluent and varied language.', 'Very well developed answers with good nuance.'],
    B: ['Very good work, a few small errors.', 'Clear and well structured.'],
    C: ['Good work. Keep developing your sentences.', 'Solid, try to vary your vocabulary more.'],
    D: ['On the right track, work on verb endings.', 'Understandable, but needs more detail.'],
    E: ['Basic but understandable. Practise the vocabulary.', 'Simple sentences, keep going!'],
    F: ['Let’s go through this together and plan a retake.'],
  };
  function levelFor(ability) {
    var v = ability + (rnd() - 0.5) * 0.3;
    if (v > 0.78) return 'A';
    if (v > 0.68) return 'B';
    if (v > 0.55) return 'C';
    if (v > 0.45) return 'D';
    if (v > 0.3) return 'E';
    return 'F';
  }

  var marks = [];
  var markN = 0;
  function markAll(assignment, studentIds, whenOffset, share) {
    var count = Math.round(studentIds.length * (share == null ? 1 : share));
    studentIds.slice(0, count).forEach(function (sid) {
      var absent = rnd() < 0.05;
      assignment.criteriaIds.forEach(function (skill, i) {
        var level = absent ? null : levelFor(studentLevel[sid]);
        var m = {
          id: 'm' + ++markN,
          assignmentId: assignment.id,
          studentId: sid,
          criterionId: skill,
          level: level,
          markedAt: iso(whenOffset),
          updatedAt: iso(whenOffset),
        };
        if (absent) m.absent = true;
        else if (i === 0 && rnd() < 0.45) m.comment = pick(COMMENTS[level]);
        marks.push(m);
      });
    });
  }

  function homework(id, title, offset, maxScore, studentIds, done) {
    var entries = {};
    if (done) {
      studentIds.forEach(function (sid) {
        var r = rnd();
        if (r < 0.06) entries[sid] = { absent: true, updatedAt: iso(offset) };
        else if (r < 0.14) return; // not handed in
        else
          entries[sid] = {
            score: Math.max(0, Math.min(maxScore, Math.round(maxScore * (0.25 + studentLevel[sid] * 0.75 + (rnd() - 0.5) * 0.25)))),
            updatedAt: iso(offset),
          };
      });
    }
    return { id: id, title: title, date: day(offset), maxScore: maxScore, entries: entries, createdAt: iso(offset - 7), updatedAt: iso(offset) };
  }

  var byId = {};
  assignments.forEach(function (a) {
    byId[a.id] = a;
  });

  // --- the three classes ----------------------------------------------------
  var s7 = makeStudents('7a', 22);
  var s8 = makeStudents('8b', 24);
  var s9 = makeStudents('9c', 20);

  function group(id, name, schoolYear, ids, plan, extra) {
    return Object.assign(
      {
        id: id,
        name: name,
        subject: 'MSP',
        schoolYear: schoolYear,
        academicYear: academicYear,
        year: yearLabel,
        curriculum: 'GR',
        studentIds: ids,
        assignments: plan.map(function (p) {
          var ga = { assignmentId: p[0], startDate: day(p[1]), dueDate: day(p[2]) };
          if (p[3]) ga.completed = true;
          return ga;
        }),
        createdAt: created,
        updatedAt: iso(-1),
        archived: false,
      },
      extra || {},
    );
  }

  // [assignmentId, start, due, completed]
  var g7 = group('g-7a', 'Spanska 7A', '7', s7, [
    ['a-familia', -40, -30, true],
    ['a-mercado', -20, -9],
    ['a-muertos', -2, 5],
  ]);
  var g8 = group('g-8b', 'Spanska 8B', '8', s8, [
    ['a-tiempo', -45, -35, true],
    ['a-vacaciones', -28, -17, true],
    ['a-muertos', -12, -3],
    ['a-mercado', 1, 6],
  ], {
    tests: [
      { id: 't-8b-1', name: 'Unit test: El pasado', description: 'Listening and writing, past tense.', startDate: day(-45), dueDate: day(-17), assignmentIds: ['a-tiempo', 'a-vacaciones'], createdAt: created, updatedAt: created },
    ],
  });
  var g9 = group('g-9c', 'Spanska 9C', '9', s9, [
    ['a-restaurante', -42, -33, true],
    // marked, but never closed: shows up as an overdue correction
    ['a-podcast', -33, -19],
    ['a-carta', -10, 0],
    ['a-muertos', 7, 21],
  ]);

  // Marked work, plus the most recent assignment part-way through marking.
  markAll(byId['a-familia'], s7, -27);
  markAll(byId['a-mercado'], s7, -5, 0.55);
  markAll(byId['a-tiempo'], s8, -32);
  markAll(byId['a-vacaciones'], s8, -14);
  markAll(byId['a-muertos'], s8, -1, 0.4);
  markAll(byId['a-restaurante'], s9, -30);
  markAll(byId['a-podcast'], s9, -16);

  g7.homework = [
    homework('h-7a-1', 'Vocabulary: la familia', -33, 10, s7, true),
    homework('h-7a-2', 'Numbers 1–100', -19, 10, s7, true),
    homework('h-7a-3', 'Vocabulary: la comida', -6, 15, s7, true),
    homework('h-7a-4', 'Workbook p. 34–35', 4, 10, s7, false),
  ];
  g8.homework = [
    homework('h-8b-1', 'Verbs: pretérito indefinido', -30, 20, s8, true),
    homework('h-8b-2', 'Vocabulary: el tiempo', -16, 10, s8, true),
    homework('h-8b-3', 'Reading log', -4, 10, s8, true),
  ];
  g9.homework = [
    homework('h-9c-1', 'Vocabulary: en el restaurante', -36, 15, s9, true),
    homework('h-9c-2', 'Ser vs. estar', -21, 10, s9, true),
    homework('h-9c-3', 'Subjunctive: first steps', -7, 10, s9, true),
  ];

  // A retake (komplettering) for two students on the 8B writing task.
  var retakers = s8.filter(function (sid) {
    return marks.some(function (m) {
      return m.assignmentId === 'a-vacaciones' && m.studentId === sid && (m.level === 'F' || m.level === 'E');
    });
  }).slice(0, 2);
  var resets = [];
  if (retakers.length) {
    resets.push({ id: 'r-8b-1', assignmentId: 'a-vacaciones', groupId: 'g-8b', date: day(-6), studentIds: retakers, createdAt: iso(-8), updatedAt: iso(-6) });
    retakers.forEach(function (sid) {
      ['writing', 'adaptation'].forEach(function (skill) {
        marks.push({ id: 'm' + ++markN, assignmentId: 'a-vacaciones', studentId: sid, criterionId: skill, level: pick(['D', 'C']), resetId: 'r-8b-1', comment: skill === 'writing' ? 'Big improvement on the retake!' : undefined, markedAt: iso(-5), updatedAt: iso(-5) });
      });
    });
  }

  var data = {
    version: '1.0.0',
    lastModified: iso(0),
    groups: [g7, g8, g9],
    students: students,
    assignments: assignments,
    marks: marks,
    finalGrades: [],
    skillGradeOverrides: [],
    recentActivity: [
      { type: 'assignment', id: 'a-muertos', groupId: 'g-8b', visitedAt: iso(-1) },
      { type: 'group', id: 'g-9c', visitedAt: iso(-2) },
      { type: 'assignment', id: 'a-mercado', groupId: 'g-7a', visitedAt: iso(-3) },
      { type: 'group', id: 'g-7a', visitedAt: iso(-4) },
    ],
    resets: resets,
    settings: {
      language: 'en',
      theme: 'light',
      autoSaveInterval: 750,
      uiScale: 15,
      sidebarCollapsed: false,
      profile: { firstName: 'Demo', lastName: 'Teacher' },
    },
  };

  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    // The UI language is its own key; English for portfolio visitors (the
    // switcher in the app still offers Swedish).
    localStorage.setItem('lang', 'en');
    if (reset) history.replaceState(null, '', location.pathname);
  } catch (e) {
    /* storage full or blocked: the app starts empty */
  }
})();
