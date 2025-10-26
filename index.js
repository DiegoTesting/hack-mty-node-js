const express = require('express');
const morgan = require('morgan');
const passport = require('./utils/auth');
const port = process.env.PORT || 3000   ;

const routes = require('./routes');

const app = express();


// Instalado?
const cors = require('cors');

// CONFIGURAR CORS
const whitelist = [
  'http://localhost:3000',
  'https://myapp.co',
  'http://localhost:4200',
  `https://${process.env.REMOTE_HOST}`,
  'exp://192.168.43.72:8081',
  'http://192.168.43.72:8081',
  'http://localhost:8081',
  'http://192.168.43.185:8081'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir si viene de la lista o si no hay origen (Postman, Curl, servidor interno)
    if (!origin || whitelist.some(url => origin.startsWith(url))) {
      callback(null, true);
    } else {
      console.log('❌ Bloqueado por CORS:', origin);
      callback(new Error('CORS no permitido'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));


app.use(passport.initialize());


routes(app);

app.use((err, req, res, next) => {
    return res.json({ 
        error: err.message 
    });
});
const HOST = "0.0.0.0";
app.listen(port, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${port}`);
});
