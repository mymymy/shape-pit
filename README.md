# Shape Pit

A guessing game. Pieces rain into the window, pile up and settle, and once
nothing is moving you say how many there are.

**Play it: https://mymymy.github.io/shape-pit/**

Every round is cut afresh: one shape or two out of six, ordered by how many sides
they have — circles, petals, triangles, rectangles, pentagons, hexagons — which come
to rest across one another like a dropped handful — in a palette of its own each time. How big a
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

Guess the count exactly and the pit itself celebrates: a bar of light runs up it from
the floor and off the top, every piece taking the colour as the bar reaches it and
letting it go behind. It is a better reward than paper thrown at a card, because it is
made of the thing you have just counted. The colour is the player's level where maths
mode is on and the house accent where it is not — either way something the round's own
palette did not choose — and it is lifted towards the light so it reads as lit rather
than merely repainted. The blend is cut once into a ramp of nine colour tables rather
than worked out per piece per frame: with two thousand pieces on screen, mixing and
formatting a colour string sixty times a second for each of them is most of a frame
spent on arithmetic, and a band quantised to eight steps is one nobody can tell from a
smooth one.

**Maths mode** puts a question in front of each round. Pick a player on the start
card — or both, and they take it in turns. The only way out of it is the start card,
which a reload brings back: there is nothing on the question card offering a child a
way past the question. The two banks are pitched at the two
people it was built for: Year 3 on one side and Year 5 on the other.

Each of them climbs a ladder of named levels, and the game says so. A bar across the
top of the screen carries the level, whose it is, and how much of it is left — "Level
2 · Bea", "4 more for Level 3" — and it fills as the answers come right. Every level
has its own colour, climbing green, teal, blue, violet, rose, gold, so which one you
are on is something you can see across the room rather than a number to read. Every
right answer throws a handful of confetti; finishing a level fills the bar to the
top, says "Level 3!" on the card in that level's colour, and throws the lot.

And each level unlocks a shape, with the level for its number of sides: one for the
circle, two for the petal, then three, four, five, six. So a level's reward says
something true about the level — "Level 4! Rectangles unlocked — four sides." — and
the pattern is left there to be noticed, which is the best kind of teaching there is.
When a level hands one over, the shape itself comes forward: large, in the level's
colour, in the middle of the page over the top of everything, turning twice and slowing
to a stop the right way up, with a glow round it that breathes three times while it
does. The rest of the page dims towards its own background for the second and a half
it takes, so the new shape is the only thing in the room, and "Level 5 unlocked" comes
up in big type underneath a beat after the shape does — the shape sits a little above
centre so that the pair of them is what is centred, rather than the shape alone. The
glow is drawn rather than blurred, two larger copies of the same outline under a radial
wash, because what shadowBlur does to a scaled transform is not the same in every
browser.

The round that follows an unlock belongs to that shape alone, and is cut from the
larger half of the size range: seeing the pit filled with pentagons is more of a reward
than being told that pentagons exist, and a pit of seven-pixel pentagons is a poor look
at a pentagon.

The card carries the collection as a row of little shapes, the locked ones left
faint, each turned the way a book would show it, since at that size a point-up
pentagon and a flat-topped hexagon are the only thing telling the two apart.

The circle and the petal are not given a side count anywhere, only a place in the
order. Whether a circle has one side or none is a thing some teachers say and others
mark wrong, and this is not the game to settle it in. Three onwards is not in doubt.

One a level means a ladder collects as many shapes as it has rungs, so Bea's six
reach all six and Venus's four reach the first four: circles, triangles, rectangles
and pebbles, which are the ones she is being taught to name anyway. Her row on the
card is four long rather than six, since a locked shape nobody can reach is not
something to look at all evening. With no maths on, the pit has all six from the
start, as it always did.

Venus climbs her own four tiers, three right answers for Level 2 and then four and
five. Bea's ladder has six rungs and opens on two levels of Venus's bank — the same
sums her sister is doing, which she can do standing on her head — before starting on
her own year at Level 3. Beginning a ten-year-old on a seven-year-old's first tier
would be insulting rather than encouraging, so the warm-up starts a couple of tiers
in and costs two right answers a rung rather than three.

What counts is answers got right rather than questions asked, so a child who is
struggling is not pushed up for it, and about a third of the questions come from the
level below, so the climb is felt rather than stepped off. It starts at Level 1 again
each time the game is opened.

Every question is generated rather than drawn from a list, so the same one does not
come round twice in an evening, and every answer is a number or one of a few buttons
— nothing to spell. Nothing typed is ever a negative number either: a phone's
numeric keypad has no minus sign on it, and a child fighting the keyboard is not
practising anything. A wrong answer costs a second go and then the answer; it never
costs the round.

Behind it is a small rigid-body engine: convex outlines, separating-axis tests
clipped down to two-point contacts, and impulses that carry across the substeps of
a frame rather than starting from nothing each one — the difference between a heap
that holds itself up and a heap that shivers. The frame is spent on ten short steps
of eight passes rather than a few long ones, and the contacts are solved from the
floor upwards, so what holds the bottom up reaches the top in one pass instead of
one level per pass.

The picture is drawn between the steps rather than on them. The physics runs in
fixed sixtieths of a second and a frame takes as many of those as it can afford, so
on a full pit a frame is worth two of them, or one, or four; drawn on the steps, the
pieces arrive unevenly and the pit appears to speed up and slow down as the frames
get cheaper. Drawn part way between where a piece was and where it is, by how far
into the next step the frame has got, what is on screen follows real time instead —
which takes the frames where the pit's apparent speed jumps by a quarter or more
from one in five to one in sixteen.

Most of a full pit is doing nothing, and is charged for accordingly: a piece that
has stopped moving stops being simulated, and one that has stopped moving under two
cells of heap is buried — it is not woken by its neighbours at all. That last part
is the whole of the saving. A sleeper roused whenever the piece beside it shuffles
rouses the piece beside that, and a heap is one connected thing, so the pit
liquefies and falls asleep again twice a second and the sleeping buys nothing. What
does still reach a buried piece is being leaned on: press one more than a seventh of
its own size into the pit under it and it takes part again, since a rigid floor part
way up a heap has nowhere to put what settles onto it. Together that is about twice
the pieces in the same time, and a steadier frame with it.

No two pieces ever share a pixel. They collide on an outline a hair larger than the
one drawn, so what penetration a soft solver leaves is spent in the gap rather than
on screen; the last of it is pushed out at the moment the pit stops; and each piece
cuts a thin moat of the ground around itself as it is drawn, which settles the
matter whatever the physics did.

One file, no build step, no dependencies. Open `index.html` anywhere.

Add `?debug=1` to the URL for a handle on the simulation from the console.
