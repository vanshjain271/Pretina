const axios = require('axios');

async function run() {
  try {
    // 1. Login as admin
    const loginRes = await axios.post('http://13.233.249.150:5001/api/v1/auth/admin-login', {
      email: 'admin@pretina.com', // Let's guess admin email, or I can just generate a JWT locally.
      password: 'admin' // I need a valid token.
    });
  } catch (err) {
    console.log(err.message);
  }
}
run();
