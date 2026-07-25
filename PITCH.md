# Oryn - Impact Lab: AI Mashinani, Biashara Track

Demo slot: **3 minutes**, five-judge panel, 3:30 am. Submissions close 3:15 am.

## Idea lock sentence

> This helps **[NAME A REAL PERSON YOU KNOW]**, a Nairobi freelancer, who today struggles with **getting paid for work they already delivered, because chasing the money is awkward and they give up after one reminder**.

Put a real name in before kickoff. The brief is explicit: no nameable beneficiary, no build. If you can call them tonight, better.

## Positioning

**Oryn is the follow-up small businesses never get around to doing.**

Not a crypto product. A getting-paid product. The payment rail is plumbing and gets one sentence.

## The problem

A freelancer finishes the work. Sends the invoice. Then nothing.

Chasing that money is the worst job in a small business. It is awkward, it eats hours, and it strains the client you need for the next job. So most people send one polite reminder, feel uncomfortable, and quietly stop. The invoice ages. Cash flow dies. A business that is profitable on paper cannot make rent.

The work was done. The money exists. The follow-up is what is missing.

## 3-minute script

**0:00-0:25 — The problem**
"Everyone in this room has an invoice someone never paid. You did the work. You sent it. You sent one reminder, it felt awkward, and you stopped chasing. That money is still sitting out there. For a small business in Nairobi that is not an annoyance, it is the difference between making rent and not."

**0:25-0:45 — What it is, and who for**
"Oryn does the chasing for you. This helps [NAME], a freelancer here in Nairobi, who today struggles with getting paid for work she already delivered. She uploads the invoice once. Oryn handles every follow-up after that, on its own, until she is paid."

**0:45-2:05 — Demo**
1. **Upload a contract.** Oryn extracts client, amount, due date.
   Say: *"Claude read that. No template, no form. That is a real contract."*
2. **Open the agent timeline.** Show reminder one, reminder two, the escalation.
   Say: *"It wrote each of these itself. Different week, different tone. Week three knows what week one already tried."*
3. **Trigger the payment.** Show the agent stop.
   Say: *"Paid. It stops on its own. Nobody told it to."*

**2:05-2:35 — Why this needs Claude**
"A scheduled reminder is spam. What actually recovers money is judgment: how hard to push this specific client, in which words, on which day, before the relationship breaks. That is the call Claude makes, per client, unattended, for weeks. It is the difference between a cron job and a collections officer."

**2:35-3:00 — Close**
"A small business in Nairobi cannot hire a credit controller. Oryn is that person, working every day, for nothing. The work was already done. Oryn makes sure they get paid for it."

## Judge Q&A - prepare these three

**"Where is Claude in this?"**
Claude is the first provider in the document-parsing chain and the model that writes every reminder. Point at `apps/web/app/api/ai/parse-document/route.ts`. Gemini and Groq sit behind it as fallbacks so the demo cannot die on stage.

**"Did you build this tonight?"**
Answer straight: this is an existing codebase, repositioned and extended for the Biashara problem tonight. Do not claim it was written from scratch in one night. `app.oryn.cc` has months of deploy history and a judge can click it. Owning it costs nothing; being caught costs the entry.

**"Why not M-Pesa?"**
Not built. Say so. It is the obvious next rail for this market and it is honestly the right answer for Kenya, but it is not in the demo tonight.

## Demo rules

- Do not open with the blockchain. Do not open with the architecture.
- Payment rails get one line, only if asked: "Cards through Stripe, USDC on Arc for cross-border."
- If the live demo breaks, cut to the recording. Do not debug in front of five judges.
- 3 minutes is short. Rehearse it twice out loud before 3:00 am.

## Honest scope

Built and working: document parsing (Claude first), agent scheduling and escalation, reminder generation, payment detection, Stripe and Arc/USDC settlement.

Not built: M-Pesa/Daraja.
