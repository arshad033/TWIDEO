import { Router } from "express";
import {
  createTweet,
  getUserTweet,
  updateTweet,
  deleteTweet,
} from "../controllers/tweet.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJwt);
router.route("/create-tweet").post(createTweet);
router.route("/delete-tweet/:tweetId").delete(deleteTweet);
router.route("/update-tweet/:tweetId").patch(updateTweet);
router.route("/get-tweet/:userId").get(getUserTweet);

export default router;
