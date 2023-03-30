const mongoose = require("mongoose");
const express = require("express");
const Post = require("../model/post");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");


const router = new express.Router();


//  authenticate token  for middleware
const authenticateToken = async (req, res, next) => {
    let token = req.headers.authorization;

    if (token?.includes("Bearer ")) {
        token = token.split("Bearer ")[1]
    }

    try {
        if (!token) {
            return res.status(400).json({
                status: "error",
                message: "No user",
            });
        }

        jwt.verify(token, process.env.SECRET_KEY, async (err, jwtObj) => {
            if (err) {
                return res.status(400).json({
                    status: "error",
                    message: "Invalid User",
                });
            }
            req.user = jwtObj._doc;
            next();
        });
    } catch (e) {
        return res.status(400).json({
            status: "error",
            message: e.message,
        });
    }
};



// get all post
router.get("/posts", async (req, res) => {
    try {
        const posts = await Post.find();
        return res.status(200).json({
            posts: posts,
        });
    } catch (e) {
        return res.status(400).json({
            status: "error",
            message: e.message,
        });
    }
});


//  post create for particuler user 
router.post("/posts", authenticateToken, async (req, res) => {
    try {
        const { title, body, image } = req.body;
        if (!title || !body || !image) {
            return res.status(400).json({
                status: "error",
                message: "please provide full information",
            });
        }
        const savePost = new Post({
            title: title,
            body: body,
            image: image,
            user: req.user.email,
        });
        const data = await savePost.save()
        return res.status(200).json({
            status: "success",
            data: data,
        });
    } catch (e) {
        return res.status(400).json({
            status: "error",
            message: e.message,
        });
    }
});


// update post 
router.put("/posts/:postId", authenticateToken, async (req, res) => {
    try {
        const postId = req.params.postId;
        if (!postId) {
            return res.status(400).json({
                status: "error",
                message: "please provide full information",
            });
        }
        const oldPost = await Post.find({ _id: postId });

        if (oldPost[0].user != req.user.email) {
            return res.status(400).json({
                status: "error",
                message: "you are not the owner of this post",
            });
        }
        const { title, body, image } = req.body;

        await Post.findOneAndUpdate(
            { _id: postId },
            {
                $set: {
                    title: title,
                    body: body,
                    image: image,
                    user: req.user.email,
                }
            },
            { new: true }
        );

        return res.status(200).json({
            status: "success",
        });
    } catch (e) {
        return res.status(400).json({
            status: "error",
            message: e.message,
        });
    }
});



// delete post 
router.delete("/posts/:postId", authenticateToken, async (req, res) => {
    try {
        const postId = req.params.postId;
        if (!postId) {
            return res.status(400).json({
                status: "error",
                message: "please provide full information",
            });
        }
        const oldPost = await Post.find({ _id: postId });
        if (oldPost[0].user != req.user.email) {
            return res.status(400).json({
                status: "error",
                message: "you are not the owner of this post",
            });
        }
        await Post.findOneAndDelete(
            { _id: postId }
        );
        return res.status(200).json({
            status: "success",
        });
    } catch (e) {
        return res.status(400).json({
            status: "error",
            message: e.message,
        });
    }
});

module.exports = router;
