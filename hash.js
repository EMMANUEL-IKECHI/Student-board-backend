const bcrypt = require('bcryptjs');
const password = 'admin'; // Replace with your actual admin password

bcrypt.hash(password, 10).then(hash => {
    console.log(hash);
});