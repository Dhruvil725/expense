// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const Dashboard = ({ user, onLogout }) => {
//   const [users, setUsers] = useState([]);
//   const [expenses, setExpenses] = useState([]);
//   const [newUser, setNewUser] = useState({ email: '', password: '', role: 'Employee', manager_id: '' });
//   const [newRule, setNewRule] = useState({ is_manager_first: false, approvers: [], rule_type: 'Sequential', threshold_percentage: 0, specific_approver_id: '' });
//   const [newExpense, setNewExpense] = useState({ amount: '', original_currency: '', category: '', description: '', expense_date: '' });
//   const [pendingApprovals, setPendingApprovals] = useState([]);
//   const [teamExpenses, setTeamExpenses] = useState([]);
//   const [currencies, setCurrencies] = useState([]);
//   const [expenseFilter, setExpenseFilter] = useState({ status: '', startDate: '', endDate: '' });
//   const [teamExpenseFilter, setTeamExpenseFilter] = useState({ status: '', startDate: '', endDate: '' });
//   const [approvalComments, setApprovalComments] = useState({});

//   const ruleDescriptions = {
//     'Sequential': 'All approvers must approve in sequence.',
//     'Percentage': 'Requires X% of approvers to approve.',
//     'SpecificApprover': 'Only specific approver can approve.',
//     'Hybrid': 'Combination of percentage OR specific approver.'
//   };

//   const fetchCurrencies = async () => {
//     try {
//       const res = await axios.get('https://restcountries.com/v3.1/all?fields=currencies');
//       const currencySet = new Set();
//       res.data.forEach(country => {
//         if (country.currencies) {
//           Object.keys(country.currencies).forEach(curr => currencySet.add(curr));
//         }
//       });
//       setCurrencies(Array.from(currencySet).sort());
//     } catch (err) {
//       console.error('Error fetching currencies:', err);
//     }
//   };

//   useEffect(() => {
//     fetchCurrencies();
//     if (user.role === 'Admin') {
//       fetchUsers();
//       fetchExpenses();
//       fetchApprovalRules();
//     } else if (user.role === 'Manager') {
//       fetchPendingApprovals();
//       fetchTeamExpenses();
//     } else if (user.role === 'Employee') {
//       fetchUserExpenses();
//     }
//   }, [user]);

//   useEffect(() => {
//     if (user.role === 'Manager') {
//       fetchTeamExpenses();
//     }
//   }, [teamExpenseFilter]);

//   useEffect(() => {
//     if (user.role === 'Employee') {
//       fetchUserExpenses();
//     }
//   }, [expenseFilter]);

//   const fetchUsers = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
//       setUsers(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const fetchExpenses = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/expenses', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
//       setExpenses(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleCreateUser = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.post('http://localhost:5000/users', newUser, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
//       fetchUsers();
//       setNewUser({ email: '', password: '', role: 'Employee', manager_id: '' });
//       alert('User created successfully');
//     } catch (err) {
//       alert(err.response?.data?.error || 'Error creating user');
//     }
//   };

//   const handleUpdateUser = async (id, updates) => {
//     try {
//       await axios.put(`http://localhost:5000/users/${id}`, updates, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
//       fetchUsers();
//     } catch (err) {
//       alert(err.response?.data?.error || 'Error updating user');
//     }
//   };

//   const handleUpdateRule = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.post('http://localhost:5000/approval-rules', newRule, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
//       await fetchApprovalRules();
//       alert('Approval rules updated successfully');
//     } catch (err) {
//       alert(err.response?.data?.error || 'Error updating rules');
//     }
//   };

//   const handleOverrideStatus = async (id, status) => {
//     try {
//       await axios.put(`http://localhost:5000/expenses/${id}/status`, { status }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
//       fetchExpenses();
//       alert(`Expense ${status.toLowerCase()} successfully`);
//     } catch (err) {
//       alert(err.response?.data?.error || 'Error updating expense');
//     }
//   };

//   const fetchPendingApprovals = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/approvals/pending', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
//       setPendingApprovals(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const fetchTeamExpenses = async () => {
//     try {
//       const params = new URLSearchParams();
//       if (teamExpenseFilter.status) params.append('status', teamExpenseFilter.status);
//       if (teamExpenseFilter.startDate) params.append('startDate', teamExpenseFilter.startDate);
//       if (teamExpenseFilter.endDate) params.append('endDate', teamExpenseFilter.endDate);

//       const res = await axios.get(`http://localhost:5000/approvals/team?${params.toString()}`, { 
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
//       });
//       setTeamExpenses(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const fetchUserExpenses = async () => {
//     try {
//       const params = new URLSearchParams();
//       if (expenseFilter.status) params.append('status', expenseFilter.status);
//       if (expenseFilter.startDate) params.append('startDate', expenseFilter.startDate);
//       if (expenseFilter.endDate) params.append('endDate', expenseFilter.endDate);

