//modified by prasanna-17/07/25
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import { encrypt, decrypt } from './cryptoUtil.js';
//import { generateRS256Token } from '../src/utils/jwts.js';
import { generateRS256Token } from '../src/utils/jwts.js';
import { verifyRS256Token } from '../src/utils/jwts.js';
import { logToFile } from '../Logger/logger.js'; // if index.js is in root
//import { generateRS256Token } from '../src/utils/tokenService.js'; // adjust if in utils/

//Kiddo

//mongodb+srv://Kiddo:<db_password>@cluster0.nixegdc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
const app = express();
const PORT = 5003;

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://prasannask17:12345@soa.gojpgch.mongodb.net/?retryWrites=true&w=majority&appName=SOA';
const DB_NAME = 'Banking';

let db;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`Connected to MongoDB successfully - Database: ${DB_NAME}`);
    
    // List all collections to verify connection
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Root API route
app.get('/api', (req, res) => {
  res.json({
    message: 'Banking Management System API',
    version: '1.0.0',
    endpoints: {
      banks: '/api/banks',
      branches: '/api/branches', 
      customers: '/api/customers',
      kyc: '/api/kyc',
      employees: '/api/employees',
      accounts: '/api/accounts',
      transactions: '/api/transactions',
      reports: '/api/reports',
      health: '/api/health',
      check:'/check',
      transfer:'/transfer',
      settle:'/settle',
      refund:'/refund'
    }
  });
});
app.post('/check', async (req, res) => {
  try {
    const { payload } = req.body;

    // ✅ Validate encrypted payload format
    if (!payload || !payload.content || !payload.iv || !payload.tag) {
      const encrypted = encrypt({ valid: false, error: '❌ Invalid encrypted request format.' });
      return res.status(400).json(encrypted);
    }

    // ✅ Decrypt the payload
    let decrypted;
    try {
      decrypted = decrypt(payload);
    } catch (decryptionError) {
      const encrypted = encrypt({ valid: false, error: '❌ Failed to decrypt payload.' });
      return res.status(400).json(encrypted);
    }

    const { accountNumber } = decrypted;

    if (!accountNumber) {
      const encrypted = encrypt({ valid: false, error: '❌ Account number is required.' });
      return res.status(400).json(encrypted);
    }

    // 🔍 Step 2: Find account by accountNumber
    const account = await db.collection('accounts').findOne({ accountNumber });

    if (!account) {
      const encrypted = encrypt({ valid: false, error: '❌ Bank account not found.' });
      return res.status(404).json(encrypted);
    }

    // 🔍 Step 3: Fetch bank details using bankId
    let bank;
    try {
      bank = await db.collection('banks').findOne({ _id: new ObjectId(account.bankId) });
    } catch (err) {
      const encrypted = encrypt({ valid: false, error: '❌ Invalid bank ID.' });
      return res.status(400).json(encrypted);
    }

    if (!bank) {
      const encrypted = encrypt({ valid: false, error: '❌ Bank information not found.' });
      return res.status(404).json(encrypted);
    }

    // ✅ Step 4: Return encrypted response
    const encrypted = encrypt({
      valid: true,
      account: {
        accountNumber: account.accountNumber,
        accountHolderName: account.accountHolderName,
        balance: account.balance,
        bankName: bank.name || 'Unknown',
        ifsc: bank.ifsc || 'N/A',
      }
    });

    res.json(encrypted);

  } catch (err) {
    console.error('❌ Bank check error:', err.message);
    const encrypted = encrypt({ valid: false, error: '❌ Internal server error while checking account.' });
    res.status(500).json(encrypted);
  }
});






//transfer
app.post('/transfer', async (req, res) => {
  try {
    const decrypted = decrypt(req.body); // already an object
    const { fromAccountNumber, toAccountNumber, amount } = decrypted;

    if (!fromAccountNumber || !toAccountNumber || !amount) {
      const encryptedResponse = encrypt({
        status: 'failed',
        message: 'Missing required fields.'
      });
      return res.status(400).json(encryptedResponse);
    }

    const fromAccount = await db.collection('accounts').findOne({ accountNumber: fromAccountNumber });
    const toAccount = await db.collection('accounts').findOne({ accountNumber: toAccountNumber });

    if (!fromAccount || !toAccount) {
      const encryptedResponse = encrypt({
        status: 'failed',
        message: 'Invalid account(s).'
      });
      return res.status(404).json(encryptedResponse);
    }

    if (fromAccount.balance < amount) {
      const encryptedResponse = encrypt({
        status: 'failed',
        message: 'Insufficient balance.'
      });
      return res.status(400).json(encryptedResponse);
    }

    await db.collection('accounts').updateOne(
      { accountNumber: fromAccountNumber },
      { $inc: { balance: -amount } }
    );

    await db.collection('accounts').updateOne(
      { accountNumber: toAccountNumber },
      { $inc: { balance: amount } }
    );

    const encryptedResponse = encrypt({
      status: 'success',
      message: 'Funds transferred successfully.',
      transactionId: `BANKTXN-${Date.now()}`
    });
    return res.json(encryptedResponse);

  } catch (err) {
    console.error('❌ Transfer error:', err);
    const encryptedError = encrypt({
      status: 'failed',
      message: 'Internal server error'
    });
    return res.status(500).json(encryptedError);
  }
});





