const assert = require('node:assert/strict');
const { festivalSchedule } = require('./festivals');
const schedule = iso => festivalSchedule(new Date(iso));

assert.equal(schedule('2026-11-08T18:29:59Z').active[1], 'Diwali');
assert.equal(schedule('2026-11-08T18:30:00Z').active[1], 'Bhai Dooj');
assert.equal(schedule('2027-07-01T00:00:00Z').active, null);
assert.equal(schedule('2027-08-03T00:00:00Z').active[1], 'Raksha Bandhan');
assert.equal(schedule('2027-12-31T18:30:00Z').upcoming.length, 0);
