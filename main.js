import express from 'express';
import 'dotenv/config'

const app = express();
const DEPLOYED = process.env.RENDER ?? false;
const HOSTNAME = process.env.RENDER_EXTERNAL_HOSTNAME ?? process.env.HOSTNAME;
const PORT = process.env.PORT;

app.get("/", (req, res) => {
    res.send("Hello world!");
});

app.listen(PORT, HOSTNAME, () => {
    if (DEPLOYED) {
        console.log(`Deployed to render: ${HOSTNAME}`);
        console.log(`Url: ${process.env.RENDER_EXTERNAL_URL}`);
    } else {
        console.log(`Deployed locally: ${HOSTNAME}`);
    }
    console.log(`Listening on port ${PORT}`);
});