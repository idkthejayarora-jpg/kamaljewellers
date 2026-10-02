// node motion.test.js — checks the "open now" parser against the real hours string.
const {parseHours,statusAt}=require('./motion.js');
const assert=require('assert');
const h=parseHours('Mon – Sat · 11 AM – 8 PM');
assert.deepStrictEqual(h,{days:[1,2,3,4,5,6],open:660,close:1200});
assert.strictEqual(statusAt(h,3,13*60).label,'Open now · till 8 PM');          // Wed 1 PM
assert.strictEqual(statusAt(h,3,9*60).label,'Opens today · 11 AM');           // Wed 9 AM
assert.strictEqual(statusAt(h,3,20*60).label,'Opens tomorrow · 11 AM');       // Wed 8 PM sharp
assert.strictEqual(statusAt(h,6,21*60).label,'Opens Mon · 11 AM');            // Sat night → Sunday closed
assert.strictEqual(statusAt(h,0,12*60).label,'Opens tomorrow · 11 AM');       // Sunday noon
assert.deepStrictEqual(parseHours('Daily 10:30 AM – 9 PM'),{days:[0,1,2,3,4,5,6],open:630,close:1260});
assert.strictEqual(parseHours('Open whenever'),null);
assert.deepStrictEqual(parseHours('10 AM - 8 PM '),{days:[0,1,2,3,4,5,6],open:600,close:1200});   // the live site's real string: no days = every day
assert.strictEqual(parseHours('Mon – Sat · 8 PM – 11 AM'),null);             // wraps midnight → not supported
console.log('motion.test.js ok');
