/**
 * Seed script — inserts demo admin + students into local MongoDB
 * Run: node src/data/seed.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/admin");
const Student = require("../models/student");
const { StockItem, Stock } = require("../models/stock");
const Meal = require("../models/meal");

const { NODE_ENV, DB_URI_CLOUD, DB_URI_LOCAL } = process.env;
const DB_URI = NODE_ENV === "production" ? DB_URI_LOCAL : DB_URI_CLOUD;

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const admins = [
  { email: "admin@sohozmeal.com", password: "admin", wing: "ALL" },
  { email: "male@sohozmeal.com",  password: "admin", wing: "MALE" },
  { email: "female@sohozmeal.com",password: "admin", wing: "FEMALE" },
];

const students = [
  // MALE
  { studentId: "2001001", hallId: "M-001", name: "Rahim Uddin",   gender: "MALE",   department: "CSE",  batch: 20, roomNo: "101", residence: "OSMANY_HALL" },
  { studentId: "2001002", hallId: "M-002", name: "Karim Hossain", gender: "MALE",   department: "EECE", batch: 20, roomNo: "102", residence: "OSMANY_HALL" },
  { studentId: "2001003", hallId: "M-003", name: "Jamal Ahmed",   gender: "MALE",   department: "ME",   batch: 20, roomNo: "103", residence: "OSMANY_HALL" },
  { studentId: "2001004", hallId: "M-004", name: "Salim Khan",    gender: "MALE",   department: "CE",   batch: 20, roomNo: "104", residence: "OSMANY_HALL" },
  { studentId: "2001005", hallId: "M-005", name: "Noman Sheikh",  gender: "MALE",   department: "CSE",  batch: 21, roomNo: "105", residence: "OSMANY_HALL" },
  // FEMALE
  { studentId: "2002001", hallId: "F-001", name: "Fatima Akter",  gender: "FEMALE", department: "CSE",  batch: 20, roomNo: "201", residence: "OSMANY_HALL" },
  { studentId: "2002002", hallId: "F-002", name: "Sumaiya Islam", gender: "FEMALE", department: "EECE", batch: 20, roomNo: "202", residence: "OSMANY_HALL" },
  { studentId: "2002003", hallId: "F-003", name: "Nasrin Begum",  gender: "FEMALE", department: "ME",   batch: 20, roomNo: "203", residence: "OSMANY_HALL" },
  { studentId: "2002004", hallId: "F-004", name: "Roksana Parvin",gender: "FEMALE", department: "CE",   batch: 21, roomNo: "204", residence: "OSMANY_HALL" },
  { studentId: "2002005", hallId: "F-005", name: "Marium Khatun", gender: "FEMALE", department: "CSE",  batch: 21, roomNo: "205", residence: "OSMANY_HALL" },
];

// STORED items per wing — rice, oil, lentil
// NON_STORED items — egg (consumed same day)
const stockItemsSeed = [
  { name: "Rice",   unit: "KG",  category: "STORED",     wing: "MALE" },
  { name: "Oil",    unit: "LTR", category: "STORED",     wing: "MALE" },
  { name: "Lentil", unit: "KG",  category: "STORED",     wing: "MALE" },
  { name: "Egg",    unit: "PCS", category: "NON_STORED", wing: "MALE" },
  { name: "Rice",   unit: "KG",  category: "STORED",     wing: "FEMALE" },
  { name: "Oil",    unit: "LTR", category: "STORED",     wing: "FEMALE" },
  { name: "Lentil", unit: "KG",  category: "STORED",     wing: "FEMALE" },
  { name: "Egg",    unit: "PCS", category: "NON_STORED", wing: "FEMALE" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateStr(offsetDays = 0) {
  return today(offsetDays).toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function seed() {
  await mongoose.connect(DB_URI, { useUnifiedTopology: true, useNewUrlParser: true });
  console.log("Connected to", DB_URI);

  // ── Admins ────────────────────────────────────────────────────────────────
  for (const a of admins) {
    const exists = await Admin.findOne({ email: a.email });
    if (exists) { console.log(`  skip admin ${a.email}`); continue; }
    await Admin.create(a);   // pre-save hook hashes password
    console.log(`  created admin ${a.email}`);
  }

  // ── Students ──────────────────────────────────────────────────────────────
  for (const s of students) {
    const exists = await Student.findOne({ studentId: s.studentId });
    if (exists) { console.log(`  skip student ${s.studentId}`); continue; }
    // default password = studentId (hashed by schema default)
    await Student.create(s);
    console.log(`  created student ${s.studentId} (${s.name})`);
  }

  // ── Meals (today for every student, all meals ON) ─────────────────────────
  const todayStr = dateStr(0);
  for (const s of students) {
    const exists = await Meal.findOne({ studentId: s.studentId, date: todayStr });
    if (exists) { console.log(`  skip meal ${s.studentId} ${todayStr}`); continue; }
    await Meal.create({
      studentId: s.studentId,
      date: todayStr,
      wing: s.gender,
      meal: { breakfast: true, lunch: true, dinner: true },
      guestMeal: { breakfast: 0, lunch: 0, dinner: 0 },
    });
    console.log(`  created meal ${s.studentId} ${todayStr}`);
  }

  // ── Stock Items + Stock snapshots ─────────────────────────────────────────
  for (const si of stockItemsSeed) {
    let item = await StockItem.findOne({ name: si.name, wing: si.wing });
    if (!item) {
      item = await StockItem.create(si);
      console.log(`  created stock item ${si.name} (${si.wing})`);
    } else {
      console.log(`  skip stock item ${si.name} (${si.wing})`);
    }

    // Only create Stock snapshot for STORED items
    if (si.category === "STORED") {
      const stockExists = await Stock.findOne({ item: item._id, wing: si.wing });
      if (!stockExists) {
        await Stock.create({ item: item._id, wing: si.wing, quantity: 0, price: 0 });
        console.log(`    created stock snapshot for ${si.name} (${si.wing})`);
      }
    }
  }

  console.log("\nSeed complete.");
  console.log("─────────────────────────────────────────────");
  console.log("Admin logins:");
  admins.forEach(a => console.log(`  ${a.email}  /  ${a.wing}  /  password: admin`));
  console.log("\nStudent logins (password = studentId):");
  students.forEach(s => console.log(`  ${s.studentId}  /  ${s.name}  /  ${s.gender}`));
  console.log("─────────────────────────────────────────────");

  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
