const sqlanywhere = require('sqlanywhere');
const readline = require('readline');
const chalk = require('chalk');
const config = require('./config');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const terms = [];

console.log(chalk.bold.underline('SQLANYWHERE DB Search'))
console.log(chalk.bold.underline('Copyright (c) Max Rumsey 2018') + '\n')

console.log(chalk.yellow('\nAttempting to connect to database.'))
const conn = sqlanywhere.createConnection();
conn.connect({
  //Host: config.Host,
  Password: config.Password,
  UserId: config.UserId,
  DatabaseFile: config.DatabaseFile
}, (err) => {
  console.log(chalk.yellow('Connection to database made.'))
  if (err) {
    console.log(err);
    return process.exit(1)
  }
  GatherTerm(conn);

})
function GatherTerm(conn) {
  logExamples()
  rl.question(chalk.underline('Enter your search term(s):\n'), (res) => {
    let reqArr = res.split(',');
    if (typeof reqArr === 'string') {
      reqArr = [res];
    }
    for (var i = 0; i < reqArr.length; i++) {
      if (!(/^[a-zA-Z0-9 ]+$/.test(reqArr[i]))) {
        console.log(chalk.bold.red(config.msg.search_terms_warn))
        return process.exit(0)
      }
      reqArr[i] = reqArr[i].toLowerCase()
      reqArr[i] = reqArr[i].trim()
    }
    terms.push(reqArr)
    console.log(config.msg.additional_term)
    rl.question(config.questions.enter_another, (res) => {
      if (res.toUpperCase().includes('Y')) {
        GatherTerm(conn);
      } else {
        ExecuteQuery(conn, terms)
      }
    })
  })
}
function ExecuteQuery(conn, terms) {
  console.log(chalk.yellow('\nMoving to query execution stage.'));
  let query;
  try {
    query = BuildQuery(terms)
  } catch (e) {
    console.log(chalk.bold.red(config.error.query_build))
    console.log(e);
    return process.exit(1);
  }
  conn.exec(query, (err, output) => {
    if (err) {
      console.log(chalk.bold.red(config.error.query_exec))
      console.log(err);
      return process.exit(1)
    } else if (!output || output.length === 0) {
      console.log(chalk.bold.red('No records returned.'))
      return process.exit(0)
    } else {
      console.table(output);
      return process.exit(0)
    }
  })

}
function BuildQuery(terms) {
  const ORJOINS = []
  for (var i = 0; i < terms.length; i++) {
    const ans = []
    for (var j = 0; j < terms[i].length; j++) {
      ans.push(`(LOWER(${config.table}.${config.column}) like '% ${terms[i][j]} %')`)
    }
    ORJOINS.push(`( ${ans.join(' AND ')} )`)
  }
  const query = [
    'SELECT',
    config.affectedcols.join(', '),
    'FROM',
    config.table,
    'WHERE',
    '(',
    ORJOINS.join(' OR '),
    ')',
    'ORDER BY',
    `${config.table}.patientid`
  ].join(' ')
  return query;
}
function logExamples() {
  console.log(chalk.bold('\nExample Searches:'))
  console.log([
    'stick',
    'stick, dog',
    'stick, cat, dog, fish\n'
  ].join('\n'))
}
//cursor catch
