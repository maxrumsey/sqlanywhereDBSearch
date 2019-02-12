const sqlanywhere = require('sqlanywhere');
const readline = require('readline');
const chalk = require('chalk');
const config = require('./config');
const package = require('./package.json')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const terms = [];

console.log(chalk.bold.underline('SQLANYWHERE DB Search'))
console.log(chalk.bold.underline('Copyright (c) Max Rumsey 2018') + '\n')
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
    rl.question(chalk.underline.green(config.questions.enter_another), (res) => {
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
    if (err) {
      console.log(chalk.bold.red(config.error.query_exec))
      console.log(err);
      return process.exit(1)
    } else if (!output || output.length === 0) {
      console.log(chalk.bold.red('No records returned. Program will now exit.'))
      return process.exit(0)
    } else {
      buildXLDocument(output)
      try {
        const cleanOutput = cleanArray(output)
        console.table(cleanOutput);
      } catch (e) {
        console.log(e)
      }
      console.log('\n\nExiting program. To search for another thing, restart the program.')
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
  console.log('\n')
  const filename = 'c:/Users/Katrin/Desktop' + new Date() + 'output.xlsx'
  wb.write(filename, (err, stats) => {
    if (err) {
      console.log(chalk.red.bold('Error saving file.'))
      console.log(err);
      process.exit(1);
    } else {
      console.log('File Saved As: ' + filename)
    }
  })

}
function cleanArray(input) {
  const newObj;
  for (var i = 0; i < input.length; i++) {
    input[i]
    if (newObj[input[i].patientid]) {
      newObj[input[i].patientid].createdate.push(input[i].createdate)
    } else {
      newObj[input[i].patientid] = {
        createdate: input[i].createdate,
        patientid: input[i].patientid
      }
    }
  }
  const entries = Object.entries(newObj)
  const finalArr = []
  for (var j = 0; j < entries.length; j++) {
    finalArr.push({
      patientid: entries[j][1].patientid,
      createdate: entries[j][1].createdate
    })
  }
  return finalArr;
}
