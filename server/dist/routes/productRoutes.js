import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import * as productController from "../controllers/productController.js";
import validate from "../middleware/validate.js";
import { createProductSchema } from "@ecommerce/schemas";
const router = express.Router();
// Konfigurasi Multer untuk penyimpanan file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const targetDir = process.env.UPLOAD_DIR
            ? path.resolve(process.cwd(), process.env.UPLOAD_DIR, "products")
            : path.resolve(process.cwd(), "public/images/products");
        fs.mkdirSync(targetDir, { recursive: true });
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });
// --- RUTE PRODUK ---
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.get("/:id/preview", protect, restrictTo("admin", "penjual"), productController.getProductDetailsForPreview);
// Rute untuk membuat produk baru
router.post("/", protect, restrictTo("penjual", "admin"), upload.fields([
    { name: "productImages", maxCount: 9 },
    { name: "promoProductImage", maxCount: 1 },
    { name: "productVideo", maxCount: 1 },
]), validate(createProductSchema), // Pindahkan validasi ke sini setelah multer
productController.createProduct);
// Rute untuk menghapus produk
router.delete("/:id", protect, restrictTo("admin"), productController.deleteProduct);
// Rute untuk memperbarui produk
router.put("/:id", protect, restrictTo("admin", "penjual"), productController.updateProduct);
export default router;
