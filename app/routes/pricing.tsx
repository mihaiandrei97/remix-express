import { Form } from "@remix-run/react";

import { type ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { stripe } from "~/lib/stripe.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  if(!context.user || !context.session){
    return json({ message: "Unauthorized" }, { status: 401 });
  }
  const plan = formData.get("plan") as string;
  // check if customer exists
  const customer = await stripe.customers.create({
    email: context.user.email,
  });
  // save customer id to database

  const metadata = {
    plan,
    userId: context.user.id
  }

    const product = {
        price: 10000,
        name: "Basic Plan",
        description: "This is the basic plan"
    }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customer.id,
    success_url: process.env.HOST_NAME + "/success",
    cancel_url: process.env.HOST_NAME + "/cancel",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: product.price,
          product_data: {
            name: product.name,
            description: product.description,
            images: ["https://icodethis.com/logo.png"],
          },
        },
        quantity: 1,
      },
    ],
    metadata,
    allow_promotion_codes: true,
    // automatic_tax: {
    //   enabled: true,
    // },
    // invoice_creation: {
    //   enabled: true,
    // },
  });

  return redirect(session.url!)
}

export default function Pricing() {
  return (
    <Form method="POST">
      <label>
        <span>Plan</span>
        <select name="plan">
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
        </select>
      </label>
      <button type="submit">Subscribe</button>
    </Form>
  );
}
