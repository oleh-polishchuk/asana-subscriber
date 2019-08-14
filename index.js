const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');

/* Application */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* Constants */
const PORT = 8080;
const CONSTANTS = {
    ASANA_WORKSPACE: "352710604643046",
    ASANA_BEARER_TOCKEN: "0/74746f068e09df47ba8a729dd8bc166f",
};

const instance = axios.create({
    baseURL: 'https://app.asana.com/api/1.0/',
    headers: {
        Authorization: `Bearer ${CONSTANTS.ASANA_BEARER_TOCKEN}`,
    }
});

instance.defaults.headers.post[ 'Content-Type' ] = 'application/json';

const getTaskById = (id) => {
    return instance.get(`/tasks/${id}`, {
        params: {
            assignee: 'me',
            workspace: `${CONSTANTS.ASANA_WORKSPACE}`,
        },
    }).then(response => response && response.data && response.data.data)
};

const markTaskAsCompleted = (task) => {
    if (!task) {
        throw new Error('Task does not exist!');
    }

    const taskId = task.gid;
    const projects = task.projects;
    const project = projects && projects.find(p => p.name === 'Core Brands NDC');
    const projectId = project && project.gid;

    const section = {
        "id": 804519931728554,
        "gid": "804519931728554",
        "name": "Archive",
        "resource_type": "section"
    };

    const sectionId = section && section.gid;

    return instance.post(`/tasks/${taskId}/addProject`, {
        data: {
            task_gid: taskId,
            project: projectId,
            section: sectionId,
        },
    }).then(response => {
        return response;
    }).catch(reason => {
        return reason && reason.message;
    });
};

/* Routes */
app.get('/', (req, res) => res.send('Hello World!'));

app.post('/receive-webhook/7654', (req, res) => {
    let xHookSecretValue = req.headers[ 'x-hook-secret' ];

    console.log('Req received with header[x-hook-secret]:' + xHookSecretValue);
    // console.log(req.body);

    if (req.body && req.body.events && req.body.events.length) {
        const firstChangedTaskEvent = req.body.events.find(event => event.type === 'task' && event.action === 'changed');
        if (firstChangedTaskEvent && firstChangedTaskEvent.resource) {
            getTaskById(firstChangedTaskEvent.resource)
                .then(task => {
                    if (task && task.completed) {
                        markTaskAsCompleted(task).then(response => {
                            console.log(response)
                        })
                    }
                    console.log(task.completed);
                })
                .catch(reason => {
                    console.log("Error:", reason);
                    res
                        .set("x-hook-secret", xHookSecretValue)
                        .sendStatus(200);
                })
        }
    }

    res
        .set("x-hook-secret", xHookSecretValue)
        .sendStatus(200);
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
