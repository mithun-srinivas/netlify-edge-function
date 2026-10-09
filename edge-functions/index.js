// A Netlify Edge Function.
//
// The whole file is one function. Netlify runs it at whichever of its
// locations around the world is closest to the person asking, so the
// answer comes back in a few milliseconds instead of crossing an ocean.
//
// A request comes in as a standard web Request, and we hand back a
// standard web Response - the same objects fetch() uses in the browser.

// Our cohort, kept in a plain array in memory.
const cohort = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Grace Hopper' },
  { id: 3, name: 'Alan Turing' },
  { id: 4, name: 'Katherine Johnson' },
  { id: 5, name: 'Dennis Ritchie' },
];

export default async () => {
  return new Response(JSON.stringify(cohort), {
    headers: { 'content-type': 'application/json' },
  });
};

// Which URL this function answers on. Netlify reads this at deploy time,
// so there is no routing to configure anywhere else.
export const config = { path: '/api/students' };
