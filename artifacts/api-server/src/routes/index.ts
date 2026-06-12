import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import postsRouter from "./posts";
import usersRouter from "./users";
import storiesRouter from "./stories";
import notificationsRouter from "./notifications";
import messagesRouter from "./messages";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(postsRouter);
router.use(usersRouter);
router.use(storiesRouter);
router.use(notificationsRouter);
router.use(messagesRouter);

export default router;
