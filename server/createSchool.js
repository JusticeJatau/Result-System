import "dotenv/config";
import { connectDB } from "./config/db.js";
import School from "./models/School.js";

async function createSchool() {
  await connectDB();

  const school = await School.findOneAndUpdate(
    {
      code: "SAA",
    },
    {
      $set: {
        name: "Shammer Ambassadors Academy",
        address: "Damaturu, Yobe State",
        motto: "Raising Future Ambassadors",
        logoUrl: "/school-logo.png",
        activeSession: "2026/2027",
        activeTerm: "First Term",
        calculatePosition: true,
      },
      $setOnInsert: {
        code: "SAA",
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  console.log("School created successfully:");
  console.log(`Name: ${school.name}`);
  console.log(`Code: ${school.code}`);
  console.log(`ID: ${school._id}`);

  process.exit(0);
}

createSchool().catch((error) => {
  console.error("Could not create school:", error.message);
  process.exit(1);
});