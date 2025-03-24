import { Router } from "express";
import {
  createTweet,
  getUserTweet,
  updateTweet,
  deleteTweet,
} from "../controllers/tweet.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-tweet").post(verifyJwt, createTweet);
router.route("/delete-tweet/:tweetId").delete(verifyJwt, deleteTweet);
router.route("/update-tweet/:tweetId").patch(verifyJwt, updateTweet);
router.route("/get-tweet/:tweetId").get(verifyJwt, getUserTweet);

export default router;
