// Dates follow IIT Bombay's holiday list and the Indian High Commission's list:
// https://iitb.ac.in/holidayslist and https://www.hcilondon.gov.in/page/list-of-the-holidays/
const festivals = [
  ['2026-11-08', 'Diwali', 'lamp', 'Stock up for', 'the festival of lights.', 'Antique gold finishes, festive sets and gifting pieces'],
  ['2026-11-11', 'Bhai Dooj', 'rose', 'Jewellery for', 'Bhai Dooj gifting.', 'Earrings, bangles and gift-ready sets'],
  ['2026-11-15', 'Chhath Puja', 'harvest', 'Prepare for', 'Chhath Puja.', 'Traditional sets, bangles and warm gold finishes'],
  ['2026-11-24', 'Guru Nanak Jayanti', 'harvest', 'Stock for', 'the Gurpurab season.', 'Classic earrings, bangles and understated sets'],
  ['2026-12-25', 'Christmas', 'evergreen', 'Stock up for', 'Christmas gifting.', 'Sparkling studs, bracelets and gifting sets'],
  ['2027-01-14', 'Makar Sankranti', 'harvest', 'Welcome the', 'harvest season.', 'Bright bangles, classic earrings and festive sets'],
  ['2027-02-11', 'Basant Panchami', 'harvest', 'Bring spring to', 'your jewellery counter.', 'Golden finishes and light festive pieces'],
  ['2027-03-10', 'Eid al-Fitr', 'evergreen', 'Get your shelves', 'ready for Eid.', 'Statement earrings, bangles and occasion sets'],
  ['2027-03-23', 'Holi', 'rose', 'Make room', 'for colour.', 'Colourful earrings, bright bangles and lightweight sets'],
  ['2027-04-07', 'Ugadi & Gudi Padwa', 'harvest', 'Stock for', 'a festive new year.', 'Traditional jewellery and gold finish sets'],
  ['2027-04-14', 'Vaisakhi', 'harvest', 'Prepare for', 'Vaisakhi celebrations.', 'Bright bangles and statement earrings'],
  ['2027-08-17', 'Raksha Bandhan', 'rose', 'Stock up for', 'Rakhi gifting.', 'Bracelets, earrings and small gifting sets'],
  ['2027-08-25', 'Janmashtami', 'evergreen', 'Prepare for', 'Janmashtami.', 'Traditional sets and colourful festive pieces'],
  ['2027-09-04', 'Ganesh Chaturthi', 'harvest', 'Stock up for', 'Ganesh Chaturthi.', 'Traditional earrings and gold finish jewellery'],
  ['2027-09-12', 'Onam', 'evergreen', 'Get ready for', 'Onam.', 'Gold finish sets, bangles and traditional earrings'],
  ['2027-10-09', 'Dussehra', 'harvest', 'Dress your shelves', 'for Dussehra.', 'Jadau, statement earrings and festive sets'],
  ['2027-10-18', 'Karwa Chauth', 'rose', 'Stock up for', 'Karwa Chauth.', 'Bangles, statement sets and warm gold finishes'],
  ['2027-10-29', 'Diwali', 'lamp', 'Stock up for', 'the festival of lights.', 'Antique gold finishes, festive sets and gifting pieces'],
  ['2027-10-31', 'Bhai Dooj', 'rose', 'Jewellery for', 'Bhai Dooj gifting.', 'Earrings, bangles and gift-ready sets'],
  ['2027-11-04', 'Chhath Puja', 'harvest', 'Prepare for', 'Chhath Puja.', 'Traditional sets, bangles and warm gold finishes'],
  ['2027-11-14', 'Guru Nanak Jayanti', 'harvest', 'Stock for', 'the Gurpurab season.', 'Classic earrings, bangles and understated sets'],
  ['2027-12-25', 'Christmas', 'evergreen', 'Stock up for', 'Christmas gifting.', 'Sparkling studs, bracelets and gifting sets'],
];

function festivalSchedule(now = new Date()) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', dateStyle: 'short' }).format(now);
  const upcoming = festivals.filter(([date]) => date >= today);
  const next = upcoming[0];
  const active = next && Date.parse(next[0]) - Date.parse(today) <= 14 * 86400000 ? next : null;
  return { active, upcoming };
}

if (typeof module !== 'undefined') module.exports = { festivalSchedule };
