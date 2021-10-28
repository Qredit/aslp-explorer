var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", {
    title: "ASLP",
    routename: "home",
    csrfToken: req.csrfToken()
  });
});




/* GET ark pages. */
router.get("/transactions", function (req, res, next) {
  res.render("transactions", {
    title: "Ark",
    routename: "transactions",
    csrfToken: req.csrfToken()
  });
});
router.get("/block", function (req, res, next) {
  res.render("block", {
    title: "Blocks",
    routename: "block",
    csrfToken: req.csrfToken()
  });
});
router.get("/tokenlist", function (req, res, next) {
  res.render("tokenlist", {
    title: "Token List",
    routename: "tokenlist",
    csrfToken: req.csrfToken()
  });
});

router.get("/latestblocks", function (req, res, next) {
  res.render("latestblocks", {
    title: "Latest Blocks",
    routename: "latestblocks",
    csrfToken: req.csrfToken()
  });
});


/* Explorer URL Parameter routes*/

router.get("/transaction/:transactionId", function (req, res, next) {
  res.render("transaction", {
    title: "Transaction Details",
    routename: "transaction",
    transactionId: req.params.transactionId,
    csrfToken: req.csrfToken()
  });
});

router.get("/wallet/:walletId", function (req, res, next) {
  res.render("wallet", {
    title: "Wallet Details",
    routename: "sender",
    walletId: req.params.walletId,
    csrfToken: req.csrfToken()
  });
});

router.get("/token/:tokenid", function (req, res, next) {
  res.render("token", {
    title: "Token Details",
    routename: "token",
    tokenid: req.params.tokenid,
    csrfToken: req.csrfToken()
  });
});

router.get("/block/:blockId", function (req, res, next) {
  res.render("block", {
    title: "Block Details",
    routename: "sender",
    walletId: req.params.blockId,
    csrfToken: req.csrfToken()
  });
});


module.exports = router;
