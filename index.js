require('dotenv').config();

const connectDB = require('./src/db/db');
const app = require('./src/app');

connectDB()
.then( () => {
    app.listen(process.env.PORT || 3000, () => {
        console.log('Server listening on port : ' + process.env.PORT);
    });
})
.catch( (err) => {
    console.log("Mongo Error: " + err);
})