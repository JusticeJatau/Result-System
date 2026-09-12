import jwt from "jsonwebtoken";

export function protectPlatform(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Platform sign-in required" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "platform_admin") return res.status(403).json({ message: "Platform access denied" });
    req.platformAdmin = payload;
    next();
  } catch {
    res.status(401).json({ message: "Platform session expired" });
  }
}
