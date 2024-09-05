import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user:"postgres",
  host:"localhost",
  database:"World",
  password:"root",
  port:5432
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  // { id: 1, name: "Angela", color: "teal" },
  // { id: 2, name: "Jack", color: "powderblue" },
  // for visualising how the data look
];

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries JOIN USERS on visited_countries.user_id = users.id where users.id=$1",[currentUserId]);
  
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getUser(){
  const result = await db.query("select * from users");
  users=result.rows;
  return users.find((user) => user.id == currentUserId);

}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUser = await getUser();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const user = getUser();
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;

    try {
      await db.query(
        "INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)",
        [countryCode,currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
// to add new user
app.post("/user", async (req, res) => {
  if (req.body.add==="new"){
    res.render("new.ejs");
  }else{
  currentUserId = req.body.user;
  res.redirect("/");
  }
  
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
 let user_name=req.body.name;
  let color=req.body.color;
  try {
   const result =  await db.query(
      "INSERT INTO users (name,color) VALUES ($1,$2) returning * ",
      [user_name,color]
    );

    const id = result.rows[0].id;
    currentUserId = id;
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
