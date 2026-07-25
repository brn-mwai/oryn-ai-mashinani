<p align="center">
  <img src="assets/banner.png" alt="Oryn" width="100%">
</p>

<h1 align="center">Oryn</h1>

<p align="center">
  <strong>Impact Lab: AI Mashinani — Biashara Track</strong>
</p>

---

## The problem

> **This helps a small Kenyan business that delivers first and invoices after, who today struggles with getting paid — because chasing the money is awkward, so they send one reminder and stop.**

The supplier who released stock on credit. The fundi who finished the job. The transporter whose load was delivered three weeks ago. They did the work. The money exists. Nobody is asking for it.

Chasing payment is the worst job in a small business. It is uncomfortable, it eats hours, and it strains the client you need for the next job. So the invoice ages, and a business that is profitable on paper cannot make rent.

## What Oryn does

Upload the invoice once. Oryn does every follow-up after that.

1. **Claude reads the document** and pulls out client, amount, due date
2. **The agent writes each reminder itself** and picks the channel
3. **It escalates** week by week, gentle to firm, remembering what it already tried
4. **It stops** the moment payment lands

It runs unattended for weeks. You find out when you have been paid.

## Why this needs Claude

A scheduled reminder is spam. What recovers money is judgment: how hard to push this client, in which words, on which day, before the relationship breaks. Claude makes that call per client, over weeks, with nobody watching.

## Built with

Claude (document parsing and message generation) · Next.js 15 · Convex · Clerk · Inngest · Resend · Twilio · M-Pesa · Stripe

## Try it

| | |
|---|---|
| Landing | [oryn.cc](https://oryn.cc) |
| App | [app.oryn.cc](https://app.oryn.cc) |
| Pitch | [PITCH.md](PITCH.md) |
| Team | [TEAM.md](TEAM.md) |

## Honest scope

**Working:** document parsing with Claude, agent scheduling and escalation, reminder generation, multi-channel outreach, payment detection, Stripe and USDC settlement, M-Pesa STK push.

**Not working tonight:** M-Pesa needs live Daraja credentials to transact. The integration is in, the Safaricom account is not.

**Not built from scratch tonight:** Oryn is an existing codebase. Tonight it was repositioned for the Biashara problem, moved onto Claude, and localised to Kenyan shillings.

## Team

| | | | | |
|---|---|---|---|---|
| [Brian Mwai](https://github.com/brn-mwai) | [Mathew Rym](https://github.com/Mathew-Rym) | [Abdikhafar](https://github.com/Abdikhafar-hub) | [Yusuf](https://github.com/Yusuf-cm) | [Joseph Wakaro](https://github.com/josephwakaro) |

## License

MIT
