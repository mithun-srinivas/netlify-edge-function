# Cohort API — Netlify Edge Function

Returns a list of students as JSON, from a
[Netlify Edge Function](../README.md). One file, no dependencies, nothing to
install.

```
netlify/
├── edge-functions/
│   └── index.js    the whole thing - 27 lines
├── netlify.toml    tells Netlify where to find it
└── public/
    └── index.html  a one-page site, so the deploy has something to serve
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

Netlify → **Add new site** → **Import an existing project** → pick the repo,
then:

| Setting | Value |
|---|---|
| Base directory | the folder holding `netlify.toml` |
| Build command | *(leave empty)* |
| Publish directory | `public` |

If this folder is pushed as a repo of its own, the base directory is the repo
root and you can leave it blank. If you deploy it from inside the sessions
repo, set the base directory to `09-10-2026/netlify`.

```bash
curl https://YOUR-SITE.netlify.app/api/students
```

There is no build step and no `npm install`, because there is nothing to
install. The function only uses web APIs the runtime already has.

### Run it locally

```bash
npm install -g netlify-cli
netlify dev
```

That serves the function at http://localhost:8888/api/students. It downloads
Deno the first time, because that is what edge functions run on.

Plain `node index.js` will not work — this is not a Node program, and it is
not meant to be run as one.

## ⚠️ The 404 that tells you nothing

**Symptom:** the site deploys, `/` shows the page, and `/api/students` returns
Netlify's "Page not found". No build error, no failed deploy, nothing in the
logs.

**Cause:** Netlify never found the function, so nothing claimed that URL and
the request fell through to the static 404.

Check, in order:

1. **Is `edge_functions` pointing at a folder that does *not* contain your
   publish directory?** This is the one that bites. `edge_functions = "."`
   looks reasonable and silently registers nothing, because `.` contains
   `public/`. Give the function a folder of its own — that is why `index.js`
   lives in `edge-functions/`.
2. **Is the path relative to the base directory?** `edge_functions` is
   resolved from the site's base directory, not from the repo root.
3. **Is `netlify.toml` inside the base directory?** Netlify only reads the one
   at the base.
4. **Did the deploy actually pick it up?** Open the deploy log and look for an
   "Edge Functions bundling" step naming `index`. If that step is missing, the
   folder is wrong — go back to 1.

A quick way to confirm from the outside:

```bash
curl -i https://YOUR-SITE.netlify.app/api/students | head -3
```

`404` with `content-type: text/html` is the static 404 page, which means no
function is registered. A working function answers `200` with
`content-type: application/json`.

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

**The `config` export, at the bottom of `edge-functions/index.js`:**

```js
export const config = { path: '/api/students' };
```

Netlify reads that at deploy time. No routing lives anywhere else.

**`netlify.toml`:**

```toml
[build]
  publish = "public"
  edge_functions = "edge-functions"
```

Edge functions live in their own folder, and Netlify is told which one. The
default, if you say nothing, is `netlify/edge-functions/`.

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
3. Set `edge_functions = "."` and redeploy. The site is fine, the endpoint
   404s, and nothing says why. Put it back. This is the failure students will
   actually hit.
