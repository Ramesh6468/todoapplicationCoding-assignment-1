const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());

let db = null;

const initiateDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running");
    });
  } catch (e) {
    console.log(`DBERROR ${e.message}`);
  }
};

initiateDbAndServer();

const checkRequestQuery = async (request, response, next) => {
  const { search_q, category, priority, status, date } = request.query;

  const { todoId } = request.params;
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const findCategory = categoryArray.includes(category);
    if (findCategory === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const findCategory2 = priorityArray.includes(priority);
    if (findCategory2 === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const findCategory3 = statusArray.includes(status);
    if (findCategory3 === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      const formatDate = format(new Date(date), "yyyy-MM-dd");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );
      const isValidDate = await isValid(result);
      if (isValidDate === true) {
        request.date = formatDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;

  next();
};

const checkRequestsBody = (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;

  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    categoryIsInArray = categoryArray.includes(category);

    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    priorityArray = ["HIGH", "MEDIUM", "LOW"];
    priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      console.log(formatedDate);
      const result = toDate(new Date(formatedDate));
      const isValidDate = isValid(result);
      console.log(isValidDate);
      console.log(isValidDate);
      if (isValidDate === true) {
        request.dueDate = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todo = todo;
  request.id = id;

  request.todoId = todoId;

  next();
};

app.get("/todos/", checkRequestQuery, async (request, response) => {
  const { status = "", search_q = "", priority = "", category = "" } = request;
  console.log(status, search_q, priority, category);
  const getTodosQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate 
        FROM 
            todo
        WHERE 
        todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' 
        AND status LIKE '%${status}%' AND category LIKE '%${category}%';`;

  const todosArray = await db.all(getTodosQuery);
  response.send(todosArray);
});

app.get("/todos/:todoId", checkRequestQuery, async (request, response) => {
  const { todoId } = request;

  const getTodosQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM 
            todo            
        WHERE 
            id = ${todoId};`;

  const todo = await db.get(getTodosQuery);
  response.send(todo);
});

app.get("/agenda/", checkRequestQuery, async (request, response) => {
  const { date } = request;
  const selectQuery2 = `SELECT id, todo, priority, status, category, due_date as dueDate FROM todo WHERE due_date = '${date}' `;
  const result2 = await db.all(selectQuery2);

  if (result2 === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    response.send(result2);
  }
});

app.post("/todos/", checkRequestsBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request;
  const postQuery = `INSERT INTO todo (id, todo, priority, status, category, due_date)
  VALUES (
${id}, '${todo}','${priority}','${status}','${category}','${dueDate}'
     
  )
  `;
  const result4 = await db.run(postQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", checkRequestsBody, async (request, response) => {
  const { todoId } = request;
  const { priority, todo, status, category, dueDate } = request;
  let updateTodo = null;
  switch (true) {
    case status !== undefined:
      updateTodo = `UPDATE todo SET status = '${status}' WHERE id = ${todoId}`;
      await db.run(updateTodo);
      response.send("Status Updated");
      break;
    case priority !== undefined:
      updateTodo = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId}`;
      await db.run(updateTodo);
      response.send("Priority Updated");
      break;
    case todo !== undefined:
      updateTodo = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId}`;
      await db.run(updateTodo);
      response.send("Todo Updated");
      break;
    case category !== undefined:
      updateTodo = `UPDATE todo SET category = '${category}' WHERE id = ${todoId}`;
      await db.run(updateTodo);
      response.send("Category Updated");
      break;
    case dueDate !== undefined:
      updateTodo = `UPDATE todo SET due_date = '${dueDate}' WHERE id = ${todoId}`;
      await db.run(updateTodo);
      response.send("Due Date Updated");
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId}`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
