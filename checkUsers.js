const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://leelaprasadpailaa2znaturopathy_db_user:l2sg8C6HzL2mXp6B@cluster0.mljz3f6.mongodb.net/tgh_asset_hub?retryWrites=true&w=majority';
MongoClient.connect(uri)
    .then(client => {
        return client.db().collection('User').find({}).sort({ createdAt: 1 }).toArray();
    })
    .then(docs => {
        docs.forEach(d => console.log(d.name + ' | ' + d.email + ' | ' + d.role));
    })
    .catch(err => console.error(err.message));