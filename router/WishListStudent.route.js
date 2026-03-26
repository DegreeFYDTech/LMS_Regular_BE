import express from 'express';
import { addToWishlist, removeFromWishlist, checkShortListById, exportWishlistStudents } from '../controllers/wishlistController.js';
import { authorize } from '../middlewares/authMiddleware.js';
import { getWishListStudents } from '../controllers/whishlist-table.js'
const router = express.Router();

router.get('/', authorize(['l2', 'l3', 'Supervisor', 'to', 'to_l3']), getWishListStudents);
router.get('/checkwishlist/:studentId', authorize(['l2', 'l3', 'Supervisor', 'to', 'to_l3']), checkShortListById);
router.post('/add', authorize(['l2', 'l3', 'to', 'to_l3']), addToWishlist);
router.post('/remove', authorize(['l2', 'l3', 'to', 'to_l3']), removeFromWishlist);
router.get('/export', authorize(['l2', 'l3', 'Supervisor', 'to', 'to_l3']), exportWishlistStudents);
export default router;