//       const res = await axios.get(`http://localhost:5000/expense-submission?${params.toString()}`, { 
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
//       });
//       setExpenses(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const fetchApprovalRules = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/approval-rules', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
//       if (res.data) {
//         setNewRule({
//           is_manager_first: res.data.is_manager_first || false,
//           approvers: res.data.approvers ? JSON.parse(res.data.approvers) : [],
//           rule_type: res.data.rule_type || 'Sequential',
//           threshold_percentage: res.data.threshold_percentage || 0,
//           specific_approver_id: res.data.specific_approver_id || ''
//         });
//       }
//     } catch (err) {
//       console.error('Error fetching approval rules:', err);
//     }
//   };

//   const handleSubmitExpense = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.post('http://localhost:5000/expense-submission', newExpense, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
//       setNewExpense({ amount: '', original_currency: '', category: '', description: '', expense_date: '' });
//       fetchUserExpenses();
//       alert('Expense submitted successfully');
//     } catch (err) {
//       alert(err.response?.data?.error || 'Error submitting expense');
//     }
//   };

//   const handleApprove = async (id, status) => {
//     const comments = approvalComments[id] || '';
  
//     if (status === 'Rejected' && !comments.trim()) {
//     alert('Please provide comments for rejection');
//     return;
//     }

//     try {
//       await axios.put(`http://localhost:5000/approvals/${id}`, { status, comments }, { 
//       headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
//       });
//       fetchPendingApprovals();
//       fetchTeamExpenses();
//       setApprovalComments({ ...approvalComments, [id]: '' });
//       alert(`Expense ${status.toLowerCase()} successfully`);
//     }   catch (err) {
//       alert(err.response?.data?.error || 'Error processing approval');
//     }
//   };

//   if (!user) {
//     return (
//       <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//         <div className="spinner"></div>
//       </div>
//     );
//   }

//   const getStatusBadge = (status) => {
//     const statusClass = status === 'Pending' ? 'status-pending' : status === 'Approved' ? 'status-approved' : 'status-rejected';
//     return <span className={`status-badge ${statusClass}`}>{status}</span>;
//   };

//   const getRoleBadge = (role) => {
//     const roleClass = role === 'Admin' ? 'role-admin' : role === 'Manager' ? 'role-manager' : 'role-employee';
//     return <span className={`role-badge ${roleClass}`}>{role}</span>;
//   };

//   return (
//     <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
//       <header>
//         <div className="header-content">
//           <h1 className="logo">Expense Management System</h1>
//           <div className="user-info">
//             <div>
//               <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Welcome back,</div>
//               <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>{user.email}</div>
//               {getRoleBadge(user.role)}
//             </div>
//             <button onClick={onLogout} className="danger">Logout</button>
//           </div>
//         </div>
//       </header>

//       <main className="page-container">
//         {user.role === 'Admin' && (
//           <>
//             <div className="page-title">Admin Dashboard</div>
//             <div className="page-subtitle">Manage users, approval rules, and oversee all expenses</div>

//             <div className="grid grid-cols-3">
//               <section className="section">
//                 <div className="section-header">
//                   <h3 className="section-title">User Management</h3>
//                 </div>
//                 <form onSubmit={handleCreateUser}>
//                   <div className="form-group">
//                     <label>Email Address</label>
//                     <input type="email" placeholder="user@company.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
//                   </div>
//                   <div className="form-group">
//                     <label>Password</label>
//                     <input type="password" placeholder="Enter password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
//                   </div>
//                   <div className="form-row">
//                     <div className="form-group">
//                       <label>Role</label>
//                       <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
//                         <option value="Employee">Employee</option>
//                         <option value="Manager">Manager</option>
//                       </select>
//                     </div>
//                     <div className="form-group">
//                       <label>Manager ID</label>
//                       <input type="number" placeholder="Manager ID" value={newUser.manager_id} onChange={(e) => setNewUser({ ...newUser, manager_id: e.target.value })} />
//                     </div>
//                   </div>
//                   <button type="submit" className="btn-full">Create User</button>
//                 </form>

//                 <div className="divider"></div>

//                 <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: '#334155' }}>All Users</h4>
//                 <div className="table-container">
//                   <table>
//                     <thead>
//                       <tr>
//                         <th>ID</th>
//                         <th>Email</th>
//                         <th>Role</th>
//                         <th>Action</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {users.map(u => (
//                         <tr key={u.id}>
//                           <td>{u.id}</td>
//                           <td>{u.email}</td>
//                           <td>{getRoleBadge(u.role)}</td>
//                           <td>
//                             <button onClick={() => handleUpdateUser(u.id, { role: u.role === 'Employee' ? 'Manager' : 'Employee' })} className="small secondary">
//                               Toggle Role
//                             </button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </section>

