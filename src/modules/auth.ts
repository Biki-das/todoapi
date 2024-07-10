import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import bycrpt from "bcrypt";
dotenv.config();

export const comparePassword = (password, hash) => {
  return bycrpt.compareSync(password, hash);
};

export const hashPassword = (password) => {
  return bycrpt.hash(password, 5);
};

export const createJWT = (user: { id: string; username: string }) => {
  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET
  );
  return token;
};

export const protect = (req, res, next) => {
  const bearer = req.headers.authorization;
  if (!bearer) {
    res.status(401);
    res.json({ message: "not authorized" });
    return;
  }

  const [, token] = bearer.split(" ");

  if (!token) {
    res.status(401);
    res.json({ message: "invalid token" });
    return;
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(401);
    res.json({ message: "invalid token" });
    return;
  }
};
