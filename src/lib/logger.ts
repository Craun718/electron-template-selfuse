import log from 'electron-log';

// electron-log writes to a rotating file under userData and mirrors to the
// terminal. Use the default export throughout the main process.
log.transports.file.level = 'info';
log.transports.console.level = 'info';
log.info('logger initialized');

export default log;