//               <section className="section">
//                 <div className="section-header">
//                   <h3 className="section-title">Approval Rules</h3>
//                 </div>
//                 <form onSubmit={handleUpdateRule}>
//                   <div className="checkbox-group">
//                     <input type="checkbox" id="managerFirst" checked={newRule.is_manager_first} onChange={(e) => setNewRule({ ...newRule, is_manager_first: e.target.checked })} />
//                     <label htmlFor="managerFirst">Manager approval required first</label>
//                   </div>

//                   <div className="form-group">
//                     <label>Approvers (User IDs)</label>
//                     <textarea placeholder='[2, 3, 4]' value={JSON.stringify(newRule.approvers)} onChange={(e) => {
//                       try {
//                         setNewRule({ ...newRule, approvers: JSON.parse(e.target.value || '[]') });
//                       } catch (err) {}
//                     }} rows={3} />
//                     <p className="help-text">Enter user IDs as JSON array</p>
//                   </div>

//                   <div className="form-group">
//                     <label>Rule Type</label>
//                     <select value={newRule.rule_type} onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value })}>
//                       <option value="Sequential">Sequential</option>
//                       <option value="Percentage">Percentage</option>
//                       <option value="SpecificApprover">Specific Approver</option>
//                       <option value="Hybrid">Hybrid</option>
//                     </select>
//                     <p className="help-text">{ruleDescriptions[newRule.rule_type]}</p>
//                   </div>

//                   {(newRule.rule_type === 'Percentage' || newRule.rule_type === 'Hybrid') && (
//                     <div className="form-group">
//                       <label>Threshold Percentage</label>
//                       <input type="number" placeholder="60" min="1" max="100" value={newRule.threshold_percentage} onChange={(e) => setNewRule({ ...newRule, threshold_percentage: e.target.value })} />
//                     </div>
//                   )}

//                   {(newRule.rule_type === 'SpecificApprover' || newRule.rule_type === 'Hybrid') && (
//                     <div className="form-group">
//                       <label>Specific Approver ID</label>
//                       <input type="number" placeholder="User ID" value={newRule.specific_approver_id} onChange={(e) => setNewRule({ ...newRule, specific_approver_id: e.target.value })} />
//                     </div>
//                   )}

//                   <button type="submit" className="btn-full">Update Approval Rules</button>
//                 </form>
//               </section>

//               <section className="section">
//                 <div className="section-header">
//                   <h3 className="section-title">All Expenses</h3>
//                 </div>
//                 <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
//                   {expenses.length === 0 ? (
//                     <div className="empty-state">
//                       <div className="empty-state-icon">📊</div>
//                       <div className="empty-state-text">No expenses yet</div>
//                     </div>
//                   ) : (
//                     <div className="table-container">
//                       <table>
//                         <thead>
//                           <tr>
//                             <th>Employee</th>
//                             <th>Amount</th>
//                             <th>Status</th>
//                             <th>Actions</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {expenses.map(e => (
//                             <tr key={e.id}>
//                               <td>{e.employee_email}</td>
//                               <td>${e.amount}</td>
//                               <td>{getStatusBadge(e.status)}</td>
//                               <td>
//                                 <div style={{ display: 'flex', gap: '0.5rem' }}>
//                                   <button onClick={() => handleOverrideStatus(e.id, 'Approved')} className="small success">Approve</button>
//                                   <button onClick={() => handleOverrideStatus(e.id, 'Rejected')} className="small danger">Reject</button>
//                                 </div>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </div>
//               </section>
//             </div>
//           </>
//         )}

//         {user.role === 'Manager' && (
//           <>
//             <div className="page-title">Manager Dashboard</div>
//             <div className="page-subtitle">Review pending approvals and monitor team expenses</div>

//             <div className="grid grid-cols-2">
//               <section className="section">
//                 <div className="section-header">
//                   <h3 className="section-title">Pending Approvals</h3>
//                   <span className="status-badge status-pending">{pendingApprovals.length} Pending</span>
//                 </div>
//                 <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
//                   {pendingApprovals.length === 0 ? (
//                     <div className="empty-state">
//                       <div className="empty-state-icon">✓</div>
//                       <div className="empty-state-text">All caught up!</div>
//                     </div>
//                   ) : (
//                     pendingApprovals.map(a => (
//                       <div key={a.id} className="card">
//                         <div style={{ marginBottom: '1rem' }}>
//                           <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
//                             {a.converted_amount} {a.company_currency}
//                           </div>
//                           {a.original_currency !== a.company_currency && (
//                             <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
//                               Original: {a.amount} {a.original_currency}
//                             </div>
//                           )}
//                         </div>
//                         <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
//                           <strong>Employee:</strong> {a.employee_email}
//                         </div>
//                         <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
//                           <strong>Category:</strong> {a.category}
//                         </div>
//                         <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
//                           <strong>Description:</strong> {a.description}
//                         </div>
                        
