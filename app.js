const express = require("express");
const app = express();
const stripe = require("stripe")(
  "sk_test_51K42yJDd9umCXJBoINyssGubWEJc34SnttOuBWvSOZJRZ159cKQm4yH1zLpVGN59x7WX5f1v21QeAI5dleAqLaPy00SOWHApLU"
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server Started");
});

app.post("/create-account", (req, res) => {
  stripe.accounts
    .create({
      type: "express",
      country: "US",
      email: req.body.email,
      business_type: "individual",

      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })
    .then((account) => {
      res.send(account);
    });
});

app.post("/create-account-link", (req, res) => {
  stripe.accountLinks
    .create({
      account: req.body.account,
      refresh_url: "https://example.com/reauth",
      return_url: "https://example.com/return",
      type: "account_onboarding",
    })
    .then((resp) => {
      res.send(resp);
    });
});

app.post("/payment-intents", (req, res) => {
  stripe.paymentIntents
    .create({
      amount: req.body.amount,
      currency: "usd",
      payment_method_types: ["card"],
      description: "Payment for order",
      receipt_email: req.body.email,
      transfer_data: {
        // Send the amount for the pilot after collecting a 20% platform fee:
        // the `amountForPilot` method simply computes `ride.amount * 0.8`
        amount: req.body.amount * 0.8,
        // The destination of this Payment Intent is the pilot's Stripe account
        destination: req.body.account,
      },
    })
    .then((intent) => {
      stripe.paymentIntents
        .confirm(intent.id, {
          payment_method: "pm_card_visa",
        })
        .then((resp) => {
          res.send(resp);
        });
    });
});

app.get("/get-balance/:id", (req, res) => {
  stripe.balance.retrieve({ stripeAccount: req.params.id }).then((resp) => {
    res.send(resp);
  });
});

app.post("/checkout", (req, res) => {
  stripe.checkout.sessions
    .create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "T-shirt",
            },
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
    })
    .then((resp) => {
      res.send(resp);
    });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
