# Shape Pit

A guessing game. Pieces rain into the window, pile up and settle, and once
nothing is moving you say how many there are.

**Play it: https://mymymy.github.io/shape-pit/**

Every round is cut afresh: one shape or two out of balls, rounded pebbles, sharp
shards, broad slabs, rounded tiles and planks, and sticks that come to rest across
one another like a dropped handful — in a palette of its own each time. How big a
piece is varies most of all, and is drawn evenly across the scales rather than
evenly across the pixels, so the hard rounds turn up as often as the easy ones.

Nothing caps how many pieces there are. The only limit is how small one may be
cut — seven pixels, about what can still be told apart and counted — and the rest
follows from the size of the window: a phone holds forty to seven hundred of them,
a desktop window rather more. It pours until the pit is full rather than to a guess
at how many that takes, and what counts as full is a couple of pieces of the heap
standing near the fill line, with the depth of everything still falling added on —
or the rain already in the air carries the heap over the top of the window, where
it cannot be counted.

The box that asks the question can be dragged aside by its grip, since on a full
pit there is no corner for it that leaves the pieces clear.

Behind it is a small rigid-body engine: convex outlines, separating-axis tests
clipped down to two-point contacts, and impulses that carry across the substeps of
a frame rather than starting from nothing each one — the difference between a heap
that holds itself up and a heap that shivers. The frame is spent on twenty short
steps of three passes rather than five long ones of eight, which for the same work
leaves a heap twenty-five pieces deep about a tenth as far into itself, and the
contacts are solved from the floor upwards, so what holds the bottom up reaches the
top in one pass instead of one level per pass.

No two pieces ever share a pixel. They collide on an outline a hair larger than the
one drawn, so what penetration a soft solver leaves is spent in the gap rather than
on screen; the last of it is pushed out at the moment the pit stops; and each piece
cuts a thin moat of the ground around itself as it is drawn, which settles the
matter whatever the physics did.

One file, no build step, no dependencies. Open `index.html` anywhere.

Add `?debug=1` to the URL for a handle on the simulation from the console.
