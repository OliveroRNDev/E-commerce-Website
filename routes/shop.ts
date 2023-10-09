import * as express from "express";
import userController from "../controllers/shop";
import authMiddleware from "../middleware/is-auth"

const router=express.Router();

router.get("/", authMiddleware.blockAdmin, userController.shopController);

router.post("/", authMiddleware.blockAdmin, userController.searchController);

router.get("/sales", authMiddleware.blockAdmin, userController.salesController);

router.post("/sales", authMiddleware.blockAdmin, userController.searchSalesController);

router.post("/category/:categoryId", authMiddleware.blockAdmin, userController.searchCategoryController);

router.post("/subcategory/:subcategoryId", authMiddleware.blockAdmin, userController.searchSubcategoryController);

router.post("/review/:productId", authMiddleware.blockAdmin, userController.postReview);

router.get("/review/:productId", authMiddleware.blockAdmin, userController.getReview);

router.get("/homepage",authMiddleware.blockAdmin,userController.hompageController);

router.get("/cart",authMiddleware.isLoggedIn,authMiddleware.blockAdmin,userController.cartController);

router.post("/cart",authMiddleware.isLoggedIn,authMiddleware.blockAdmin,userController.addCartController);

router.get("/orders",authMiddleware.isLoggedIn,authMiddleware.blockAdmin,userController.ordersController);

router.get("/checkout", authMiddleware.isLoggedIn, authMiddleware.blockAdmin, userController.checkoutController);

router.get("/checkout/cancel", authMiddleware.isLoggedIn, authMiddleware.blockAdmin, userController.checkoutController);

router.get("/checkout/success", authMiddleware.isLoggedIn,authMiddleware.blockAdmin,userController.createOrderController)

router.get("/product-details/:productId", authMiddleware.blockAdmin, userController.detailsController);

router.get("/subcategory/:subcategoryId", authMiddleware.blockAdmin, userController.getSubcategory);

router.get("/category/:categoryId",authMiddleware.blockAdmin, userController.getCategory);

router.get("/orders", authMiddleware.isLoggedIn,authMiddleware.blockAdmin,userController.ordersController);

export default router;