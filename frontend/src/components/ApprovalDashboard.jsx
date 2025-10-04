import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApprovalDashboard = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [teamExpenses, setTeamExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [approvalModal, setApprovalModal] = useState({ show: false, expense: null });
  const [comments, setComments] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchApprovals();
    fetchTeamExpenses();
  }, []);

  const fetchApprovals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/approvals/pending',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPendingApprovals(response.data);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }
  };

  const fetchTeamExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(
        `http://localhost:5000/api/approvals/team?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setTeamExpenses(response.data);
    } catch (error) {
      console.error('Error fetching team expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    fetchTeamExpenses();
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: ''
    });
    setTimeout(() => fetchTeamExpenses(), 100);
  };

  const openApprovalModal = (expense) => {
    setApprovalModal({ show: true, expense });
    setComments('');
  };

  const closeApprovalModal = () => {
    setApprovalModal({ show: false, expense: null });
    setComments('');
  };

  const handleApproval = async (status) => {
    if (!approvalModal.expense) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/approvals/${approvalModal.expense.approval_id}`,
        { status, comments },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert(response.data.message);
      closeApprovalModal();
      fetchApprovals();
      fetchTeamExpenses();
    } catch (error) {
      if (error.response?.status === 400) {
        alert('Previous approvals must be completed first. You cannot approve this expense yet.');
      } else if (error.response?.status === 403) {
        alert('You are not authorized to approve this expense.');
      } else {
        alert('Error processing approval: ' + (error.response?.data?.error || 'Unknown error'));
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return '#4CAF50';
      case 'Rejected': return '#f44336';
      case 'Pending': return '#ff9800';
      default: return '#757575';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPendingSummary = () => {
    const totalAmount = pendingApprovals.reduce((sum, exp) => 
      sum + parseFloat(exp.converted_amount || exp.amount), 0
    );
    return {
      count: pendingApprovals.length,
      amount: totalAmount.toFixed(2)
    };
  };

  const pendingSummary = getPendingSummary();

  return (
    <div className="approval-dashboard-container">
      <h2>Approval Dashboard</h2>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card pending">
          <h3>Pending Approvals</h3>
          <p className="count">{pendingSummary.count}</p>
          <p className="sub-text">${pendingSummary.amount} Total</p>
        </div>
        <div className="summary-card info">
          <h3>Team Expenses</h3>
          <p className="count">{teamExpenses.length}</p>
          <p className="sub-text">All status</p>
        </div>
      </div>

      {/* Pending Approvals Section */}
      <div className="section">
        <h3>Expenses Requiring Your Approval</h3>
        {pendingApprovals.length === 0 ? (
          <div className="no-items">No pending approvals</div>
        ) : (
          <div className="expenses-grid">
            {pendingApprovals.map((expense) => (
              <div key={expense.id} className="expense-card">
                <div className="card-header">
                  <span className="category-badge">{expense.category}</span>
                  <span className="date">{formatDate(expense.expense_date)}</span>
                </div>
                <div className="card-body">
                  <p className="employee-name">{expense.employee_email}</p>
                  <p className="description">{expense.description}</p>
                  <div className="amount-row">
                    <div>
                      <small>Original:</small>
                      <p>{expense.original_currency} {expense.amount}</p>
                    </div>
                    {expense.converted_amount && (
                      <div>
                        <small>Converted:</small>
                        <p className="converted">${expense.converted_amount}</p>
                      </div>
                    )}
                  </div>
                  {expense.sequence_order > 1 && (
                    <div className="sequence-info">
                      <small>Approval Step: {expense.sequence_order}</small>
                    </div>
                  )}
                </div>
                <div className="card-actions">
                  <button 
                    className="btn-approve"
                    onClick={() => openApprovalModal(expense)}
                  >
                    Review
                  </button>
                  <button 
                    className="btn-details"
                    onClick={() => setSelectedExpense(expense)}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Expenses Section */}
      <div className="section">
        <h3>Team Expenses History</h3>
        
        {/* Filters */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>Status</label>
              <select 
                name="status" 
                value={filters.status} 
                onChange={handleFilterChange}
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-actions">
              <button className="btn-filter" onClick={applyFilters}>
                Apply
              </button>
              <button className="btn-clear" onClick={clearFilters}>
                Clear
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading team expenses...</div>
        ) : teamExpenses.length === 0 ? (
          <div className="no-items">No team expenses found</div>
        ) : (
          <div className="expenses-table-container">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.employee_email}</td>
                    <td>{formatDate(expense.expense_date)}</td>
                    <td>
                      <span className="category-badge">{expense.category}</span>
                    </td>
                    <td className="description-cell">{expense.description}</td>
                    <td>
                      ${expense.converted_amount || expense.amount}
                      {expense.company_currency && ` ${expense.company_currency}`}
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(expense.status) }}
                      >
                        {expense.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-view"
                        onClick={() => setSelectedExpense(expense)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {approvalModal.show && (
        <div className="modal-overlay" onClick={closeApprovalModal}>
          <div className="modal-content approval-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Review Expense</h3>
              <button className="btn-close" onClick={closeApprovalModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <strong>Employee:</strong>
                <span>{approvalModal.expense.employee_email}</span>
              </div>
              <div className="detail-row">
                <strong>Category:</strong>
                <span>{approvalModal.expense.category}</span>
              </div>
              <div className="detail-row">
                <strong>Date:</strong>
                <span>{formatDate(approvalModal.expense.expense_date)}</span>
              </div>
              <div className="detail-row">
                <strong>Description:</strong>
                <span>{approvalModal.expense.description}</span>
              </div>
              <div className="detail-row">
                <strong>Original Amount:</strong>
                <span>
                  {approvalModal.expense.original_currency} {approvalModal.expense.amount}
                </span>
              </div>
              {approvalModal.expense.converted_amount && (
                <div className="detail-row">
                  <strong>Converted Amount:</strong>
                  <span>${approvalModal.expense.converted_amount} USD</span>
                </div>
              )}
              {approvalModal.expense.sequence_order > 1 && (
                <div className="detail-row highlight">
                  <strong>Approval Sequence:</strong>
                  <span>Step {approvalModal.expense.sequence_order}</span>
                </div>
              )}

              <div className="comments-section">
                <label htmlFor="comments">Comments (Optional):</label>
                <textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add comments about this approval..."
                  rows="3"
                />
              </div>

              <div className="approval-actions">
                <button 
                  className="btn-approve-action"
                  onClick={() => handleApproval('Approved')}
                >
                  ✓ Approve
                </button>
                <button 
                  className="btn-reject-action"
                  onClick={() => handleApproval('Rejected')}
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Details Modal */}
      {selectedExpense && (
        <div className="modal-overlay" onClick={() => setSelectedExpense(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Expense Details</h3>
              <button className="btn-close" onClick={() => setSelectedExpense(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <strong>Employee:</strong>
                <span>{selectedExpense.employee_email}</span>
              </div>
              <div className="detail-row">
                <strong>Date:</strong>
                <span>{formatDate(selectedExpense.expense_date)}</span>
              </div>
              <div className="detail-row">
                <strong>Category:</strong>
                <span>{selectedExpense.category}</span>
              </div>
              <div className="detail-row">
                <strong>Description:</strong>
                <span>{selectedExpense.description}</span>
              </div>
              <div className="detail-row">
                <strong>Original Amount:</strong>
                <span>
                  {selectedExpense.original_currency} {selectedExpense.amount}
                </span>
              </div>
              {selectedExpense.converted_amount && (
                <div className="detail-row">
                  <strong>Converted Amount:</strong>
                  <span>
                    ${selectedExpense.converted_amount} {selectedExpense.company_currency}
                  </span>
                </div>
              )}
              <div className="detail-row">
                <strong>Status:</strong>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(selectedExpense.status) }}
                >
                  {selectedExpense.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .approval-dashboard-container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        h2 {
          margin-bottom: 20px;
          color: #333;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .summary-card {
          background: white;
          padding: 25px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .summary-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
        }

        .summary-card .count {
          font-size: 36px;
          font-weight: bold;
          margin: 10px 0;
        }

        .summary-card.pending .count { color: #ff9800; }
        .summary-card.info .count { color: #2196F3; }

        .summary-card .sub-text {
          margin: 0;
          font-size: 14px;
          color: #999;
        }

        .section {
          background: white;
          padding: 25px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 25px;
        }

        .section h3 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .expenses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .expense-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          transition: box-shadow 0.3s;
        }

        .expense-card:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .card-header {
          background-color: #f5f5f5;
          padding: 12px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-body {
          padding: 15px;
        }

        .employee-name {
          font-weight: 600;
          color: #333;
          margin: 0 0 8px 0;
        }

        .description {
          color: #666;
          font-size: 14px;
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        .amount-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 10px 0;
          border-top: 1px solid #f0f0f0;
        }

        .amount-row small {
          display: block;
          color: #999;
          font-size: 11px;
          margin-bottom: 2px;
        }

        .amount-row p {
          margin: 0;
          font-weight: 600;
          color: #333;
        }

        .amount-row .converted {
          color: #4CAF50;
        }

        .sequence-info {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #f0f0f0;
        }

        .sequence-info small {
          color: #2196F3;
          font-weight: 500;
        }

        .card-actions {
          display: flex;
          gap: 10px;
          padding: 12px 15px;
          background-color: #fafafa;
        }

        .btn-approve,
        .btn-details,
        .btn-view {
          flex: 1;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-approve {
          background-color: #4CAF50;
          color: white;
        }

        .btn-approve:hover {
          background-color: #45a049;
        }

        .btn-details,
        .btn-view {
          background-color: #2196F3;
          color: white;
        }

        .btn-details:hover,
        .btn-view:hover {
          background-color: #1976d2;
        }

        .filters-section {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .filters-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          align-items: end;
        }

        .filter-group label {
          display: block;
          margin-bottom: 5px;
          font-size: 13px;
          color: #555;
        }

        .filter-group select,
        .filter-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .filter-actions {
          display: flex;
          gap: 8px;
        }

        .btn-filter,
        .btn-clear {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-filter {
          background-color: #4CAF50;
          color: white;
        }

        .btn-filter:hover {
          background-color: #45a049;
        }

        .btn-clear {
          background-color: #f0f0f0;
          color: #333;
        }

        .btn-clear:hover {
          background-color: #e0e0e0;
        }

        .expenses-table-container {
          overflow-x: auto;
        }

        .expenses-table {
          width: 100%;
          border-collapse: collapse;
        }

        .expenses-table th,
        .expenses-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .expenses-table th {
          background-color: #f5f5f5;
          font-weight: 600;
          color: #555;
          font-size: 13px;
        }

        .description-cell {
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .category-badge {
          background-color: #e3f2fd;
          color: #1976d2;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .date {
          font-size: 13px;
          color: #666;
        }

        .status-badge {
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }

        .loading,
        .no-items {
          text-align: center;
          padding: 40px;
          color: #999;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 85vh;
          overflow-y: auto;
        }

        .approval-modal {
          max-width: 500px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h3 {
          margin: 0;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #666;
          line-height: 1;
        }

        .btn-close:hover {
          color: #333;
        }

        .modal-body {
          padding: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-row strong {
          color: #555;
        }

        .detail-row.highlight {
          background-color: #e3f2fd;
          padding: 12px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .comments-section {
          margin: 20px 0;
        }

        .comments-section label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #555;
        }

        .comments-section textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          resize: vertical;
        }

        .approval-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 20px;
        }

        .btn-approve-action,
        .btn-reject-action {
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-approve-action {
          background-color: #4CAF50;
          color: white;
        }

        .btn-approve-action:hover {
          background-color: #45a049;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
        }

        .btn-reject-action {
          background-color: #f44336;
          color: white;
        }

        .btn-reject-action:hover {
          background-color: #da190b;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
        }
      `}</style>
    </div>
  );
};

export default ApprovalDashboard;