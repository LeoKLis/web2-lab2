import express from 'express';
import 'dotenv/config'

const app = express();
const DEPLOYED = process.env.RENDER ?? false;
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Hello world!");
});

app.listen(PORT, DEPLOYED ? "0.0.0.0" : "localhost", () => {
    if (DEPLOYED) {
        console.log(`Deployed to render!`);
        console.log(`Url: ${process.env.RENDER_EXTERNAL_URL}`);
    } else {
        console.log(`Deployed locally!`);
    }
    console.log(`Listening on port ${PORT}`);
});