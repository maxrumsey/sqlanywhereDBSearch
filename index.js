const sqlanywhere = require('sqlanywhere');
const readline = require('readline');
const chalk = require('chalk');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(chalk.magenta.bgBlue('SQLANYWHERE DB Search'))
console.log(chalk.bold.underline('Copyright (c) Max Rumsey 2018') + '\n')

console.log(chalk.bold('Example Searches:'))
console.log([
  'stick',
  'stick, dog',
  'stick, cat, dog, fish\n'
].join('\n'))

rl.question('Enter your search term(s):\n', (res) => {
  let reqArr = res.split(', ');
  if (typeof reqArr === 'string') {
    reqArr = [res];
  }
  for (var i = 0; i < reqArr.length; i++) {
    if (!(/^[a-zA-Z0-9]+$/.test(reqArr[i]))) {
      console.log(chalk.bold.red('Search Terms can only contain English characters and numbers. (A-Z, 0-9). Search terms must be seperated by a comma and a space.\nYour search term(s) did not follow these rules.'))
      process.exit(1)
    }
  }
})


//cursor catch
