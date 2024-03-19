const express = require('express')
const router = express.Router()
const axios = require('axios')
const Transaction = require('../models/Transaction') // Ensure this path matches the location of your model


router.get('/init', async (req, res) => {
  try {
    const response = await axios.get(
      'https://s3.amazonaws.com/roxiler.com/product_transaction.json'
    )
    // Assuming the data structure matches the sample you provided.
    const transactions = response.data.map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      description: item.description,
      category: item.category,
      image: item.image,
      sold: item.sold,
      dateOfSale: new Date(item.dateOfSale), 
    }))
    await Transaction.deleteMany() 
    await Transaction.insertMany(transactions)
    res.status(200).send('Database initialized with seed data')
  } catch (error) {
    res.status(500).send('Error initializing the database: ' + error.message)
  }
})

router.get('/', async (req, res) => {
  let { page = 1, perPage = 10, search = '' } = req.query
  page = parseInt(page)
  perPage = parseInt(perPage)

  const searchQuery = {}

  if (search) {
    searchQuery.$or = [
      { productTitle: { $regex: search, $options: 'i' } },
      { productDescription: { $regex: search, $options: 'i' } },
    ]

    if (!isNaN(search)) {
      searchQuery.$or.push({ price: Number(search) })
    }
  }

  try {
    const transactions = await Transaction.find(searchQuery)
      .skip((page - 1) * perPage)
      .limit(perPage)

    const total = await Transaction.countDocuments(searchQuery)

    res.status(200).json({
      data: transactions,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    })
  } catch (error) {
    res.status(500).send('Error fetching transactions: ' + error.message)
  }
})

router.get('/list', async (req, res) => {
  let { page = 1, perPage = 10, search = '' } = req.query
  page = parseInt(page)
  perPage = parseInt(perPage)

  const searchQuery = {}

  if (search) {
    searchQuery.$or = [
      { productTitle: { $regex: search, $options: 'i' } },
      { productDescription: { $regex: search, $options: 'i' } },
      { price: search.match(/^\d+$/) ? Number(search) : undefined },
    ]
  }

  try {
    const transactions = await Transaction.find(
      search.trim() ? searchQuery : {}
    )
      .skip((page - 1) * perPage)
      .limit(perPage)

    const total = await Transaction.countDocuments(
      search.trim() ? searchQuery : {}
    )

    res.json({
      data: transactions,
      total: total,
      page: page,
      totalPages: Math.ceil(total / perPage),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: error.message })
  }
})


router.get('/statistics', async (req, res) => {
  const { month } = req.query 

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res
      .status(400)
      .send("Please provide a month in the format 'YYYY-MM'.")
  }

  const startDate = new Date(`${month}-01T00:00:00.000Z`)
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + 1)

  try {
    const statistics = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSaleAmount: { $sum: '$price' },
          totalSoldItems: { $sum: { $cond: ['$isSold', 1, 0] } },
          totalNotSoldItems: { $sum: { $cond: ['$isSold', 0, 1] } },
        },
      },
    ])

    // If no transactions found, return zeros
    const result = statistics[0] || {
      totalSaleAmount: 0,
      totalSoldItems: 0,
      totalNotSoldItems: 0,
    }

    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: error.message })
  }
})

router.get('/barchart', async (req, res) => {
  const { month } = req.query // "YYYY-MM"

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res
      .status(400)
      .send("Please provide a month in the format 'YYYY-MM'.")
  }

  const startDate = new Date(`${month}-01T00:00:00.000Z`)
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + 1)

  try {
    const priceRanges = [
      { $lt: 101 }, 
      { $gte: 101, $lt: 201 },
      { $gte: 201, $lt: 301 }, 
      { $gte: 301, $lt: 401 },
      { $gte: 401, $lt: 501 }, 
      { $gte: 501, $lt: 601 }, 
      { $gte: 601, $lt: 701 },
      { $gte: 701, $lt: 801 }, 
      { $gte: 801, $lt: 901 }, 
      { $gte: 901 },
    ]

    const barChartData = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $bucket: {
          groupBy: '$price',
          boundaries: [
            0,
            101,
            201,
            301,
            401,
            501,
            601,
            701,
            801,
            901,
            Infinity,
          ],
          default: 'Other',
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ])

    
    res.json(barChartData)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: error.message })
  }
})

router.get('/piechart', async (req, res) => {
  const { month } = req.query // Expecting a month in the format "MM"

  if (!month || !/^\d{2}$/.test(month)) {
    return res.status(400).send("Please provide a month in the format 'MM'.")
  }

  try {
    const pieChartData = await Transaction.aggregate([
      {
        $addFields: {
          month: { $month: '$dateOfSale' },
        },
      },
      {
        $match: {
          month: parseInt(month),
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ])

    
    const formattedResult = pieChartData.map((data) => ({
      category: data._id,
      items: data.count,
    }))

    res.json(formattedResult)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: error.message })
  }
})

router.get('/combined', async (req, res) => {
  const { month } = req.query

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res
      .status(400)
      .send("Please provide a month in the format 'YYYY-MM'.")
  }

  try {
    
    const initData = await getInitData() // Logic from /init endpoint
    const listData = await getListData(month) // Logic from /list endpoint, for the given month
    const statisticsData = await getStatisticsData(month) // Logic from /statistics endpoint, for the given month
    const barChartData = await getBarChartData(month) // Logic from /barchart endpoint, for the given month
    const pieChartData = await getPieChartData(month) // Logic from /piechart endpoint, for the given month

    // Combine all the data into one object
    const combinedData = {
      initData,
      listData,
      statisticsData,
      barChartData,
      pieChartData,
    }

    res.json(combinedData)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: error.message })
  }
})

//
async function getInitData() {
  
  const response = await axios.get(
    'https://s3.amazonaws.com/roxiler.com/product_transaction.json'
  )
  const transactions = response.data
  await Transaction.deleteMany()
  await Transaction.insertMany(transactions)
  return transactions.length 
}


async function getListData(month) {
  
  const startDate = new Date(`${month}-01T00:00:00.000Z`)
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1)

  return await Transaction.find({
    dateOfSale: { $gte: startDate, $lt: endDate },
  }).sort({ dateOfSale: -1 }) 
}

async function getStatisticsData(month) {
  const startDate = new Date(`${month}-01T00:00:00.000Z`);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

  const stats = await Transaction.aggregate([
    { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
    { $group: {
        _id: null,
        totalSaleAmount: { $sum: "$price" },
        totalSoldItems: { $sum: { $cond: ["$isSold",
            1, 0] } },
        totalNotSoldItems: { $sum: { $cond: ["$isSold",
            0, 1] } }
      }
    }
  ]);
 }

async function getBarChartData(month) {
  const startDate = new Date(`${month}-01T00:00:00.000Z`)
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1)

  return await Transaction.aggregate([
    { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
    {
      $bucket: {
        groupBy: '$price',
        boundaries: [0, 101, 201, 301, 401, 501, 601, 701, 801, 901, Infinity],
        default: 'Other',
        output: {
          count: { $sum: 1 },
        },
      },
    },
  ])
}

async function getPieChartData(month) {
  const startDate = new Date(`${month}-01T00:00:00.000Z`)
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1)

  return await Transaction.aggregate([
    { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
  ])
}

module.exports = router

