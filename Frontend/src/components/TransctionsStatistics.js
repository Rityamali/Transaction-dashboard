import React, { useState, useEffect } from 'react';
import axios from 'axios';


function TransctionsStatistics() {

    const [month, setMonth] = useState('3');
    const [currentPage, setCurrentPage] = useState(1);
    const [statistics, setStatistics] = useState({
        totalSaleAmount: 0,
        totalSoldItems: 0,
        totalNotSoldItems: 0
      })

      useEffect(() => {
        fetchStatistics();
      }, [month,  currentPage])


      const fetchStatistics = async () => {
        try {
          const response = await axios.get(`https://s3.amazonaws.com/roxiler.com/product_transaction.json`)
          setStatistics(response.data);
        } catch (error) {
          console.error('Error fetching statistics:', error)
        }
      }

  return (
    <div>
    <h2>Transaction Statistics</h2>
    <p>Total Sale Amount: {statistics.totalSaleAmount}</p>
    <p>Total Sold Items: {statistics.totalSoldItems}</p>
    <p>Total Not Sold Items: {statistics.totalNotSoldItems}</p>
  </div>
  )
}

export default TransctionsStatistics