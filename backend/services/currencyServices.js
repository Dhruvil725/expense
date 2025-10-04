const axios = require('axios');

const EXCHANGE_API_KEY = '51653e369e06e9c31542b13b'; 
const BASE_CURRENCY = 'INR'; 

class CurrencyService {
  async convertToBaseCurrency(amount, fromCurrency) {
    if (fromCurrency === BASE_CURRENCY) {
      return parseFloat(amount);
    }

    try {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
      );
      
      const rate = response.data.rates[BASE_CURRENCY];
      return parseFloat((amount * rate).toFixed(2));
    } catch (error) {
      console.error('Currency conversion error:', error);
      throw new Error('Failed to convert currency');
    }
  }

  getBaseCurrency() {
    return BASE_CURRENCY;
  }
}

module.exports = new CurrencyService();