const Transaction = require("../models/Transaction");
const Lawyer = require("../models/Lawyer");
const axios = require("axios")


function generateTransId() {
  const timestamp = Date.now().toString();
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;
  const transactionId = `${timestamp}${randomNumber}`;
  return transactionId;
}

const fundWallet = async (req, res) => {
    const user = req.user;
    const { amount, reference } = req.body;

    if (!amount || !reference) {
        return res.status(400).json({
            message: "Reference or amount is missing",
            success: false,
        });
    }

    try {
        // Prevent duplicate transactions
        const existingTx = await Transaction.findOne({ reference_number: reference });
        if (existingTx) {
            return res.status(409).json({
                message: "Transaction already processed",
                success: false,
            });
        }

        let lawyer = await Lawyer.findOne({ user: user._id });
        if (!lawyer) {
            return res.status(404).json({
                message: "Wallet not found for user",
                success: false,
            });
        }

        // Verify payment with Paystack API
        const payment = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const paymentData = payment?.data?.data;

        if (!paymentData || paymentData.status !== "success") {
            return res.status(422).json({
                message: "Payment verification failed",
                success: false,
            });
        }

        const amountPaid = paymentData.amount / 100;

        lawyer.balance += amountPaid;

        const transaction = new Transaction({
            user: user._id,
            amount: amountPaid,
            type: "credit",
            status: "completed",
            description: `Wallet funding with ${amountPaid}`,
            reference_number: reference,
        });

        await Promise.all([lawyer.save(), transaction.save()]);

        return res.status(200).json({
            message: "Wallet funded successfully",
            success: true,
            data: {
                balance: lawyer.balance,
                transaction: transaction,
            },
        });
    } catch (error) {
        console.error("Error funding wallet:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};


// Withdraw from user wallet to their bank

const fetchSupportBanks = async (req, res) => {
    try {
        const response = await fetch('https://api.paystack.co/bank', {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch banks');
        }

        const banks = await response.json();
        const bankData = banks.data;

        if (!bankData) {
            throw new Error('No bank data found');
        }

        return res.status(200).json(bankData);
    } catch (error) {
        console.error('Error fetching banks:', error.message);
        return res.status(500).json({ error: 'Failed to fetch banks' });
    }
};

const withdrawalRequest = async(req, res)=>{
    let {accountNmber, bankCode, amount} = req.body
    const user = req.user;
    let account_number = '';
    let account_name = '';
    let bank_code = '';
    let message = ''
    const minimumWithdrawal = Number(1000);
    let val = Number(amount);


    let wallet = await Lawyer.findOne({ user: user.userId });
    if (!wallet) {
        return res.status(404).json({ error: "User wallet not found" });
    }
    const userBalance = wallet.balance;

    if (!amount || !accountNmber) {

        return res.status(400).json({error: "amount and account number are missing"});
        
      }
    if(val < minimumWithdrawal){
        return res.status(400).json({"error": "Minimum withdrawal amount is 10,000 naira"});
    }

if (userBalance < Number(val)){
    return res.status(400).json({error:"Insufficient Funds in user wallet!"})
    }else{

    // create unique transaction id
    let transaction_id;
    while (true) {
    transaction_id = generateTransId();
    const existingTrans = await Transaction.findOne({
        reference_number: transaction_id,
    });
    if (!existingTrans) {
        break;
    }
    }

    const transaction = new Transaction({
        user: user,
        amount,
        type: "debit",
        status: "pending",
        description: `N${amount} Withdrawn from user wallet`,
        reference_number: transaction_id,
    });


// Endpoint to verify users account number
    const verifybankUrl = `https://api.paystack.co/bank/resolve?account_number=${accountNmber}&bank_code=${bankCode}`;
    const response = await fetch(verifybankUrl, {
        method:"GET",
        headers:{
          "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        }
      })
      .then(info => info.json())
    
      if(response.status === false){
        transaction.TransactionStatus = "failed";
        transaction.description = "paystack withdrawal bank verification failed";
        await transaction.save();
        return res.status(400).json({error: response?.message || "error occured"})
        
      }

        bank_code = response.data.bank_code;
        account_number = response.data.account_number;
        account_name = response.data.account_name;

    // proceed with creating transfer

    const transData = {
        "bank_code":bankCode,
        "account_number":account_number,
        "name":account_name,
        "type": "nuban",
        "currency": "NGN"
    }

    const trasnferDetails = await fetch("https://api.paystack.co/transferrecipient",{
            method:"POST",
            headers:{
            "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(transData)            
        })
        .then(res => res.json())

        if(trasnferDetails.status === false){

            return res.status(400).json({error:"failed.."})
            
        }

        const recipient_code = trasnferDetails.data.recipient_code;

        const data = {
            "source": "balance",
            "amount": amount * 100,
            "reference": transaction_id,
            "recipient": recipient_code,
            "reason": "Funds withdrawal"
        }

        const processTransfer = await fetch("https://api.paystack.co/transfer",{
            method:"POST",
            headers:{
            "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)            
        })
        .then(res => res.json())

        if(processTransfer.status === false){
            return res.status(401).json({error:"Transfer could not be completed, please try again later"})
        }

        // res.json(processTransfer)
    
        const amount_paid = Number(amount);
        wallet.balance = userBalance - Number(amount_paid);
        transaction.status = "completed";
        await wallet.save();
        await transaction.save();

        return res.status(200).json({message:"Withdraw in progress .."})

}

};

const getAllTransactions = async (req, res) => {
    try {
        const trx = await Transaction.find({user: req.user._id}).sort({ createdAt: -1 });

        if (trx.length === 0) {
            return res.status(404).json({ message: "No transactions found" });
        }

        return res.status(200).json({ trx });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const getAllTransactionsByAdmin = async (req, res) => {
    try {
        const trx = await Transaction.find().sort({ createdAt: -1 });

        if (trx.length === 0) {
            return res.status(404).json({ message: "No transactions found" });
        }

        return res.status(200).json({ trx });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}



module.exports = {
    fundWallet,
    fetchSupportBanks,
    withdrawalRequest,
    getAllTransactions,
    getAllTransactionsByAdmin
}