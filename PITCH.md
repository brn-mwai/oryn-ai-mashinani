# Oryn - AI Mashinani 2026, Biashara Track

## Positioning

**Oryn is the follow-up small businesses never get around to doing.**

Not a crypto product. A getting-paid product. The payment rail is plumbing.

## The problem

A freelancer finishes the work. Sends the invoice. Then nothing.

Chasing that money is the worst job in a small business. It is awkward, it eats hours, and it damages the client relationship you need for the next job. So most people send one polite reminder, feel uncomfortable, and quietly give up. The invoice ages. Cash flow dies. The business that was profitable on paper cannot make rent.

The work was done. The money exists. The follow-up is what is missing.

## What Oryn does

Upload the contract or invoice. Oryn reads it, works out who owes what and when, then does the chasing:

- Writes each reminder itself, matched to how overdue the payment is
- Picks the channel and the timing
- Escalates in tone as weeks pass, from nudge to firm
- Watches for the payment and stops the moment it lands

It runs on its own for weeks. You do not open it. You get told when you are paid.

## Why this needs AI, not a cron job

A scheduled reminder is a spam filter's problem. What actually recovers money is judgment: how hard to push this specific client, in which words, on which day, before the relationship breaks. That is the decision Oryn makes, over and over, per client, unattended.

The agent holds its reasoning between runs, so week three knows what week one already tried.

## Payment rails

Whatever the client can actually pay with. Card via Stripe for local clients, USDC on Circle's Arc for cross-border ones where a wire would take days and cost a chunk of a small invoice.

The rail is a detail. It gets one line in the demo.

## 90-second script

**0:00-0:15 — The problem**
"Every freelancer here has an invoice someone never paid. You did the work. You sent it. You sent one reminder, it felt awkward, and you stopped. That money is still out there."

**0:15-0:30 — What it is**
"Oryn does the chasing for you. Upload the invoice once. It handles every follow-up after that, on its own, until you are paid."

**0:30-1:05 — Demo**
1. Upload a contract. Oryn extracts client, amount, due date. *Say: "It read that itself."*
2. Open the agent timeline. Show reminder one, reminder two, the escalation. *Say: "It wrote each of these. Different week, different tone."*
3. Trigger the payment. Show the agent stop. *Say: "Paid. It stops. Nobody told it to."*

**1:05-1:20 — Why it matters here**
"A small business in Nairobi does not have a credit controller. Oryn is that person, for the cost of nothing, working every day."

**1:20-1:30 — Close**
"The work was already done. Oryn just makes sure you get paid for it."

## Demo rules

- Do not open with the blockchain. Do not open with the architecture.
- One line, once, if asked: "Cards through Stripe, USDC on Arc for cross-border."
- If the live demo breaks, cut to the recording. Do not debug on stage.

## Honest scope

Built and working: document parsing, agent scheduling and escalation, reminder generation, payment detection, Stripe and Arc/USDC settlement.

Not built: M-Pesa/Daraja integration. Do not claim it. If asked, it is the obvious next rail for this market and it is not in the demo.
