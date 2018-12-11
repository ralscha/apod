const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);
const directory = 'www/svg';

const keep = [
    'md-search.svg',
    'md-arrow-dropdown.svg',
    'md-close.svg',
    'md-arrow-back.svg',
    'ios-search.svg',
    'ios-arrow-dropdown.svg',
    'ios-close.svg',
    'ios-arrow-back.svg'
	];

async function remove() {
  try {
    const files = await readdir(directory);
	const toBeDeleted = [];
	for (const file of files) {
		if (!keep.includes(file)) {
			toBeDeleted.push(file);
		}
	}
    const unlinkPromises = toBeDeleted.map(filename => unlink(`${directory}/${filename}`));
    return await Promise.all(unlinkPromises);
  } catch(err) {
    console.log(err);
  }
}

remove();