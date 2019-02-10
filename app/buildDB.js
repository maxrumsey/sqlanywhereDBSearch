module.exports = () => {
  const sqlanywhere = require('sqlanywhere');
  const conn = sqlanywhere.createConnection();
  return new Promise((resolve, reject) => {
    conn.connect({
      DatabaseFile: 'cstone.db',
      UserID: 'csdbo',
      Password: 'csdbo',
      Host: 'localhost:2638'
    }, (err) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(conn)
      }
    })
  })
}
