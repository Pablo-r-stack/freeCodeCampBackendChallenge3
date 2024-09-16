require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const urlparser = require('url');
const app = express();

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.urlencoded({ extended: true }));


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//Schema
const Schema = mongoose.Schema;

const UrlSchema = new Schema({
  original_url: {
    type: String,
    required: true,
    unique: true
  },
  short_url: {
    type: Number,
    required: true,
    unique: true
  }
})

//model
const Url = mongoose.model('Url', UrlSchema);


//Crud methods
const createUrl = async (origin) => {
  try {
    const counter = await Url.countDocuments();
    let url = new Url({
      original_url: origin,
      short_url: (counter + 1),
    });
    return await url.save();
  } catch (err) {
    throw new Error('Error while creating URL');
  }
}


const getUrlById = async (shortUrl) => {
  try {
    const existingUrl = await Url.findOne({ short_url: shortUrl }).exec();
    return existingUrl;
  } catch (err) {
    throw new Error('Error while fetching URL');
  }
}

const getUrlByOrigin = async (originalUrl) => {
  try {
    const existingUrl = await Url.findOne({ original_url: originalUrl }).exec();
    return existingUrl;
  } catch (err) {
    throw new Error('Error while fetching URL');
  }
}

// Basic Configuration
const port = process.env.PORT || 3000;



app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;
  // The 'parse' method is deprecated, but I'll use it for the purpose of completing the project.
  dns.lookup(urlparser.parse(url).hostname, async (err, address) => {
    if (!address) {
      res.json({ error: 'Invalid URL' });
    } else {
      console.log('Trying to save', url);
      let existingUrl = await getUrlByOrigin(url);

      if (existingUrl) {
        res.json({ "original_url": existingUrl.original_url, "short_url": existingUrl.short_url });
      } else {
        // Usa await para crear la URL si no existe
        let newUrl = await createUrl(url);
        res.json({ "original_url": newUrl.original_url, "short_url": newUrl.short_url });
      }
    }
  })
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const { short_url } = req.params;
  try {
    const url = await getUrlById(short_url);
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    res.redirect(url.original_url);
  } catch (err) {
    console.error(err);
    res.status(404).send('Not found')
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
