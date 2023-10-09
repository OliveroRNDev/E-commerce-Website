import * as express from "express";
import productController from "../controllers/products";
import authMiddleware from "../middleware/is-auth"
import { body } from "express-validator";


const router = express.Router();

router.get("/admin/logos", authMiddleware.isAdmin, productController.getLogos);

router.get("/admin/product-sale", authMiddleware.isAdmin, productController.getProductSale);

router.post("/admin/product-sale", authMiddleware.isAdmin, productController.postProductSale);

router.get("/admin/category", authMiddleware.isAdmin, productController.getCategory);

router.get("/admin/subcategory", authMiddleware.isAdmin, productController.getSubcategory);

router.get("/admin/sales", authMiddleware.isAdmin, productController.getSales);

router.get("/admin/sales-list", authMiddleware.isAdmin, productController.getSalesList);

router.post("/admin/edit-sale/:saleId", authMiddleware.isAdmin, productController.getEditSale);

router.post("/admin/delete-sale/:saleId", authMiddleware.isAdmin, productController.deleteSale);

router.post("/admin/sales", [
    body('startDate').isISO8601().withMessage("Invalid day received").isAfter().withMessage('Insert a valid date!'),
    body('endDate').isISO8601().withMessage("Invalid day received").isAfter().withMessage('Insert a valid date!'),
    body('sale').isNumeric().withMessage('Insert a number!'),
], authMiddleware.isAdmin, productController.postSales);

router.post("/admin/logos",[body('description').isLength({min:8,max:200}).withMessage('Length between 8 and 200.')],authMiddleware.isAdmin,productController.postLogos);

router.post("/admin/category",[body('description').isLength({min:8,max:200}).withMessage('Length between 8 and 200.')],authMiddleware.isAdmin,productController.postCategory);

router.post("/admin/subcategory",[body('description').isLength({min:8,max:200}).withMessage('Length between 8 and 200.')],authMiddleware.isAdmin,productController.postSubcategory);

router.get("/admin/homepage", authMiddleware.isAdmin, productController.getHomepage);

router.post("/admin/homepage",[body('link').isURL().withMessage('Insert a valid URL')],authMiddleware.isAdmin,productController.postHomepage);

router.get("/admin/add-product", authMiddleware.isAdmin, productController.addProduct);

router.get("/admin/product-color/:productId",authMiddleware.isAdmin,productController.editProductColor);

router.post("/admin/product-color/:productId",authMiddleware.isAdmin,productController.postProductColor);

router.post("/admin/product-color-delete/:productId",authMiddleware.isAdmin,productController.postProductColorDelete);

router.get("/admin/product-size/:productId",authMiddleware.isAdmin,productController.editProductSize);

router.post("/admin/product-size/:productId",authMiddleware.isAdmin,productController.postProductSize);

router.post("/admin/product-size-delete/:productId",authMiddleware.isAdmin,productController.postProductSizeDelete);

router.post("/admin/edit-logo/:logoId",[body('description').isLength({min:8,max:200}).withMessage('Length between 8 and 200.')],authMiddleware.isAdmin,productController.editLogos);

router.post("/admin/edit-subcategory/:subcategoryId",[body('description').isLength({min:8,max:200}).withMessage('Length between 8 and 200.')],authMiddleware.isAdmin,productController.editSubcategory);

router.post("/admin/edit-category/:categoryId", [body('description').isLength({ min: 8, max: 200 }).withMessage('Length between 8 and 200.')], authMiddleware.isAdmin, productController.editCategory);

router.post("/admin/edit-products/:productId", authMiddleware.isAdmin, productController.editProducts);

router.post("/admin/delete-products/:productId", authMiddleware.isAdmin, productController.deleteProducts);

router.post("/admin/delete-homepage/:imageId", authMiddleware.isAdmin, productController.deleteHomepage);

router.post("/admin/delete-logos/:imageId", authMiddleware.isAdmin, productController.deleteLogos);

router.post("/admin/delete-category/:imageId", authMiddleware.isAdmin, productController.deleteCategory);

router.post("/admin/delete-subcategory/:imageId",authMiddleware.isAdmin,productController.deleteSubcategory);

router.get("/admin/products",authMiddleware.isAdmin,productController.adminProducts);

router.post("/admin/products", [
    body('title').isString().withMessage('Title: Only numbers and letters').isLength({ min: 5 }).withMessage('Title: Minimum length is 5').trim(),
    body('description').isLength({min:8,max:200}).withMessage('Description: Between 8 and 200 characters'),
    body('deposit').isInt().withMessage('Insert a number without a decimal'),
    body('price').isNumeric().withMessage('Price: Needs to be a number')
],authMiddleware.isAdmin,productController.postAddProducts);

export default router;