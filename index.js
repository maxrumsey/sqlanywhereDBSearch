const sqlanywhere = require('sqlanywhere');
const readline = require('readline');
const chalk = require('chalk');
const config = require('config');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const terms = [];

console.log(chalk.magenta.bgBlue('SQLANYWHERE DB Search'))
console.log(chalk.bold.underline('Copyright (c) Max Rumsey 2018') + '\n')

console.log(chalk.bold('Example Searches:'))
console.log([
  'stick',
  'stick, dog',
  'stick, cat, dog, fish\n'
].join('\n'))
const conn = sqlanywhere.createConnection(config, (err) => {
  if (err) {
    console.log(err);
    return process.exit(1)
  }


})
function GatherTerm(conn) {
  rl.question('Enter your search term(s):\n', (res) => {
    let reqArr = res.split(', ');
    if (typeof reqArr === 'string') {
      reqArr = [res];
    }
    for (var i = 0; i < reqArr.length; i++) {
      if (!(/^[a-zA-Z0-9]+$/.test(reqArr[i]))) {
        console.log(chalk.bold.red('Search Terms can only contain English characters and numbers. (A-Z, 0-9). Search terms must be seperated by a comma and a space.\nYour search term(s) did not follow these rules.'))
        return process.exit(0)
      }
    }
    terms.push(reqArr)
    console.log(`You are able to enter another search term. This will search for records that contain your original query(-ies), ${chalk.bold('or')} your new query.`)
    rl.question('Would you like to enter another search term? (REPLY WITH "yes" or "no")', (res) => {
      if (res.toUpperCase().includes('Y')) {
        GatherTerm(conn);
      } else {
        ExecuteQuery(conn, terms)
      }
    })
  })
}
function ExecuteQuery(conn, terms) {
  console.log(chalk.yellow('Moving to query execution stage.'));
  let query;
  try {
    query = BuildTerms(terms)
  } catch (e) {
    console.log(chalk.bold.red('ERROR WHILE BUILDING SQL QUERY. PROGRAM WILL NOW EXIT.'))
    console.log(e);
    return process.exit(1);
  }
  conn.exec(query, (err, output) => {
    if (err) {
      console.log(chalk.bold.red('ERROR WHILE EXECUTING SQL QUERY. PROGRAM WILL NOW EXIT.'))
      console.log('QUERY: ' + query)
      console.log(err);
      return process.exit(1)
    } else if (!output || output.length === 0) {
      console.log(chalk.bold.red('No records returned.'))
      return process.exit(0)
    } else {
      console.table(output);
    }
  })

}
function BuildTerms(terms) {
  const ORJOINS = []
  for (var i = 0; i < terms.length; i++) {
    const ans = []
    for (var j = 0; j < terms[i].length; j++) {
      ans.push(`(${config.table}.${config.column} like '% ${terms[i][j]} %')`)
    }
    ORJOINS.push(`( ${ans.join(' AND ')} )`)
  }
  const query = `SELECT ${config.affectedcols.join(', ')} FROM ${config.table} WHERE (${ORJOINS.join(' OR ')})`
  return query;
}

//cursor catch