//                         <div className="form-group" style={{ marginBottom: '1rem' }}>
//                           <label>Comments (Required for rejection)</label>
//                           <textarea 
//                             placeholder="Add your comments here..."
//                             value={approvalComments[a.id] || ''}
//                             onChange={(e) => setApprovalComments({ ...approvalComments, [a.id]: e.target.value })}
//                             rows={3}
//                           />
//                         </div>

//                         <div className="btn-group">
//                           <button onClick={() => handleApprove(a.id, 'Approved')} className="success">Approve</button>
//                           <button onClick={() => handleApprove(a.id, 'Rejected')} className="danger">Reject</button>
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </section>

//               <section className="section">
//                 <div className="section-header">
//                   <h3 className="section-title">Team Expenses</h3>
//                 </div>
                
//                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
//                   <div className="form-group" style={{ margin: 0 }}>
//                     <label>Status</label>
//                     <select value={teamExpenseFilter.status} onChange={(e) => setTeamExpenseFilter({ ...teamExpenseFilter, status: e.target.value })}>
//                       <option value="">All Status</option>
//                       <option value="Pending">Pending</option>
//                       <option value="Approved">Approved</option>
//                       <option value="Rejected">Rejected</option>
//                     </select>
//                   </div>
//                   <div className="form-group" style={{ margin: 0 }}>
//                     <label>Start Date</label>
//                     <input type="date" value={teamExpenseFilter.startDate} onChange={(e) => setTeamExpenseFilter({ ...teamExpenseFilter, startDate: e.target.value })} />
//                   </div>
//                   <div className="form-group" style={{ margin: 0 }}>
//                     <label>End Date</label>
//                     <input type="date" value={teamExpenseFilter.endDate} onChange={(e) => setTeamExpenseFilter({ ...teamExpenseFilter, endDate: e.target.value })} />
//                   </div>
//                 </div>

//                 <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
//                   {teamExpenses.length === 0 ? (
//                     <div className="empty-state">
//                       <div className="empty-state-icon">📋</div>
//                       <div className="empty-state-text">No expenses found</div>
//                     </div>
//                   ) : (
//                     <div className="table-container">
//                       <table>
//                         <thead>
//                           <tr>
//                             <th>Employee</th>
//                             <th>Amount</th>
//                             <th>Category</th>
//                             <th>Date</th>
//                             <th>Status</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {teamExpenses.map(e => (
//                             <tr key={e.id}>
//                               <td>{e.employee_email}</td>
//                               <td>
//                                 <div style={{ fontWeight: 600 }}>{e.converted_amount} {e.company_currency}</div>
//                                 {e.original_currency !== e.company_currency && (
//                                   <div style={{ fontSize: '0.75rem', color: '#64748b' }}>({e.amount} {e.original_currency})</div>
//                                 )}
//                               </td>
//                               <td>{e.category}</td>
//                               <td>{new Date(e.expense_date).toLocaleDateString()}</td>
//                               <td>{getStatusBadge(e.status)}</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </div>
//               </section>
//             </div>
//           </>
//         )}

//         {user.role === 'Employee' && (
//   <>
//     <div className="page-title">Employee Dashboard</div>
//     <div className="page-subtitle">
//       Submit expenses and track your reimbursements
//     </div>

//     <div className="grid grid-cols-2">
//       <section className="section">
//         <div className="section-header">
//           <h3 className="section-title">Submit New Expense</h3>
//         </div>
//         <form onSubmit={handleSubmitExpense}>
//           <div className="form-row">
//             <div className="form-group">
//               <label>Amount</label>
//               <input
//                 type="number"
//                 step="0.01"
//                 placeholder="0.00"
//                 value={newExpense.amount}
//                 onChange={(e) =>
//                   setNewExpense({ ...newExpense, amount: e.target.value })
//                 }
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label>Currency</label>
//               <select
//                 value={newExpense.original_currency}
//                 onChange={(e) =>
//                   setNewExpense({
//                     ...newExpense,
//                     original_currency: e.target.value,
//                   })
//                 }
//                 required
//               >
//                 <option value="">Select Currency</option>
//                 {currencies.slice(0, 50).map((curr) => (
//                   <option key={curr} value={curr}>
//                     {curr}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="form-group">
//             <label>Category</label>
//             <input
//               type="text"
//               placeholder="e.g., Travel, Food"
//               value={newExpense.category}
//               onChange={(e) =>
//                 setNewExpense({ ...newExpense, category: e.target.value })
//               }
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label>Description</label>
//             <textarea
//               placeholder="Provide details..."
//               value={newExpense.description}
//               onChange={(e) =>
//                 setNewExpense({ ...newExpense, description: e.target.value })
//               }
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label>Expense Date</label>
//             <input
//               type="date"
//               value={newExpense.expense_date}
//               onChange={(e) =>
//                 setNewExpense({ ...newExpense, expense_date: e.target.value })
//               }
//               required
//             />
//           </div>

