require('dotenv').config();

const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { log } = require("./services/logger");
const { changedTaskFilter } = require('./services/utils');
const { getTaskById, moveTaskToColumn } = require("./services/asana-service");
const { isEstablishingWebHookProcess, handleHandShake } = require('./services/webhook-service');

/* Application */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

/* Routes */
app.get('/', (req, res) => fs.readFile('/tmp/default.log', 'utf8', (err, logs) => {
    res.render('index', {
        version: '1.0.1',
        logs: logs,
    });
}));

app.post('/receive-webhook/core-brands-ndc-7654', (req, res) => {
    if (isEstablishingWebHookProcess(req)) {
        return handleHandShake(req, res);
    }

    const events = req.body && req.body.events;
    if (events) {
        log(`Received ${events.length} webhook events`);
        const changedTasksEvents = events.filter(changedTaskFilter);
        if (changedTasksEvents) {
            log(`Found ${changedTasksEvents.length} events with type: task and action: changed`);
            changedTasksEvents.map(event => {
                getTaskById(event.resource).then(task => {
                    if (task && task.completed) {
                        moveTaskToColumn(task, 'Core Brands NDC', 'Archive');
                        moveTaskToColumn(task, 'Core Sprint C (NDC)', 'Archive', true);
                    }
                })
            });
        }
    }

    res.sendStatus(200);
});

app.post('/receive-webhook/core-sprint-c-ndc-7654', (req, res) => {
    if (isEstablishingWebHookProcess(req)) {
        return handleHandShake(req, res);
    }

    const events = req.body && req.body.events;
    if (events) {
        log(`Received ${events.length} webhook events`);
        const changedTasksEvents = events.filter(changedTaskFilter);
        if (changedTasksEvents) {
            log(`Found ${changedTasksEvents.length} events with type: task and action: changed`);
            changedTasksEvents.map(event => {
                getTaskById(event.resource).then(task => {
                    if (task && task.completed) {
                        moveTaskToColumn(task, 'Core Sprint C (NDC)', 'Archive');
                        moveTaskToColumn(task, 'Core Brands NDC', 'Archive', true);
                    }
                })
            });
        }
    }

    res.sendStatus(200);
});

app.listen(process.env.PORT, () => log(`Example app listening on port ${process.env.PORT}!`));
