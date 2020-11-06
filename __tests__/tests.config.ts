import dotenv from "dotenv";
dotenv.config();

export const config = {
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
};
