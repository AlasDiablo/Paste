import express from "express";
import Database from 'better-sqlite3';

const db = new Database('./paste.db', { verbose: console.log });

const quota = 10;

const app = express();

const createDB = db.prepare("CREATE TABLE if not exists paste (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, date DATE, data TEXT)");
createDB.run();

const getIpQuota = (ip) => {
    const stmt = db.prepare("select count(ip) as count from paste where ip = ?");
    return quota - stmt.get(ip).count;
}

app.get('/', (req, res, next) => {
    const quota = getIpQuota(req.ip);
    res.send({quota});
});

app.get('/save', (req, res, next) => {
    const quota = getIpQuota(req.ip);
    if (quota <= 0) {
        res.status(429);
        res.send({quota, error: 'Too Many Requests - You have no more quota available'});
        return;
    }
    const content = req.query['content'];
    if (!content) {
        res.status(400);
        res.send({quota, error: 'Bad Request - Invalid content'});
        return;
    }
    if (content.length >= 8000) {
        res.status(413);
        res.send({quota, error: 'Request Entity Too Large - Encoded data is greater that 8 kB'});
        return;
    }
    const stmt = db.prepare("insert into paste(ip, date, data) values (?, ?, ?)")
    const result = stmt.run(req.ip, new Date().getTime(), content);
    res.send({quota: quota - 1, id: result.lastInsertRowid});
});

app.get('/load', (req, res, next) => {
    const id = req.query['id'];
    if (!id) {
        res.status(400);
        res.send({quota, error: 'Bad Request - Invalid id'});
        return;
    }
    const stmt = db.prepare("select data from paste where id = ?");
    const result = stmt.get(id);
    if (!result) {
        res.send({});
    }
    res.send({content: result.data});
});

setInterval(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const stmt = db.prepare("delete from paste where date < ?");
    stmt.run(date.getTime());
}, 1000 * 60 * 60 * 24);

app.listen(3000);
