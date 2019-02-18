const sqlanywhere = require('sqlanywhere');
const readline = require('readline');
const chalk = require('chalk');
const config = require('./config');
const package = require('./package.json')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const fs = require('fs');
const terms = [];

console.log(chalk.bold.underline('SQLANYWHERE DB Search'))
console.log(chalk.bold.underline('Copyright (c) Max Rumsey 2019') + '\n')
console.log(chalk.underline(`Version: ${package.version}`))

console.log(chalk.yellow('\nAttempting to connect to the SQL Anywhere database.'))
const conn = sqlanywhere.createConnection();
conn.connect({
  //Host: config.Host,
  Password: config.Password,
  UserId: config.UserId,
  DatabaseFile: config.DatabaseFile
}, (err) => {
  console.log(chalk.yellow('Connection to the database established.'))
  if (err) {
    console.log(err);
    console.log('Error connecting to database. Process will now exit.')
    return process.exit(1)
  }
  GatherTerm(conn);

})
function GatherTerm(conn) {
  logExamples()
  rl.question(chalk.underline.green('Enter your search term(s), seperated by a comma:\n'), (res) => {
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
    rl.question(chalk.underline.green(config.questions.enter_another) + ' ', (res) => {
      if (res.toUpperCase().includes('Y')) {
        GatherTerm(conn);
      } else {
        ExecuteQuery(conn, terms)
      }
    })
  })
}
function ExecuteQuery(conn, terms) {
  console.log(chalk.yellow('\nExecuting SQL Query.'));
  let query;
  try {
    query = BuildQuery(terms)
  } catch (e) {
    console.log(chalk.bold.red(config.error.query_build))
    console.log(e);
    return process.exit(1);
  }
  conn.exec(query, (err, output) => {
    console.log('\nQuery Finished\n')
    if (err) {
      console.log(chalk.bold.red(config.error.query_exec))
      console.log(err);
      return process.exit(1)
    } else if (!output || output.length === 0) {
      console.log(chalk.bold.red('No records returned. Program will now exit.'))
      console.log('Are you sure the DB is running at this location?: ' + config.Host)
      return process.exit(0)
    } else {
      buildXLDocument(output)
      try {
        console.table(output);
      } catch (e) {
        console.log(e)
      }
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
    'stick                 - Will search the database for all records which contain the word "stick"',
    'stick, dog            - Will search the database for all records which contain both words "stick" and "dog"',
    'stick, cat, dog, fish - Will search the database for all records which contain the words "stick", "cat", "dog", and "fish"\n'
  ].join('\n'))
}
function buildXLDocument(inputArr) {
  const xl = require('excel4node');
  var wb = new xl.Workbook()

  var ws = wb.addWorksheet('Output')

  var style = wb.createStyle({
    font: {
      color: '#FF0800',
      size: 12,
    }
  });
  ws.cell(1, 1)
    .string('Patient ID')
    .style(style)
  ws.cell(1, 2)
    .string('Record Creation Date')
    .style(style)
  for (var i = 0; i < inputArr.length; i++) {
    ws.cell(i+2, 1)
      .string(inputArr[i].patientid)
      .style(style)
    ws.cell(i+2, 2)
      .string(inputArr[i].createdate)
      .style(style)
  }
  console.log('\nFile Output Path:')
  const filename = require('path').join(require('os').homedir(), 'Desktop') + '\\' + `${terms[0].join('_').toUpperCase().replace(/ /g, '_')}.xlsx`
  console.log(filename)
  wb.write(filename, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('File Saved.')
    }
    console.log('The program will now exit.')
    console.log(process.exit(0))
  })

}
''
