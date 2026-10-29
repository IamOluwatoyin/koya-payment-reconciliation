
const fs = require("fs");

const latestAttempts = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split(/\r?\n/);

for (const line of lines) {
  if (!line.trim()) continue;

  let event;

  try {
    event = JSON.parse(line);
  } catch {
    // Ignore unreadable JSON lines.
    continue;
  }

  // Ignore events without a transaction ID.
  if (!event.txn_id) continue;

  const timestamp = Date.parse(event.ts);

  // Keep the latest attempt for each transaction.
  const previous = latestAttempts.get(event.txn_id);

  if (!previous || timestamp >= previous.timestamp) {
    latestAttempts.set(event.txn_id, {
      status: event.status,
      amount: Number(event.amount),
      timestamp,
    });
  }
}

// Only the latest successful attempt counts.
let total = 0;
let count = 0;

for (const event of latestAttempts.values()) {
  if (event.status === "success") {
    total += event.amount;
    count += 1;
  }
}

const expected = parseInt(
  fs.readFileSync("expected.txt", "utf8").trim(),
  10
);

if (count !== expected) {
  console.log(
    `Check failed: counted ${count} successful payments, expected ${expected}.`
  );
  console.log(
    "Something in the data isn't being handled the way the README describes."
  );
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
