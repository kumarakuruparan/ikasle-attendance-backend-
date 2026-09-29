import { Router } from 'express';
import healthRouter from './health.routes';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import departmentRouter from './department.routes';
import attendanceRouter from './attendance.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/me', authRouter);
router.use('/employees', userRouter);
router.use('/users', userRouter); // Alias for full backward compatibility
router.use('/departments', departmentRouter);
router.use('/attendance', attendanceRouter);

export default router;
