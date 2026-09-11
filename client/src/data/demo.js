export const students = [
  { _id: "1", admissionNo: "BFA/001", fullName: "Ibrahim Yusuf", gender: "Male", className: "JSS 1A" },
  { _id: "2", admissionNo: "BFA/002", fullName: "Aisha Bello", gender: "Female", className: "JSS 1A" },
  { _id: "3", admissionNo: "BFA/003", fullName: "David Musa", gender: "Male", className: "JSS 1A" },
  { _id: "4", admissionNo: "BFA/004", fullName: "Maryam Sani", gender: "Female", className: "JSS 1A" },
  { _id: "5", admissionNo: "BFA/005", fullName: "Usman Ali", gender: "Male", className: "JSS 1A" }
];
export const teachers = [
  { _id: "t1", name: "Mr. Musa Ibrahim", email: "musa@brightfuture.edu", role: "teacher", subject: "Mathematics" },
  { _id: "t2", name: "Mrs. Grace David", email: "grace@brightfuture.edu", role: "form_master", subject: "English Language" },
  { _id: "t3", name: "Mr. John Peter", email: "john@brightfuture.edu", role: "teacher", subject: "Basic Science" }
];
export const subjects = [{ _id: "s1", name: "Mathematics", code: "MTH" }, { _id: "s2", name: "English Language", code: "ENG" }, { _id: "s3", name: "Basic Science", code: "BSC" }, { _id: "s4", name: "Social Studies", code: "SOS" }];
export const resultStatus = [
  { subject: "Mathematics", teacher: "Mr. Musa", status: "Submitted", missing: 0 },
  { subject: "English Language", teacher: "Mrs. Grace", status: "Submitted", missing: 0 },
  { subject: "Basic Science", teacher: "Mr. John", status: "Draft", missing: 2 },
  { subject: "Social Studies", teacher: "Mrs. Grace", status: "Reviewed", missing: 0 }
];
