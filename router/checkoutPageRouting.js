const express = require ('express');
const Product = require('../model/productModel');
const verifyToken = require('./verifyToken');
const stripe = require('stripe')('sk_test_0LPgnByD2j7OeZnmCjsVvfn40047V6ZnFq');
const {
    User
} = require("../model/userModel");

const router = express.Router();

router.get("/checkout", verifyToken, async (req, res) => {

    const user = await User.findOne({
        _id: req.user.user._id
    }).populate("cart.productId");
    
    let totalPrice = 0;

    for (let i = 0; i < user.cart.length; i++) {
        totalPrice += user.cart[i].amount * user.cart[i].productId.price
        
    }
    user.totalCartPrice = totalPrice;
    await user.save()
    
    if (user.cart.length > 0){

    return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: user.cart.map((product)=>{ // map retunerar en array
            return {
                //from stripe (their own code)
                name: product.productId.title,
                amount: product.productId.price*100, // *100 = 1 krona
                quantity: product.amount,
                currency: "sek"
                }
            }),
            success_url:"http://localhost:4000/", // where user goes when success
            cancel_url:"http://localhost:4000/products" // where user goes when no success
    
        }).then((session)=>{
            console.log(session)
            res.render("checkout", {user, sessionId:session.id}) // rendera proceed to checkout, typ finalcheckout
        })
    } else {
        res.render("checkout", {user, sessionId:undefined})
    }
    
});

module.exports = router;