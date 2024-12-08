const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Busines = require('../models/business.model')
const Config  = require('../models/config.model');

const {fileUploader} = require('../utils/util');


// Centralized Error Handler
const errorHandler = (err, model, res) => {
    if (res.headersSent) {
        console.error(`Error after headers were sent: ${err.message}`);
        return;
    }
    res.status(err.status || 500).json({
        message: `Error with ${model.modelName} operation.`,
        details: err.message,
    });
};

// CRUD Handler Function
const handleCRUD = (model, operation) => {
    return async (req, res) => {
        try {
            const { id } = req.params; // For ID-based operations
            let result;

            // Helper to send responses
            const sender = (result) => res.status(200).json(result);

            switch (operation) {
                case 'getAll':
                    result = await model.find({});
                    return sender(result);

                case 'getSingle':
                    result = await model.findById(id);
                    if (!result)
                        return res
                            .status(404)
                            .json({ message: `${model.modelName} record not found.` });
                    return sender(result);

                case 'create':
                    const imagePath = await fileUploader(req,res)
                    const textData = req.body
                    textData.imgUrl = await imagePath

                    result = await model.create(textData);
                    return sender(result);

                case 'delete':
                    result = await model.findByIdAndDelete(id);
                    if (!result)
                        return res
                            .status(404)
                            .json({ message: `${model.modelName} record not found for deletion.` });
                    return res.status(200).json({
                        message: `Record in ${model.modelName} deleted successfully.`,
                    });

                case 'update':
                    const uptImageUrl = await fileUploader(req,res)
                    req.body.imgUrl = uptImageUrl
                  
                    result = await model.findByIdAndUpdate(id, req.body, { new: true });
                    if (!result)
                        return res
                            .status(404)
                            .json({ message: `${model.modelName} record not found for update.` });
                    return sender(result);

                default:
                    return res.status(400).json({ message: 'Invalid operation specified.' });
            }
        } catch (err) {
            errorHandler(err, model, res);
        }
    };
};

//Configuration Controllers
const createConfiguration = handleCRUD(Config, 'create')
const updateConfiguration = handleCRUD(Config, 'update')

//Business controllers
const createBusinessDetails = handleCRUD(Busines, 'create')
const updateBusinessDetails = handleCRUD(Busines, 'update')

// Transaction controllers
const getAllTransactions = handleCRUD(Transaction, 'getAll');
const getSingleTransaction = handleCRUD(Transaction, 'getSingle');
const createTransaction = handleCRUD(Transaction, 'create');
const updateTransaction = handleCRUD(Transaction, 'update');
const deleteTransaction = handleCRUD(Transaction, 'delete');

// User controllers
const getAllUsers = handleCRUD(User, 'getAll');
const getSingleUser = handleCRUD(User, 'getSingle');
const deleteUser = handleCRUD(User, 'delete');

// Product controllers
const getAllProducts = handleCRUD(Product, 'getAll');
const getSingleProduct = handleCRUD(Product, 'getSingle');
const createProduct = handleCRUD(Product, 'create');
const updateProduct = handleCRUD(Product, 'update');
const deleteProduct = handleCRUD(Product, 'delete');

// Exporting Controllers
module.exports = {
    createConfiguration,
    updateConfiguration,

    createBusinessDetails,
    updateBusinessDetails,

    getAllTransactions,
    getSingleTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,

    getAllUsers,
    getSingleUser,
    deleteUser,
    
    getAllProducts,
    getSingleProduct,
    createProduct,
    updateProduct,
    deleteProduct,
};
