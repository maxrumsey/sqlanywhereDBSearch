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

const conn = sqlanywhere.createConnection({
  Host: config.Host,
  Password: config.Password,
  UserId: config.UserID,
  DatabaseName: config.DatabaseName
}, (err) => {
  if (err) {
    console.log(err);
    return process.exit(1)
  }


})
function GatherTerm(conn) {
  logExamples()
  rl.question('Enter your search term(s):\n', (res) => {
    let reqArr = res.split(', ');
    if (typeof reqArr === 'string') {
      reqArr = [res];
    }
    for (var i = 0; i < reqArr.length; i++) {
      if (!(/^[a-zA-Z0-9]+$/.test(reqArr[i]))) {
        console.log(chalk.bold.red(config.msg.search_terms_warn))
        return process.exit(0)
      }
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
  console.log(chalk.yellow('Moving to query execution stage.'));
  let query;
  try {
    query = BuildQuery(terms)
  } catch (e) {
    console.log(chalk.bold.red(config.error.query_build))
    console.log(e);
    return process.exit(1);
  }
  console.log(chalk.bold('QUERY: ') + query)
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
      ans.push(`(${config.table}.${config.column} like '% ${terms[i][j]} %')`)
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
    ')'
  ].join(' \n ')
  return query;
}
function logExamples() {
  console.log(chalk.bold('Example Searches:'))
  console.log([
    'stick',
    'stick, dog',
    'stick, cat, dog, fish\n'
  ].join('\n'))
}
//cursor catch
