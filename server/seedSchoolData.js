import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import School from "./models/School.js";
import User from "./models/User.js";
import {
  Student,
  Subject,
  Assignment,
  ClassRoom,
  AcademicPeriod,
} from "./models/Academic.js";

const classGroups = [
  {
    levels: ["Nursery 1", "Nursery 2"],
    arms: [""],
  },
  {
    levels: [
      "Primary 1",
      "Primary 2",
      "Primary 3",
      "Primary 4",
      "Primary 5",
    ],
    arms: ["A", "B"],
  },
  {
    levels: ["JSS 1", "JSS 2", "JSS 3"],
    arms: ["A", "B", "C"],
  },
  {
    levels: ["SSS 1", "SSS 2", "SSS 3"],
    arms: ["A", "B", "C"],
  },
];

const classes = classGroups.flatMap((group) =>
  group.levels.flatMap((level) =>
    group.arms.map((arm) => ({
      name: `${level}${arm}`,
      level,
      arm,
    }))
  )
);

const subjectGroups = {
  nursery: [
    ["Numeracy", "NUM"],
    ["Literacy", "LIT"],
    ["Rhymes", "RHY"],
    ["Basic Science", "BSC"],
    ["Social Habits", "SOH"],
    ["Cultural and Creative Arts", "CCA"],
    ["Christian Religious Knowledge", "CRK"],
    ["Health Education", "HED"],
  ],

  primary: [
    ["English Language", "ENG"],
    ["Mathematics", "MTH"],
    ["Basic Science and Technology", "BST"],
    ["Social Studies", "SOS"],
    ["Civic Education", "CVE"],
    ["Cultural and Creative Arts", "CCA"],
    ["Christian Religious Knowledge", "CRK"],
    ["Physical and Health Education", "PHE"],
    ["Computer Studies", "CMP"],
    ["Home Economics", "HEC"],
    ["Agricultural Science", "AGR"],
    ["Nigerian Language", "NGL"],
  ],

  junior: [
    ["English Language", "ENG"],
    ["Mathematics", "MTH"],
    ["Basic Science", "BSC"],
    ["Basic Technology", "BTE"],
    ["Social Studies", "SOS"],
    ["Civic Education", "CVE"],
    ["Cultural and Creative Arts", "CCA"],
    ["Business Studies", "BUS"],
    ["Computer Studies", "CMP"],
    ["Home Economics", "HEC"],
    ["Agricultural Science", "AGR"],
    ["Christian Religious Knowledge", "CRK"],
    ["French", "FRE"],
  ],

  senior: [
    ["English Language", "ENG"],
    ["Mathematics", "MTH"],
    ["Civic Education", "CVE"],
    ["Biology", "BIO"],
    ["Chemistry", "CHM"],
    ["Physics", "PHY"],
    ["Agricultural Science", "AGR"],
    ["Further Mathematics", "FMT"],
    ["Economics", "ECO"],
    ["Government", "GOV"],
    ["Literature in English", "LTE"],
    ["Commerce", "COM"],
    ["Financial Accounting", "ACC"],
    ["Geography", "GEO"],
    ["Christian Religious Knowledge", "CRK"],
    ["Computer Studies", "CMP"],
    ["Data Processing", "DPR"],
    ["Home Management", "HMG"],
  ],
};

const teacherNames = [
  "Abigail Daniel",
  "Adamu Ibrahim",
  "Aisha Mohammed",
  "Blessing John",
  "Chinedu Okafor",
  "Deborah Samuel",
  "Emmanuel Peter",
  "Fatima Aliyu",
  "Grace David",
  "Hauwa Musa",
  "Ibrahim Usman",
  "Josephine Mark",
  "Kabiru Sani",
  "Maryam Bello",
  "Nathaniel James",
  "Ruth Andrew",
  "Samuel Yakubu",
  "Zainab Garba",
];

const firstNames = [
  "Aisha",
  "Abubakar",
  "Blessing",
  "Daniel",
  "Esther",
  "Fatima",
  "Grace",
  "Hauwa",
  "Ibrahim",
  "James",
  "Joy",
  "Kabiru",
  "Maryam",
  "Moses",
  "Nathaniel",
  "Ruth",
  "Samuel",
  "Sarah",
  "Usman",
  "Zainab",
  "David",
  "Deborah",
  "Emmanuel",
  "Joseph",
  "Mercy",
];

const surnames = [
  "Abdullahi",
  "Adamu",
  "Aliyu",
  "Bello",
  "Dauda",
  "Garba",
  "Ibrahim",
  "James",
  "John",
  "Musa",
  "Sani",
  "Samuel",
  "Usman",
  "Yakubu",
  "Yusuf",
  "Peter",
  "Mark",
  "Mohammed",
  "Andrew",
  "Daniel",
];

