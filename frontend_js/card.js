// Copyright 2020, Zaven Nahapetyan

class Card {
  static get WIDTH() {
    return 154;
  }

  static get HEIGHT() {
    return 214;
  }

  static get SUITES() {
    return ['C', 'D', 'H', 'S'];
  }

  static get RANKS() {
    return [
      '2', '3', '4', '5', '6', '7', '8', '9',
      '10', 'J', 'Q', 'K', 'A'
    ];
  }

  constructor(id, rotation, x, y, freed, rank, suite, width, height) {
    this.id = id;
    this.rotation = rotation;
    this.x = x;
    this.y = y;
    this.freed = freed;
    this.rank = rank;
    this.suite = suite;

    if (width) {
      this.width = width;
    } else {
      this.width = Card.WIDTH;
    }
    if (height) {
      this.height = height;
    } else {
      this.height = Card.HEIGHT;
    }
  }

  static from(card) {
    return new Card(
      card.id,
      card.rotation,
      card.x,
      card.y,
      card.freed,
      card.rank,
      card.suite,
      card.width,
      card.height
    );
  }

  getID() {
    return this.id;
  }

  getRankAndSuite() {
    return {
      rank: this.rank,
      suite: this.suite,
    };
  }

  getEdges() {
    // Add tiny rotation otherwise the slope of vertical line is undefined.
    if (Number.isInteger(2 * this.rotation / Math.PI)) {
      this.rotation += 0.01;
    }
    const a = this.height * Math.cos(this.rotation);
    const b = this.width * Math.sin(this.rotation);
    const c = this.width * Math.cos(this.rotation);
    const d = this.height * Math.sin(this.rotation);
    const p1x = this.x - (c + d) / 2;
    const p1y = this.y + (a - b) / 2;
    const p2x = this.x - (d - c) / 2;
    const p2y = this.y + (a + b) / 2;
    const p3x = this.x + (c + d) / 2;
    const p3y = this.y - (a - b) / 2;
    const p4x = this.x + (d - c) / 2;
    const p4y = this.y - (a + b) / 2;
    const slope1 = b / c;
    const slope2 = a / d;
    return {
      slope1, slope2, p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y,
    };
  }

  intersects(tapX, tapY) {
    const e = this.getEdges();
    const l1 = (x) => x * e.slope1 - e.p1x * e.slope1 + e.p1y;
    const l2 = (x) => -x * e.slope2 + e.p3x * e.slope2 + e.p3y;
    const l3 = (x) => -x * e.slope2 + e.p1x * e.slope2 + e.p1y;
    const l4 = (x) => x * e.slope1 - e.p3x * e.slope1 + e.p3y;
    const s1 = Math.sign(Math.sin(this.rotation));
    const s2 = Math.sign(Math.cos(this.rotation));
    return s2 * tapY < s2 * l1(tapX) && s1 * tapY < s1 * l2(tapX)
      && s1 * tapY > s1 * l3(tapX) && s2 * tapY > s2 * l4(tapX);
  }

  distanceFromCenter() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  draw(ctx, cardImage) {
    let width = this.width;
    let height = this.height;
    if (this.freed) {
      width *= 1.5;
      height *= 1.5;
    }
    // Bring canvas rendering to center of card and rotate there.
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.translate(-width / 2, -height / 2);
    ctx.drawImage(cardImage, 0, 0, width, height);
    ctx.restore();
  }
}

if (typeof module !== 'undefined') {
  module.exports = Card;
}
