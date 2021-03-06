# Japper

<span class="badge-npmversion"><a href="https://npmjs.org/package/japper" title="View this project on NPM"><img src="https://img.shields.io/npm/v/japper.svg" alt="NPM version" /></a></span>

Database library for PostgreSQL that doesn't get in your way but makes interacting with database more elegant.

It's a thin layer on top of [node-postgres](https://node-postgres.com/) built with typescript in mind, heavily inspired by C# dapper library.

**Writing raw SQL is the recommended way to do anything** besides a couple goodies included like simple CRUD queries that are used always.

**Be more productive when working with your database while still having all the control!**

## Documentation

### Features

- Write plain SQL queries (no need to learn yet another "language" just to interact with a database)
- Generate INSERT/UPDATE queries based on object schema (making DTO classes single source of truth)
- Returns are key! Improve your code readability with getting the results back as needed (see examples below)
- Automatically open connection on first usage
- Everything great [node-postgres](https://node-postgres.com/) already provides us with

## Installation

    $ npm install japper --save

## Usage

All of the example are written with [Typescript](https://www.typescriptlang.org/). Of course, this is usable without typescript, but I suggest you to try out [Typescript](https://www.typescriptlang.org/) :)

### Usage with [Express](https://expressjs.com/) (connection pool example)

```typescript
import { JapperPool } from "japper"; // import Japper Pool
import express from "express";

const app = express();
const PORT = 3000;

// create a Japper pool of connections
const db = new JapperPool({
  database: "db_name",
  user: "db_username",
  password: "db_password"
  // ....
});

class User {
  username!: string;
  email!: string;
};

app.get("/users", async (req, res) => {
  try {
    // execute SQL queries and get results back ready to be used
    res.status(200).send(await db.query<User>("SELECT * FROM users"));
  }
  catch(error) {
    ...
  }
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`)
});
```

### Usage without a connection pool

```typescript
import { JapperConnection } from "japper" // import Japper Connection

const config = {
  database: "db_name",
  user: "db_username",
  password: "db_password"
  // ....
};

class User {
  username!: string;
  email!: string;
};

try {
  const Users = new JapperConnection(config).open(async (cn) => {
    await cn.query<User>("SELECT * FROM users")
  }) // => Array<User>
  console.log(Users);
}
catch {
  ...
}
```

## API documentation

## Main usage

### **query** - execute query and return array of found rows (preferably typed if using typescript)

```typescript
async query<T extends object>(query: string, params?: any[] | undefined): Promise<T[]>
```

Example Usage:

```typescript
const GmailUsers = await db.query<User>("SELECT * FROM users where email LIKE '%gmail.com'");
const PostsNewerThen = await db.query<Post>("SELECT * FROM posts where created_at >= $1", [new Date(2020, 1, 1)]);
```

### **queryFirst** - execute query and return a single row as object (preferably typed if using typescript)

```typescript
async queryFirst<T extends object>(query: string, params?: any[] | undefined): Promise<T | null>
```

Example Usage:

```typescript
const FirstGmailUser = await db.queryFirst<User>("SELECT * FROM users where email LIKE '%gmail.com' ORDER BY ID ASC LIMIT 1");
```

### **executeScalar** - execute query and return a single value as string

```typescript
async executeScalar(query: string, params?: any[]): Promise<string | null>
```

Example Usage:

```typescript
const FirstUserEmail = await db.executeScalar("SELECT email FROM users where id = $1", [1]);
const GetIDByUsername = parseInt(await db.executeScalar("SELECT id FROM users WHERE username = $1", ["someUsername"]));
```

### **execute** - execute query and return number of changed rows

```typescript
async execute(query: string, params?: any[]): Promise<number>
```

Example Usage:

```typescript
const DeletedUsers = await db.execute("DELETE FROM users WHERE email LIKE '%gmail.com'");
console.log(`Deleted ${DeletedUsers} users`);
```

## CRUD helpers

### **insert** - insert row based on schema (making DTOs single source of truth)

```typescript
async insert<T extends object, K extends keyof T>(tableName: string, obj: T, excludeFields: K[] | null = null): Promise<number>
```

Example Usage:

```typescript
class User {
  id?: number;
  username!: string;
  password!: string;
}

await db.insert("users", { username: "test", password: "plainPasswordYuck" });

// or if we want to exclude some properties from inserting (in this example we don't insert id)
const newUser: User = { username: "test", password: "plainPasswordYuck" };
await db.insert("users", newUser, ["id"]);
```

### **insertReturning** - insert row based on schema and return a field as string

```typescript
async insertReturning<T extends object, R extends keyof T, E extends keyof T>(tableName: string, obj: T, returningPropertyName: R, excludeFields: E[] | null = null): Promise<string>
```

Example Usage:

```typescript
// return id after inserting
const newUserID = await db.insertReturning("users", { username: "test", password: "plainPasswordYuck" }, "id");
```

### **update** - update an object based on schema

```typescript
async update<T extends object, K extends keyof T>(tableName: string, obj: T, primaryKeyName: K, excludeFields: K[] | null = null): Promise<number>
```

Example Usage:

```typescript
// update user that has this id with this schema
const newUserID = await db.update("users", { id: 1, username: "changed", password: "plainPasswordYuck" }, "id");
```

### **delete** - delete a row based on a single field

```typescript
async delete(tableName: string, primaryKeyName: string = "id", primaryKeyValue: any): Promise<number>
```

Example Usage:

```typescript
// delete user with id 1
const newUserID = await b.delete("users", "id", 1);
```

## JapperPool vs JapperConnection

**JapperPool** maintains a pool of connections that can be reused. So when you create a new JapperPool you can just issue queries on it whenever you want. The pool can remain opened for ever.
When you want to close the pool you call

    .close()

**JapperConnection** is a one time connection that cannot be reused. So use them wisely! Connections should be opened as short as possible but opening and closing the connection is expensive so you could do multiple queries using one..be smart!

Example Usage:

```typescript
import { JapperConnection } from "japper";

const config = {
  database: "db_name",
  user: "db_username",
  password: "db_password",
  // ....
};

//manually closing connection
const conn = new JapperConnection(config);
await conn.execute("DELETE FROM users"); // first query will automatically open connection
await conn.insert("users", { username: "test", email: "test" });
await conn.close(); //after we're done we close it

// if we need to use db again, we create a new connection again!

// better way (no need to manually close connection)
new JapperConnection(config)(async (cn) => {
  await cn.execute("DELETE FROM users");
  await cn.insert("users", { username: "test", email: "test" });
});
```

## Accessing node-postgres

JapperConnection and JapperPoll have a property named `adapter` which is a node-postgres object!

## Support

japper is free software. If you encounter a bug with the library please open an issue on the [GitHub repo](https://github.com/givemeurhats/japper).

When you open an issue please provide:

- version of Node
- version of Postgres
- smallest possible snippet of code to reproduce the problem

## Contributing

**:heart: contributions!**

I will **happily** accept your pull request if it:

- **has tests**
- added or changed functionality is in the japper philosophy
- does not break backwards compatibility

If your change involves breaking backwards compatibility please please point that out in the pull request & we can discuss & plan when and how to release it and what type of documentation or communication it will require.

### Setting up for local development

1. Clone the repo
2. From your workspace root run `yarn`
3. Ensure you have a PostgreSQL instance running and an empty database for tests
4. Ensure you have the proper environment variables configured for connecting to the instance (see .sample-env and create .env file based on it)
5. Run `yarn test` to run all the tests

## License

Copyright (c) 2020 Eric Jardas (givemeurhats@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
