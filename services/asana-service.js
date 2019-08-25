const axios = require('axios');
const { log, error } = require("./logger");
const { projects: cachedProjects } = require('./cache-service');

const instance = axios.create({
    baseURL: 'https://app.asana.com/api/1.0/',
    headers: {
        Authorization: `Bearer ${process.env.ASANA_BEARER_TOCKEN}`,
    }
});

instance.defaults.headers.post[ 'Content-Type' ] = 'application/json';

module.exports.getTaskById = (id) => {
    return instance
        .get(`/tasks/${id}`, {
            params: {
                assignee: 'me',
                workspace: `${process.env.ASANA_WORKSPACE}`,
            },
        })
        .then(response => response && response.data && response.data.data)
        .catch(reason => reason && reason.message);
};

module.exports.moveTaskToColumn = (task, projectName, sectionName, shouldAddIfDoesNotBelong = false) => {
    if (!task) {
        throw new Error('Task does not exist!');
    }
    log(`Moving task ${task.gid} to ${projectName} ${sectionName} section`);

    const taskId = task.gid;
    const projects = task.projects;
    let project = projects && projects.find(p => p.name === projectName);
    let projectId = project && project.gid;

    if (!projectId && shouldAddIfDoesNotBelong) {
        project = cachedProjects && cachedProjects.find(p => p.name === projectName);
        projectId = project && project.gid;
    }

    const cachedProject = cachedProjects.find(p => p.id === projectId);
    const cachedSection = cachedProject && cachedProject.sections.find(s => s.name === sectionName);
    const sectionId = cachedSection && cachedSection.gid;

    const isAlreadyInSection = task.memberships && task.memberships.find(m => {
        return m
            && m.project && m.project.name === projectName
            && m.section && m.section.name === sectionName
    });
    if (isAlreadyInSection) {
        return log(`Task ${task.gid} already in ${projectName} ${sectionName} section`)
    }

    if (!projectId) {
        return log(`Task ${task.gid} does not belong to ${projectName}`);
    }
    if (!sectionId) {
        return log(`Section ${sectionName} was not found in cache service`);
    }

    instance
        .post(`/tasks/${taskId}/addProject`, {
            data: {
                task_gid: taskId,
                project: projectId,
                section: sectionId,
            },
        })
        .then(() => log(`Task ${task.gid} was successfully moved to ${projectName} ${sectionName} section`))
        .catch(reason => error(`Error occur during moving task ${task.gid} to ${projectName} ${sectionName} section: ${reason && reason.message}`));
};
