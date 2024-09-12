import { ActionFunctionArgs } from "@remix-run/node";
import Stripe from "stripe";
import { stripe } from "~/lib/stripe.server";

interface Metadata {
    userId: string;
    plan: string;
}

export async function action({ request }: ActionFunctionArgs) {
    const body = await request.text();
    const signature = request.headers.get("Stripe-Signature") as string;
    if (!signature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  
    const stripeSigningSecret = process.env.STRIPE_SIGNING_SECRET as string;

    try {
        const event = stripe.webhooks.constructEvent(
          body,
          signature,
          stripeSigningSecret
        );
    
        const completedEvent = event.data.object as Stripe.Checkout.Session & {
          metadata: Metadata;
        };
    
        if (event.type === "checkout.session.completed") {
          if (completedEvent.mode === "payment") {
            console.log('Payment completed');
            console.log(completedEvent.metadata);
            // metadata.userId
            // metadata.plan


            // update in baza de date la userul cu id metadata.userId ca are planul metadata.plan


            // const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
            //   completedEvent.id,
            //   {
            //     expand: ["line_items"],
            //   }
            // );
            // if (!sessionWithLineItems.line_items) {
            //   throw new Error("No line items found");
            // }
            // await processPayment({
            //   userId: completedEvent.metadata.userId,
            //   proTier: completedEvent.metadata.proTier,
            //   amount: sessionWithLineItems.line_items.data[0].amount_total,
            // });
          }
        }
        return new Response(JSON.stringify({ success: true, error: null }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.error(error);
        return new Response(
          JSON.stringify({
            success: false,
            error: (error as { message: string }).message,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
}