import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as _ from 'lodash';

/**
 * Very Basic Starter Snake Agent for:
 * https://github.com/Dkendal/battle_snake
 */

const app = express();

app.use(bodyParser.json());

app.post('/start', function(req, res) {
  res.json({
    head_url: 'https://s.gravatar.com/avatar/3e2b342616822f8eabc9dd393840db4a',
    name: 'Typescript Snake',
    color: '#0073bf',
    head_type: 'regular',
  });
});

app.post('/move', ({body}, res) => {
  const move_ = move(body);

  const json = {
    move: move_,
  };

  res.json(json);
});

app.listen(4000, function() {});

/**
 * Api Objects
 */

type Move = 'up' | 'down' | 'left' | 'right';

interface Snake {
  id: string;
  object: 'snake';
  body: List<Point>;
  health: number;
  taunt: string;
  name: string;
}

interface List<T> {
  object: 'list';
  data: T[];
}

interface Point {
  object: 'point';
  x: number;
  y: number;
}

interface World {
  object: 'world';
  id: number;
  you: Snake;
  snakes: List<Snake>;
  height: number;
  width: number;
  turn: number;
  food: List<Point>;
}

/**
 * Domain Objects
 */
interface Candidate {
  point: Point;
  origin: Point;
  score: number;
}

/**
 * Identity vectors
 */
const up = point(0, 1);
const down = point(0, -1);
const left = point(1, 0);
const right = point(-1, 0);
const dir = [up, down, left, right];

function bind(fn: Function, ...args: any[]) {
  return fn.bind(null, ...args);
}

/**
 * Produce a move given current state of the world.
 */
function move(world: World): Move {
  const [hd, hd_, ...tail] = world.you.body.data;

  const candidate = _(dir)
    .map(dir => {
      const point = add(hd, dir);
      return new Candidate(point, hd, score(point, world));
    })
    .min();

  if (!candidate) {
    throw new Error('no candidate move');
  }

  return candidate.toMove();
}

function score(point: Point, world: World): number {
  // This is backward on itself
  if (_.isEqual(point, world.you.body.data[1])) {
    return 1000;
  }

  // This is an obstacle
  const blocked = _(world.snakes.data).some((x: Snake) =>
    x.body.data.some(y => _(y).isEqual(point))
  );

  if(blocked) {
    return 1000;
  }

  // This is a wall
  if (
    point.x > world.width ||
    point.x < 0 ||
    point.y > world.height ||
    point.y < 0
  ) {
    return 1000;
  }

  const minDistance = _(world.food.data)
    .map(food => {
      return manhattanDistance(point, food);
    })
    .min();

  return minDistance;
}

class Candidate {
  constructor(point: Point, origin: Point, score: number) {
    this.origin = origin;
    this.point = point;
    this.score = score;
  }

  valueOf() {
    return this.score;
  }

  toString() {
    return this.toMove();
  }

  toMove(): Move {
    const p = sub(this.origin, this.point);

    if (_.isEqual(p, up)) {
      return 'up';
    }
    if (_.isEqual(p, down)) {
      return 'down';
    }
    if (_.isEqual(p, left)) {
      return 'left';
    }
    if (_.isEqual(p, right)) {
      return 'right';
    }
    throw new Error(`${p} is not an identity vector`);
  }
}

/**
 * Point operations
 */

/**
 * NOT a class constructor because I want easy object equality with
 * api objects.
 */
function point(x: number, y: number): Point {
  return {
    object: 'point',
    x: x,
    y: y,
  };
}

function add(a: Point, b: Point): Point {
  return point(a.x + b.x, a.y + b.y);
}

function sub(a: Point, b: Point): Point {
  return add(a, mul(b, -1));
}

function mul(a: Point, s: number): Point {
  return point(a.x * s, a.y * s);
}

function manhattanDistance(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
