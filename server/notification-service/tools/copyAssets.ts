import * as shell from 'shelljs';

const source = 'src/emails/';
const destination = 'build/src/emails';

shell.mkdir('-p', destination);
shell.cp('-R', `${source}*`, destination);

console.log(`Copied email templates from ${source} to ${destination}`);