app.post('/settle', async (req, res) => {
  try {
    const encryptedPayload = req.body;

    // ✅ Decrypt payload (already returns object, no need to parse again)
    const { fromAccountNumber, toAccountNumber, amount } = decrypt(encryptedPayload);

    if (!fromAccountNumber || !toAccountNumber || !amount) {
      const encryptedRes = encrypt({
        status: 'failed',
        message: 'Missing required fields.'
      });
      return res.status(400).json(encryptedRes);
    }

    const fromAccount = await db.collection('accounts').findOne({ accountNumber: fromAccountNumber });
    const toAccount = await db.collection('accounts').findOne({ accountNumber: toAccountNumber });

    if (!fromAccount || !toAccount) {
      const encryptedRes = encrypt({
        status: 'failed',
        message: 'Invalid account(s).'
      });
      return res.status(404).json(encryptedRes);
    }

    if (fromAccount.balance < amount) {
      const encryptedRes = encrypt({
        status: 'failed',
        message: 'Insufficient balance.'
      });
      return res.status(400).json(encryptedRes);
    }

    await db.collection('accounts').updateOne(
      { accountNumber: fromAccountNumber },
      { $inc: { balance: -amount } }
    );

    await db.collection('accounts').updateOne(
      { accountNumber: toAccountNumber },
      { $inc: { balance: amount } }
    );

    const encryptedRes = encrypt({
      status: 'success',
      message: '✅ Amount settled to merchant successfully.',
      transactionId: `BANKTXN-${Date.now()}`
    });

    return res.json(encryptedRes);

  } catch (err) {
    console.error('❌ Settle error:', err);

    const encryptedRes = encrypt({
      status: 'failed',
      message: 'Internal server error during settle'
    });
    return res.status(500).json(encryptedRes);
  }
});

//refund

app.post('/refund', async (req, res) => {
  try {
    const encryptedPayload = req.body;

    // ✅ Decrypt payload (already returns object, no need to parse again)
    const { fromAccountNumber, toAccountNumber, amount } = decrypt(encryptedPayload);

    if (!fromAccountNumber || !toAccountNumber || !amount) {
      const encryptedRes = encrypt({
        status: 'failed',
        message: 'Missing required fields.'
      });
      return res.status(400).json(encryptedRes);
    }

    const fromAccount = await db.collection('accounts').findOne({ accountNumber: fromAccountNumber });
    const toAccount = await db.collection('accounts').findOne({ accountNumber: toAccountNumber });

    if (!fromAccount || !toAccount) {
      const encryptedRes = encrypt({
        status: 'failed',
        message: 'Invalid account(s).'
      });
      return res.status(404).json(encryptedRes);
    }

    if (fromAccount.balance < amount) {
      const encryptedRes = encrypt({
        status: 'failed',
        message: 'Insufficient balance.'
      });
      return res.status(400).json(encryptedRes);
    }

    await db.collection('accounts').updateOne(
      { accountNumber: fromAccountNumber },
      { $inc: { balance: -amount } }
    );

    await db.collection('accounts').updateOne(
      { accountNumber: toAccountNumber },
      { $inc: { balance: amount } }
    );

    const encryptedRes = encrypt({
      status: 'success',
      message: '❌ Amount refunded to payer successfully.',
      transactionId: `BANKTXN-${Date.now()}`
    });

    return res.json(encryptedRes);

  } catch (err) {
    console.error('❌ Settle error:', err);

    const encryptedRes = encrypt({
      status: 'failed',
      message: 'Internal server error during settle'
    });
    return res.status(500).json(encryptedRes);
  }
});







// Start server
connectToMongoDB().then(() => {
 app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

});