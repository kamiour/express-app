const express = require('express');
const { body } = require('express-validator/check');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/products', isAuth, adminController.getProducts);
router.get('/add-product', isAuth, adminController.getAddProduct);
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
  '/add-product',
  [
    body('title', 'Invalid title').trim().isLength({ min: 3 }),
    body('price', 'Invalid price: should be float').trim().isFloat(),
    body('description', 'Invalid description').trim().isLength({ min: 5 }),
  ],
  isAuth,
  adminController.postAddProduct
);

router.post(
  '/edit-product',
  isAuth,
  [
    body('title').trim().isLength({ min: 3 }),
    body('price').trim().isFloat(),
    body('description').trim().isLength({ min: 5 }),
  ],
  adminController.postEditProduct
);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;
