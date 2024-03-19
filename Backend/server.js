const express = require('express')
const mongoose = require('mongoose')
const axios = require('axios')

// Routes imports
const transactionsRouter = require('./routes/transactions')

const app = express()
app.use(express.json())

const mongoURI =
  'mongodb+srv://ritesh:ritesh@14433cluster.zsohzko.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB...', err))

// Routes
app.use('/api/transactions', transactionsRouter)

// Start the server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