function getSubjectsForClass(className) {
  if (className.startsWith("Nursery")) {
    return subjectGroups.nursery;
  }

  if (className.startsWith("Primary")) {
    return subjectGroups.primary;
  }

  if (className.startsWith("JSS")) {
    return subjectGroups.junior;
  }

  return subjectGroups.senior;
}

async function seedSchoolData() {
  await connectDB();

  const schoolCode = process.env.SEED_SCHOOL_CODE || "SAA";

  const school = await School.findOne({
    code: schoolCode,
  });

  if (!school) {
    throw new Error(
      `School with code ${schoolCode} was not found. Run the main seed first.`
    );
  }

  const session = school.activeSession || "2026/2027";
  const term = school.activeTerm || "First Term";

  const teacherPassword =
    process.env.SEED_TEACHER_PASSWORD || "Teacher@123";

  const hashedPassword = await bcrypt.hash(teacherPassword, 10);

  console.log("Creating teachers...");

  const teachers = [];

  for (let index = 0; index < teacherNames.length; index++) {
    const number = String(index + 1).padStart(2, "0");

    const email = `teacher${number}@shammeracademy.edu.ng`;

    const teacher = await User.findOneAndUpdate(
      {
        school: school._id,
        email,
      },
      {
        $set: {
          name: teacherNames[index],
          role: "form_master",
          active: true,
        },
        $setOnInsert: {
          password: hashedPassword,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    teachers.push(teacher);
  }

  console.log("Creating subjects...");

  const subjectMap = new Map();

  const allSubjects = Object.values(subjectGroups).flat();

  for (const [name, code] of allSubjects) {
    const subject = await Subject.findOneAndUpdate(
      {
        school: school._id,
        name,
      },
      {
        $set: {
          code,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    subjectMap.set(name, subject);
  }

  console.log("Creating classes and teacher assignments...");

  const classRecords = [];

  for (let classIndex = 0; classIndex < classes.length; classIndex++) {
    const classData = classes[classIndex];

    const formMaster =
      teachers[classIndex % teachers.length];

    const classRoom = await ClassRoom.findOneAndUpdate(
      {
        school: school._id,
        name: classData.name,
        session,
      },
      {
        $set: {
          level: classData.level,
          arm: classData.arm,
          formMaster: formMaster._id,
          active: true,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    classRecords.push(classRoom);

    const classSubjects = getSubjectsForClass(classData.name);

    for (
      let subjectIndex = 0;
      subjectIndex < classSubjects.length;
      subjectIndex++
    ) {
      const [subjectName] = classSubjects[subjectIndex];

      const subject = subjectMap.get(subjectName);

      // The Form Master teaches the first subject in their class.
      // The remaining subjects are distributed evenly.
      const teacher =
        subjectIndex === 0
          ? formMaster
          : teachers[
              (classIndex + subjectIndex) % teachers.length
            ];

      await Assignment.findOneAndUpdate(
        {
          school: school._id,
          teacher: teacher._id,
          className: classData.name,
          subject: subject._id,
        },
        {
          $set: {
            isFormMaster: teacher._id.equals(formMaster._id),
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }
  }

  console.log("Creating 50 students...");

  for (let index = 0; index < 50; index++) {
    const classRoom =
      classRecords[index % classRecords.length];

    const firstName =
      firstNames[index % firstNames.length];

    const surname =
      surnames[(index * 3) % surnames.length];

    const fullName = `${firstName} ${surname}`;

    const admissionNo = `SAA/${session.slice(
      0,
      4
    )}/${String(index + 1).padStart(3, "0")}`;

    await Student.findOneAndUpdate(
      {
        school: school._id,
        admissionNo,
      },
      {
        $set: {
          fullName,
          gender: index % 2 === 0 ? "Male" : "Female",
          className: classRoom.name,
          session,
          active: true,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  await AcademicPeriod.findOneAndUpdate(
    {
      school: school._id,
      session,
      term,
    },
    {
      $set: {
        scoreEntryOpen: true,
        active: true,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  console.log("");
  console.log("School data added successfully.");
  console.log(`Classes: ${classes.length}`);
  console.log(`Subjects: ${subjectMap.size}`);
  console.log("Students: 50");
  console.log(`Teachers: ${teachers.length}`);
  console.log("");
  console.log(
    "Teacher emails: teacher01@shammeracademy.edu.ng to teacher18@shammeracademy.edu.ng"
  );
  console.log(`Teacher password: ${teacherPassword}`);
  console.log("");
  console.log(
    "The script is safe to run again. It updates matching records instead of duplicating them."
  );

  process.exit(0);
}

seedSchoolData().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});