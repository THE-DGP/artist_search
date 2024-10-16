// functions/api.js
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

exports.handler = async (event, context) => {
  try {
    await client.connect();
    const db = client.db('local');
    const collection = db.collection('artists');

    const artistName = event.queryStringParameters.q || '';

    if (!artistName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Please provide an artist name.' }),
      };
    }

    const artistDetails = await collection.find({ name: artistName }).toArray();

    if (artistDetails.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'No artist found.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(artistDetails),
    };
  } catch (err) {
    console.error('Error while querying artists:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while querying the database.' }),
    };
  } finally {
    client.close();
  }
};
