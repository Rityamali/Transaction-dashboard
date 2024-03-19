import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TransactionsDashboard() {
  const [month, setMonth] = useState('3'); // Default to March
  const [searchText, setSearchText] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [month, searchText, currentPage]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`https://s3.amazonaws.com/roxiler.com/product_transaction.json`);
      setTransactions(response.data);
      setTotalPages(response.headers['x-total-pages'] || 1);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div>
      <h1>Transactions Dashboard</h1>
      <label htmlFor="month">Select Month:</label>
      <select id="month" value={month} onChange={(e) => setMonth(e.target.value)}>
        <option value="1">January</option>
        <option value="2">February</option>
        <option value="3">March</option>
        <option value="4">April</option>
        <option value="5">May</option>
        <option value="6">June</option>
        <option value="7">July</option>
        <option value="8">August</option>
        <option value="9">Septenber</option>
        <option value="10">Octomber</option>
        <option value="11">November</option>
        <option value="12">December</option>
        
      </select>
      <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search transactions..." />
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction._id}>
              <td>{transaction.title}</td>
              <td>{transaction.description}</td>
              <td>{transaction.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handlePrevPage}>Previous</button>
      <button onClick={handleNextPage}>Next</button>
    </div>
  );
}

export default TransactionsDashboard;
