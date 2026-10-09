# Cohort API — Netlify Edge Function

Returns a list of students as JSON, from a
[Netlify Edge Function](../README.md). One file, no dependencies, nothing to
install.

```
netlify/
├── index.js        the whole thing - 27 lines
├── netlify.toml    tells Netlify where index.js is
└── public/         a one-page site so the deploy has something to serve
```

## The endpoint

| Method | URL | Returns |
|---|---|---|
| GET | `/api/students` | the five students, as JSON |

```json
[
  { "id": 1, "name": "Ada Lovelace" },
  { "id": 2, "name": "Grace Hopper" },
  { "id": 3, "name": "Alan Turing" },
  { "id": 4, "name": "Katherine Johnson" },
  { "id": 5, "name": "Dennis Ritchie" }
]
```

## Deploy it

1. Push this repo to GitHub.
2. Netlify → **Add new site** → **Import an existing project** → pick the repo.
3. Set:
   - **Base directory:** `09-10-2026/netlify`
   - **Build command:** *(leave empty)*
   - **Publish directory:** `public`
4. Deploy.

Then:

```bash
curl https://YOUR-SITE.netlify.app/api/students
```

There is no build step and no `npm install`, because there is nothing to
install. The function uses only web APIs the runtime already has.

### Run it locally

```bash
npm install -g netlify-cli
netlify dev
```

That serves the function at http://localhost:8888/api/students. It downloads
Deno the first time, because that is what edge functions run on.

Plain `node index.js` will not work — this is not a Node program, and it is
not meant to be run as one.

## How the file works

The whole function is this:

```js
export default async () => {
  return new Response(JSON.stringify(cohort), {
    headers: { 'content-type': 'application/json' },
  });
};
```

A function that returns a `Response`. That is the entire API — the same
`Response` object you get back from `fetch()` in the browser.

We never look at the incoming request, because there is only one route and
one method. A function that needed the URL or the body would start with:

```js
export default async (request) => {
  const url = new URL(request.url);
  const body = await request.json();
  // ...
};
```

## How it gets a URL

Two things connect the file to `/api/students`.

**The `config` export, at the bottom of `index.js`:**

```js
export const config = { path: '/api/students' };
```

Netlify reads that at deploy time. No routing lives anywhere else.

**`netlify.toml`:**

```toml
[build]
  publish = "public"
  edge_functions = "."
```

Edge functions normally live in a `netlify/edge-functions/` folder. We keep a
single `index.js` at the top instead, so `edge_functions = "."` points Netlify
at it. Remove that line and the site still deploys perfectly — but the
function is never found and `/api/students` returns 404. Worth breaking once,
because the error tells you nothing.

## About the array

```js
const cohort = [ ... ];
```

The list is written into the file, so every location serves the same five
students and the function is pure: same request, same answer, no memory
needed. That is exactly the shape of work edge functions are good at.

The moment you want to *add* a student, this stops being enough. Each of
Netlify's locations runs its own copy of the file and throws it away when it
goes idle, so anything you pushed into the array would vanish, and a request
from another country would never have seen it at all. Data that has to change
has to live outside the function — see §5 of the
[session notes](../README.md).

## Things to demo

1. `curl https://YOUR-SITE.netlify.app/api/students` — the deployed endpoint.
2. Add `console.log(context.geo.city)` (take `(request, context)` as the
   arguments) and watch the Netlify function log to see *where* it ran.
3. Open the URL on a phone on mobile data and compare the response time with
   the Render service in the folder next door.