//           <button type="submit" className="btn-full">
//             Submit Expense
//           </button>
//         </form>
//       </section>

//       <section className="section">
//         <div className="section-header">
//           <h3 className="section-title">My Expense History</h3>
//         </div>

//         <div
//           style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(3, 1fr)',
//             gap: '0.75rem',
//             marginBottom: '1.5rem',
//           }}
//         >
//           <div className="form-group" style={{ margin: 0 }}>
//             <label>Status</label>
//             <select
//               value={expenseFilter.status}
//               onChange={(e) =>
//                 setExpenseFilter({ ...expenseFilter, status: e.target.value })
//               }
//             >
//               <option value="">All Status</option>
//               <option value="Pending">Pending</option>
//               <option value="Approved">Approved</option>
//               <option value="Rejected">Rejected</option>
//             </select>
//           </div>
//           <div className="form-group" style={{ margin: 0 }}>
//             <label>Start Date</label>
//             <input
//               type="date"
//               value={expenseFilter.startDate}
//               onChange={(e) =>
//                 setExpenseFilter({ ...expenseFilter, startDate: e.target.value })
//               }
//             />
//           </div>
//           <div className="form-group" style={{ margin: 0 }}>
//             <label>End Date</label>
//             <input
//               type="date"
//               value={expenseFilter.endDate}
//               onChange={(e) =>
//                 setExpenseFilter({ ...expenseFilter, endDate: e.target.value })
//               }
//             />
//           </div>
//         </div>

//         <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
//           {expenses.length === 0 ? (
//             <div className="empty-state">
//               <div className="empty-state-icon">💼</div>
//               <div className="empty-state-text">No expenses yet</div>
//             </div>
//           ) : (
//             expenses.map((e) => (
//               <div key={e.id} className="card">
//                 <div
//                   style={{
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     alignItems: 'start',
//                     marginBottom: '1rem',
//                   }}
//                 >
//                   <div>
//                     <div
//                       style={{
//                         fontSize: '1.125rem',
//                         fontWeight: 600,
//                         color: '#0f172a',
//                       }}
//                     >
//                       ${e.amount} {e.original_currency}
//                     </div>
//                     <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
//                       {e.category}
//                     </div>
//                   </div>
//                   {getStatusBadge(e.status)}
//                 </div>
//                 <div
//                   style={{
//                     fontSize: '0.875rem',
//                     color: '#475569',
//                     marginBottom: '0.5rem',
//                   }}
//                 >
//                   {e.description}
//                 </div>
//                 <div
//                   style={{
//                     fontSize: '0.75rem',
//                     color: '#94a3b8',
//                     marginBottom: '1rem',
//                   }}
//                 >
//                   Date: {new Date(e.expense_date).toLocaleDateString()}
//                 </div>

