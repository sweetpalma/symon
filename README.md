![banner](banner.png)

# Symon

[![npm-badge]][npm-url]
[![ci-badge]][ci-url]
[![license-badge]][license-url]
[![typescript-badge]][typescript-url]

Minimalistic chatbot framework for humans.

## Getting Started

<!-- prettier-ignore-start -->

### Installation
```bash
npm install symon
```

###  Configuration

```typescript
// English 
import { Bot } from 'symon';
const bot = new Bot();

// Other languages may require a specific stemmer:
// https://naturalnode.github.io/natural/stemmers.html
import { Bot, PorterStemmerUk as stemmer } from 'symon';
const bot = new Bot({ stemmer });
```

### Natural Language Understanding

```typescript
bot.addDocument({
  intent: 'chatter/greeting',
  examples: ['hello', 'hi'],
  answers: ['Hello!'],
});

bot.addDocument({
  intent: 'chatter/parting',
  examples: ['goodbye', 'bye'],
  answers: ['Bye!'],
});
```

### Named Entity Recognition

```typescript
bot.addEntity({
  label: 'insult',
  options: ['stupid', 'silly'],
});

bot.addEntity({
  label: 'praise',
  options: ['smart', 'sweet'],
});

bot.addDocument({
  intent: 'chatter/insult',
  examples: ['you are %insult%', '%insult%'],
  answers: ['You make me sad...'],
});

bot.addDocument({
  intent: 'chatter/praise',
  examples: ['you are %praise%', '%insult%'],
  answers: ['Thanks!'],
});
```

### Handlers

```typescript
bot.addDocument({
  intent: 'random',
  examples: ['pick a random number', 'say a random number'],
  handler: async (ctx) => {
    const number = Math.floor(Math.random() * 5);
    await ctx.say({ answer: number.toString() });
  },
});
```

### Middlewares

```typescript
bot.addMiddleware(async (req, res) => {
  if (!res.answer) {
    res.answer = `Sorry, I don't understand you.`;
  }
});
```

### Built-in Shell Interface

```typescript
import { Shell } from 'symon';
const shell = new Shell({ bot });
shell.start();
```

<!-- prettier-ignore-end -->

## License

Symon is licensed under the MIT license.

[typescript-badge]: https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg
[typescript-url]: http://www.typescriptlang.org/
[ci-badge]: https://img.shields.io/github/actions/workflow/status/sweetpalma/symon/main.yml?logo=github&label=CI
[ci-url]: https://github.com/sweetpalma/symon/actions/workflows/main.yml
[npm-badge]: https://img.shields.io/npm/v/symon?logo=npm
[npm-url]: https://www.npmjs.com/package/symon
[license-badge]: https://img.shields.io/npm/l/symon
[license-url]: https://github.com/sweetpalma/symon/blob/master/LICENSE
