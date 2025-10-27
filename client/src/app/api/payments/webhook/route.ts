import { prisma } from '@/lib/prisma'
import { getStripeInstance } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    const stripe = getStripeInstance()
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)

  try {
    // Update payment status
    await prisma.payment.updateMany({
      where: {
        providerId: paymentIntent.id,
      },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        providerData: {
          status: paymentIntent.status,
        },
      },
    })

    // Update order status
    const payment = await prisma.payment.findFirst({
      where: {
        providerId: paymentIntent.id,
      },
      include: {
        order: true,
      },
    })

    if (payment) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          updatedAt: new Date(),
        },
      })

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: payment.order.userId,
          type: 'PAYMENT_SUCCESS',
          title: 'Payment Successful',
          message: `Your payment for order ${payment.order.orderNumber} has been processed successfully.`,
          data: {
            orderId: payment.order.id,
            orderNumber: payment.order.orderNumber,
            amount: payment.amount,
          },
        },
      })

      console.log(`Order ${payment.order.orderNumber} confirmed and payment completed`)
    }
  } catch (error) {
    console.error('Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id)

  try {
    // Update payment status
    await prisma.payment.updateMany({
      where: {
        providerId: paymentIntent.id,
      },
      data: {
        status: 'FAILED',
        providerData: {
          status: paymentIntent.status,
          last_payment_error: paymentIntent.last_payment_error ? JSON.parse(JSON.stringify(paymentIntent.last_payment_error)) : null,
        },
      },
    })

    // Update order status
    const payment = await prisma.payment.findFirst({
      where: {
        providerId: paymentIntent.id,
      },
      include: {
        order: true,
      },
    })

    if (payment) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'FAILED',
          updatedAt: new Date(),
        },
      })

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: payment.order.userId,
          type: 'PAYMENT_SUCCESS',
          title: 'Payment Failed',
          message: `Your payment for order ${payment.order.orderNumber} has failed. Please try again.`,
          data: {
            orderId: payment.order.id,
            orderNumber: payment.order.orderNumber,
            error: paymentIntent.last_payment_error ? JSON.parse(JSON.stringify(paymentIntent.last_payment_error)) : null,
          },
        },
      })

      console.log(`Payment failed for order ${payment.order.orderNumber}`)
    }
  } catch (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment canceled:', paymentIntent.id)

  try {
    // Update payment status
    await prisma.payment.updateMany({
      where: {
        providerId: paymentIntent.id,
      },
      data: {
        status: 'CANCELLED',
        providerData: {
          status: paymentIntent.status,
        },
      },
    })

    // Update order status
    const payment = await prisma.payment.findFirst({
      where: {
        providerId: paymentIntent.id,
      },
      include: {
        order: true,
      },
    })

    if (payment) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'CANCELLED',
          updatedAt: new Date(),
        },
      })

      console.log(`Order ${payment.order.orderNumber} canceled`)
    }
  } catch (error) {
    console.error('Error handling payment cancellation:', error)
    throw error
  }
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  console.log('Charge dispute created:', dispute.id)

  try {
    // Find the payment associated with this charge
    const payment = await prisma.payment.findFirst({
      where: {
        providerData: {
          path: ['charges', 'data'],
          array_contains: [{ id: typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id }],
        },
      },
      include: {
        order: true,
      },
    })

    if (payment) {
      // Create notification for admin
      await prisma.notification.create({
        data: {
          type: 'SYSTEM',
          title: 'Charge Dispute Created',
          message: `A dispute has been created for order ${payment.order.orderNumber}. Dispute ID: ${dispute.id}`,
          data: {
            orderId: payment.order.id,
            orderNumber: payment.order.orderNumber,
            disputeId: dispute.id,
            chargeId: typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id,
            amount: dispute.amount,
            reason: dispute.reason,
          },
        },
      })

      console.log(`Dispute created for order ${payment.order.orderNumber}`)
    }
  } catch (error) {
    console.error('Error handling dispute creation:', error)
    throw error
  }
}