//                 {e.approval_trail &&
//                   e.approval_trail.length > 0 &&
//                   e.approval_trail[0].approver_email && (
//                     <div
//                       style={{
//                         borderTop: '1px solid #e2e8f0',
//                         paddingTop: '1rem',
//                       }}
//                     >
//                       <div
//                         style={{
//                           fontSize: '0.875rem',
//                           fontWeight: 600,
//                           color: '#334155',
//                           marginBottom: '0.5rem',
//                         }}
//                       >
//                         Approval Trail:
//                       </div>
//                       {e.approval_trail.map((approval, index) => (
//                         <div
//                           key={index}
//                           style={{
//                             fontSize: '0.75rem',
//                             color: '#64748b',
//                             marginBottom: '0.25rem',
//                             paddingLeft: '1rem',
//                           }}
//                         >
//                           <strong>Step {approval.sequence_order}:</strong>{' '}
//                           {approval.approver_email} - {approval.status}
//                           {approval.comments && (
//                             <div
//                               style={{
//                                 color: '#94a3b8',
//                                 fontStyle: 'italic',
//                               }}
//                             >
//                               "{approval.comments}"
//                             </div>
//                           )}
//                           {approval.approved_at && (
//                             <div style={{ color: '#94a3b8' }}>
//                               {new Date(
//                                 approval.approved_at
//                               ).toLocaleString()}
//                             </div>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   )}
//               </div>
//             ))
//           )}
//         </div>
//       </section>
//     </div>
//   </>
// )}

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ user, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'Employee', manager_id: '' });
  const [newRule, setNewRule] = useState({ is_manager_first: false, approvers: [], rule_type: 'Sequential', threshold_percentage: 0, specific_approver_id: '' });
  const [newExpense, setNewExpense] = useState({ amount: '', original_currency: '', category: '', description: '', expense_date: '' });
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [teamExpenses, setTeamExpenses] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [expenseFilter, setExpenseFilter] = useState({ status: '', startDate: '', endDate: '' });
  const [teamExpenseFilter, setTeamExpenseFilter] = useState({ status: '', startDate: '', endDate: '' });
  const [approvalComments, setApprovalComments] = useState({});

  const ruleDescriptions = {
    'Sequential': 'All approvers must approve in sequence.',
    'Percentage': 'Requires X% of approvers to approve.',
    'SpecificApprover': 'Only specific approver can approve.',
    'Hybrid': 'Combination of percentage OR specific approver.'
  };

  const fetchCurrencies = async () => {
    try {
      const res = await axios.get('https://restcountries.com/v3.1/all?fields=currencies');
      const currencySet = new Set();
      res.data.forEach(country => {
        if (country.currencies) {
          Object.keys(country.currencies).forEach(curr => currencySet.add(curr));
        }
      });
      setCurrencies(Array.from(currencySet).sort());
    } catch (err) {
      console.error('Error fetching currencies:', err);
    }
  };

  useEffect(() => {
    fetchCurrencies();
    if (user.role === 'Admin') {
      fetchUsers();
      fetchExpenses();
      fetchApprovalRules();
    } else if (user.role === 'Manager') {
      fetchPendingApprovals();
      fetchTeamExpenses();
    } else if (user.role === 'Employee') {
      fetchUserExpenses();
    }
  }, [user]);

  useEffect(() => {
    if (user.role === 'Manager') {
      fetchTeamExpenses();
    }
  }, [teamExpenseFilter]);

  useEffect(() => {
    if (user.role === 'Employee') {
      fetchUserExpenses();
    }
  }, [expenseFilter]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/expenses', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/users', newUser, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchUsers();
      setNewUser({ email: '', password: '', role: 'Employee', manager_id: '' });
      alert('User created successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating user');
    }
  };

  const handleUpdateUser = async (id, updates) => {
    try {
      await axios.put(`http://localhost:5000/users/${id}`, updates, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating user');
    }
  };

  const handleUpdateRule = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/approval-rules', newRule, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      await fetchApprovalRules();
      alert('Approval rules updated successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating rules');
    }
  };

  const handleOverrideStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/expenses/${id}/status`, { status }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchExpenses();
      alert(`Expense ${status.toLowerCase()} successfully`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating expense');
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const res = await axios.get('http://localhost:5000/approvals/pending', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setPendingApprovals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeamExpenses = async () => {
    try {
      const params = new URLSearchParams();
      if (teamExpenseFilter.status) params.append('status', teamExpenseFilter.status);
      if (teamExpenseFilter.startDate) params.append('startDate', teamExpenseFilter.startDate);
      if (teamExpenseFilter.endDate) params.append('endDate', teamExpenseFilter.endDate);

      const res = await axios.get(`http://localhost:5000/approvals/team?${params.toString()}`, { 
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
      });
      setTeamExpenses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserExpenses = async () => {
    try {
      const params = new URLSearchParams();
      if (expenseFilter.status) params.append('status', expenseFilter.status);
      if (expenseFilter.startDate) params.append('startDate', expenseFilter.startDate);
      if (expenseFilter.endDate) params.append('endDate', expenseFilter.endDate);

      const res = await axios.get(`http://localhost:5000/expense-submission?${params.toString()}`, { 
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
      });
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApprovalRules = async () => {
    try {
      const res = await axios.get('http://localhost:5000/approval-rules', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.data) {
        setNewRule({
          is_manager_first: res.data.is_manager_first || false,
          approvers: res.data.approvers ? JSON.parse(res.data.approvers) : [],
          rule_type: res.data.rule_type || 'Sequential',
          threshold_percentage: res.data.threshold_percentage || 0,
          specific_approver_id: res.data.specific_approver_id || ''
        });
      }
    } catch (err) {
      console.error('Error fetching approval rules:', err);
    }
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/expense-submission', newExpense, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setNewExpense({ amount: '', original_currency: '', category: '', description: '', expense_date: '' });
      fetchUserExpenses();
      alert('Expense submitted successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Error submitting expense');
    }
  };

  const handleApprove = async (id, status) => {
    const comments = approvalComments[id] || '';
  
    if (status === 'Rejected' && !comments.trim()) {
      alert('Please provide comments for rejection');
      return;
    }

    try {
      await axios.put(`http://localhost:5000/approvals/${id}`, { status, comments }, { 
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
      });
      fetchPendingApprovals();
      fetchTeamExpenses();
      setApprovalComments({ ...approvalComments, [id]: '' });
      alert(`Expense ${status.toLowerCase()} successfully`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error processing approval');
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusClass = status === 'Pending' ? 'status-pending' : status === 'Approved' ? 'status-approved' : 'status-rejected';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  const getRoleBadge = (role) => {
    const roleClass = role === 'Admin' ? 'role-admin' : role === 'Manager' ? 'role-manager' : 'role-employee';
    return <span className={`role-badge ${roleClass}`}>{role}</span>;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header>
        <div className="header-content">
          <h1 className="logo">Expense Management System</h1>
          <div className="user-info">
            <div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Welcome back,</div>
              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>{user.email}</div>
              {getRoleBadge(user.role)}
            </div>
            <button onClick={onLogout} className="danger">Logout</button>
          </div>
        </div>
      </header>

      <main className="page-container">
        {user.role === 'Admin' && (
          <>
            <div className="page-title">Admin Dashboard</div>
            <div className="page-subtitle">Manage users, approval rules, and oversee all expenses</div>

            <div className="grid grid-cols-3">
              <section className="section">
                <div className="section-header">
                  <h3 className="section-title">User Management</h3>
                </div>
                <form onSubmit={handleCreateUser}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="user@company.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" placeholder="Enter password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Role</label>
                      <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                        <option value="Employee">Employee</option>
                        <option value="Manager">Manager</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Manager ID</label>
                      <input type="number" placeholder="Manager ID" value={newUser.manager_id} onChange={(e) => setNewUser({ ...newUser, manager_id: e.target.value })} />
                    </div>
                  </div>
                  <button type="submit" className="btn-full">Create User</button>
                </form>

                <div className="divider"></div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: '#334155' }}>All Users</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td>{u.email}</td>
                          <td>{getRoleBadge(u.role)}</td>
                          <td>
                            <button onClick={() => handleUpdateUser(u.id, { role: u.role === 'Employee' ? 'Manager' : 'Employee' })} className="small secondary">
                              Toggle Role
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="section">
                <div className="section-header">
                  <h3 className="section-title">Approval Rules</h3>
                </div>
                <form onSubmit={handleUpdateRule}>
                  <div className="checkbox-group">
                    <input type="checkbox" id="managerFirst" checked={newRule.is_manager_first} onChange={(e) => setNewRule({ ...newRule, is_manager_first: e.target.checked })} />
                    <label htmlFor="managerFirst">Manager approval required first</label>
                  </div>

                  <div className="form-group">
                    <label>Approvers (User IDs)</label>
                    <textarea placeholder='[2, 3, 4]' value={JSON.stringify(newRule.approvers)} onChange={(e) => {
                      try {
                        setNewRule({ ...newRule, approvers: JSON.parse(e.target.value || '[]') });
                      } catch (err) {}
                    }} rows={3} />
                    <p className="help-text">Enter user IDs as JSON array</p>
                  </div>

                  <div className="form-group">
                    <label>Rule Type</label>
                    <select value={newRule.rule_type} onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value })}>
                      <option value="Sequential">Sequential</option>
                      <option value="Percentage">Percentage</option>
                      <option value="SpecificApprover">Specific Approver</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                    <p className="help-text">{ruleDescriptions[newRule.rule_type]}</p>
                  </div>

                  {(newRule.rule_type === 'Percentage' || newRule.rule_type === 'Hybrid') && (
                    <div className="form-group">
                      <label>Threshold Percentage</label>
                      <input type="number" placeholder="60" min="1" max="100" value={newRule.threshold_percentage} onChange={(e) => setNewRule({ ...newRule, threshold_percentage: e.target.value })} />
                    </div>
                  )}

                  {(newRule.rule_type === 'SpecificApprover' || newRule.rule_type === 'Hybrid') && (
                    <div className="form-group">
                      <label>Specific Approver ID</label>
                      <input type="number" placeholder="User ID" value={newRule.specific_approver_id} onChange={(e) => setNewRule({ ...newRule, specific_approver_id: e.target.value })} />
                    </div>
                  )}

                  <button type="submit" className="btn-full">Update Approval Rules</button>
                </form>
              </section>

              <section className="section">
                <div className="section-header">
                  <h3 className="section-title">All Expenses</h3>
                </div>
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {expenses.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📊</div>
                      <div className="empty-state-text">No expenses yet</div>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map(e => (
                            <tr key={e.id}>
                              <td>{e.employee_email}</td>
                              <td>${e.amount}</td>
                              <td>{getStatusBadge(e.status)}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button onClick={() => handleOverrideStatus(e.id, 'Approved')} className="small success">Approve</button>
                                  <button onClick={() => handleOverrideStatus(e.id, 'Rejected')} className="small danger">Reject</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {user.role === 'Manager' && (
          <>
            <div className="page-title">Manager Dashboard</div>
            <div className="page-subtitle">Review pending approvals and monitor team expenses</div>

            <div className="grid grid-cols-2">
              <section className="section">
                <div className="section-header">
                  <h3 className="section-title">Pending Approvals</h3>
                  <span className="status-badge status-pending">{pendingApprovals.length} Pending</span>
                </div>
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {pendingApprovals.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">✓</div>
                      <div className="empty-state-text">All caught up!</div>
                    </div>
                  ) : (
                    pendingApprovals.map(a => (
                      <div key={a.id} className="card">
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
                            {a.converted_amount} {a.company_currency}
                          </div>
                          {a.original_currency !== a.company_currency && (
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                              Original: {a.amount} {a.original_currency}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                          <strong>Employee:</strong> {a.employee_email}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                          <strong>Category:</strong> {a.category}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
                          <strong>Description:</strong> {a.description}
                        </div>
                        
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label>Comments (Required for rejection)</label>
                          <textarea 
                            placeholder="Add your comments here..."
                            value={approvalComments[a.id] || ''}
                            onChange={(e) => setApprovalComments({ ...approvalComments, [a.id]: e.target.value })}
                            rows={3}
                          />
                        </div>

                        <div className="btn-group">
                          <button onClick={() => handleApprove(a.id, 'Approved')} className="success">Approve</button>
                          <button onClick={() => handleApprove(a.id, 'Rejected')} className="danger">Reject</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="section">
                <div className="section-header">
                  <h3 className="section-title">Team Expenses</h3>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Status</label>
                    <select value={teamExpenseFilter.status} onChange={(e) => setTeamExpenseFilter({ ...teamExpenseFilter, status: e.target.value })}>
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Start Date</label>
                    <input type="date" value={teamExpenseFilter.startDate} onChange={(e) => setTeamExpenseFilter({ ...teamExpenseFilter, startDate: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>End Date</label>
                    <input type="date" value={teamExpenseFilter.endDate} onChange={(e) => setTeamExpenseFilter({ ...teamExpenseFilter, endDate: e.target.value })} />
                  </div>
                </div>

                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {teamExpenses.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-text">No expenses found</div>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Amount</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamExpenses.map(e => (
                            <tr key={e.id}>
                              <td>{e.employee_email}</td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{e.converted_amount} {e.company_currency}</div>
                                {e.original_currency !== e.company_currency && (
                                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>({e.amount} {e.original_currency})</div>
                                )}
                              </td>
                              <td>{e.category}</td>
                              <td>{new Date(e.expense_date).toLocaleDateString()}</td>
                              <td>{getStatusBadge(e.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {user.role === 'Employee' && (
  <>
    <div className="page-title">Employee Dashboard</div>
    <div className="page-subtitle">Submit expenses and track your reimbursements</div>

    <div className="grid grid-cols-2">
      <section className="section">
        <div className="section-header">
          <h3 className="section-title">Submit New Expense</h3>
        </div>
        <form onSubmit={handleSubmitExpense}>
          <div className="form-row">
            <div className="form-group">
              <label>Amount</label>
              <input type="number" step="0.01" placeholder="0.00" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select value={newExpense.original_currency} onChange={(e) => setNewExpense({ ...newExpense, original_currency: e.target.value })} required>
                <option value="">Select Currency</option>
                {currencies.slice(0, 50).map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Category</label>
            <input type="text" placeholder="e.g., Travel, Food" value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea placeholder="Provide details..." value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} required />
          </div>

          <div className="form-group">
            <label>Expense Date</label>
            <input type="date" value={newExpense.expense_date} onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })} required />
          </div>

          <button type="submit" className="btn-full">Submit Expense</button>
        </form>
      </section>

      <section className="section">
        <div className="section-header">
          <h3 className="section-title">My Expense History</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Status</label>
            <select value={expenseFilter.status} onChange={(e) => setExpenseFilter({ ...expenseFilter, status: e.target.value })}>
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Start Date</label>
            <input type="date" value={expenseFilter.startDate} onChange={(e) => setExpenseFilter({ ...expenseFilter, startDate: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>End Date</label>
            <input type="date" value={expenseFilter.endDate} onChange={(e) => setExpenseFilter({ ...expenseFilter, endDate: e.target.value })} />
          </div>
        </div>

        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💼</div>
              <div className="empty-state-text">No expenses yet</div>
            </div>
          ) : (
            expenses.map(e => (
              <div key={e.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
                      ${e.amount} {e.original_currency}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {e.category}
                    </div>
                  </div>
                  {getStatusBadge(e.status)}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                  {e.description}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  Date: {new Date(e.expense_date).toLocaleDateString()}
                </div>

                {e.approval_trail && e.approval_trail.length > 0 && e.approval_trail[0].approver_email && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                      Approval Trail:
                    </div>
                    {e.approval_trail.map((approval, index) => (
                      <div key={index} style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', paddingLeft: '1rem' }}>
                        <strong>Step {approval.sequence_order}:</strong> {approval.approver_email} - {approval.status}
                        {approval.comments && (
                          <div style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '0.25rem' }}>
                            "{approval.comments}"
                          </div>
                        )}
                        {approval.approved_at && (
                          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            {new Date(approval.approved_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  </>
)}
      </main>
    </div>
  );
};

export default Dashboard;