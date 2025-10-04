import React, { useState } from 'react';
import axios from 'axios';

const ExpenseSubmission = () => {
  const [formData, setFormData] = useState({
    amount: '',
    original_currency: 'USD',
    category: '',
    description: '',
    expense_date: '',
    receipt: null
  });
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' }
  ];

  const categories = [
    'Travel',
    'Meals',
    'Office Supplies',
    'Software',
    'Training',
    'Entertainment',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear converted amount when amount or currency changes
    if (name === 'amount' || name === 'original_currency') {
      setConvertedAmount(null);
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      receipt: e.target.files[0]
    }));
  };

  // Optional: Preview conversion before submission
  const previewConversion = async () => {
    if (!formData.amount || formData.original_currency === 'USD') {
      return;
    }

    try {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${formData.original_currency}`
      );
      const rate = response.data.rates.USD;
      const converted = (parseFloat(formData.amount) * rate).toFixed(2);
      setConvertedAmount(converted);
    } catch (error) {
      console.error('Conversion preview error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('amount', formData.amount);
      submitData.append('original_currency', formData.original_currency);
      submitData.append('category', formData.category);
      submitData.append('description', formData.description);
      submitData.append('expense_date', formData.expense_date);
      
      if (formData.receipt) {
        submitData.append('receipt', formData.receipt);
      }

      const response = await axios.post(
        'http://localhost:5000/api/expenses',
        submitData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMessage({ 
        type: 'success', 
        text: 'Expense submitted successfully! Routing to approvers...' 
      });

      // Reset form
      setFormData({
        amount: '',
        original_currency: 'USD',
        category: '',
        description: '',
        expense_date: '',
        receipt: null
      });
      setConvertedAmount(null);

      // Clear file input
      document.getElementById('receipt-input').value = '';

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to submit expense' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="expense-submission-container">
      <h2>Submit New Expense</h2>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-group">
          <label htmlFor="amount">Amount *</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            onBlur={previewConversion}
          />
        </div>

        <div className="form-group">
          <label htmlFor="original_currency">Currency *</label>
          <select
            id="original_currency"
            name="original_currency"
            value={formData.original_currency}
            onChange={handleChange}
            onBlur={previewConversion}
            required
          >
            {currencies.map(curr => (
              <option key={curr.code} value={curr.code}>
                {curr.symbol} {curr.code} - {curr.name}
              </option>
            ))}
          </select>
        </div>

        {convertedAmount && formData.original_currency !== 'USD' && (
          <div className="conversion-preview">
            <small>
              ≈ ${convertedAmount} USD (Company Currency)
            </small>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="expense_date">Expense Date *</label>
          <input
            type="date"
            id="expense_date"
            name="expense_date"
            value={formData.expense_date}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            required
            placeholder="Provide details about this expense..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="receipt-input">Receipt (Optional)</label>
          <input
            type="file"
            id="receipt-input"
            accept="image/*,.pdf"
            onChange={handleFileChange}
          />
          <small>Supported formats: JPG, PNG, PDF (Max 5MB)</small>
        </div>

        <button 
          type="submit" 
          className="btn-submit"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Expense'}
        </button>
      </form>

      <style jsx>{`
        .expense-submission-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        h2 {
          margin-bottom: 20px;
          color: #333;
        }

        .alert {
          padding: 12px;
          margin-bottom: 20px;
          border-radius: 4px;
        }

        .alert-success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .alert-error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .expense-form {
          background: #fff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #555;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #4CAF50;
        }

        .conversion-preview {
          margin-top: -15px;
          margin-bottom: 15px;
          padding: 8px;
          background-color: #e8f5e9;
          border-radius: 4px;
        }

        .conversion-preview small {
          color: #2e7d32;
          font-weight: 500;
        }

        .btn-submit {
          width: 100%;
          padding: 12px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .btn-submit:hover:not(:disabled) {
          background-color: #45a049;
        }

        .btn-submit:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        small {
          display: block;
          margin-top: 5px;
          color: #666;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default ExpenseSubmission;