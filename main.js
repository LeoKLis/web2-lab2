import express from 'express';
import { randomBytes } from 'node:crypto';
import { Client } from 'pg';
import 'dotenv/config'

const DEPLOYED = process.env.RENDER ?? false;
const PORT = process.env.PORT || 3000;

const client = new Client({
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOSTNAME,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl: true
});
await client.connect();

const app = express();
app.set('view engine', 'pug')
app.use(express.urlencoded({ extended: false }));

const sessions = new Map();

app.use((req, res, next) => {
    const sessionId = req.headers.cookie?.match(/(?:^|;\s*)session_id=([a-f0-9]{64})(?:;|$)/)?.[1];
    const session = sessions.get(sessionId);
    if (session) {
        req.sessionId = sessionId;
        req.session = session;
    }
    next();
});

app.get("/", async (req, res) => {
    let querys = req.query
    let result = [];
    let user = undefined;
    if (querys.search) {
        if (querys.sqli_security === "true") {
            result = (await client.query("SELECT user_id, name FROM users WHERE name ilike $1", [`%${querys.search}%`])).rows;
        } else {
            result = (await client.query(`SELECT * FROM users WHERE name ilike \'%${querys.search}%\'`)).rows;
        }
    }
    if (req.sessionId) {
        user = (await client.query("SELECT * FROM users WHERE user_id = $1", [req.session.user_id])).rows[0] ?? undefined;
    }
    res.render('index', { result: result, user: user });
});

app.get("/create-table-test", async (req, res) => {
    await client.query("CREATE TABLE IF NOT EXISTS test ()");
    res.redirect("/");
});

app.post("/login", async (req, res) => {
    const { user, pass } = req.body ?? {};

    const user_row = await client.query("SELECT * FROM users WHERE username like $1", [user]);
    if (user_row.rowCount !== 1) {
        return res.status(401).send("Neispravno kor. ime ili lozinka.");
    }

    if (user_row.rows[0].password !== pass) {
        return res.status(401).send("Neispravno kor. ime ili lozinka.");
    }

    if (req.sessionId) sessions.delete(req.sessionId);
    const sessionId = randomBytes(32).toString('hex');
    sessions.set(sessionId, {
        user_id: user_row.rows[0].user_id,
    });
    res.cookie('session_id', sessionId, { sameSite: 'none', httpOnly: true, path: '/', secure: true });
    res.redirect('/');
});

app.post('/logout', (req, res) => {
    if (req.sessionId) sessions.delete(req.sessionId);
    res.clearCookie('session_id', sessionCookie);
    res.redirect('/');
});

app.post("/transfer", async (req, res) => {
    const { target_username, amount } = req.body ?? {};

    if (!req.sessionId) {
        return res.status(401).send("Niste ulogirani.")
    }
    let user = (await client.query("SELECT * FROM users WHERE user_id = $1", [req.session.user_id])).rows[0] ?? undefined;
    if (!user) {
        return res.status(404).send("Ulogirani korisnik nije pronadjen.")
    }

    let target_user = await client.query("SELECT * FROM users WHERE username like $1", [target_username]);
    console.log(target_user);
    if (target_user.rowCount !== 1) {
        return res.status(404).send("Ne postoji korisnik s ovim korisnickim imenom.");
    }
    target_user = target_user.rows[0];


    if (parseInt(user.money) < parseInt(amount)) {
        return res.status(400).send("Nemate dovoljno novaca");
    }

    user.money = parseInt(user.money) - parseInt(amount);
    target_user.money = parseInt(target_user.money) + parseInt(amount);

    await client.query("UPDATE users SET money = $1 WHERE user_id = $2", [user.money, user.user_id])
    await client.query("UPDATE users SET money = $1 WHERE user_id = $2", [target_user.money, target_user.user_id])

    res.redirect('/');
})

app.listen(PORT, DEPLOYED ? "0.0.0.0" : "localhost", () => {
    if (DEPLOYED) {
        console.log(`Deployed to render!`);
        console.log(`Url: ${process.env.RENDER_EXTERNAL_URL}`);
        console.log(`Listening on port ${PORT}`);
    } else {
        console.log(`Deployed locally!`);
        console.log(`http://localhost:${PORT}`);
    }
});
