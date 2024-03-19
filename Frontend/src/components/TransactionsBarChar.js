import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';

function TransactionsBarChar() {


  const [barChartData, setBarChartData] = useState({});

  useEffect(() => {
    fetchBarChartData();
  }, []);


  const fetchBarChartData = async () => {
    try {
      const response = await axios.get(`https://s3.amazonaws.com/roxiler.com/product_transaction.json`);
      setBarChartData(response.data);
      drawBarChart(response.data);
    } catch (error) {
      console.error('Error fetching bar chart data:', error);
    }
  };

  const drawBarChart = (data) => {
    const ctx = document.getElementById('bar-chart');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Number of Items',
          data: Object.values(data),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  };

  return (
    <>
    <div>TransactionsBarChar</div>
    <canvas id="bar-chart" width="400" height="400"></canvas>
      </>
  )
}

export default TransactionsBarChar