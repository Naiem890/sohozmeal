import { Router } from 'express';
import authController from '../controllers/authController';
import studentController from '../controllers/studentController';
import mealController from '../controllers/mealController';
import stockController from '../controllers/stockController';
import costController from '../controllers/costController';
import complaintController from '../controllers/complaintController';
import hallFeastController from '../controllers/hallFeastController';
import noticeController from '../controllers/noticeController';
import hallController from '../controllers/hallController';

const router = Router();

router.use('/auth', authController);
router.use('/student', studentController);
router.use('/meal', mealController);
router.use('/stock', stockController);
router.use('/cost', costController);
router.use('/feast', hallFeastController);
router.use('/complaint', complaintController);
router.use('/notice', noticeController);
router.use('/hall', hallController);

export default router;
