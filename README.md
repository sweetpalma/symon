# Symon ![Validate](https://github.com/sweetpalma/symon/actions/workflows/validate.yml/badge.svg)

Simple framework for building smart chatbots.

## Example

<!-- prettier-ignore -->
```typescript
import { Bot, Shell } from 'symon';

const bot = new Bot();

bot.addDocument({
  intent: 'chatter/hello',
  examples: ['hello', 'hi', 'good afternoon', 'good morning', 'good evening'],
  answers: ['Hello!'],
});

bot.addDocument({
  intent: 'chatter/bye',
  examples: ['bye', 'goodbye'],
  answers: ['Bye!'],
});

bot.addMiddleware((req, res) => {
  if (!res.answer) {
    res.answer = `Sorry, I don't understand you.`;
  }
});

const cli = new Shell({ bot });
cli.start();
```
