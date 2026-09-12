import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import School from "./models/School.js";
import User from "./models/User.js";
import { Assignment, ClassRoom, Student, Subject } from "./models/Academic.js";

const argument = process.argv.find(item => item.startsWith("--school="));
const schoolCode = (argument?.split("=")[1] || process.env.SEED_SCHOOL_CODE || "SAA").trim().toUpperCase();
const sessionArgument = process.argv.find(item => item.startsWith("--session="));

await connectDB();

const school = await School.findOne({ code: schoolCode });
if (!school) {
  console.error(`School with code ${schoolCode} was not found. Create it from the Echo8V dashboard first.`);
  process.exit(1);
}

const session = sessionArgument?.split("=")[1] || school.activeSession || "2026/2027";
const arms = (levels, letters) => levels.flatMap(level => letters.map(letter => `${level}${letter}`));
const classNames = [
  ...arms(["Nursery 1", "Nursery 2"], ["A", "B"]),
  ...arms(["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5"], ["A", "B"]),
  ...arms(["JSS 1", "JSS 2", "JSS 3"], ["A", "B", "C"]),
  ...arms(["SSS 1", "SSS 2", "SSS 3"], ["A", "B", "C"])
];

const subjectGroups = {
  nursery: ["English Language", "Mathematics", "Basic Science", "Health Habits", "Social Habits", "Rhymes", "Creative Arts", "CRK"],
  primary: ["English Language", "Mathematics", "Basic Science", "Basic Technology", "Social Studies", "Civic Education", "CRK", "Cultural and Creative Arts", "Home Economics", "Computer Studies", "Physical and Health Education", "Agricultural Science"],
  jss: ["English Language", "Mathematics", "Basic Science", "Basic Technology", "Social Studies", "Civic Education", "CRK", "Cultural and Creative Arts", "Home Economics", "Computer Studies", "Physical and Health Education", "Agricultural Science", "Business Studies"],
  sss: ["English Language", "Mathematics", "Biology", "Chemistry", "Physics", "Civic Education", "CRK", "Computer Studies", "Agricultural Science", "Economics", "Government", "Literature in English", "Geography", "Commerce", "Financial Accounting"]
};

const groupFor = className => className.startsWith("Nursery") ? "nursery" : className.startsWith("Primary") ? "primary" : className.startsWith("JSS") ? "jss" : "sss";
const subjectNames = [...new Set(Object.values(subjectGroups).flat())];
const codeFor = name => name.split(/\s+/).map(word => word[0]).join("").slice(0, 5).toUpperCase();

const classes = [];
for (const name of classNames) {
  const match = name.match(/^(.*?\d)([A-C])$/);
  classes.push(await ClassRoom.findOneAndUpdate(
    { school: school._id, name, session },
    { $set: { level: match?.[1] || name, arm: match?.[2] || "", active: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ));
}

const subjects = new Map();
for (const name of subjectNames) {
  const applicableClasses = classNames.filter(className => subjectGroups[groupFor(className)].includes(name));
  const subject = await Subject.findOneAndUpdate(
    { school: school._id, name },
    { $set: { code: codeFor(name), classes: applicableClasses } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  subjects.set(name, subject);
}

const teacherPassword = process.env.SEED_TEACHER_PASSWORD || "Teacher@123";
const passwordHash = await bcrypt.hash(teacherPassword, 10);
const firstNames = ["Amina", "Musa", "Grace", "John", "Fatima", "Ibrahim", "Maryam", "Daniel", "Zainab", "Samuel", "Hauwa", "David"];
const lastNames = ["Yusuf", "Bello", "Musa", "Ibrahim", "David", "Usman", "James", "Adamu", "Ali", "Peter", "Sani", "Yakubu"];
const teachers = [];

// Form Master is no longer an account type. Preserve the accounts and restore their normal teacher role.
await User.updateMany({ school: school._id, role: "form_master" }, { role: "teacher" });

for (let index = 0; index < 36; index += 1) {
  const number = String(index + 1).padStart(2, "0");
  const email = `teacher${number}@shammeracademy.edu.ng`;
  const teacher = await User.findOneAndUpdate(
    { school: school._id, email },
    { $set: { name: `${firstNames[index % firstNames.length]} ${lastNames[(index * 5) % lastNames.length]}`, role: "teacher", active: true }, $setOnInsert: { password: passwordHash } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  teachers.push(teacher);
}

// Rebuild only assignments belonging to generated demo teachers. Manually created staff and Admins are preserved.
await Assignment.deleteMany({ school: school._id, teacher: { $in: teachers.map(item => item._id) } });

let assignmentIndex = 0;
for (const classroom of classes) {
  const classSubjects = subjectGroups[groupFor(classroom.name)];
  for (const subjectName of classSubjects) {
    const teacher = teachers[assignmentIndex % teachers.length];
    await Assignment.create({ school: school._id, teacher: teacher._id, className: classroom.name, subject: subjects.get(subjectName)._id, isFormMaster: false });
    assignmentIndex += 1;
  }
}

// Form Master is an additional class responsibility; all accounts remain teachers.
for (let index = 0; index < classes.length; index += 1) {
  classes[index].formMaster = teachers[index]._id;
  await classes[index].save();
}

const studentFirstNames = ["Ibrahim", "Aisha", "David", "Maryam", "Samuel", "Zainab", "John", "Fatima", "Daniel", "Hauwa"];
for (let index = 0; index < 50; index += 1) {
  const number = String(index + 1).padStart(3, "0");
  await Student.findOneAndUpdate(
    { school: school._id, admissionNo: `${schoolCode}/${number}` },
    { $set: { fullName: `${studentFirstNames[index % studentFirstNames.length]} ${lastNames[(index * 7) % lastNames.length]}`, gender: index % 2 ? "Female" : "Male", className: classNames[index % classNames.length], session, active: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

console.log(`School data prepared for ${school.name} (${school.code}).`);
console.log(`${classes.length} classes, ${subjects.size} subjects, ${teachers.length} teachers and 50 students are available.`);
console.log(`Generated teacher password: ${teacherPassword}`);
console.log("Existing School Admin accounts and manually created teachers were preserved.");
process.exit(0);
