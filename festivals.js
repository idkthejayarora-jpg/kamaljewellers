// Dates follow IIT Bombay's holiday list and the Indian High Commission's list:
// https://iitb.ac.in/holidayslist and https://www.hcilondon.gov.in/page/list-of-the-holidays/
const festivals = [
  ['2026-11-08', 'Diwali', 'lamp', 'Antique gold finishes, festive sets and gifting pieces'],
  ['2026-11-15', 'Chhath Puja', 'harvest', 'Traditional sets, bangles and warm gold finishes'],
  ['2026-11-24', 'Guru Nanak Jayanti', 'harvest', 'Classic earrings, bangles and understated sets'],
  ['2026-12-25', 'Christmas', 'evergreen', 'Sparkling studs, bracelets and gifting sets'],
  ['2027-01-14', 'Makar Sankranti', 'harvest', 'Bright bangles, classic earrings and festive sets'],
  ['2027-03-10', 'Eid al-Fitr', 'evergreen', 'Statement earrings, bangles and occasion sets'],
  ['2027-03-23', 'Holi', 'rose', 'Colourful earrings, bright bangles and lightweight sets'],
  ['2027-04-07', 'Ugadi & Gudi Padwa', 'harvest', 'Traditional jewellery and gold finish sets'],
  ['2027-04-14', 'Vaisakhi', 'harvest', 'Bright bangles and statement earrings'],
  ['2027-08-17', 'Raksha Bandhan', 'rose', 'Bracelets, earrings and small gifting sets'],
  ['2027-09-04', 'Ganesh Chaturthi', 'harvest', 'Traditional earrings and gold finish jewellery'],
  ['2027-09-12', 'Onam', 'evergreen', 'Gold finish sets, bangles and traditional earrings'],
  ['2027-10-09', 'Dussehra', 'harvest', 'Jadau, statement earrings and festive sets'],
  ['2027-10-29', 'Diwali', 'lamp', 'Antique gold finishes, festive sets and gifting pieces'],
  ['2027-11-04', 'Chhath Puja', 'harvest', 'Traditional sets, bangles and warm gold finishes'],
  ['2027-11-14', 'Guru Nanak Jayanti', 'harvest', 'Classic earrings, bangles and understated sets'],
  ['2027-12-25', 'Christmas', 'evergreen', 'Sparkling studs, bracelets and gifting sets'],
];

function nextFestival(now = new Date()) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', dateStyle: 'short' }).format(now);
  return festivals.find(([date]) => date >= today) || null;
}

if (typeof module !== 'undefined') module.exports = { nextFestival };
