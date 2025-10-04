import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    companyName: '',
    country: '',
    currency: ''
  });
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('https://restcountries.com/v3.1/all?fields=name,currencies')
      .then(res => {
        setCountries(res.data);
      })
      .catch(err => console.error(err));
  }, []);

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    const countryData = countries.find(c => c.name.common === selectedCountry);
    const currency = countryData?.currencies ? Object.keys(countryData.currencies)[0] : '';
    setForm({ ...form, country: selectedCountry, currency });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/auth/signup', form);
      alert(res.data.message);
      navigate('/login');
    } catch (err) {
      alert(err.response.data.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="page-container">
        <h2>Signup</h2>
        <input
          type="text"
          placeholder="Company Name"
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          required
        />
        <select
          value={form.country}
          onChange={handleCountryChange}
          required
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            <option key={country.name.common} value={country.name.common}>
              {country.name.common}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Currency"
          value={form.currency}
          readOnly
          className="w-full p-4 mb-6 border border-slate-300 rounded-xl bg-slate-100"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing up...' : 'Signup'}
        </button>
      </form>
    </div>
  );
};

export default Signup;
