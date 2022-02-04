const { validationResult } = require('express-validator/check');

const Product = require('../models/product');

const fileHelper = require('../utils/file');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    activeAddProduct: true,
    formsCSS: true,
    productCSS: true,
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;

  if (!editMode) {
    return res.redirect('/');
  }

  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect('/');
      }

      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        formsCSS: true,
        productCSS: true,
        editing: editMode,
        product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;

      return next(error);
    });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const price = +req.body.price ? +req.body.price : req.body.price;
  const image = req.file;
  const description = req.body.description;

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      formsCSS: true,
      productCSS: true,
      editing: false,
      hasError: true,
      product: {
        title,
        price: price.toString(),
        description,
      },
      errorMessage: 'Attached file is not an image',
      validationErrors: [],
    });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      formsCSS: true,
      productCSS: true,
      editing: false,
      hasError: true,
      product: {
        title,
        price: price.toString(),
        description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  const imageUrl = image.path;

  const product = new Product({
    title,
    price,
    description,
    imageUrl,
    userId: req.user,
  });

  product
    .save()
    .then(() => {
      console.log('Created product!');
      res.redirect('/admin/products');
    })
    .catch((err) => {
      // res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;

      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedDescription = req.body.description;
  const updatedPrice = +req.body.price ? +req.body.price : req.body.price;
  const image = req.file;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      formsCSS: true,
      productCSS: true,
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice.toString(),
        description: updatedDescription,
        _id: prodId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }

      product.title = updatedTitle;
      product.description = updatedDescription;
      product.price = updatedPrice;

      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }

      return product.save().then(() => {
        console.log('Updated product!');
        res.redirect('/admin/products');
      });
    })

    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;

      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    // .populate('userId')
    .then((products) => {
      res.render('admin/products', {
        pageTitle: 'Admin Products',
        prods: products,
        path: '/admin/products',
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;

      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error('Product not found!'));
      }

      fileHelper.deleteFile(product.imageUrl);

      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(() => {
      console.log('Deleted product!');
      res.status(200).json({
        message: 'Success!',
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: 'Deleting product failed.',
      });
    });
};
