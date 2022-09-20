import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bodyParser from "body-parser";
import fs from 'fs';
import https from 'https';
import config from './server.config.json' assert { type: "json" };

/**
 * Database object
 * @type {Database}
 */
const db = new Database('./paste.db');

/**
 * User quota by moths
 * @type {number}
 */
const quota = config.userQuotaByMoths;

/**
 * RESTFul API
 * @type {Express}
 */
const app = express();

/**
 * Do a preflight for cors origin
 */
app.options('*', cors());
/**
 * Fully enable cors origin
 */
app.use(cors());
/**
 * Add Post handle - json body
 */
app.use(bodyParser.json());
/**
 * Add Post handle - urlencoded body
 */
app.use(bodyParser.urlencoded({ extended: true }));
/**
 * Add Post handle - raw body
 */
app.use(bodyParser.raw());

/**
 * Create database table
 */
const createDB = db.prepare('CREATE TABLE if not exists paste (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, date DATE, data TEXT)');
createDB.run();

/**
 * Get user left quota
 * @param ip{number} User ip
 * @returns {number} quota left
 */
const getIpQuota = (ip) => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const stmt = db.prepare('select count(ip) as count from paste where ip = ? and date > ?');
    return quota - stmt.get(ip, date.getTime()).count;
};

/**
 * Set the default
 * @returns {{quota: number}} left user quota
 */
app.get('/', (req, res) => {
    const leftQuota = getIpQuota(req.ip);
    res.send({ quota: leftQuota });
});

/**
 * Save the given paste
 * @param content{string} Encoded paste data
 * @returns {{quota: number, id: number}} return new quota and the paste id
 */
app.post('/save', (req, res) => {
    const leftQuota = getIpQuota(req.ip);
    if (quota <= 0) {
        res.status(429);
        res.send({ quota: leftQuota, error: 'Too Many Requests - You have no more quota available' });
        return;
    }
    const { content } = req.body;
    if (!content) {
        res.status(400);
        res.send({ quota, error: 'Bad Request - Invalid content' });
        return;
    }
    if (content.length >= config.maxPasteSize) {
        res.status(413);
        res.send({ quota, error: `Request Entity Too Large - Encoded data is greater that ${config.maxPasteSize / 1000} kB` });
        return;
    }
    const stmt = db.prepare('insert into paste(ip, date, data) values (?, ?, ?)');
    const result = stmt.run(req.ip, new Date().getTime(), content);
    res.send({ quota: quota - 1, id: result.lastInsertRowid });
});

/**
 * Load paste content
 * @param id{number} paste id
 * @returns {{content: string}|{}} paste content or en empty object
 */
app.get('/load', (req, res) => {
    const { id } = req.query;
    if (!id) {
        res.status(400);
        res.send({ quota, error: 'Bad Request - Invalid id' });
        return;
    }
    const stmt = db.prepare('select data from paste where id = ?');
    const result = stmt.get(id);
    if (!result) {
        res.send({});
    }
    res.send({ content: result.data });
});

/**
 * Remove outdated paste each x days
 */
setInterval(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - config.pasteDuration);
    const stmt = db.prepare('delete from paste where date < ?');
    stmt.run(date.getTime());
}, (1000 * 60 * 60 * 24) * config.daysBetweenRemoval);

/**
 * Create a http or https server
 */
if (config.useHttps) {
    https.createServer({
                key: fs.readFileSync("key.pem"),
                cert: fs.readFileSync("cert.pem"),
            },
            app,
        ).listen(config.serverPort);
} else {
    app.listen(config.serverPort);
}
