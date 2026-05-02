const mongoose = require('mongoose');

const dealerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  profilePicUrl: String,
  documents: [String], // Array of Cloudinary URLs
  balance: { type: Number, default: 0 }, // Positive means they owe us
}, { timestamps: true });

const dealerLedgerSchema = new mongoose.Schema({
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  date: { type: Date, required: true, default: Date.now },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['CREDIT_GIVEN', 'PAYMENT_RECEIVED'], required: true }
});

const labourSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  profilePicUrl: String,
  documents: [String],
  salary: { type: Number, required: true },
  loan: { type: Number, default: 0 }, // Outstanding loan amount
}, { timestamps: true });

const labourLedgerSchema = new mongoose.Schema({
  labourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Labour', required: true },
  date: { type: Date, required: true, default: Date.now },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  deductionMonth: String, // e.g. "May 2026"
});

const eggProductionSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now, unique: true },
  paiti: { type: Number, default: 0 },
  trays: { type: Number, default: 0 },
  totalEggs: { type: Number, default: 0 },
  pricePerPaiti: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
});

const eggDistributionSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  paiti: { type: Number, default: 0 },
  trays: { type: Number, required: true },
  ratePerTray: { type: Number, default: 0 },
  ratePerPaiti: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paid: { type: Boolean, default: false },
});

const feedStockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantityBori: { type: Number, required: true },
  pricePerBori: { type: Number, required: true },
  dateAdded: { type: Date, default: Date.now }
});

const feedUsageSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  feedId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedStock', required: true },
  boriUsed: { type: Number, required: true },
  cost: { type: Number, required: true }
});

const medicineStockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  dateAdded: { type: Date, default: Date.now }
});

const medicineUsageSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicineStock', required: true },
  unitsUsed: { type: Number, required: true },
  cost: { type: Number, required: true }
});

const miscExpenseSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  description: { type: String, required: true },
  amount: { type: Number, required: true }
});

// Auth OTP Schema
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // Expires in 10 minutes (600s)
});

module.exports = {
  Dealer: mongoose.model('Dealer', dealerSchema),
  DealerLedger: mongoose.model('DealerLedger', dealerLedgerSchema),
  Labour: mongoose.model('Labour', labourSchema),
  LabourLedger: mongoose.model('LabourLedger', labourLedgerSchema),
  EggProduction: mongoose.model('EggProduction', eggProductionSchema),
  EggDistribution: mongoose.model('EggDistribution', eggDistributionSchema),
  FeedStock: mongoose.model('FeedStock', feedStockSchema),
  FeedUsage: mongoose.model('FeedUsage', feedUsageSchema),
  MedicineStock: mongoose.model('MedicineStock', medicineStockSchema),
  MedicineUsage: mongoose.model('MedicineUsage', medicineUsageSchema),
  MiscExpense: mongoose.model('MiscExpense', miscExpenseSchema),
  Otp: mongoose.model('Otp', otpSchema),
};
