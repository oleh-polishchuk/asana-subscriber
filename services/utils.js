module.exports.changedTaskFilter = event => event && event.type === 'task' && event.action === 'changed';
