export const tableName = "users";

export class User {
  username?: string;
  password?: string;
  email?: string;
}

export const user1: User = {
  username: "user1",
  password: "passsworduser1",
  email: "user1@gmail.com",
};

export const user2: User = {
  username: "user2",
  password: "passsworduser2",
  email: "user2@gmail.com",
};

export const InsertUserQuery = `INSERT INTO ${tableName}(username, password, email) VALUES($1, $2, $3)`;
