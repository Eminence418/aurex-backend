const express = require('express');
const cors    = require('cors');
const https   = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── PUT YOUR NEW PAYSTACK SECRET KEY HERE (never share this file publicly) ──
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET || 'YOUR_SECRET_KEY_HERE';

app.use(cors());
app.use(express.json());

/* GET /banks  — returns the full list of Nigerian banks from Paystack */
app.get('/banks', (req, res) => {
  paystackGet('/bank?currency=NGN&perPage=100', (err, data) => {
    if (err) return res.status(502).json({ error: 'Could not fetch banks' });
    res.json(data.data); // array of { name, code, ... }
  });
});

/* GET /resolve?account_number=&bank_code=  — resolves account name */
app.get('/resolve', (req, res) => {
  const { account_number, bank_code } = req.query;
  if (!account_number || !bank_code) {
    return res.status(400).json({ error: 'account_number and bank_code are required' });
  }
  paystackGet(
    `/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
    (err, data) => {
      if (err || !data.status) {
        return res.status(422).json({ error: 'Account not found' });
      }
      res.json({ account_name: data.data.account_name });
    }
  );
});

/* tiny helper — makes an HTTPS GET to Paystack */
function paystackGet(path, cb) {
  const options = {
    hostname: 'api.paystack.co',
    path,
    method:  'GET',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  };
  let body = '';
  const req = https.request(options, r => {
    r.on('data', chunk => { body += chunk; });
    r.on('end', () => {
      try { cb(null, JSON.parse(body)); }
      catch (e) { cb(e); }
    });
  });
  req.on('error', cb);
  req.end();
}

app.listen(PORT, () => console.log(`Aurex backend running on port ${PORT}`));
