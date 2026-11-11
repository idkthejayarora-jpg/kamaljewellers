const assert = require('node:assert/strict');
const { nextFestival } = require('./festivals');
const at = iso => nextFestival(new Date(iso));

assert.equal(at('2026-11-08T18:29:59Z')[1], 'Diwali');
assert.equal(at('2026-11-08T18:30:00Z')[1], 'Chhath Puja');
assert.equal(at('2027-07-01T00:00:00Z')[1], 'Raksha Bandhan');
assert.equal(at('2027-12-31T18:30:00Z'), null);
